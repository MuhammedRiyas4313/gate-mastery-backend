const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Revision = require('../models/Revision');
const PYQ = require('../models/PYQ');
const TestSeries = require('../models/TestSeries');
const DPP = require('../models/DPP');
const QuizSession = require('../models/QuizSession');

// @desc    Get all subjects for a user
// @route   GET /api/subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: -1 });

    // Populate chapters and topics for each subject
    const fullSubjects = await Promise.all(subjects.map(async (subj) => {
      const chapters = await Chapter.find({ subject: subj._id }).sort({ orderIndex: 1 });
      
      const chaptersWithTopics = await Promise.all(chapters.map(async (chap) => {
        const topics = await Topic.find({ chapter: chap._id }).sort({ orderIndex: 1 });
        return { ...chap._doc, topics };
      }));

      return { ...subj._doc, chapters: chaptersWithTopics };
    }));

    res.json(fullSubjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a subject
// @route   POST /api/subjects
const addSubject = async (req, res) => {
  const { name, icon, color, startDate } = req.body;
  const subject = await Subject.create({
    name, icon, color, startDate, user: req.user._id
  });
  res.status(201).json(subject);
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
const updateSubject = async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (subject && subject.user.toString() === req.user._id.toString()) {
    const oldStatus = subject.status;
    subject.name = req.body.name || subject.name;
    subject.icon = req.body.icon || subject.icon;
    subject.color = req.body.color || subject.color;
    subject.status = req.body.status || subject.status;
    const updated = await subject.save();

    // Auto generate Subject Test
    if (updated.status === 'complete' && oldStatus !== 'complete') {
        await TestSeries.create({
            user: req.user._id,
            title: `Subject Test: ${updated.name}`,
            type: 'SUBJECT',
            subject: updated._id,
            status: 'PENDING'
        });
    }

    res.json(updated);
  } else {
    res.status(404).json({ message: 'Subject not found' });
  }
};


// @desc    Add a chapter
// @route   POST /api/subjects/:subjectId/chapters
const addChapter = async (req, res) => {
  const { name, orderIndex } = req.body;
  const chapter = await Chapter.create({
    name, orderIndex, subject: req.params.subjectId
  });
  res.status(201).json(chapter);
};

// @desc    Update a chapter status
// @route   PUT /api/subjects/chapters/:id
const updateChapter = async (req, res) => {
  const chapter = await Chapter.findById(req.params.id);
  if (chapter) {
    const oldStatus = chapter.status;
    chapter.name = req.body.name || chapter.name;
    chapter.status = req.body.status || chapter.status;
    const updated = await chapter.save();

    // After completion of Chapter a revision and a PYQ record should create
    if (updated.status === 'complete' && oldStatus !== 'complete') {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 14); // 2 weeks
      
      await Revision.create({
        user: req.user._id,
        date: scheduledDate,
        tags: [{
          subject: updated.subject,
          chapter: updated._id
        }],
        type: 'CHAPTER_AUTO',
        status: 'PENDING'
      });

      // Auto generate PYQ record
      await PYQ.create({
        user: req.user._id,
        title: `PYQ: ${updated.name}`,
        subject: updated.subject,
        chapter: updated._id,
        status: 'PENDING'
      });

      // Auto generate Chapter Test
      await TestSeries.create({
        user: req.user._id,
        title: `Chapter Test: ${updated.name}`,
        type: 'CHAPTER',
        subject: updated.subject,
        chapter: updated._id,
        status: 'PENDING'
      });
    }

    
    res.json(updated);
  } else {
    res.status(404).json({ message: 'Chapter not found' });
  }
};

// @desc    Add a topic
// @route   POST /api/subjects/chapters/:chapterId/topics
const addTopic = async (req, res) => {
  const { name, orderIndex, dateTaught, subjectId } = req.body;
  const topic = await Topic.create({
    name, orderIndex, dateTaught, chapter: req.params.chapterId, subject: subjectId
  });
  res.status(201).json(topic);
};

// @desc    Update a topic
// @route   PUT /api/subjects/topics/:id
const updateTopic = async (req, res) => {
  const topic = await Topic.findById(req.params.id);
  if (topic) {
    topic.name = req.body.name || topic.name;
    topic.status = req.body.status || topic.status;
    topic.dateTaught = req.body.dateTaught || topic.dateTaught;
    const updated = await topic.save();
    res.json(updated);
  } else {
    res.status(404).json({ message: 'Topic not found' });
  }
};

// Delete routes
const deleteSubject = async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (subject && subject.user.toString() === req.user._id.toString()) {
    await Chapter.deleteMany({ subject: subject._id });
    await Topic.deleteMany({ subject: subject._id });
    await Revision.deleteMany({ subject: subject._id });
    await Subject.deleteOne({ _id: subject._id });
    res.json({ message: 'Subject removed' });
  } else {
    res.status(404).json({ message: 'Subject not found' });
  }
};

const deleteChapter = async (req, res) => {
  const chapter = await Chapter.findById(req.params.id);
  if (chapter) {
    await Topic.deleteMany({ chapter: chapter._id });
    await Revision.deleteMany({ chapter: chapter._id });
    await Chapter.deleteOne({ _id: chapter._id });
    res.json({ message: 'Chapter removed' });
  } else {
    res.status(404).json({ message: 'Chapter not found' });
  }
};

const deleteTopic = async (req, res) => {
  const topic = await Topic.findById(req.params.id);
  if (topic) {
    await Revision.deleteMany({ topic: topic._id });
    await Topic.deleteOne({ _id: topic._id });
    res.json({ message: 'Topic removed' });
  } else {
    res.status(404).json({ message: 'Topic not found' });
  }
};

const getChapters = async (req, res) => {
  try {
    const chapters = await Chapter.find({ subject: req.params.subjectId }).sort({ orderIndex: 1 });
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubjectDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const subject = await Subject.findById(id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const chapters = await Chapter.find({ subject: id }).sort({ orderIndex: 1 });
    const chapterIds = chapters.map(c => c._id);

    const topics = await Topic.find({ subject: id }).sort({ dateTaught: -1 }).populate('chapter');
    
    const [revisions, dpps, pyqs, tests, quizzes] = await Promise.all([
      Revision.find({ user: userId, 'tags.subject': id }).populate('tags.chapter tags.topic'),
      DPP.find({ user: userId, 'tags.subject': id }).populate('tags.chapter tags.topic'),
      PYQ.find({ user: userId, subject: id }).populate('chapter'),
      TestSeries.find({ user: userId, subject: id }).populate('chapter'),
      QuizSession.find({ user: userId, 'quizzes.subject': id })
    ]);

    res.json({
      subject,
      chapters,
      topics,
      activities: {
        revisions,
        dpps,
        pyqs,
        tests,
        quizzes
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSubjects, addSubject, updateSubject, deleteSubject,
  addChapter, updateChapter, deleteChapter,
  addTopic, updateTopic, deleteTopic,
  getChapters, getSubjectDetails
};

const TestSeries = require('../models/TestSeries');

// @desc    Get all test series entries
// @route   GET /api/test-series
const getTestSeries = async (req, res) => {
  try {
    const { status, subjectId, chapterId, type } = req.query;

    const filter = { user: req.user._id };

    if (status && status !== 'all') filter.status = status;
    if (subjectId && subjectId !== 'all') filter.subject = subjectId;
    if (chapterId && chapterId !== 'all') filter.chapter = chapterId;
    if (type && type !== 'all') filter.type = type;

    const tests = await TestSeries.find(filter)
      .populate('subject chapter')
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a manual test series entry
// @route   POST /api/test-series
const addTestSeries = async (req, res) => {
  try {
    const { title, type, subjectId, chapterId, score, totalMarks, date } = req.body;
    
    const newTest = await TestSeries.create({
      user: req.user._id,
      title,
      type,
      subject: subjectId || null,
      chapter: chapterId || null,
      score: score || 0,
      totalMarks: totalMarks || 0,
      date: date ? new Date(date) : new Date(),
      status: 'PENDING'
    });

    const populated = await newTest.populate('subject chapter');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a test series entry
// @route   PUT /api/test-series/:id
const updateTestSeries = async (req, res) => {
  try {
    const test = await TestSeries.findById(req.params.id);
    if (test && test.user.toString() === req.user._id.toString()) {
      test.title = req.body.title || test.title;
      test.type = req.body.type || test.type;
      test.subject = req.body.subjectId !== undefined ? req.body.subjectId : test.subject;
      test.chapter = req.body.chapterId !== undefined ? req.body.chapterId : test.chapter;
      test.score = req.body.score !== undefined ? Number(req.body.score) : test.score;
      test.totalMarks = req.body.totalMarks !== undefined ? Number(req.body.totalMarks) : test.totalMarks;
      test.status = req.body.status || test.status;
      test.notes = req.body.notes !== undefined ? req.body.notes : test.notes;
      test.date = req.body.date ? new Date(req.body.date) : test.date;

      if (req.body.status === 'COMPLETED' && test.status !== 'COMPLETED') {
        test.attemptedAt = new Date();
      }
      
      const updated = await test.save();
      const populated = await updated.populate('subject chapter');
      res.json(populated);
    } else {
      res.status(404).json({ message: 'Test not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a TestSeries
// @route   DELETE /api/test-series/:id
const deleteTestSeries = async (req, res) => {
  try {
    const test = await TestSeries.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    if (test.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await test.deleteOne();
    res.json({ message: 'Test removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTestSeries, addTestSeries, updateTestSeries, deleteTestSeries };

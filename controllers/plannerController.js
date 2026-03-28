const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Revision = require('../models/Revision');
const DPP = require('../models/DPP');
const PYQ = require('../models/PYQ');
const TestSeries = require('../models/TestSeries');
const QuizSession = require('../models/QuizSession');

const getPlannerData = async (req, res) => {
  try {
    const { from, to, start, end } = req.query;
    const fromDate = new Date(from || start);
    const toDate = new Date(to || end);

    const subjects = await Subject.find({ user: req.user._id }).select('_id');
    const subjectIds = subjects.map(s => s._id);

    const [topics, revisions, dpps, pyqs, tests, quizzes] = await Promise.all([
      Topic.find({ subject: { $in: subjectIds }, dateTaught: { $gte: fromDate, $lte: toDate } }).populate('subject chapter'),
      Revision.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } }).populate('tags.subject tags.chapter tags.topic'),
      DPP.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } }).populate('tags.subject tags.chapter tags.topic'),
      PYQ.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } }).populate('subject chapter'),
      TestSeries.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } }).populate('subject chapter'),
      QuizSession.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } })
    ]);

    const dayMap = {};

    const processItems = (items, key, dateField = 'date') => {
      items.forEach(item => {
        const dateVal = item[dateField] || item.updatedAt || item.createdAt;
        if (!dateVal) return;
        const dayStr = new Date(dateVal).toISOString().split('T')[0];
        if (!dayMap[dayStr]) {
          dayMap[dayStr] = { topics: [], revisions: [], dpps: [], pyqs: [], tests: [], quizzes: [] };
        }
        dayMap[dayStr][key].push(item);
      });
    };

    processItems(topics, 'topics', 'dateTaught');
    processItems(revisions, 'revisions', 'date');
    processItems(dpps, 'dpps', 'date');
    processItems(pyqs, 'pyqs', 'date');
    processItems(tests, 'tests', 'date');
    processItems(quizzes, 'quizzes', 'date');

    res.json(dayMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPlannerData };

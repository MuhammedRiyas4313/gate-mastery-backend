const Topic = require('../models/Topic');
const Revision = require('../models/Revision');
const DPP = require('../models/DPP');
const PYQ = require('../models/PYQ');
const TestSeries = require('../models/TestSeries');
const QuizSession = require('../models/QuizSession');

const getPlannerData = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [topics, revisions, dpps, pyqs, tests, quizzes] = await Promise.all([
      Topic.find({ user: req.user._id, dateTaught: { $gte: fromDate, $lte: toDate } }).populate('subject chapter'),
      Revision.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } }).populate('tags.subject tags.chapter tags.topic'),
      DPP.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } }).populate('tags.subject tags.chapter tags.topic'),
      PYQ.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } }).populate('subject chapter'),
      TestSeries.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } }).populate('subject chapter'),
      QuizSession.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } })
    ]);

    res.json({
      topics,
      revisions,
      dpps,
      pyqs,
      tests,
      quizzes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPlannerData };

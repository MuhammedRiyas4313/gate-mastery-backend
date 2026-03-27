const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Revision = require('../models/Revision');
const DPP = require('../models/DPP');
const PYQ = require('../models/PYQ');
const TestSeries = require('../models/TestSeries');
const QuizSession = require('../models/QuizSession');
const Exam = require('../models/Exam');

const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // 8. Upcoming Exams & Dynaimc Countdown
    const exams = await Exam.find({ user: req.user._id, active: true }).sort({ date: 1 });
    const primaryExam = exams[0];
    const gateCountdownDays = primaryExam 
      ? Math.ceil((new Date(primaryExam.date) - new Date()) / (1000 * 60 * 60 * 24))
      : 316; // Maintain 316 as fallback for now if no exam added

    // 1. Topics handled today
    const topicsCompletedToday = await Topic.find({
      user: req.user._id,
      updatedAt: { $gte: today, $lte: endOfToday },
      status: 'complete'
    }).populate('subject chapter');

    // 2. Revisions today (Fix populate paths)
    const revisionsToday = await Revision.find({
      user: req.user._id,
      date: { $gte: today, $lte: endOfToday }
    }).populate('tags.subject tags.chapter tags.topic');

    // 3. DPP today
    const dppToday = await DPP.findOne({
      user: req.user._id,
      date: { $gte: today, $lte: endOfToday }
    }).populate('tags.subject tags.chapter tags.topic');

    // 4. PYQs today
    const pyqsToday = await PYQ.find({
      user: req.user._id,
      $or: [
        { date: { $gte: today, $lte: endOfToday } },
        { updatedAt: { $gte: today, $lte: endOfToday } }
      ]
    }).populate('subject chapter topic');

    // 5. Test Series
    const testsToday = await TestSeries.find({
      user: req.user._id,
      date: { $gte: today, $lte: endOfToday }
    }).populate('subject chapter');

    // 6. Recent Quiz Sessions (Last 5 for velocity chart)
    const recentQuizzes = await QuizSession.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(5)
      .populate('quizzes.subject quizzes.chapter quizzes.topic');

    const weekendQuiz = recentQuizzes.find(q => {
       const qDate = new Date(q.date);
       return qDate.setHours(0,0,0,0) === today.getTime();
    });

    // 7. Subject Progress
    const subjects = await Subject.find({ user: req.user._id });
    const subjectProgress = await Promise.all(subjects.map(async (sub) => {
      const chapters = await Chapter.find({ subject: sub._id });
      const totalChapters = chapters.length;
      const completedChapters = chapters.filter(c => c.status === 'complete').length;

      return {
        _id: sub._id,
        name: sub.name,
        color: sub.color,
        icon: sub.icon || '📚',
        totalChapters,
        completedChapters,
        percent: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
      };
    }));

    res.json({
      todayISO: today.toISOString(),
      gateCountdownDays: gateCountdownDays > 0 ? gateCountdownDays : 0,
      topicsCompletedToday,
      revisionsToday,
      dppToday,
      pyqsToday,
      testsToday,
      weekendQuiz,
      recentQuizzes,
      subjectProgress,
      upcomingExams: exams.map(e => ({
        ...e._doc,
        daysLeft: Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };

const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Revision = require('../models/Revision');
const PYQ = require('../models/PYQ');
const TestSeries = require('../models/TestSeries');
const QuizSession = require('../models/QuizSession');
const DPP = require('../models/DPP');


const { trackAttendance } = require('../utils/attendanceTracker');


const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 0. Attendance & Streak Calculation
    const streakResult = await trackAttendance(userId);
    const streak = streakResult || 0;

    // 1. Subject Progress & Readiness
    const subjects = await Subject.find({ user: userId });
    let totalTopicsCount = 0;
    let totalDoneTopicsCount = 0;

    const subjectProgress = await Promise.all(subjects.map(async (sub) => {
      const totalTopics = await Topic.countDocuments({ subject: sub._id });
      const doneTopics = await Topic.countDocuments({ subject: sub._id, status: 'complete' });
      
      totalTopicsCount += totalTopics;
      totalDoneTopicsCount += doneTopics;

      return {
        subject: { 
          id: sub._id, 
          name: sub.name, 
          icon: sub.icon, 
          color: sub.color || 'hsl(var(--primary))' 
        },
        totalTopics,
        doneTopics,
        progressPercent: totalTopics > 0 ? (doneTopics / totalTopics) * 100 : 0
      };
    }));

    const readinessScore = totalTopicsCount > 0 ? Math.round((totalDoneTopicsCount / totalTopicsCount) * 100) : 0;

    // 2. Revision Efficiency (By Status)
    const revisions = await Revision.find({ user: userId });
    const revisionBySlot = [
      { slot: 'Completed', done: revisions.filter(r => r.status === 'COMPLETED').length },
      { slot: 'Pending', done: revisions.filter(r => r.status === 'PENDING').length },
      { slot: 'Snoozed', done: revisions.filter(r => r.status === 'SNOOZED').length },
      { slot: 'Ongoing', done: revisions.filter(r => r.status === 'ONGOING').length }
    ];

    // 3. PYQ Depth (By Difficulty)
    const pyqs = await PYQ.find({ user: userId });
    const pyqByDifficulty = [
      { difficulty: 'Easy', done: pyqs.filter(p => p.difficulty === 'EASY' && p.status === 'COMPLETED').length, total: pyqs.filter(p => p.difficulty === 'EASY').length },
      { difficulty: 'Medium', done: pyqs.filter(p => p.difficulty === 'MEDIUM' && p.status === 'COMPLETED').length, total: pyqs.filter(p => p.difficulty === 'MEDIUM').length },
      { difficulty: 'Hard', done: pyqs.filter(p => p.difficulty === 'HARD' && p.status === 'COMPLETED').length, total: pyqs.filter(p => p.difficulty === 'HARD').length },
    ];

    // 4. Activity Heatmap (Last 168 days)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 168);

    const subjectIds = subjects.map(s => s._id);

    const [revActivities, pyqActivities, testActivities, quizActivities, topicActivities, dppActivities] = await Promise.all([
      Revision.find({ user: userId, updatedAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' }),
      PYQ.find({ user: userId, updatedAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' }),
      TestSeries.find({ user: userId, updatedAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' }),
      QuizSession.find({ user: userId, updatedAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' }),
      Topic.find({ subject: { $in: subjectIds }, updatedAt: { $gte: sixMonthsAgo }, status: 'complete' }),
      DPP.find({ user: userId, updatedAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' })
    ]);


    const activityMap = {};

    const processItems = (items) => items.forEach(item => {
      const dateSource = item.updatedAt || item.date || item.createdAt;
      if (!dateSource) return;
      const day = new Date(dateSource).toISOString().split('T')[0];
      activityMap[day] = (activityMap[day] || 0) + 1;
    });

    processItems(revActivities);
    processItems(pyqActivities);
    processItems(testActivities);
    processItems(quizActivities);
    processItems(topicActivities);
    processItems(dppActivities);


    const activityHeatmap = Object.keys(activityMap).map(date => ({
      date,
      count: activityMap[date],
      level: Math.min(Math.ceil(activityMap[date] / 2), 4)
    }));

    res.json({
      readinessScore,
      subjectProgress,
      revisionBySlot,
      pyqByDifficulty,
      activityHeatmap,
      streak
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };

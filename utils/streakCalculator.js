const Revision = require('../models/Revision');
const Topic = require('../models/Topic');
const PYQ = require('../models/PYQ');
const TestSeries = require('../models/TestSeries');
const QuizSession = require('../models/QuizSession');
const DPP = require('../models/DPP');

const Subject = require('../models/Subject');

/**
 * Calculates the current study streak for a user.
 * A study streak is defined as consecutive days with at least one completed activity.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<number>} - The length of the current streak.
 */
const calculateStreak = async (userId) => {
  try {
    // Get user's subjects first to find topics
    const subjects = await Subject.find({ user: userId }).select('_id');
    const subjectIds = subjects.map(s => s._id);

    // 1. Gather all unique completion dates for the user
    // Consider Topic, Revision, PYQ, TestSeries, QuizSession, DPP
    const [revDates, topicDates, pyqDates, testDates, quizDates, dppDates] = await Promise.all([
      Revision.find({ user: userId, status: 'COMPLETED' }).select('updatedAt'),
      Topic.find({ subject: { $in: subjectIds }, status: 'complete' }).select('updatedAt'),
      PYQ.find({ user: userId, status: 'COMPLETED' }).select('updatedAt'),
      TestSeries.find({ user: userId, status: 'COMPLETED' }).select('updatedAt'),
      QuizSession.find({ user: userId, status: 'COMPLETED' }).select('updatedAt'),
      DPP.find({ user: userId, status: 'COMPLETED' }).select('updatedAt')
    ]);

    const allDatesSet = new Set();
    const processItems = (items) => items.forEach(item => {
      const date = item.updatedAt || item.createdAt;
      if (date) {
        allDatesSet.add(new Date(date).toISOString().split('T')[0]);
      }
    });

    processItems(revDates);
    processItems(topicDates);
    processItems(pyqDates);
    processItems(testDates);
    processItems(quizDates);
    processItems(dppDates);

    if (allDatesSet.size === 0) return 0;

    // 2. Sort dates in descending order
    const sortedDates = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));
    
    // 3. Calculate streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = 0;
    let checkDate = new Date(); // Start from today

    // If today is not in sortedDates, check from yesterday
    if (!allDatesSet.has(today)) {
      if (!allDatesSet.has(yesterdayStr)) {
        return 0; // No activity today or yesterday, streak is 0
      }
      checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday
    }

    // Iterate backwards through consecutive days
    while (allDatesSet.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return currentStreak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};

module.exports = { calculateStreak };

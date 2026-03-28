const User = require('../models/User');

/**
 * Checks and updates the user's attendance-based streak on each visit.
 * @param {string} userId - The user's ID.
 * @returns {Promise<number>} - The updated current streak.
 */
const trackAttendance = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return 0;

    const now = new Date();
    // Use Asia/Kolkata or user's local day for consistency
    const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // "YYYY-MM-DD"
    const todayDate = new Date(todayStr);

    const lastVisit = user.lastVisit;
    
    if (!lastVisit) {
      // First visit ever
      user.lastVisit = todayDate;
      user.currentStreak = 1;
      await user.save();
      return 1;
    }

    const lastVisitStr = lastVisit.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    
    if (todayStr === lastVisitStr) {
      // Already visited today, no change
      return user.currentStreak;
    }

    // Check if yesterday was the last visit
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    if (lastVisitStr === yesterdayStr) {
      // Visited yesterday, increment streak
      user.currentStreak += 1;
    } else {
      // Missed yesterday, reset streak
      user.currentStreak = 1;
    }

    user.lastVisit = todayDate;
    await user.save();
    return user.currentStreak;
  } catch (error) {
    console.error('Attendance track error:', error);
    return 0;
  }
};

module.exports = { trackAttendance };

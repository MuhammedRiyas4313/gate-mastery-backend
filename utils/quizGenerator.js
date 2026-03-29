const QuizSession = require('../models/QuizSession');

/**
 * Ensures that if a weekend (Saturday/Sunday) just passed, 
 * the required quiz sessions exist for that weekend.
 * If today is Monday-Friday, it specifically checks the most recent Saturday and Sunday.
 */
const autoGenerateQuizSessions = async (userId) => {
  try {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    now.setHours(0, 0, 0, 0);

    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday... 6 is Saturday

    // 1. Determine the relevant Saturday and Sunday to check.
    // If today is Monday(1) to Friday(5), we check the weekend that just passed.
    // If today is Saturday(6) or Sunday(0), we check the current weekend.
    
    let targetSat, targetSun;

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
       // Monday to Friday: Check the preceding Saturday/Sunday
       targetSat = new Date(now);
       targetSat.setDate(now.getDate() - (dayOfWeek + 1)); // 1 -> -2, 2 -> -3... 5 -> -6
       
       targetSun = new Date(now);
       targetSun.setDate(now.getDate() - dayOfWeek); // 1 -> -1, 2 -> -2... 5 -> -5
    } else if (dayOfWeek === 6) {
       // Saturday: Check today and tomorrow (Sunday)
       targetSat = new Date(now);
       targetSun = new Date(now);
       targetSun.setDate(now.getDate() + 1);
    } else {
       // Sunday: Check yesterday (Saturday) and today
       targetSun = new Date(now);
       targetSat = new Date(now);
       targetSat.setDate(now.getDate() - 1);
    }

    const checkDays = [
       { date: targetSat, name: 'Saturday' },
       { date: targetSun, name: 'Sunday' }
    ];

    for (const day of checkDays) {
       const dateStart = new Date(day.date);
       dateStart.setHours(0, 0, 0, 0);
       const dateEnd = new Date(day.date);
       dateEnd.setHours(23, 59, 59, 999);

       const existing = await QuizSession.findOne({
          user: userId,
          date: { $gte: dateStart, $lte: dateEnd }
       });

       if (!existing) {
          await QuizSession.create({
             user: userId,
             date: dateStart,
             dayName: day.name,
             status: 'PENDING',
             quizzes: []
          });
       }
    }

  } catch (error) {
    console.error('Quiz Auto-Generation Error:', error);
  }
};

module.exports = { autoGenerateQuizSessions };

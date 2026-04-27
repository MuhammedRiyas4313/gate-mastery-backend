const User = require('../models/User');
const DPP = require('../models/DPP');
const Revision = require('../models/Revision');
const QuizSession = require('../models/QuizSession');

/**
 * Sync daily tasks for a specific user today.
 * Handles DPP, Revisions, and Quiz Sessions based on user activity and date.
 */
const syncUserDailyTasks = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return null;

        const now = new Date();
        const istDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // "YYYY-MM-DD"
        const today = new Date(istDateStr);
        today.setHours(0, 0, 0, 0);

        const istDayOfWeek = now.toLocaleDateString("en-US", { weekday: 'long', timeZone: "Asia/Kolkata" });
        const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
        const dayNum = dayMap[istDayOfWeek];

        let updated = false;

        // --- 1. DPP GENERATION ---
        // Requirement: Skip on Sunday. Only create if not already generated.
        const dppKey = `${istDateStr}:DPP`;
        if (dayNum !== 0 && !user.generatedTasks.includes(dppKey)) {
            // Check if DPP exists in DB (might have been created but not in history yet)
            const dppInDb = await DPP.findOne({ user: userId, date: today });
            if (!dppInDb) {
                await DPP.create({ user: userId, date: today, status: 'PENDING' });
            }
            user.generatedTasks.push(dppKey);
            updated = true;
        }

        // --- 2. REVISION GENERATION (REMOVED) ---
        // Daily revision document creation is no longer required as per user request.


        // --- 3. QUIZ SESSION GENERATION ---
        // Only auto-create if user logs in on Saturday or Sunday.
        // If Saturday: create Saturday quiz; If Sunday: create Sunday quiz.
        if (dayNum === 6) { // Saturday
            await createQuizIfMissing(user, istDateStr, today, 'Saturday');
        } else if (dayNum === 0) { // Sunday
            await createQuizIfMissing(user, istDateStr, today, 'Sunday');
        }

        // Update user history if any new tasks were generated
        if (updated || user.isModified('generatedTasks')) {
            await user.save();
        }

        return { success: true, istDateStr };
    } catch (error) {
        console.error(`[TaskEngine] Sync failed for user ${userId}:`, error);
        return null;
    }
};

/** Helper to create quiz session and track history */
const createQuizIfMissing = async (user, dateStr, dateObj, dayName) => {
    const quizKey = `${dateStr}:${dayName}:QUIZ`;
    if (!user.generatedTasks.includes(quizKey)) {
        const quizExists = await QuizSession.findOne({ user: user._id, date: dateObj, dayName: dayName });
        if (!quizExists) {
            await QuizSession.create({
                user: user._id,
                date: dateObj,
                dayName: dayName,
                status: 'PENDING',
                quizzes: []
            });
        }
        user.generatedTasks.push(quizKey);
    }
};

module.exports = { syncUserDailyTasks };

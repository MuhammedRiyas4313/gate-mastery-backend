const User = require('../models/User');
const DPP = require('../models/DPP');
const Revision = require('../models/Revision');
const QuizSession = require('../models/QuizSession');

/**
 * Core engine to generate daily tasks for all users.
 * This can be triggered by node-cron (local) or a Vercel Cron job (HTTP).
 */
const runDailyTaskGeneration = async () => {
    console.log('[TaskEngine] Initiating daily generation sequence...');
    
    const users = await User.find({});
    const now = new Date();
    const istDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // "YYYY-MM-DD"
    const today = new Date(istDateStr);
    today.setHours(0, 0, 0, 0);

    // Get the correct day of week in IST to determine if it's Quiz time (Saturday/Sunday)
    const istDayStr = now.toLocaleDateString("en-US", { weekday: 'long', timeZone: "Asia/Kolkata" });
    const dayNumMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const dayNum = dayNumMap[istDayStr];

    const stats = {
        usersProcessed: 0,
        dppsCreated: 0,
        revisionsCreated: 0,
        quizzesCreated: 0
    };

    for (const user of users) {
        stats.usersProcessed++;
        
        // 1. Generate DPP
        const dppExists = await DPP.findOne({
            user: user._id,
            date: { $gte: today }
        });

        if (!dppExists) {
            await DPP.create({
                user: user._id,
                date: today,
                status: 'PENDING'
            });
            stats.dppsCreated++;
        }

        // 1.5 Generate Daily Revision
        const revExists = await Revision.findOne({
            user: user._id,
            date: { $gte: today },
            type: 'DAILY'
        });

        if (!revExists) {
            await Revision.create({
                user: user._id,
                date: today,
                type: 'DAILY',
                status: 'PENDING'
            });
            stats.revisionsCreated++;
        }

        // 2. Generate Weekly Quiz Session if Saturday (6) or Sunday (0)
        if (dayNum === 6 || dayNum === 0) {
            const dayName = dayNum === 6 ? 'Saturday' : 'Sunday';
            const sessionExists = await QuizSession.findOne({
                user: user._id,
                date: { $gte: today },
                dayName: dayName
            });

            if (!sessionExists) {
                await QuizSession.create({
                    user: user._id,
                    date: today,
                    dayName: dayName,
                    status: 'PENDING',
                    quizzes: []
                });
                stats.quizzesCreated++;
            }
        }
    }

    console.log(`[TaskEngine] Sequence completed:`, stats);
    return stats;
};

module.exports = { runDailyTaskGeneration };

const cron = require('node-cron');
const { runDailyTaskGeneration } = require('./dailyTaskEngine');

/**
 * Initializes local cron schedulers for standard server deployments.
 * NOTE: For Vercel, use the /api/cron/daily endpoint instead as Vercel kills lambdas after execution.
 */
const initSchedulers = () => {
    // Every day at midnight local time
    cron.schedule('0 0 * * *', async () => {
        try {
            await runDailyTaskGeneration();
        } catch (error) {
            console.error('[SchedulerError] Failed during daily crontab trigger:', error);
        }
    });

    console.log('[Scheduler] Local crontab triggers initialized.');
};

module.exports = { initSchedulers };

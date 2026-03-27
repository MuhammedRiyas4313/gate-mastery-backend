const express = require('express');
const router = express.Router();
const { runDailyTaskGeneration } = require('../utils/dailyTaskEngine');

/**
 * @route   POST /api/cron/daily
 * @desc    Triggers the generation of daily DPPs, Revisions, and Quiz Sessions.
 * @access  Private (Cron secret)
 */
router.post('/daily', async (req, res) => {
    // Basic verification using a secret token if provided in env
    const authHeader = req.headers['authorization'];
    const CRON_SECRET = process.env.CRON_SECRET;

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return res.status(401).json({ success: false, message: 'Unauthorized execution attempt.' });
    }

    try {
        const stats = await runDailyTaskGeneration();
        res.status(200).json({ 
            success: true, 
            message: 'Daily generation sequence executed successfully.',
            stats 
        });
    } catch (error) {
        console.error('[CronRouteError] Execute failed:', error);
        res.status(500).json({ success: false, message: 'Internal engine failure during generation.' });
    }
});

module.exports = router;

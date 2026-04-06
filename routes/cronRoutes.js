const express = require('express');
const router = express.Router();

/**
 * @route   POST /api/cron/daily
 * @desc    Check (No longer active - tasks are sync'd on login/navigation)
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
        res.status(200).json({ 
            success: true, 
            message: 'Cron triggered (Tasks are now handled on user navigation).'
        });
    } catch (error) {
        console.error('[CronRouteError] Execute failed:', error);
        res.status(500).json({ success: false, message: 'Internal engine failure during generation.' });
    }
});

module.exports = router;

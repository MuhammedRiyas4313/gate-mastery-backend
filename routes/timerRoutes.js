const express = require('express');
const router = express.Router();
const { saveSession, getStats } = require('../controllers/timerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/session', saveSession);
router.get('/stats', getStats);

module.exports = router;

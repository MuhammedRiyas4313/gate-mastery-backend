const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Routes
router.route('/')
    .post(protect, upload.single('file'), scheduleController.uploadSchedule)
    .get(protect, scheduleController.getSchedules);

router.route('/:id')
    .delete(protect, scheduleController.deleteSchedule);

module.exports = router;

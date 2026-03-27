const express = require('express');
const router = express.Router();
const { getExams, addExam, updateExam, deleteExam } = require('../controllers/examController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getExams).post(addExam);
router.route('/:id').put(updateExam).delete(deleteExam);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getQuizSessions, addQuizSession, updateQuizSession, deleteQuizSession } = require('../controllers/quizSessionController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getQuizSessions);
router.post('/', protect, addQuizSession);
router.put('/:id', protect, updateQuizSession);
router.delete('/:id', protect, deleteQuizSession);

module.exports = router;

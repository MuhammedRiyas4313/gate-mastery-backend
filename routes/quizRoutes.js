const express = require('express');
const router = express.Router();
const { getQuizzes, addQuiz, updateQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getQuizzes);
router.post('/', protect, addQuiz);
router.put('/:id', protect, updateQuiz);
router.delete('/:id', protect, deleteQuiz);

module.exports = router;

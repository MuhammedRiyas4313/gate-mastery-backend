const express = require('express');
const router = express.Router();
const {
  getSubjects, addSubject, updateSubject, deleteSubject,
  addChapter, updateChapter, deleteChapter,
  addTopic, updateTopic, deleteTopic,
  getChapters
} = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSubjects);
router.post('/', protect, addSubject);
router.put('/:id', protect, updateSubject);
router.delete('/:id', protect, deleteSubject);

router.post('/:subjectId/chapters', protect, addChapter);
router.put('/chapters/:id', protect, updateChapter);
router.delete('/chapters/:id', protect, deleteChapter);

router.get('/:subjectId/chapters', protect, getChapters);
router.post('/chapters/:chapterId/topics', protect, addTopic);
router.put('/topics/:id', protect, updateTopic);
router.delete('/topics/:id', protect, deleteTopic);

module.exports = router;

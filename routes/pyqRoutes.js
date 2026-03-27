const express = require('express');
const router = express.Router();
const { getPYQs, addPYQ, updatePYQ, deletePYQ } = require('../controllers/pyqController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getPYQs);
router.post('/', protect, addPYQ);
router.put('/:id', protect, updatePYQ);
router.delete('/:id', protect, deletePYQ);

module.exports = router;

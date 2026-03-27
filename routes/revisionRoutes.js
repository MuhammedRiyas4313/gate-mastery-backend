const express = require('express');
const router = express.Router();
const { getRevisions, updateRevision, deleteRevision } = require('../controllers/revisionController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getRevisions);
router.put('/', protect, updateRevision);
router.delete('/:id', protect, deleteRevision);

module.exports = router;

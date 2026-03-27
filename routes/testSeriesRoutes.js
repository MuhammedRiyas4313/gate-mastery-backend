const express = require('express');
const router = express.Router();
const { getTestSeries, addTestSeries, updateTestSeries, deleteTestSeries } = require('../controllers/testSeriesController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTestSeries);
router.post('/', protect, addTestSeries);
router.put('/:id', protect, updateTestSeries);
router.delete('/:id', protect, deleteTestSeries);

module.exports = router;

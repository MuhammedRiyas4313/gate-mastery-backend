const express = require('express');
const router = express.Router();
const { getPlannerData } = require('../controllers/plannerController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getPlannerData);

module.exports = router;

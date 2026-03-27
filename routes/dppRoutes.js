const express = require('express');
const router = express.Router();
const { getDPPs, updateDPP, deleteDPP } = require('../controllers/dppController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDPPs);
router.put('/', protect, updateDPP);
router.delete('/:id', protect, deleteDPP);


module.exports = router;

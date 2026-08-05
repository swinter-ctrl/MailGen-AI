const express = require('express');
const router = express.Router();
const { generateEmail, getHistory } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate-email', protect, generateEmail);
router.get('/history', protect, getHistory);

module.exports = router;

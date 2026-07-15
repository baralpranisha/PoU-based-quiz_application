const express = require('express');
const router  = express.Router();
const { submitResult, getMyResults, getLatestResult, getMyStats, getAllResults } = require('../controllers/resultController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/',         protect, requireRole('student'), submitResult);
router.get('/me',        protect, requireRole('student'), getMyResults);
router.get('/me/latest', protect, requireRole('student'), getLatestResult);
router.get('/me/stats',  protect, requireRole('student'), getMyStats);
router.get('/',          protect, requireRole('teacher', 'admin'), getAllResults);

module.exports = router;
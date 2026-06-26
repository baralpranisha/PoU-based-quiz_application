const express = require('express');
const router  = express.Router();

const {
  submitResult,
  getMyResults,
  getLatestResult,
  getMyStats,
  getAllResults
} = require('../controllers/resultController');

const { protect, requireRole } = require('../middleware/authMiddleware');

router.use(protect);

// Student routes
router.post('/',          requireRole('student'), submitResult);
router.get('/me',         requireRole('student'), getMyResults);
router.get('/me/latest',  requireRole('student'), getLatestResult);
router.get('/me/stats',   requireRole('student'), getMyStats);

// Teacher / admin — all results with optional filters
router.get('/', requireRole('teacher', 'admin'), getAllResults);

module.exports = router;

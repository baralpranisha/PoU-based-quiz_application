const express = require('express');
const router  = express.Router();

const {
  submitPeer,
  getPeerSubmissions,
  getMySubmissions,
  reviewSubmission
} = require('../controllers/peerController');

const { protect, requireRole } = require('../middleware/authMiddleware');

router.use(protect);

// Student submits peer questions
router.post('/', requireRole('student'), submitPeer);

// Student views their own submissions
router.get('/me', requireRole('student'), getMySubmissions);

// Teacher / admin views all submissions (filter by ?status=pending etc.)
router.get('/', requireRole('teacher', 'admin'), getPeerSubmissions);

// Teacher / admin approves or rejects a submission
router.patch('/:id/review', requireRole('teacher', 'admin'), reviewSubmission);

module.exports = router;

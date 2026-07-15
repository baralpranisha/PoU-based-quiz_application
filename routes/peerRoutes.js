const express = require('express');
const router  = express.Router();
const { submitPeer, getPeerSubmissions, getMySubmissions, reviewSubmission } = require('../controllers/peerController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/',            protect, requireRole('student'), submitPeer);
router.get('/me',           protect, requireRole('student'), getMySubmissions);
router.get('/',             protect, requireRole('teacher', 'admin'), getPeerSubmissions);
router.patch('/:id/review', protect, requireRole('teacher', 'admin'), reviewSubmission);

module.exports = router;
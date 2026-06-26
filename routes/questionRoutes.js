const express = require('express');
const router  = express.Router();

const {
  getQuestions,
  getQuizQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getSubjects
} = require('../controllers/questionController');

const { protect, requireRole } = require('../middleware/authMiddleware');

// Public — students fetch quiz questions without auth would expose answers,
// so we protect the quiz endpoint too. All routes require login.
router.use(protect);

// Distinct subjects list (used by dropdowns in frontend)
router.get('/subjects', getSubjects);

// Randomised question set for a quiz attempt
router.get('/quiz', getQuizQuestions);

// Full question list — teacher/admin only
router.get('/', requireRole('teacher', 'admin'), getQuestions);

// Single question
router.get('/:id', getQuestionById);

// Create — teacher or admin
router.post('/', requireRole('teacher', 'admin'), createQuestion);

// Update / delete — creator or admin (checked inside controller)
router.put('/:id',    requireRole('teacher', 'admin'), updateQuestion);
router.delete('/:id', requireRole('teacher', 'admin'), deleteQuestion);

module.exports = router;

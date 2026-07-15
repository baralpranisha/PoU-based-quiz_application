const express = require('express');
const router  = express.Router();
const { getQuestions, getQuizQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion, getSubjects } = require('../controllers/questionController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/subjects',  protect, getSubjects);
router.get('/quiz',      protect, getQuizQuestions);
router.get('/',          protect, getQuestions);
router.get('/:id',       protect, getQuestionById);
router.post('/',         protect, requireRole('teacher', 'admin'), createQuestion);
router.put('/:id',       protect, requireRole('teacher', 'admin'), updateQuestion);
router.delete('/:id',    protect, requireRole('teacher', 'admin'), deleteQuestion);

module.exports = router;
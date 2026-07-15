const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/subjects', protect, async (req, res) => {
  const Question = require('../models/Question');
  const { semester } = req.query;
  const filter = { isActive: true };
  if (semester) filter.semester = parseInt(semester);
  const subjects = await Question.distinct('subject', filter);
  res.json({ subjects });
});

module.exports = router;
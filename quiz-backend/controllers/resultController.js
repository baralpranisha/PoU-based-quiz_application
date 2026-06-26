const Result      = require('../models/Result');
const ActivityLog = require('../models/ActivityLog');

// POST /api/results  — student submits a quiz
const submitResult = async (req, res) => {
  try {
    const { subject, semester, mode, total, score, answers, correct, questions, timeTaken } = req.body;

    if (!subject || !semester || total === undefined || score === undefined)
      return res.status(400).json({ message: 'subject, semester, total and score are required' });

    const percentage = Math.round((score / total) * 100);

    const result = await Result.create({
      student: req.user._id,
      subject, semester, mode,
      total, score, percentage,
      answers, correct, questions, timeTaken
    });

    // Log activity (for admin/teacher dashboards)
    await ActivityLog.create({
      user: req.user._id, name: req.user.name, role: 'student',
      type: 'quiz_complete',
      message: `${req.user.name} completed a quiz — ${subject}`,
      meta: { subject, semester, score, total, pct: percentage, mode, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
    });

    res.status(201).json({ message: 'Result saved', result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save result', error: err.message });
  }
};

// GET /api/results/me  — student's own history
const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .select('-questions -answers -correct');  // lighter payload for dashboard
    res.json({ count: results.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results/me/latest  — single latest result (for results.html)
const getLatestResult = async (req, res) => {
  try {
    const result = await Result.findOne({ student: req.user._id }).sort({ createdAt: -1 });
    if (!result) return res.status(404).json({ message: 'No results found' });
    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results/me/stats  — aggregated stats for student dashboard
const getMyStats = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id }).sort({ createdAt: -1 });

    const taken     = results.length;
    const scores    = results.map(r => r.percentage);
    const avgScore  = taken ? Math.round(scores.reduce((a, b) => a + b, 0) / taken) : 0;
    const best      = taken ? Math.max(...scores) : 0;
    const subjects  = [...new Set(results.map(r => r.subject))];
    const history   = results.slice(0, 10).map(r => ({
      subject: r.subject, semester: r.semester, mode: r.mode,
      score: r.score, total: r.total, pct: r.percentage,
      date: r.createdAt
    }));

    res.json({ taken, avgScore, best, subjects, history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/results  — admin/teacher: all results with filters
const getAllResults = async (req, res) => {
  try {
    const { subject, semester, studentId, limit = 50 } = req.query;
    const filter = {};
    if (subject)   filter.subject   = { $regex: new RegExp(subject, 'i') };
    if (semester)  filter.semester  = parseInt(semester);
    if (studentId) filter.student   = studentId;

    const results = await Result.find(filter)
      .populate('student', 'name email semester rollNumber')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-questions -answers -correct');

    res.json({ count: results.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitResult, getMyResults, getLatestResult, getMyStats, getAllResults };

const Question      = require('../models/Question');
const ActivityLog   = require('../models/ActivityLog');

// GET /api/questions  — query: subject, semester, difficulty, source, limit
const getQuestions = async (req, res) => {
  try {
    const { subject, semester, difficulty, source, limit = 30 } = req.query;
    const filter = { isActive: true };
    if (subject)    filter.subject    = { $regex: new RegExp(subject, 'i') };
    if (semester)   filter.semester   = parseInt(semester);
    if (difficulty) filter.difficulty = difficulty;
    if (source)     filter.source     = source;

    const questions = await Question.find(filter)
      .populate('createdBy', 'name email')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch questions', error: err.message });
  }
};

// GET /api/questions/quiz  — returns randomised set for a quiz attempt
const getQuizQuestions = async (req, res) => {
  try {
    const { subject, semester, count = 20 } = req.query;
    if (!subject || !semester) return res.status(400).json({ message: 'subject and semester are required' });

    const questions = await Question.find({
      subject: { $regex: new RegExp(subject, 'i') },
      semester: parseInt(semester),
      isActive: true
    }).select('text options answer topic difficulty');

    // Shuffle and slice
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, parseInt(count));

    // Return in the shape the quiz.html localStorage uses: { q, opts, ans }
    const shaped = shuffled.map(q => ({
      _id:  q._id,
      q:    q.text,
      opts: q.options,
      ans:  q.answer,
      topic: q.topic,
      difficulty: q.difficulty
    }));

    res.json({ count: shaped.length, questions: shaped });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load quiz questions', error: err.message });
  }
};

// GET /api/questions/:id
const getQuestionById = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id).populate('createdBy', 'name');
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/questions  — teacher or admin
const createQuestion = async (req, res) => {
  try {
    const { text, options, answer, subject, semester, topic, difficulty } = req.body;
    if (!text || !options || answer === undefined || !subject || !semester)
      return res.status(400).json({ message: 'text, options, answer, subject and semester are required' });

    const question = await Question.create({
      text, options, answer, subject, semester, topic, difficulty,
      createdBy: req.user._id,
      source: req.user.role === 'admin' ? 'admin' : 'teacher'
    });

    await ActivityLog.create({
      user: req.user._id, name: req.user.name, role: req.user.role,
      type: 'question_add',
      message: `${req.user.name} added a question for ${subject} (Sem ${semester})`,
      meta: { subject, semester }
    });

    res.status(201).json({ message: 'Question created', question });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create question', error: err.message });
  }
};

// PUT /api/questions/:id
const updateQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Question not found' });

    // Only creator or admin can edit
    if (q.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to edit this question' });

    Object.assign(q, req.body);
    await q.save();
    res.json({ message: 'Question updated', question: q });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/questions/:id
const deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Question not found' });

    if (q.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    q.isActive = false;
    await q.save();
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/questions/subjects — list of distinct subjects in DB
const getSubjects = async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = { isActive: true };
    if (semester) filter.semester = parseInt(semester);
    const subjects = await Question.distinct('subject', filter);
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getQuestions, getQuizQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion, getSubjects };

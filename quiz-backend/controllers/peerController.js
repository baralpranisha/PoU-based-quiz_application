const PeerSubmission = require('../models/PeerSubmission');
const Question       = require('../models/Question');
const ActivityLog    = require('../models/ActivityLog');

// POST /api/peer  — student submits peer questions
const submitPeer = async (req, res) => {
  try {
    const { subject, semester, questions } = req.body;
    if (!subject || !semester || !questions?.length)
      return res.status(400).json({ message: 'subject, semester and questions are required' });

    const sub = await PeerSubmission.create({
      student:  req.user._id,
      name:     req.user.name,
      subject, semester, questions
    });

    await ActivityLog.create({
      user: req.user._id, name: req.user.name, role: 'student',
      type: 'peer_submit',
      message: `${req.user.name} submitted ${questions.length} peer question(s) for ${subject}`,
      meta: { subject, semester, count: questions.length }
    });

    res.status(201).json({ message: 'Peer questions submitted for review', submission: sub });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit peer questions', error: err.message });
  }
};

// GET /api/peer  — admin/teacher: list submissions (filter by status)
const getPeerSubmissions = async (req, res) => {
  try {
    const { status, subject } = req.query;
    const filter = {};
    if (status)  filter.status  = status;
    if (subject) filter.subject = { $regex: new RegExp(subject, 'i') };

    const subs = await PeerSubmission.find(filter)
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.json({ count: subs.length, submissions: subs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/peer/me  — student's own submissions
const getMySubmissions = async (req, res) => {
  try {
    const subs = await PeerSubmission.find({ student: req.user._id }).sort({ submittedAt: -1 });
    res.json({ count: subs.length, submissions: subs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/peer/:id/review  — admin/teacher approves or rejects
const reviewSubmission = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'status must be approved or rejected' });

    const sub = await PeerSubmission.findById(req.params.id).populate('student', 'name');
    if (!sub) return res.status(404).json({ message: 'Submission not found' });

    sub.status     = status;
    sub.reviewedBy = req.user._id;
    sub.reviewNote = reviewNote;
    sub.reviewedAt = new Date();
    await sub.save();

    // If approved — promote all questions into the Question collection
    if (status === 'approved') {
      const toInsert = sub.questions.map(q => ({
        text: q.q, options: q.opts, answer: q.ans,
        subject: sub.subject, semester: sub.semester,
        createdBy: sub.student._id, source: 'peer'
      }));
      await Question.insertMany(toInsert);
    }

    await ActivityLog.create({
      user: req.user._id, name: req.user.name, role: req.user.role,
      type: 'peer_review',
      message: `${req.user.name} ${status} peer submission from ${sub.student.name}`,
      meta: { subject: sub.subject }
    });

    res.json({ message: `Submission ${status}`, submission: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitPeer, getPeerSubmissions, getMySubmissions, reviewSubmission };

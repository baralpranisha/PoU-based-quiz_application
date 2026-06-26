const User        = require('../models/User');
const Question    = require('../models/Question');
const Result      = require('../models/Result');
const PeerSubmission = require('../models/PeerSubmission');
const ActivityLog = require('../models/ActivityLog');

// GET /api/admin/overview
const getOverview = async (req, res) => {
  try {
    const [students, teachers, questions, results, pendingPeer, recentLogs] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Question.countDocuments({ isActive: true }),
      Result.countDocuments(),
      PeerSubmission.countDocuments({ status: 'pending' }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10)
    ]);
    res.json({ students, teachers, questions, results, pendingPeer, recentLogs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/students
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ count: students.length, students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ count: teachers.length, teachers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/users  — admin creates student/teacher account
const createUser = async (req, res) => {
  try {
    const { name, email, password = 'QuizVerse@123', role, semester, department } = req.body;
    if (!name || !email || !role) return res.status(400).json({ message: 'name, email and role are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({ name, email, password, role, semester, department, isActive: true });

    await ActivityLog.create({
      user: req.user._id, name: req.user.name, role: 'admin',
      type: 'user_create',
      message: `Admin created ${role} account for ${name}`,
      meta: { targetRole: role }
    });

    res.status(201).json({ message: 'User created', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/users/:id/toggle  — activate/deactivate
const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot deactivate admin accounts' });

    user.isActive = !user.isActive;
    await user.save();

    await ActivityLog.create({
      user: req.user._id, name: req.user.name, role: 'admin',
      type: 'user_toggle',
      message: `Admin ${user.isActive ? 'activated' : 'deactivated'} ${user.name}`,
    });

    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin accounts' });

    await user.deleteOne();

    await ActivityLog.create({
      user: req.user._id, name: req.user.name, role: 'admin',
      type: 'user_delete',
      message: `Admin deleted ${user.role} — ${user.name}`
    });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/logs
const getLogs = async (req, res) => {
  try {
    const { type, role, limit = 100 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (role) filter.role = role;
    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json({ count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/activity/students
const getStudentActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ role: 'student', type: 'quiz_complete' })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ count: logs.length, activity: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/activity/teachers
const getTeacherActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ role: 'teacher' })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ count: logs.length, activity: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getOverview, getStudents, getTeachers, createUser, toggleUser, deleteUser, getLogs, getStudentActivity, getTeacherActivity };

const User          = require('../models/User');
const ActivityLog   = require('../models/ActivityLog');
const generateToken = require('../utils/generateToken');
const crypto        = require('crypto');

// In-memory OTP store (use Redis in production)
const otpStore = {};

// Redirect map per role
const REDIRECT = {
  student: 'student-dashboard.html',
  teacher: 'teacher-dashboard.html',
  admin:   'admin-dashboard.html'
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', semester, rollNumber } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, semester, rollNumber });

    await ActivityLog.create({ user: user._id, name, role, type: 'register', message: `${name} registered as ${role}` });

    const token = generateToken(user._id, user.role);
    res.status(201).json({
      token,
      redirectUrl: REDIRECT[user.role],
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // If frontend sends role, enforce it matches
    if (role && user.role !== role)
      return res.status(403).json({ message: `This account is not registered as ${role}` });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });

    user.lastLogin = new Date();
    await user.save();

    await ActivityLog.create({ user: user._id, name: user.name, role: user.role, type: 'login', message: `${user.name} logged in` });

    const token = generateToken(user._id, user.role);
    res.json({
      token,
      redirectUrl: REDIRECT[user.role],
      user: { id: user._id, name: user.name, email: user.email, role: user.role, semester: user.semester }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// POST /api/auth/forgot-password  — sends OTP (mocked as response)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account with that email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10-minute expiry

    // In production: send via nodemailer / SMS
    // For development, the OTP is returned in the response
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    res.json({ message: 'OTP sent to your email', devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const entry = otpStore[email];
    if (!entry) return res.status(400).json({ message: 'No OTP requested for this email' });
    if (Date.now() > entry.expires) { delete otpStore[email]; return res.status(400).json({ message: 'OTP expired' }); }
    if (entry.otp !== otp) return res.status(400).json({ message: 'Incorrect OTP' });
    res.json({ message: 'OTP verified', verified: true });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const entry = otpStore[email];
    if (!entry || entry.otp !== otp || Date.now() > entry.expires)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();
    delete otpStore[email];

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed', error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, forgotPassword, verifyOtp, resetPassword, getMe };

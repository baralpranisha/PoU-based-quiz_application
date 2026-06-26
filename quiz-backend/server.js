require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const connectDB = require('./config/db');

const authRoutes     = require('./routes/authRoutes');
const userRoutes     = require('./routes/userRoutes');
const questionRoutes = require('./routes/questionRoutes');
const quizRoutes     = require('./routes/quizRoutes');
const resultRoutes   = require('./routes/resultRoutes');
const peerRoutes     = require('./routes/peerRoutes');
const adminRoutes    = require('./routes/adminRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quizzes',   quizRoutes);
app.use('/api/results',   resultRoutes);
app.use('/api/peer',      peerRoutes);
app.use('/api/admin',     adminRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'QuizVerse PoU API is running 🚀' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

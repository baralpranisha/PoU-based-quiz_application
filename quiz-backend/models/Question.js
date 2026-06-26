const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text:       { type: String, required: true, trim: true },
  options:    { type: [String], required: true, validate: v => v.length === 4 },
  answer:     { type: Number, required: true, min: 0, max: 3 },
  subject:    { type: String, required: true, trim: true },
  semester:   { type: Number, required: true, min: 1, max: 8 },
  topic:      { type: String, trim: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source:     { type: String, enum: ['teacher', 'peer', 'admin'], default: 'teacher' },
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:    { type: String, required: true },
  semester:   { type: Number, required: true },
  mode:       { type: String, enum: ['timed', 'practice'], default: 'timed' },
  total:      { type: Number, required: true },
  score:      { type: Number, required: true },
  percentage: { type: Number, required: true },
  answers:    [{ type: Number, default: null }],
  correct:    [{ type: Number }],
  questions:  [{ q: String, opts: [String], ans: Number }],
  timeTaken:  { type: Number },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:      { type: String },
  role:      { type: String, enum: ['student', 'teacher', 'admin'] },
  type:      { type: String },
  message:   { type: String },
  meta:      { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
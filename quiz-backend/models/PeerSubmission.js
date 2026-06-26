const mongoose = require('mongoose');

const peerQuestionSchema = new mongoose.Schema({
  q:    { type: String, required: true },
  opts: { type: [String], required: true, validate: v => v.length === 4 },
  ans:  { type: Number, required: true, min: 0, max: 3 }
});

const peerSubmissionSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String },
  subject:     { type: String, required: true },
  semester:    { type: Number, required: true },
  questions:   { type: [peerQuestionSchema], required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote:  { type: String },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt:  { type: Date }
});

module.exports = mongoose.model('PeerSubmission', peerSubmissionSchema);
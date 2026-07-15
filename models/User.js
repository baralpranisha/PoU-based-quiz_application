const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6 },
  role:       { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  semester:   { type: Number, min: 1, max: 8 },
  rollNumber: { type: String },
  batch:      { type: String },
  department: { type: String },
  office:     { type: String },
  officeHours:{ type: String },
  bio:        { type: String },
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now },
  lastLogin:  { type: Date }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
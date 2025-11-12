// server/models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email:    { type: String, required: true, lowercase: true, trim: true, index: true },
  purpose:  { type: String, enum: ['verify', 'password-reset'], default: 'verify', index: true },
  otp:      { type: String, required: true },
  expiry:   { type: Date, required: true }, // Remove index: true here since we use schema.index() below
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date },
  verified: { type: Boolean, default: false }, // For tracking OTP verification in password reset flow
}, { timestamps: true });

// One active OTP per (email,purpose)
otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
// Auto-delete after expiry
otpSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);

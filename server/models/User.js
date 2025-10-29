const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },

    // Store the HASH here. We hide it by default and opt-in via .select('+password')
    password: { type: String, required: true, select: false },

    // ✅ role for admin gating
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true }
  },
  { timestamps: true }
);

// Hash password if modified or new
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance method used by your authController
UserSchema.methods.comparePassword = function (candidatePassword) {
  // this.password is selected in the login query via .select('+password')
  return bcrypt.compare(candidatePassword, this.password || '');
};

// Optional: remove password from JSON responses if it somehow gets selected
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);

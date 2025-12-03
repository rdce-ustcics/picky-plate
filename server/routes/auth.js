// server/routes/auth.js
const express = require('express');
const router = express.Router();

const { signup, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const Otp = require('../models/Otp');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/mailer');

// ── Config
const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const OTP_TTL_MIN = Number(process.env.OTP_CODE_TTL_MIN || 10);
const OTP_RESEND_COOLDOWN_SEC = Number(process.env.OTP_RESEND_COOLDOWN_SEC || 120);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

function generateOtp(len = OTP_LENGTH) {
  const min = 10 ** (len - 1);
  const max = 10 ** len - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

// ── Auth basics
router.post('/signup', signup);
router.post('/login',  login);
router.get('/me', protect, getMe);
router.post('/logout', logout);

// ─────────────────────────────────────────────
// Email verification OTP
// ─────────────────────────────────────────────

// POST /api/auth/request-otp  { email }
router.post('/request-otp', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account with that email.' });
    if (user.verified) return res.status(400).json({ success: false, message: 'Email already verified.' });

    const now = Date.now();
    // Check for existing verification OTP
    let rec = await Otp.findOne({ email, purpose: 'verify' });
    if (rec?.lastSentAt) {
      const since = (now - new Date(rec.lastSentAt).getTime()) / 1000;
      const remaining = Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SEC - since));
      if (remaining > 0) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining}s before requesting another code.`,
          cooldownSec: remaining,
        });
      }
    }

    const otp = generateOtp(OTP_LENGTH);
    const expiry = new Date(now + OTP_TTL_MIN * 60 * 1000);

    // upsert OTP doc with 'verify' purpose for email verification
    await Otp.findOneAndUpdate(
      { email, purpose: 'verify' },
      { otp, expiry, attempts: 0, lastSentAt: new Date(now), purpose: 'verify', verified: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail({ to: email, code: otp });

    return res.json({
      success: true,
      message: 'OTP sent.',
      length: OTP_LENGTH,
      ttlMin: OTP_TTL_MIN,
      cooldownSec: OTP_RESEND_COOLDOWN_SEC,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

// POST /api/auth/verify-otp  { email, otp, purpose }
router.post('/verify-otp', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const code  = String(req.body.otp || '').trim();
    const purpose = String(req.body.purpose || 'verify').toLowerCase();

    if (!email || !code) return res.status(400).json({ success: false, message: 'Email & OTP are required.' });

      // Map 'verification' to 'verify' for backwards compatibility
      const otpPurpose = purpose === 'verification' ? 'verify' : purpose;

      // Try specific purpose first
      let rec = await Otp.findOne({ email, purpose: otpPurpose });

      // Fallback: any OTP for this email (in case of mismatched purpose)
      if (!rec) {
        rec = await Otp.findOne({ email });
      }

      if (!rec) {
        return res.status(400).json({ success: false, message: 'No OTP requested for this email.' });
      }

    if (Date.now() > new Date(rec.expiry).getTime())
      return res.status(400).json({ success: false, message: 'OTP expired.' });

    if (rec.otp !== code) {
      rec.attempts = (rec.attempts || 0) + 1;
      await rec.save();
      if (rec.attempts >= OTP_MAX_ATTEMPTS)
        return res.status(400).json({ success: false, message: 'Max attempts reached.' });
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // Handle different purposes
    if (purpose === 'password-reset') {
      // Don't delete OTP yet, we'll use it to verify permission to reset password
      rec.verified = true;
      await rec.save();
      return res.json({ success: true, message: 'OTP verified. You can now reset your password.', allowPasswordReset: true });
    } else {
      // Default: email verification
      const upd = await User.updateOne({ email }, { $set: { verified: true } });
      if (!upd.matchedCount && !upd.modifiedCount) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      await Otp.deleteOne({ _id: rec._id });
      return res.json({ success: true, message: 'Email verified. You can now log in.' });
    }
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error verifying OTP' });
  }
});

// ─────────────────────────────────────────────
// Password Reset Flow
// ─────────────────────────────────────────────

// POST /api/auth/forgot-password  { email }
router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account with that email.' });

    const now = Date.now();
    // Check for existing password-reset OTP
    let rec = await Otp.findOne({ email, purpose: 'password-reset' });
    if (rec?.lastSentAt) {
      const since = (now - new Date(rec.lastSentAt).getTime()) / 1000;
      const remaining = Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SEC - since));
      if (remaining > 0) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining}s before requesting another code.`,
          cooldownSec: remaining,
        });
      }
    }

    const otp = generateOtp(OTP_LENGTH);
    const expiry = new Date(now + OTP_TTL_MIN * 60 * 1000);

    // upsert OTP doc for password reset with correct purpose
    await Otp.findOneAndUpdate(
      { email, purpose: 'password-reset' },
      { otp, expiry, attempts: 0, lastSentAt: new Date(now), purpose: 'password-reset', verified: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail({ to: email, code: otp, subject: 'Password Reset OTP' });

    return res.json({
      success: true,
      message: 'Password reset OTP sent to your email.',
      length: OTP_LENGTH,
      ttlMin: OTP_TTL_MIN,
      cooldownSec: OTP_RESEND_COOLDOWN_SEC,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error sending password reset OTP' });
  }
});

// POST /api/auth/reset-password  { email, password, otp }
router.post('/reset-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');
    const otp = String(req.body.otp || '').trim();

    if (!email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'Email, password, and OTP are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Verify OTP and check if it's verified (look for password-reset purpose)
    const rec = await Otp.findOne({ email, purpose: 'password-reset' });
    if (!rec) return res.status(400).json({ success: false, message: 'No password reset requested for this email.' });
    if (!rec.verified) return res.status(400).json({ success: false, message: 'Please verify OTP first.' });
    if (rec.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP.' });

    // Update user password
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = password; // Will be hashed by pre-save middleware
    await user.save();

    // Clean up OTP record
    await Otp.deleteOne({ _id: rec._id });

    return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

// POST /api/auth/invalidate-otp  { email, purpose? }
router.post('/invalidate-otp', async (req, res) => {
  try {
    const email = String(req.body.email || req.query.email || '').toLowerCase().trim();
    const purpose = String(req.body.purpose || req.query.purpose || 'verify').toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    await Otp.deleteOne({ email, purpose });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error invalidating OTP' });
  }
});


module.exports = router;

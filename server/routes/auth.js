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
const OTP_RESEND_COOLDOWN_SEC = Number(process.env.OTP_RESEND_COOLDOWN_SEC || 60);
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
    let rec = await Otp.findOne({ email });
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

    // upsert OTP doc (schema has no "purpose" field)
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiry, attempts: 0, lastSentAt: new Date(now) },
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
    console.error('[request-otp] error:', e);
    return res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

// POST /api/auth/verify-otp  { email, otp }
router.post('/verify-otp', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const code  = String(req.body.otp || '').trim();
    if (!email || !code) return res.status(400).json({ success: false, message: 'Email & OTP are required.' });

    const rec = await Otp.findOne({ email });
    if (!rec) return res.status(400).json({ success: false, message: 'No OTP requested for this email.' });

    if (Date.now() > new Date(rec.expiry).getTime())
      return res.status(400).json({ success: false, message: 'OTP expired.' });

    if (rec.otp !== code) {
      rec.attempts = (rec.attempts || 0) + 1;
      await rec.save();
      if (rec.attempts >= OTP_MAX_ATTEMPTS)
        return res.status(400).json({ success: false, message: 'Max attempts reached.' });
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // success → mark user verified, consume OTP
    const upd = await User.updateOne({ email }, { $set: { verified: true } });
    if (!upd.matchedCount && !upd.modifiedCount) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await Otp.deleteOne({ _id: rec._id });
    return res.json({ success: true, message: 'Email verified. You can now log in.' });
  } catch (e) {
    console.error('[verify-otp] error:', e);
    return res.status(500).json({ success: false, message: 'Error verifying OTP' });
  }
});

module.exports = router;

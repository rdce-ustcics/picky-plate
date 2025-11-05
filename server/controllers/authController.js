// server/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signJwt = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

// POST /api/auth/signup
// Create user (verified=false). Do NOT return a token here.
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: String(email).toLowerCase().trim(),
      password,
      role: 'user',
      verified: false, // enforce OTP gate
    });

    // No token on signup. Frontend should send to /verify-otp and call /request-otp
    return res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email to continue.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, verified: user.verified },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error creating account' });
  }
};

// POST /api/auth/login
// Block login if user.verified === false
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const ok = await user.validPassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // ⛔️ Enforce OTP verification first
    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email to continue.',
        code: 'UNVERIFIED',
        email: user.email,
      });
    }

    const token = signJwt(user._id);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, verified: user.verified },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Error logging in' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, verified: user.verified },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Error fetching user data' });
  }
};

// POST /api/auth/logout
exports.logout = async (_req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

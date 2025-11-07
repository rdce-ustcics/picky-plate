// server/routes/debug.js (new file)
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// If you have a requireAuth middleware already, use it.
// Otherwise, inline a minimal one here for testing.
const requireAuth = async (req, res, next) => {
  try {
    const raw = req.headers.authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 👇 Make SURE this matches what you signed at login (id vs _id vs userId)
    const user = await User.findById(decoded.id).lean();
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    req.user = user;
    req.decoded = decoded; // handy for logging
    next();
  } catch (e) {
    console.error('requireAuth error:', e.message);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

router.get('/whoami', requireAuth, (req, res) => {
  res.json({
    success: true,
    decoded: req.decoded,             // what’s inside your JWT
    userFromDB: {
      _id: String(req.user._id),
      email: req.user.email,
      role: req.user.role,
    },
    dbName: req.app.get('mongooseDbName') || null
  });
});

module.exports = router;

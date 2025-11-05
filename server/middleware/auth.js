// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.id || payload.sub || payload.userId;
    if (!userId) return res.status(401).json({ error: 'Invalid token payload' });

    const user = await User.findById(userId).select('email name role verified').lean();
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = { id: String(user._id), email: user.email, name: user.name, role: user.role, verified: user.verified };
    next();
  } catch (e) {
    console.error('requireAuth error:', e.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = { requireAuth, requireAdmin, protect: requireAuth };

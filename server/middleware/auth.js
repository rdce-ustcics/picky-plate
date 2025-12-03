const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Extract bearer token from Authorization header
function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// Liberal userId extractor: supports { id }, { _id }, or { userId }
function getUserIdFromDecoded(decoded) {
  return decoded?.id || decoded?._id || decoded?.userId || null;
}

async function attachUserFromToken(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    console.log('[Auth] No token provided');
    return { ok: false, code: 401, msg: 'No token provided. Please login.' };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    console.log('[Auth] Token verification failed:', e.message);
    return { ok: false, code: 401, msg: 'Invalid or expired token. Please login again.' };
  }

  const userId = getUserIdFromDecoded(decoded);
  if (!userId) {
    console.log('[Auth] No user ID in token payload:', decoded);
    return { ok: false, code: 401, msg: 'Bad token payload (no user id).' };
  }

  const user = await User.findById(userId).select('-password');
  if (!user) {
    console.log('[Auth] User not found in database for ID:', userId);
    return { ok: false, code: 401, msg: 'User not found. Please login again.' };
  }

  req.user = user;
  req.tokenDecoded = decoded;
  return { ok: true };
}

/**
 * Requires a valid JWT; sets req.user
 */
const protect = async (req, res, next) => {
  try {
    const result = await attachUserFromToken(req, res);
    if (!result.ok) return res.status(result.code).json({ success: false, message: result.msg });
    next();
  } catch (error) {
    // console.error('Auth error:', error);
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

/**
 * Requires a valid JWT and admin role
 */
const requireAdmin = async (req, res, next) => {
  try {
    const result = await attachUserFromToken(req, res);
    if (!result.ok) return res.status(result.code).json({ success: false, message: result.msg });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    // console.error('Admin auth error:', error);
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

module.exports = { protect, requireAdmin };

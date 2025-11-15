// server/routes/preferences.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const UserPreferences = require('../models/UserPreferences');

// 🔐 Require JWT auth for all preferences routes
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'auth_required' });
  }

  const token = h.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ error: 'invalid_token' });
    }
    req.user = { id: String(decoded.id) };
    next();
  } catch (e) {
    console.error('preferences_auth_error:', e);
    return res.status(401).json({ error: 'invalid_token' });
  }
}

router.use(requireAuth);

// GET /api/preferences/me
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id; // ✅ always JWT id

    const prefs = await UserPreferences.findOne({ userId }).lean();

    if (!prefs) {
      return res.json({
        userId,
        likes: [],
        dislikes: [],
        favorites: [],
        diets: [],
        allergens: [],
        kiddieMeal: false,
        onboardingDone: false,
      });
    }

    res.json({
      userId: prefs.userId,
      likes: prefs.likes || [],
      dislikes: prefs.dislikes || [],
      favorites: prefs.favorites || [],
      diets: prefs.diets || [],
      allergens: prefs.allergens || [],
      kiddieMeal: prefs.kiddieMeal === true,
      onboardingDone: !!prefs.onboardingDone,
    });
  } catch (e) {
    console.error('GET /preferences/me error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// PUT /api/preferences/me
router.put('/me', async (req, res) => {
  try {
    const userId = req.user.id; // ✅ always JWT id

    const {
      likes,
      dislikes,
      diets,
      allergens,
      favorites,
      kiddieMeal,
      onboardingDone,
    } = req.body;

    const update = {};

    if ('likes' in req.body)      update.likes      = Array.isArray(likes) ? likes : [];
    if ('dislikes' in req.body)   update.dislikes   = Array.isArray(dislikes) ? dislikes : [];
    if ('diets' in req.body)      update.diets      = Array.isArray(diets) ? diets : [];
    if ('allergens' in req.body)  update.allergens  = Array.isArray(allergens) ? allergens : [];
    if ('favorites' in req.body)  update.favorites  = Array.isArray(favorites) ? favorites : [];
    if ('kiddieMeal' in req.body) update.kiddieMeal = kiddieMeal === true;

    if ('onboardingDone' in req.body) {
      update.onboardingDone = !!onboardingDone;
    } else {
      update.onboardingDone = true;
    }

    const prefs = await UserPreferences.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      userId: prefs.userId,
      likes: prefs.likes || [],
      dislikes: prefs.dislikes || [],
      favorites: prefs.favorites || [],
      diets: prefs.diets || [],
      allergens: prefs.allergens || [],
      kiddieMeal: prefs.kiddieMeal === true,
      onboardingDone: !!prefs.onboardingDone,
    });
  } catch (e) {
    console.error('PUT /preferences/me error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;

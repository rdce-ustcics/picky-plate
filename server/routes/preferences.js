// server/routes/preferences.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const UserPreferences = require('../models/UserPreferences');
const mongoose = require('mongoose');
const KidPreferences = require('../models/KidPreferences');


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
    // console.error('preferences_auth_error:', e);
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
    // console.error('GET /preferences/me error:', e);
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
    // console.error('PUT /preferences/me error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/preferences/kids - list all kids for the logged-in user
router.get('/kids', async (req, res) => {
  try {
    const userId = req.user.id;

    const kids = await KidPreferences.find({ userId }).lean();

    res.json({
      success: true,
      kids: kids || [],
    });
  } catch (e) {
    // console.error('GET /preferences/kids error:', e);
    res.status(500).json({ success: false, message: 'server_error' });
  }
});

// POST /api/preferences/kids - create or update a kid's preferences
router.post('/kids', async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      kidId, // optional for new kid
      name,
      age,
      // New fields from frontend
      eatingStyle = '',
      favoriteFoods = '',
      wontEat = '',
      notes = '',
      // Legacy/array fields
      likes = [],
      dislikes = [],
      diets = [],
      allergens = [],
      favorites = [],
      kiddieMeal = true,
    } = req.body;

    if (!name || typeof age === 'undefined') {
      return res
        .status(400)
        .json({ success: false, message: 'Name and age are required' });
    }

    const finalKidId = kidId || new mongoose.Types.ObjectId().toString();

    const doc = await KidPreferences.findOneAndUpdate(
      { userId, kidId: finalKidId },
      {
        userId,
        kidId: finalKidId,
        name,
        age,
        // New fields
        eatingStyle: eatingStyle || '',
        favoriteFoods: favoriteFoods || '',
        wontEat: wontEat || '',
        notes: notes || '',
        // Legacy fields
        likes: Array.isArray(likes) ? likes : [],
        dislikes: Array.isArray(dislikes) ? dislikes : [],
        diets: Array.isArray(diets) ? diets : [],
        allergens: Array.isArray(allergens) ? allergens : [],
        favorites: Array.isArray(favorites) ? favorites : [],
        kiddieMeal: kiddieMeal === true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      success: true,
      kid: doc,
    });
  } catch (e) {
    // console.error('POST /preferences/kids error:', e);
    res.status(500).json({ success: false, message: 'server_error' });
  }
});

// DELETE /api/preferences/kids/:kidId - optional: remove a kid
router.delete('/kids/:kidId', async (req, res) => {
  try {
    const userId = req.user.id;
    const kidId = req.params.kidId;

    await KidPreferences.deleteOne({ userId, kidId });

    res.json({ success: true });
  } catch (e) {
    // console.error('DELETE /preferences/kids/:kidId error:', e);
    res.status(500).json({ success: false, message: 'server_error' });
  }
});


module.exports = router;

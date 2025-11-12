const express = require('express');
const router = express.Router();
const { LikePref, DislikePref, DietPref, AllergenPref, FavoritePref } = require('../models/prefs');
const KiddieMeal = require('../models/kiddieMeal');

const getUserId = (req) =>
  req.header('x-user-id') || req.query.userId || (req.body && req.body.userId) || null;

router.get('/me', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const [likes, dislikes, diets, allergens, favorites, kiddieMeal] = await Promise.all([
      LikePref.findOne({ userId }).lean(),
      DislikePref.findOne({ userId }).lean(),
      DietPref.findOne({ userId }).lean(),
      AllergenPref.findOne({ userId }).lean(),
      FavoritePref.findOne({ userId }).lean(),
      KiddieMeal.findOne({ userId }).lean(),
    ]);

    res.json({
      userId,
      likes: likes?.items ?? [],
      dislikes: dislikes?.items ?? [],
      favorites: favorites?.items ?? [],
      diets: diets?.items ?? [],
      allergens: allergens?.items ?? [],
      kiddieMeal: kiddieMeal?.enabled ?? false,
      onboardingDone: Boolean(likes || dislikes || diets || allergens),
    });
  } catch (e) {
    console.error('GET /preferences/me error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.put('/me', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const upsert = (Model, items) =>
      Model.findOneAndUpdate(
        { userId },
        { $set: { items: Array.isArray(items) ? items : [] } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();

    const jobs = [];
    if ('likes' in req.body)     jobs.push(upsert(LikePref, req.body.likes));
    if ('dislikes' in req.body)  jobs.push(upsert(DislikePref, req.body.dislikes));
    if ('diets' in req.body)     jobs.push(upsert(DietPref, req.body.diets));
    if ('allergens' in req.body) jobs.push(upsert(AllergenPref, req.body.allergens));
    if ('favorites' in req.body) jobs.push(upsert(FavoritePref, req.body.favorites));

    // Handle kiddieMeal separately as it's a boolean, not an array
    if ('kiddieMeal' in req.body) {
      jobs.push(
        KiddieMeal.findOneAndUpdate(
          { userId },
          { $set: { enabled: req.body.kiddieMeal === true } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean()
      );
    }

    await Promise.all(jobs);

    const [likes, dislikes, diets, allergens, favorites, kiddieMeal] = await Promise.all([
      LikePref.findOne({ userId }).lean(),
      DislikePref.findOne({ userId }).lean(),
      DietPref.findOne({ userId }).lean(),
      AllergenPref.findOne({ userId }).lean(),
      FavoritePref.findOne({ userId }).lean(),
      KiddieMeal.findOne({ userId }).lean(),
    ]);

    res.json({
      userId,
      likes: likes?.items ?? [],
      dislikes: dislikes?.items ?? [],
      favorites: favorites?.items ?? [],
      diets: diets?.items ?? [],
      allergens: allergens?.items ?? [],
      kiddieMeal: kiddieMeal?.enabled ?? false,
      onboardingDone: true,
    });
  } catch (e) {
    console.error('PUT /preferences/me error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;

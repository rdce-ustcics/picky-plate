// server/routes/admin.js
const express = require('express');
const router = express.Router();

const admin = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// quick public ping to prove this router is mounted
router.get('/_ping', (_req, res) => res.json({ ok: true, scope: 'admin' }));

// everything below must be admin
router.use(requireAuth, requireAdmin);

// reported recipes
router.get('/reported-recipes', admin.listReportedRecipes);
router.patch('/recipes/:id/soft-delete', admin.softDeleteRecipe);
router.patch('/recipes/:id/reinstate', admin.reinstateRecipe);

// cultural explorer
router.get('/cultural-explorer', admin.getCulturalExplorer);
router.patch('/cultural-explorer', admin.updateCulturalExplorer);

module.exports = router;

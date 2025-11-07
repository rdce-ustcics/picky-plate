const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const { requireAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/flagged-recipes
 * Get all flagged recipes for admin review
 */
router.get('/flagged-recipes', requireAdmin, async (req, res) => {
  try {
    const recipes = await Recipe.find({
      isFlagged: true,
      isDeleted: false,
    })
      .populate('flaggedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ flaggedAt: -1 })
      .lean();

    res.json({ success: true, recipes });
  } catch (e) {
    console.error('Error fetching flagged recipes:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch flagged recipes' });
  }
});

/**
 * POST /api/admin/approve-recipe/:id
 * Approve a flagged recipe (remove flag)
 */
router.post('/approve-recipe/:id', requireAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, error: 'Recipe not found' });

    recipe.isFlagged = false;
    recipe.flaggedAt = null;
    recipe.flaggedBy = null;
    await recipe.save();

    res.json({ success: true, message: 'Recipe approved successfully', recipe });
  } catch (e) {
    console.error('Error approving recipe:', e);
    res.status(500).json({ success: false, error: 'Failed to approve recipe' });
  }
});

/**
 * DELETE /api/admin/reject-recipe/:id
 * Reject a flagged recipe (soft delete)
 */
router.delete('/reject-recipe/:id', requireAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, error: 'Recipe not found' });

    recipe.isDeleted = true;
    recipe.deletedAt = new Date();
    recipe.isFlagged = false;
    recipe.flaggedAt = null;
    recipe.flaggedBy = null;
    await recipe.save();

    res.json({ success: true, message: 'Recipe rejected and removed from public view' });
  } catch (e) {
    console.error('Error rejecting recipe:', e);
    res.status(500).json({ success: false, error: 'Failed to reject recipe' });
  }
});

/**
 * GET /api/admin/review-recipes
 * Recipes where state: "forReview"
 */
router.get('/review-recipes', requireAdmin, async (req, res) => {
  try {
    const recipes = await Recipe.find({ state: 'forReview', isDeleted: false })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, recipes });
  } catch (e) {
    console.error('Error fetching review recipes:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch recipes for review' });
  }
});

/**
 * POST /api/admin/recipes/:id/reinstate
 * Reinstate recipe (state -> active)
 */
router.post('/recipes/:id/reinstate', requireAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          state: 'active',
          isFlagged: false,
          flaggedAt: null,
          flaggedBy: null,
        },
      },
      { new: true, runValidators: true } // ⬅️ ensure enum + schema apply
    );

    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    return res.json({ success: true, message: 'Recipe reinstated (state: active)', recipe });
  } catch (e) {
    console.error('Error reinstating recipe:', e);
    return res.status(500).json({ success: false, error: 'Failed to reinstate recipe' });
  }
});

/**
 * DELETE /api/admin/recipes/:id
 * Permanently delete recipe
 */
router.delete('/recipes/:id', requireAdmin, async (req, res) => {
  try {
    const result = await Recipe.deleteOne({ _id: req.params.id }); // hard delete
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }
    return res.json({ success: true, message: 'Recipe permanently deleted' });
  } catch (e) {
    console.error('Error deleting recipe:', e);
    return res.status(500).json({ success: false, error: 'Failed to permanently delete recipe' });
  }
});

/**
 * GET /api/admin/stats
 * Dashboard stats
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalRecipes, flaggedCount, deletedCount, forReviewCount] = await Promise.all([
      Recipe.countDocuments({ isDeleted: false }),
      Recipe.countDocuments({ isFlagged: true, isDeleted: false }),
      Recipe.countDocuments({ isDeleted: true }),
      Recipe.countDocuments({ state: 'forReview', isDeleted: false }),
    ]);

    res.json({
      success: true,
      stats: { totalRecipes, flaggedCount, deletedCount, forReviewCount },
    });
  } catch (e) {
    console.error('Error fetching stats:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

module.exports = router;

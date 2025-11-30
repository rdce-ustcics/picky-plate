// server/controllers/adminController.js
const Recipe = require('../models/Recipe');
const RecipeReport = require('../models/RecipeReport');
const { requireAdmin } = require('../middleware/auth');

// List reported recipes
async function listReportedRecipes(req, res) {
  try {
    const reports = await RecipeReport.find({ status: 'pending' })
      .populate('recipeId', 'title author image')
      .lean();
    return res.json({ success: true, reports });
  } catch (e) {
    // console.error('Error fetching reported recipes:', e);
    return res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
}

// Soft delete a recipe (admin)
async function softDeleteRecipe(req, res) {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, { isDeleted: true });
    if (!recipe) return res.status(404).json({ success: false, error: 'Recipe not found' });
    return res.json({ success: true, message: 'Recipe soft-deleted' });
  } catch (e) {
    // console.error('Error soft deleting recipe:', e);
    return res.status(500).json({ success: false, error: 'Failed to delete recipe' });
  }
}

// Reinstate a deleted recipe (admin)
async function reinstateRecipe(req, res) {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, { isDeleted: false });
    if (!recipe) return res.status(404).json({ success: false, error: 'Recipe not found' });
    return res.json({ success: true, message: 'Recipe reinstated' });
  } catch (e) {
    // console.error('Error reinstating recipe:', e);
    return res.status(500).json({ success: false, error: 'Failed to reinstate recipe' });
  }
}

// Admin endpoint to fetch cultural explorer data
async function getCulturalExplorer(req, res) {
  try {
    const culturalData = {};  // Your logic to fetch cultural explorer data goes here
    return res.json({ success: true, data: culturalData });
  } catch (e) {
    // console.error('Error fetching cultural explorer data:', e);
    return res.status(500).json({ success: false, error: 'Failed to fetch cultural data' });
  }
}

// Admin endpoint to update cultural explorer data
async function updateCulturalExplorer(req, res) {
  try {
    const { data } = req.body;  // Your logic to update cultural explorer data goes here
    return res.json({ success: true, message: 'Cultural explorer data updated' });
  } catch (e) {
    // console.error('Error updating cultural explorer data:', e);
    return res.status(500).json({ success: false, error: 'Failed to update cultural data' });
  }
}

module.exports = {
  listReportedRecipes,
  softDeleteRecipe,
  reinstateRecipe,
  getCulturalExplorer,
  updateCulturalExplorer
};

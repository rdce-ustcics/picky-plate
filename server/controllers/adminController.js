const Recipe = require('../models/Recipe');
const RecipeReport = require('../models/RecipeReport');
const Setting = require('../models/Setting');

// Reported recipes (grouped)
exports.listReportedRecipes = async (req, res) => {
  try {
    const status = (req.query.status || 'pending').toLowerCase();
    const match = status === 'all' ? {} : { status: 'pending' };

    const agg = await RecipeReport.aggregate([
      { $match: match },
      { $group: { _id: '$recipeId', count: { $sum: 1 }, lastReportedAt: { $max: '$createdAt' } } },
      { $sort: { lastReportedAt: -1 } },
      { $limit: 200 }
    ]);

    const ids = agg.map(x => x._id);
    const recipes = await Recipe.find({ _id: { $in: ids } }).lean();
    const byId = Object.fromEntries(recipes.map(r => [String(r._id), r]));

    const payload = agg.map(x => ({
      recipe: byId[String(x._id)],
      reportCount: x.count,
      lastReportedAt: x.lastReportedAt
    })).filter(x => !!x.recipe);

    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load reported recipes' });
  }
};


// Soft-delete
exports.softDeleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Recipe.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Recipe not found' });

    await RecipeReport.updateMany({ recipeId: id, status: 'pending' }, { $set: { status: 'actioned' } });
    res.json({ ok: true, recipe: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
};

// Reinstate
exports.reinstateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Recipe.findByIdAndUpdate(
      id,
      { $set: { isDeleted: false } },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ ok: true, recipe: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reinstate recipe' });
  }
};

// Cultural Explorer: GET
exports.getCulturalExplorer = async (_req, res) => {
  try {
    const doc = await Setting.findOne({ key: 'cultural_explorer' }).lean();
    const fallback = {
      enabled: true,
      featuredRegions: ['Ilocano', 'Kapampangan'],
      rotationDays: 7,
      description: ''
    };
    res.json(doc?.data || fallback);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Cultural Explorer: PATCH
exports.updateCulturalExplorer = async (req, res) => {
  try {
    const data = {
      enabled: !!req.body.enabled,
      featuredRegions: Array.isArray(req.body.featuredRegions)
        ? req.body.featuredRegions
        : String(req.body.featuredRegions || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
      rotationDays: Math.max(1, Number(req.body.rotationDays || 7)),
      description: String(req.body.description || '')
    };

    const updated = await Setting.findOneAndUpdate(
      { key: 'cultural_explorer' },
      { $set: { data, updatedAt: new Date() } },
      { new: true, upsert: true }
    ).lean();

    res.json(updated.data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

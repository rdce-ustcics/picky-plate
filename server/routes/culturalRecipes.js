const express = require("express");
const router = express.Router();
const CulturalRecipe = require("../models/CulturalRecipe");
const { requireAdmin } = require("../middleware/auth");

/**
 * GET /api/cultural-recipes/admin/all
 * Admin only - get ALL cultural recipes (including inactive)
 */
router.get("/admin/all", requireAdmin, async (req, res) => {
  try {
    const recipes = await CulturalRecipe.find({})
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, recipes });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch cultural recipes" });
  }
});

/**
 * GET /api/cultural-recipes
 * Public endpoint - get all active cultural recipes
 * Optional query: region (filter by region), includeImages (boolean)
 */
router.get("/", async (req, res) => {
  try {
    const { region, includeImages } = req.query;
    const query = { isActive: true };

    if (region && region !== "All") {
      query.region = region;
    }

    let selectFields = 'name desc region isActive createdAt updatedAt _id';

    // Include images if requested
    if (includeImages === 'true') {
      selectFields += ' img';
    }

    const recipes = await CulturalRecipe.find(query)
      .select(selectFields)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, recipes });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch cultural recipes" });
  }
});

/**
 * GET /api/cultural-recipes/:id
 * Public endpoint - get single cultural recipe
 */
router.get("/:id", async (req, res) => {
  try {
    const recipe = await CulturalRecipe.findById(req.params.id).lean();
    if (!recipe || !recipe.isActive) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    res.json({ success: true, recipe });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch recipe" });
  }
});

/**
 * POST /api/cultural-recipes
 * Admin only - create new cultural recipe
 */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, desc, region, img, recipe, ingredients, instructions } = req.body;

    if (!name || !desc || !region) {
      return res.status(400).json({
        success: false,
        error: "Name, description, and region are required"
      });
    }

    const culturalRecipe = await CulturalRecipe.create({
      name,
      desc,
      region,
      img: img || "",
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      instructions: Array.isArray(instructions) ? instructions : [],
      recipe: Array.isArray(recipe) ? recipe : [], // Backward compatibility
      createdBy: req.user?._id || req.user?.id || null,
    });

    res.status(201).json({ success: true, recipe: culturalRecipe });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to create cultural recipe" });
  }
});

/**
 * PUT /api/cultural-recipes/:id
 * Admin only - update cultural recipe
 */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { name, desc, region, img, recipe, ingredients, instructions } = req.body;

    const culturalRecipe = await CulturalRecipe.findById(req.params.id);
    if (!culturalRecipe) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    if (name) culturalRecipe.name = name;
    if (desc) culturalRecipe.desc = desc;
    if (region) culturalRecipe.region = region;
    if (img !== undefined) culturalRecipe.img = img;
    if (Array.isArray(ingredients)) culturalRecipe.ingredients = ingredients;
    if (Array.isArray(instructions)) culturalRecipe.instructions = instructions;
    if (Array.isArray(recipe)) culturalRecipe.recipe = recipe; // Backward compatibility
    culturalRecipe.updatedBy = req.user?._id || req.user?.id || null;

    await culturalRecipe.save();

    res.json({ success: true, recipe: culturalRecipe });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to update cultural recipe" });
  }
});

/**
 * DELETE /api/cultural-recipes/:id
 * Admin only - soft delete (set isActive: false)
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const culturalRecipe = await CulturalRecipe.findById(req.params.id);
    if (!culturalRecipe) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    culturalRecipe.isActive = false;
    await culturalRecipe.save();

    res.json({ success: true, message: "Cultural recipe deleted successfully" });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to delete cultural recipe" });
  }
});

module.exports = router;

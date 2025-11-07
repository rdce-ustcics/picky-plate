const express = require("express");
const Recipe = require("../models/Recipe");
const { protect } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/recipes
 * List recipes with filters
 * Query params:
 *  - search: text search
 *  - tags: comma-separated tags
 *  - exclude: comma-separated allergens/terms to exclude
 *  - prep, cook, diff, servings: exact match filters
 *  - authorId: filter by creator (for "My Recipes")
 *  - page, limit: pagination
 */
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      tags = "",
      page = 1,
      limit = 20,
      exclude = "",
      prep = "",
      cook = "",
      diff = "",
      servings = "",
      authorId = "",
    } = req.query;

    // Base query - exclude deleted recipes from public view
    const q = {
      isDeleted: { $ne: true }
    };

    // Filter by author if provided (for "My Recipes" feature)
    if (authorId && authorId !== 'global') {
      q.createdBy = authorId;
    }

    // Text search across multiple fields
    if (search) {
      const rx = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 
        "i"
      );
      q.$or = [
        { title: rx },
        { description: rx },
        { ingredients: rx },
        { instructions: rx },
      ];
    }

    // Tag filter (match ANY of the provided tags)
    if (tags) {
      const list = String(tags)
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (list.length) q.tags = { $in: list };
    }

    // Exact match filters for dropdowns
    if (prep) q.prepTime = prep;
    if (cook) q.cookTime = cook;
    if (diff) q.difficulty = diff;
    if (servings) q.servings = servings;

    // Exclude allergens/terms
    const excludes = String(exclude)
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    if (excludes.length) {
      const andClauses = excludes.map((al) => {
        const safe = al.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(`\\b${safe}\\b`, "i");
        return {
          $nor: [
            { allergens: al },
            { tags: al },
            { ingredients: rx },
            { description: rx },
            { title: rx },
          ],
        };
      });
      q.$and = (q.$and || []).concat(andClauses);
    }

    // Pagination
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    // Execute query
    const [items, total] = await Promise.all([
      Recipe.find(q)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      Recipe.countDocuments(q),
    ]);

    res.json({
      success: true,
      items,
      total,
      page: p,
      pages: Math.ceil(total / l),
    });
  } catch (e) {
    console.error("recipes_list_error:", e);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch recipes" 
    });
  }
});

/**
 * GET /api/recipes/:id
 * Get single recipe by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const doc = await Recipe.findById(req.params.id).lean();
    
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        error: "Recipe not found" 
      });
    }

    // Don't show deleted recipes
    if (doc.isDeleted) {
      return res.status(404).json({ 
        success: false, 
        error: "Recipe not found" 
      });
    }

    res.json({ success: true, recipe: doc });
  } catch (e) {
    console.error("get_recipe_error:", e);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch recipe" 
    });
  }
});

/**
 * POST /api/recipes
 * Create a new recipe (requires authentication)
 */
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      image = "",
      author,
      prepTime = "",
      cookTime = "",
      difficulty = "Easy",
      description = "",
      servings = "",
      notes = "",
      ingredients = [],
      instructions = [],
      tags = [],
      allergens = [],
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: "Title is required" 
      });
    }

    // Clean and normalize tags
    const cleanTags = (Array.isArray(tags) ? tags : String(tags).split(","))
      .map((t) => String(t).trim().toLowerCase())
      .filter(Boolean);

    // Clean and normalize allergens
    const cleanAllergens = (Array.isArray(allergens) ? allergens : String(allergens).split(","))
      .map((a) => String(a).trim().toLowerCase())
      .filter(Boolean);

    // Create recipe
    const doc = await Recipe.create({
      title: title.trim(),
      image,
      author: author || req.user?.name || req.user?.email || "anonymous",
      prepTime,
      cookTime,
      difficulty,
      description,
      servings,
      notes,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      instructions: Array.isArray(instructions) ? instructions : [],
      tags: cleanTags,
      allergens: cleanAllergens,
      createdBy: req.user?._id || req.user?.id || null,
      isFlagged: false,
      isDeleted: false,
    });

    res.status(201).json({ success: true, recipe: doc });
  } catch (e) {
    console.error("create_recipe_error:", e);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create recipe" 
    });
  }
});

/**
 * POST /api/recipes/:id/report
 * Report a recipe for admin review (requires authentication)
 */
router.post("/:id/report", protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false, 
        message: 'Recipe not found' 
      });
    }

    if (recipe.isDeleted) {
      return res.status(400).json({ 
        success: false, 
        message: 'This recipe has already been removed' 
      });
    }

    if (recipe.isFlagged) {
      return res.status(400).json({ 
        success: false, 
        message: 'This recipe has already been reported and is under review' 
      });
    }

    // Flag the recipe
    recipe.isFlagged = true;
    recipe.flaggedAt = new Date();
    recipe.flaggedBy = req.user?._id || req.user?.id;
    await recipe.save();

    res.json({ 
      success: true, 
      message: 'Recipe reported successfully. Our admin team will review it.' 
    });
  } catch (e) {
    console.error('report_recipe_error:', e);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to report recipe. Please try again.' 
    });
  }
});

/**
 * PUT /api/recipes/:id
 * Update a recipe (requires authentication and ownership)
 */
router.put("/:id", protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false, 
        error: "Recipe not found" 
      });
    }

    // Check ownership (only creator or admin can update)
    const isOwner = recipe.createdBy && 
                    recipe.createdBy.toString() === (req.user?._id || req.user?.id).toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: "You don't have permission to edit this recipe" 
      });
    }

    // Update fields
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'isFlagged' && key !== 'isDeleted') {
        recipe[key] = updates[key];
      }
    });

    await recipe.save();

    res.json({ success: true, recipe });
  } catch (e) {
    console.error("update_recipe_error:", e);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update recipe" 
    });
  }
});

/**
 * DELETE /api/recipes/:id
 * Delete a recipe (requires authentication and ownership)
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false, 
        error: "Recipe not found" 
      });
    }

    // Check ownership (only creator or admin can delete)
    const isOwner = recipe.createdBy && 
                    recipe.createdBy.toString() === (req.user?._id || req.user?.id).toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: "You don't have permission to delete this recipe" 
      });
    }

    // Soft delete
    recipe.isDeleted = true;
    recipe.deletedAt = new Date();
    await recipe.save();

    res.json({ 
      success: true, 
      message: "Recipe deleted successfully" 
    });
  } catch (e) {
    console.error("delete_recipe_error:", e);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete recipe" 
    });
  }
});

module.exports = router;
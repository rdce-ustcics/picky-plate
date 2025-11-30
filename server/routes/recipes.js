// server/routes/recipes.js
const express = require("express");
const Recipe = require("../models/Recipe");
const { protect } = require("../middleware/auth");

const router = express.Router();
const RecipeReport = require('../models/RecipeReport');

function devImpersonate(req, _res, next) {
  if (process.env.NODE_ENV !== "production") {
    const id = req.headers["x-impersonate-user-id"];
    if (id && /^[0-9a-fA-F]{24}$/.test(String(id))) {
      req.user = { ...(req.user || {}), id: String(id), _id: String(id), email: `dev+${String(id).slice(-6)}@local` };
    }
  }
  next();
}

// ---- Helpers ----
function calcReportStats(reports) {
  const arr = Array.isArray(reports) ? reports : [];
  const lifetime = arr.length;
  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const weekly = arr.filter((r) => {
    const t = r?.createdAt ? new Date(r.createdAt).getTime() : 0;
    return t >= weekAgoMs;
  }).length;

  return { lifetime, weekly };
}

function escapeRegExp(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/recipes
 * Optional query:
 *  - search: text search across title/description/ingredients/instructions
 *  - tags: comma-separated list of tags (ANY)
 *  - exclude: comma-separated list (exclude allergens/tags/text matches)
 *  - prep, cook, diff, servings: exact string matches
 *  - authorId: show "my recipes" (matches createdBy if ObjectId OR author string)
 *  - page, limit
 *  - lite: if "true", exclude image field for faster initial load
 */
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      tags = "",
      exclude = "",
      prep = "",
      cook = "",
      diff = "",
      servings = "",
      authorId = "",
      page = 1,
      limit = 20,
      lite = "false",
    } = req.query;

    const isLiteMode = lite === "true";

    const q = {
      state: { $ne: "forReview" }, // Exclude recipes that are marked as "forReview"
    };

    // Text search across fields
    if (search) {
      const rx = new RegExp(escapeRegExp(search.trim()), "i");
      q.$or = [{ title: rx }, { description: rx }, { ingredients: rx }, { instructions: rx }];
    }

    // Tags (ANY)
    if (tags) {
      const list = String(tags)
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (list.length) q.tags = { $in: list };
    }

    // Exact-match dropdown filters
    if (prep) q.prepTime = prep;
    if (cook) q.cookTime = cook;
    if (diff) q.difficulty = diff;
    if (servings) q.servings = servings;

    // Exclusions (allergens/tags/text)
    const excludes = String(exclude)
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    if (excludes.length) {
      const andClauses = excludes.map((al) => {
        const safe = escapeRegExp(al);
        const rx = new RegExp(`\\b${safe}\\b`, "i");
        return {
          $nor: [
            { allergens: al }, // allergens array exact
            { tags: al }, // tags array exact
            { ingredients: rx }, // mention in ingredients text
            { description: rx }, // mention in description
            { title: rx }, // mention in title
          ],
        };
      });
      q.$and = (q.$and || []).concat(andClauses);
    }

    // "My Recipes" filter (createdBy ObjectId or author string equals)
    if (authorId) {
      const safe = String(authorId).trim();
      const or = [{ author: new RegExp(`^${escapeRegExp(safe)}$`, "i") }];
      if (/^[0-9a-fA-F]{24}$/.test(safe)) {
        const mongoose = require('mongoose');
        or.push({ createdBy: new mongoose.Types.ObjectId(safe) });
      }
      q.$and = (q.$and || []).concat([{ $or: or }]);
    }

    // Pagination
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    // Who is asking (to mark reportedByMe)
    const userHeaderId = (req.headers["x-user-id"] || "").toString();

    // Query - exclude image in lite mode for faster initial load
    const projection = isLiteMode ? { image: 0 } : {};
    const [rawItems, total] = await Promise.all([
      Recipe.find(q, projection).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
      Recipe.countDocuments(q),
    ]);

    // Decorate with counters and flags
    const items = rawItems.map((doc) => {
      const { lifetime, weekly } = calcReportStats(doc.reports);
      const reportedByMe =
        userHeaderId &&
        Array.isArray(doc.reports) &&
        doc.reports.some((r) => String(r.user) === userHeaderId);

      return {
        ...doc,
        reportsCount: lifetime, // lifetime total
        weeklyReports: weekly, // last 7 days
        reportedByMe,
      };
    });

    res.json({
      items,
      total,
      page: p,
      pages: Math.ceil(total / l),
    });
  } catch (e) {
    // console.error("recipes_list_error:", e);
    res.status(500).json({ success: false, error: "list_failed" });
  }
});

/**
 * GET /api/recipes/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const userHeaderId = (req.headers["x-user-id"] || "").toString();
    const doc = await Recipe.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, error: "not_found" });

    const { lifetime, weekly } = calcReportStats(doc.reports);
    const reportedByMe =
      userHeaderId &&
      Array.isArray(doc.reports) &&
      doc.reports.some((r) => String(r.user) === userHeaderId);

    res.json({
      success: true,
      recipe: {
        ...doc,
        reportsCount: lifetime,
        weeklyReports: weekly,
        reportedByMe,
      },
    });
  } catch (e) {
    // console.error("get_recipe_error:", e);
    res.status(500).json({ success: false, error: "get_failed" });
  }
});

/**
 * POST /api/recipes
 * Requires auth
 */
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      image = "",
      author, // optional override
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

    if (!title) return res.status(400).json({ success: false, error: "title_required" });

    const cleanTags = (Array.isArray(tags) ? tags : String(tags).split(","))
      .map((t) => String(t).trim().toLowerCase())
      .filter(Boolean);

    const cleanAllergens = (Array.isArray(allergens) ? allergens : String(allergens).split(","))
      .map((a) => String(a).trim().toLowerCase())
      .filter(Boolean);

    const doc = await Recipe.create({
      title,
      image,
      author: author || (req.user?.name || req.user?.email || "anonymous"),
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
      // reports/state default from schema
    });

    res.status(201).json({ success: true, recipe: doc });
  } catch (e) {
    // console.error("create_recipe_error:", e);
    res.status(500).json({ success: false, error: "create_failed" });
  }
});

/**
 * PUT /api/recipes/:id
 * Update a recipe - Creator or Admin can edit
 */
router.put("/:id", protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    // Check if user is the creator OR an admin
    const userId = String(req.user?._id || req.user?.id || "").trim();
    const recipeCreatorId = String(recipe.createdBy?._id || recipe.createdBy || "").trim();
    const isAdmin = req.user?.role === "admin";
    const isOwner = userId && recipeCreatorId && userId === recipeCreatorId;

    // console.log("Edit permission check:", { userId, recipeCreatorId, isOwner, isAdmin });

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to edit this recipe"
      });
    }

    // Update allowed fields
    const {
      title,
      image,
      prepTime,
      cookTime,
      difficulty,
      description,
      servings,
      notes,
      ingredients,
      instructions,
      tags,
      allergens,
    } = req.body;

    if (title !== undefined) recipe.title = title;
    if (image !== undefined) recipe.image = image;
    if (prepTime !== undefined) recipe.prepTime = prepTime;
    if (cookTime !== undefined) recipe.cookTime = cookTime;
    if (difficulty !== undefined) recipe.difficulty = difficulty;
    if (description !== undefined) recipe.description = description;
    if (servings !== undefined) recipe.servings = servings;
    if (notes !== undefined) recipe.notes = notes;

    if (ingredients !== undefined) {
      recipe.ingredients = Array.isArray(ingredients) ? ingredients : [];
    }
    if (instructions !== undefined) {
      recipe.instructions = Array.isArray(instructions) ? instructions : [];
    }

    if (tags !== undefined) {
      const cleanTags = (Array.isArray(tags) ? tags : String(tags).split(","))
        .map((t) => String(t).trim().toLowerCase())
        .filter(Boolean);
      recipe.tags = cleanTags;
    }

    if (allergens !== undefined) {
      const cleanAllergens = (Array.isArray(allergens) ? allergens : String(allergens).split(","))
        .map((a) => String(a).trim().toLowerCase())
        .filter(Boolean);
      recipe.allergens = cleanAllergens;
    }

    await recipe.save();

    res.json({ success: true, recipe });
  } catch (e) {
    // console.error("update_recipe_error:", e);
    res.status(500).json({ success: false, error: "update_failed" });
  }
});

/**
 * DELETE /api/recipes/:id
 * Delete a recipe - Creator or Admin can delete
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    // Check if user is the creator OR an admin
    const userId = String(req.user?._id || req.user?.id || "").trim();
    const recipeCreatorId = String(recipe.createdBy?._id || recipe.createdBy || "").trim();
    const isAdmin = req.user?.role === "admin";
    const isOwner = userId && recipeCreatorId && userId === recipeCreatorId;

    // console.log("Delete permission check:", { userId, recipeCreatorId, isOwner, isAdmin });

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this recipe"
      });
    }

    await Recipe.findByIdAndDelete(req.params.id);

    const message = isAdmin && !isOwner
      ? "Recipe deleted by admin"
      : "Recipe deleted successfully";

    res.json({ success: true, message });
  } catch (e) {
    // console.error("delete_recipe_error:", e);
    res.status(500).json({ success: false, error: "delete_failed" });
  }
});

/**
 * POST /api/recipes/:id/report
 * Report a recipe for admin review (with detailed tracking)
 */
router.post("/:id/report", protect, async (req, res) => {
  try {
    const { reason = 'other', description = '' } = req.body;
    
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

    // Check if user already reported this recipe
    const existingReport = await RecipeReport.findOne({
      recipeId: req.params.id,
      reportedBy: req.user._id,
      status: 'pending'
    });

    if (existingReport) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reported this recipe' 
      });
    }

    // Create report
    await RecipeReport.create({
      recipeId: req.params.id,
      reportedBy: req.user._id,
      reason,
      description,
      status: 'pending'
    });

    // Flag the recipe if not already flagged
    if (!recipe.isFlagged) {
      recipe.isFlagged = true;
      recipe.flaggedAt = new Date();
      recipe.flaggedBy = req.user._id;
      await recipe.save();
    }

    res.json({ 
      success: true, 
      message: 'Recipe reported successfully. Our admin team will review it.' 
    });
  } catch (e) {
    // console.error('report_recipe_error:', e);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to report recipe. Please try again.' 
    });
  }
});

module.exports = router;

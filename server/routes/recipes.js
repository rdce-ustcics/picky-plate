// server/routes/recipes.js
const express = require("express");
const mongoose = require("mongoose");
const Recipe = require("../models/Recipe");
const RecipeReport = require("../models/RecipeReport");
const { protect } = require("../middleware/auth");

const router = express.Router();

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function sevenDaysAgo() {
  return new Date(Date.now() - WEEK_MS);
}

/**
 * Helper: recompute counts & possibly delist a recipe
 * - reportCount  = active (last 7 days, excluding dismissed)
 * - lifetime     = total (excluding dismissed)
 * - Delist if active>=5 OR lifetime>=20
 * Returns { activeCount, lifetimeCount, delisted }
 */
async function recomputeReportsAndMaybeDelist(recipeId) {
  const [activeCount, lifetimeCount] = await Promise.all([
    RecipeReport.countDocuments({
      recipeId,
      status: { $ne: "dismissed" },
      createdAt: { $gte: sevenDaysAgo() },
    }),
    RecipeReport.countDocuments({
      recipeId,
      status: { $ne: "dismissed" },
    }),
  ]);

  const shouldDelist = activeCount >= 5 || lifetimeCount >= 20;

  await Recipe.updateOne(
    { _id: recipeId },
    {
      $set: {
        reportCount: activeCount,
        lastReportedAt: new Date(),
        ...(shouldDelist ? { isDeleted: true } : {}),
      },
    }
  );

  return { activeCount, lifetimeCount, delisted: shouldDelist };
}

/**
 * GET /api/recipes
 * Query:
 *  - search, tags, page, limit
 *  - exclude (CSV)
 *  - prep, cook, diff, servings
 *  - authorId (optional, for "My Recipes")
 *
 * Always hides delisted/soft-deleted recipes (isDeleted: false).
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

    const q = { isDeleted: false };

    if (search) {
      const rx = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      q.$or = [{ title: rx }, { description: rx }, { ingredients: rx }, { instructions: rx }];
    }

    if (tags) {
      const list = String(tags)
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (list.length) q.tags = { $in: list };
    }

    if (prep) q.prepTime = prep;
    if (cook) q.cookTime = cook;
    if (diff) q.difficulty = diff;
    if (servings) q.servings = servings;

    if (authorId && mongoose.isValidObjectId(authorId)) {
      q.createdBy = new mongoose.Types.ObjectId(authorId);
    }

    // Exclusions (allergens/terms)
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

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      Recipe.find(q).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
      Recipe.countDocuments(q),
    ]);

    res.json({
      items,
      total,
      page: p,
      pages: Math.ceil(total / l),
    });
  } catch (e) {
    console.error("recipes_list_error:", e);
    res.status(500).json({ success: false, error: "list_failed" });
  }
});

/**
 * GET /api/recipes/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const doc = await Recipe.findById(req.params.id);
    if (!doc || doc.isDeleted) {
      return res.status(404).json({ success: false, error: "not_found" });
    }
    res.json({ success: true, recipe: doc });
  } catch (e) {
    console.error("get_recipe_error:", e);
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
    });

    res.status(201).json({ success: true, recipe: doc });
  } catch (e) {
    console.error("create_recipe_error:", e);
    res.status(500).json({ success: false, error: "create_failed" });
  }
});

/**
 * GET /api/recipes/:id/report-status
 * Auth required — returns if THIS user can report (7-day lockout).
 *
 * Response:
 * { canReport: boolean, alreadyReported: boolean, windowEndsAt?: ISOString, activeCount: number }
 */
router.get("/:id/report-status", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const last = await RecipeReport.findOne({
      recipeId: id,
      reportedBy: req.user.id,
      status: { $ne: "dismissed" },
    })
      .sort({ createdAt: -1 })
      .lean();

    const activeCount = await RecipeReport.countDocuments({
      recipeId: id,
      status: { $ne: "dismissed" },
      createdAt: { $gte: sevenDaysAgo() },
    });

    if (!last) {
      return res.json({ canReport: true, alreadyReported: false, activeCount });
    }

    const windowEndsAt = new Date(last.createdAt.getTime() + WEEK_MS);
    const canReport = Date.now() >= windowEndsAt.getTime();

    res.json({
      canReport,
      alreadyReported: !canReport, // "already" within window
      windowEndsAt: windowEndsAt.toISOString(),
      activeCount,
    });
  } catch (e) {
    console.error("report_status_error:", e);
    res.status(500).json({ error: "report_status_failed" });
  }
});

/**
 * POST /api/recipes/:id/report
 * Auth required — creates a report if user hasn't reported in the last 7 days.
 * Returns { ok: true, duplicate?: true, activeCount, lifetimeCount, delisted }
 */
router.post("/:id/report", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "", notes = "" } = req.body || {};

    // verify recipe exists and is not already delisted
    const recipe = await Recipe.findById(id).select("_id isDeleted");
    if (!recipe) return res.status(404).json({ error: "recipe_not_found" });
    if (recipe.isDeleted) return res.status(410).json({ error: "recipe_delisted" });

    // 7-day lockout check
    const last = await RecipeReport.findOne({
      recipeId: id,
      reportedBy: req.user.id,
      status: { $ne: "dismissed" },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (last && last.createdAt > sevenDaysAgo()) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Create report
    await RecipeReport.create({
      recipeId: id,
      reportedBy: req.user.id,
      reason: String(reason).slice(0, 200),
      notes: String(notes || "").slice(0, 500),
    });

    // Recompute & maybe delist
    const { activeCount, lifetimeCount, delisted } = await recomputeReportsAndMaybeDelist(id);

    return res.status(201).json({ ok: true, activeCount, lifetimeCount, delisted });
  } catch (e) {
    console.error("report_error:", e);
    return res.status(500).json({ error: "report_failed" });
  }
});

module.exports = router;

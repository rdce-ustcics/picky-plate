// server/routes/recipes.js
const express = require("express");
const Recipe = require("../models/Recipe");
const RecipeReport = require("../models/RecipeReport");
const { protect } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/recipes
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
      // admin can optionally pass ?includeDeleted=1 to see delisted
      includeDeleted = "0",
    } = req.query;

    const q = {};
    if (includeDeleted !== "1") {
      q.isDeleted = false; // ⬅️ hide delisted by default
    }

    if (search) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      q.$or = [
        { title: rx },
        { description: rx },
        { ingredients: rx },
        { instructions: rx },
      ];
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

    // Exclusions
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
    if (!doc) return res.status(404).json({ success: false, error: "not_found" });
    // Hide delisted to non-admin callers if you want; for now we just return it.
    res.json({ success: true, recipe: doc });
  } catch (e) {
    console.error("get_recipe_error:", e);
    res.status(500).json({ success: false, error: "get_failed" });
  }
});

/**
 * POST /api/recipes
 * (unchanged from your version)
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
 * POST /api/recipes/:id/report
 * - Logged-in only (protect)
 * - Creates a 7-day expiring report (TTL)
 * - Updates weekly active count and lifetime total on Recipe
 * - Delists when (weekly >=5) OR (lifetime >=20)
 */
router.post("/:id/report", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "", notes = "" } = req.body || {};

    // verify recipe exists
    const recipe = await Recipe.findById(id).select("_id");
    if (!recipe) return res.status(404).json({ error: "recipe_not_found" });

    // Try to create a new pending report (unique guard avoids duplicates while pending)
    let report;
    try {
      report = await RecipeReport.create({
        recipeId: id,
        reportedBy: req.user.id || req.user._id, // ensure protect sets one of these
        reason: String(reason).slice(0, 200),
        notes: String(notes || "").slice(0, 500),
        status: "pending",
        // expiresAt is auto-set by model default (+7 days)
      });
    } catch (err) {
      // Duplicate pending by same user (until it expires or is actioned)
      if (err?.code === 11000) {
        const existing = await RecipeReport.findOne({
          recipeId: id,
          reportedBy: req.user.id || req.user._id,
          status: "pending",
        }).lean();
        return res.status(200).json({ ok: true, duplicate: true, reportId: existing?._id });
      }
      throw err;
    }

    // Recompute rolling 7-day active count (use createdAt; TTL will drop old docs)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyActive = await RecipeReport.countDocuments({
      recipeId: id,
      createdAt: { $gte: since },
      status: "pending",
    });

    // Increment lifetime total (denormalized, never decreases)
    // And update lastReportedAt + 7-day active counter atomically
    const updated = await Recipe.findByIdAndUpdate(
      id,
      {
        $inc: { reportTotal: 1 },
        $set: { reportCount: weeklyActive, lastReportedAt: new Date() },
      },
      { new: true }
    ).lean();

    // Delist rules
    const shouldDelist = (weeklyActive >= 5) || ((updated?.reportTotal || 0) >= 20);
    if (shouldDelist && !updated?.isDeleted) {
      await Recipe.updateOne({ _id: id }, { $set: { isDeleted: true } });
    }

    return res.status(201).json({
      ok: true,
      reportId: report._id,
      weeklyActive,
      reportTotal: (updated?.reportTotal || 0),
      delisted: shouldDelist,
    });
  } catch (e) {
    console.error("report_error:", e);
    return res.status(500).json({ error: "report_failed" });
  }
});

module.exports = router;

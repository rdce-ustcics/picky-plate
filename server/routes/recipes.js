// server/routes/recipes.js
const express = require("express");
const Recipe = require("../models/Recipe");
const { protect } = require("../middleware/auth"); // you already have this

const router = express.Router();

/**
 * GET /api/recipes
 * Optional query:
 *  - search: text search across title/description/ingredients
 *  - tags: comma-separated list of tags (matches ANY)
 *  - page, limit
 */
// server/routes/recipes.js (only the GET / block shown)
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      tags = "",
      page = 1,
      limit = 20,
      exclude = "",
      prep = "",     // NEW
      cook = "",     // NEW
      diff = "",     // NEW (difficulty)
      servings = "", // NEW
    } = req.query;

    const q = {};
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

    // NEW: exact match filters (because we store dropdown values as strings)
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
            { allergens: al },      // if present in allergens array
            { tags: al },           // if a tag equals the excluded term
            { ingredients: rx },    // mention in any ingredient text
            { description: rx },    // mention in description
            { title: rx },       // ⬅️ NEW: exclude if title mentions term
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
    res.json({ success: true, recipe: doc });
  } catch (e) {
    console.error("get_recipe_error:", e);
    res.status(500).json({ success: false, error: "get_failed" });
  }
});

/**
 * POST /api/recipes
 * Body shape mirrors your React structure.
 * Requires auth (remove `protect` if you want public posting).
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

    // tags to lowercase, trimmed
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

module.exports = router;

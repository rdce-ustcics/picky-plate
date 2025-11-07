// server/routes/recipes.js
const express = require("express");
const Recipe = require("../models/Recipe");
const { protect } = require("../middleware/auth");

const router = express.Router();

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
 *  - authorId: show “my recipes” (matches createdBy if ObjectId OR author string)
 *  - page, limit
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
    } = req.query;

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
        or.push({ createdBy: safe });
      }
      q.$and = (q.$and || []).concat([{ $or: or }]);
    }

    // Pagination
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    // Who is asking (to mark reportedByMe)
    const userHeaderId = (req.headers["x-user-id"] || "").toString();

    // Query
    const [rawItems, total] = await Promise.all([
      Recipe.find(q).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
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
    console.error("recipes_list_error:", e);
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
    console.error("create_recipe_error:", e);
    res.status(500).json({ success: false, error: "create_failed" });
  }
});

/**
 * POST /api/recipes/:id/report
 * Body: { reason: string, comment?: string }
 * Requires auth. Each user can report once.
 * Flags state=forReview if (lifetime >= 20) OR (weekly >= 5).
 */
router.post("/:id/report", protect, devImpersonate, async (req, res) => {
  try {
    const { reason = "", comment = "" } = req.body || {};
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, error: "not_found" });

    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: "no_user" });

    const already = (recipe.reports || []).some((r) => String(r.user) === String(userId));
    if (already) return res.status(409).json({ success: false, error: "already_reported" });

    recipe.reports.push({
      user: userId,
      reason: String(reason || "Other"),
      comment: String(comment || ""),
      createdAt: new Date(),
    });

    const { lifetime, weekly } = calcReportStats(recipe.reports);

    if (lifetime >= 20 || weekly >= 5) {
      recipe.state = "forReview";
    }

    await recipe.save();

    return res.status(201).json({
      success: true,
      state: recipe.state,
      reportsCount: lifetime,
      weeklyReports: weekly,
      message: "reported",
    });
  } catch (e) {
    console.error("report_recipe_error:", e);
    res.status(500).json({ success: false, error: "report_failed" });
  }
});

module.exports = router;

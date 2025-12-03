// server/routes/mealPlans.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const MealPlan = require("../models/MealPlan");

/**
 * GET /api/mealplans?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns all meal plans for the logged-in user in the date range.
 */
router.get("/", protect, async (req, res) => {
  try {
    const { start, end } = req.query;
    const q = { user: req.user.id };
    if (start && end) q.date = { $gte: start, $lte: end };
    const items = await MealPlan.find(q).sort({ date: 1 });
    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ success: false, error: "list_failed" });
  }
});

/**
 * PUT /api/mealplans/:date
 * Body: { dishes: [{name, cost, slot?}] }
 * Upserts the day's dishes for this user.
 */
router.put("/:date", protect, async (req, res) => {
  try {
    const { date } = req.params;
    const { dishes = [] } = req.body;

    if (!Array.isArray(dishes)) {
      return res.status(400).json({ success: false, error: "dishes_array_required" });
    }

    const clean = dishes
      .map(d => ({
        name: String(d.name || "").trim(),
        cost: Number(d.cost || 0),
        slot: d.slot || "other",
      }))
      .filter(d => d.name && d.cost >= 0);

    const doc = await MealPlan.findOneAndUpdate(
      { user: req.user.id, date },
      { $set: { dishes: clean } },
      { new: true, upsert: true }
    );

    res.json({ success: true, plan: doc });
  } catch (e) {
    res.status(500).json({ success: false, error: "save_failed" });
  }
});

/**
 * DELETE /api/mealplans/:date/:index
 * Deletes a single dish by index for the day.
 */
router.delete("/:date/:index", protect, async (req, res) => {
  try {
    const { date, index } = req.params;
    const doc = await MealPlan.findOne({ user: req.user.id, date });
    if (!doc) return res.status(404).json({ success: false, error: "not_found" });
    const i = parseInt(index, 10);
    if (isNaN(i) || i < 0 || i >= doc.dishes.length) {
      return res.status(400).json({ success: false, error: "bad_index" });
    }
    doc.dishes.splice(i, 1);
    await doc.save();
    res.json({ success: true, plan: doc });
  } catch (e) {
    res.status(500).json({ success: false, error: "delete_failed" });
  }
});

module.exports = router;

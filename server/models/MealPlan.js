// server/models/MealPlan.js
const mongoose = require("mongoose");

const DishSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  cost: { type: Number, required: true, min: 0 },
  slot: { type: String, enum: ["breakfast", "lunch", "dinner", "other"], default: "other" }, // optional tag
});

const MealPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // store date as YYYY-MM-DD (local, Sunday–Saturday weeks in UI)
    date: { type: String, required: true, index: true },
    dishes: { type: [DishSchema], default: [] }, // any number of dishes for the day
  },
  { timestamps: true }
);

MealPlanSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("MealPlan", MealPlanSchema);

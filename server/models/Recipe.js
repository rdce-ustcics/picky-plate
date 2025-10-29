const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, default: "anonymous" },
    image: { type: String, default: "" },

    // quick info
    prepTime: { type: String, default: "" },   // e.g. "20min"
    cookTime: { type: String, default: "" },   // e.g. "30min"
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    servings: { type: String, default: "" },   // e.g. "4 servings"

    description: { type: String, default: "" },
    notes: { type: String, default: "" },

    ingredients: { type: [String], default: [] },
    instructions: { type: [String], default: [] },

    tags: { type: [String], index: true, default: [] },
    allergens: { type: [String], index: true, default: [] },

    // who created it (optional)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // 🔹 Admin controls (soft-delete + reporting)
    isDeleted: { type: Boolean, default: false, index: true },
    reportCount: { type: Number, default: 0, index: true },
    lastReportedAt: { type: Date, index: true }
  },
  { timestamps: true }
);

// Helpful compound index for admin lists (optional)
RecipeSchema.index({ isDeleted: 1, lastReportedAt: -1 });

module.exports = mongoose.model("Recipe", RecipeSchema);

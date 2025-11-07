const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, default: "anonymous" },
    image: { type: String, default: "" },

    // quick info
    prepTime: { type: String, default: "" },
    cookTime: { type: String, default: "" },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    servings: { type: String, default: "" },

    description: { type: String, default: "" },
    notes: { type: String, default: "" },

    ingredients: { type: [String], default: [] },
    instructions: { type: [String], default: [] },

    tags: { type: [String], index: true, default: [] },
    allergens: { type: [String], index: true, default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // 🔑 moderation status
    state: { type: String, enum: ["active", "forReview"], default: "active", index: true }, // ⬅️ ADD THIS

    // legacy flags (keep if you still use them elsewhere)
    isFlagged: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    flaggedAt: { type: Date, default: null },
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// helpful compound index
RecipeSchema.index({ isFlagged: 1, isDeleted: 1 });

module.exports = mongoose.model("Recipe", RecipeSchema);

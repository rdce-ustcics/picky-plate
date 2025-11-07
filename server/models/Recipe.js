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
    
    // who created it (optional)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Admin moderation fields
    isFlagged: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    flaggedAt: { type: Date, default: null },
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index for admin queries
RecipeSchema.index({ isFlagged: 1, isDeleted: 1 });

module.exports = mongoose.model("Recipe", RecipeSchema);
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

    // ADD below allergens: { type: [String], index: true, default: [] },
    reports: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          reason: { type: String, required: true },
          comment: { type: String, default: "" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    state: {
      type: String,
      enum: ["active", "forReview"],
      default: "active",
    },

    // who created it (optional)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", RecipeSchema);
model
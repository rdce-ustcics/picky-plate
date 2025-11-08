const mongoose = require("mongoose");

const CulturalRecipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    desc: { type: String, required: true },
    region: {
      type: String,
      required: true,
      enum: ["Luzon", "Visayas", "Mindanao"],
      index: true
    },
    img: { type: String, default: "" },
    ingredients: { type: [String], default: [] }, // List of ingredients with measurements
    instructions: { type: [String], default: [] }, // Step-by-step cooking instructions
    recipe: { type: [String], default: [] }, // Legacy field for backward compatibility

    // Admin who created/updated this
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Status
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CulturalRecipe", CulturalRecipeSchema);

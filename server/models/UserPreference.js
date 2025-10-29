// server/models/UserPreference.js
const mongoose = require('mongoose');

const UserPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },

    // Step 1
    likes: [{ type: String }],            // e.g., ["filipino","japanese"]

    // Step 2
    dislikes: [{ type: String }],         // e.g., ["spicy","seafood"]

    // Step 3
    favorites: [{ type: String }],        // e.g., ["sushi","pizza"]

    // Step 4 (NEW)
    allergens: [{ type: String }],        // e.g., ["peanuts","eggs","dairy","gluten"]

    // Step 5 (NEW) - allow multiple diets for flexibility
    diets: [{ type: String }],            // e.g., ["pescetarian","low-carb"]

    onboardingDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserPreference', UserPreferenceSchema);

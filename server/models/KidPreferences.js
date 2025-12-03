const mongoose = require('mongoose');

const kidPreferencesSchema = new mongoose.Schema(
  {
    // parent user's ID (same as your JWT user id used in /api/preferences/me)
    userId: {
      type: String,
      required: true,
      index: true,
    },

    kidId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true,
    },

    // Eating style (e.g., "picky eater", "adventurous", etc.)
    eatingStyle: {
      type: String,
      default: '',
    },

    // What the kid loves to eat (free text)
    favoriteFoods: {
      type: String,
      default: '',
    },

    // What the kid won't eat (free text)
    wontEat: {
      type: String,
      default: '',
    },

    // Additional notes about the kid's eating habits
    notes: {
      type: String,
      default: '',
    },

    // Legacy fields (kept for backwards compatibility)
    likes: {
      type: [String],
      default: [],
    },
    dislikes: {
      type: [String],
      default: [],
    },
    diets: {
      type: [String],
      default: [],
    },
    allergens: {
      type: [String],
      default: [],
    },
    favorites: {
      type: [String],
      default: [],
    },

    kiddieMeal: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Each kid is unique per parent
kidPreferencesSchema.index({ userId: 1, kidId: 1 }, { unique: true });

module.exports = mongoose.model('KidPreferences', kidPreferencesSchema);

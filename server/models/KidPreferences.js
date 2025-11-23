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

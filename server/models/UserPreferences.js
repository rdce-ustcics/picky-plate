const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema(
  {
    // You can change this to Schema.Types.ObjectId if you prefer linking to User._id
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
      default: false,
    },

    onboardingDone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);

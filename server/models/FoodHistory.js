// server/models/FoodHistory.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * FoodHistory
 * - Stores what a user (or guest session) actually chose as their final decision.
 * - We'll use this to avoid recommending the exact same dish again when it's very recent.
 */

const foodHistorySchema = new Schema(
  {
    // For logged-in users, we store their userId as a string (same as UserPreferences)
    userId: { type: String, index: true },

    // For guests, we use the anonymous sessionId
    sessionId: { type: String, index: true },

    // The chosen recipe / dish / meal name
    label: { type: String, required: true },

    // What kind of choice it is
    // e.g. "recipe" (they wanted to cook), "restaurant", or "generic"
    type: {
      type: String,
      enum: ["recipe", "restaurant", "generic"],
      default: "generic",
    },

    // The chat this decision came from (if available)
    sourceChatId: { type: String },

    // Optional mood text or emoji at the time of decision
    mood: { type: String },

    // Extra info if you want to store more later
    meta: { type: Schema.Types.Mixed },

    // When they locked in this choice
    decidedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Helpful indexes for querying "recent" history
foodHistorySchema.index({ userId: 1, decidedAt: -1 });
foodHistorySchema.index({ sessionId: 1, decidedAt: -1 });

module.exports = mongoose.model("FoodHistory", foodHistorySchema);

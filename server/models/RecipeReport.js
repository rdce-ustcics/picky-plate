// server/models/RecipeReport.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const recipeReportSchema = new Schema(
  {
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', index: true, required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    reason: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'actioned', 'dismissed'], default: 'pending', index: true },

    // Auto-expire each report after 7 days
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + ONE_WEEK_MS) },
  },
  { timestamps: true }
);

// TTL – MongoDB purges after expiresAt
recipeReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Helpful for the 7-day “cool-down” lookup
recipeReportSchema.index({ recipeId: 1, reportedBy: 1, createdAt: -1 });

// Still useful to avoid **simultaneous** duplicates while one is pending
recipeReportSchema.index(
  { recipeId: 1, reportedBy: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('RecipeReport', recipeReportSchema);

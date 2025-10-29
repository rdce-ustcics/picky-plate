const mongoose = require('mongoose');
const { Schema } = mongoose;

const recipeReportSchema = new Schema(
  {
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', index: true, required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    reason: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'actioned', 'dismissed'], default: 'pending', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecipeReport', recipeReportSchema);

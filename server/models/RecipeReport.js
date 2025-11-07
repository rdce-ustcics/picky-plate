// server/models/RecipeReport.js
const mongoose = require('mongoose');

const recipeReportSchema = new mongoose.Schema({
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, maxlength: 200 },
  notes: { type: String, maxlength: 500 },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create the model
const RecipeReport = mongoose.model('RecipeReport', recipeReportSchema);

module.exports = RecipeReport;

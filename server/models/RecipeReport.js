// server/models/RecipeReport.js
const mongoose = require('mongoose');

const RecipeReportSchema = new mongoose.Schema({
  recipeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Recipe', 
    required: true,
    index: true 
  },
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  reason: { 
    type: String, 
    enum: [
      'inappropriate',
      'spam',
      'incorrect_info',
      'duplicate',
      'copyright',
      'offensive',
      'other'
    ],
    default: 'other'
  },
  description: { 
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
    default: 'pending',
    index: true
  },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: { 
    type: Date 
  },
  adminNotes: { 
    type: String 
  }
}, { timestamps: true });

// Index for efficient queries
RecipeReportSchema.index({ recipeId: 1, status: 1 });
RecipeReportSchema.index({ reportedBy: 1, createdAt: -1 });

module.exports = mongoose.model('RecipeReport', RecipeReportSchema);
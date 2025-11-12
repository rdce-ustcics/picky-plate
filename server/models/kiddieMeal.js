const mongoose = require('mongoose');

const KiddieMealSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('KiddieMeal', KiddieMealSchema, 'kiddiemeals');
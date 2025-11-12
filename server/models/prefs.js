const mongoose = require('mongoose');

const PrefSchema = new mongoose.Schema(
  { userId: { type: String, required: true, unique: true, index: true },
    items: { type: [String], default: [] } },
  { timestamps: true }
);

const makePrefModel = (collectionName) =>
  mongoose.model(`${collectionName}Pref`, PrefSchema, collectionName);

module.exports = {
  LikePref: makePrefModel('likes'),
  DislikePref: makePrefModel('dislikes'),
  DietPref: makePrefModel('diets'),
  AllergenPref: makePrefModel('allergens'),
  FavoritePref: makePrefModel('favorites'), // Added favorites model
};

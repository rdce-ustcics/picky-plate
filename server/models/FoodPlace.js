// /server/models/FoodPlace.js
const mongoose = require("mongoose");

const FoodPlaceSchema = new mongoose.Schema(
  {
    // Unique IDs
    googlePlaceId: { type: String, index: true, unique: true, sparse: true },
    provider:      { type: String, default: "google", index: true }, // "google" | "osm" | ...
    providerId:    { type: String, index: true, sparse: true },      // e.g., OSM node/way id

    // Basics
    name:   { type: String, required: true, index: true },
    address:String,
    lat:    { type: Number, index: true },
    lng:    { type: Number, index: true },

    // Meta
    rating:          Number,
    userRatingCount: Number,

    // Price (Google may return enum string or number)
    priceLevel:   mongoose.Schema.Types.Mixed, // keep raw
    priceLevelNum:Number,                      // normalized 0..4

    // Type tags
    types:       { type: [String], default: [] },

    // Links
    googleMapsUri: String,
    websiteUri:    String,

    // Provenance
    source: { type: String, default: "crawler" }, // "crawler" | "osm" | etc.

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Secondary indexes
FoodPlaceSchema.index({ provider: 1, providerId: 1 }, { unique: true, sparse: true, background: true });
FoodPlaceSchema.index({ lat: 1, lng: 1 }, { background: true });

// Keep updatedAt fresh
FoodPlaceSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});
FoodPlaceSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports =
  mongoose.models.FoodPlace || mongoose.model("FoodPlace", FoodPlaceSchema);

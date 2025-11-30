// /server/models/FoodPlace.js
const mongoose = require("mongoose");

const FoodPlaceSchema = new mongoose.Schema(
  {
    // Unique IDs
    googlePlaceId: { type: String, index: true, unique: true, sparse: true },
    provider:      { type: String, default: "google", index: true }, // "google" | "osm" | "zomato"
    providerId:    { type: String, index: true, sparse: true },      // e.g., OSM node/way id

    // Basics
    name:   { type: String, required: true, index: true },
    address: String,
    lat:    { type: Number, index: true },
    lng:    { type: Number, index: true },

    // GeoJSON location for 2dsphere geospatial queries (lng first, then lat!)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
        // Note: 2dsphere index is defined at schema level below, not here
      }
    },

    // Meta
    rating:          Number,
    userRatingCount: Number,

    // Price (Google may return enum string or number)
    priceLevel:   mongoose.Schema.Types.Mixed, // keep raw
    priceLevelNum: Number,                     // normalized 0..4

    // Type tags
    types:       { type: [String], default: [], index: true },

    // Additional fields from restaurant data
    cuisine:     String,
    locality:    String,
    city:        { type: String, index: true },

    // Delivery & booking
    hasOnlineDelivery: { type: Boolean, default: false },
    hasTableBooking:   { type: Boolean, default: false },
    isDeliveringNow:   { type: Boolean, default: false },

    // Pricing
    averageCostForTwo: Number,
    currency:          { type: String, default: "P" },

    // Links
    googleMapsUri: String,
    websiteUri:    String,
    zomatoUrl:     String,

    // Provenance
    source: { type: String, default: "crawler" }, // "crawler" | "osm" | "zomato" | "merged"

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// 2dsphere index for geospatial queries (CRITICAL for performance)
FoodPlaceSchema.index({ "location": "2dsphere" });

// Secondary indexes
FoodPlaceSchema.index({ provider: 1, providerId: 1 }, { unique: true, sparse: true, background: true });
FoodPlaceSchema.index({ lat: 1, lng: 1 }, { background: true });

// Compound indexes for common query patterns
FoodPlaceSchema.index({ city: 1, rating: -1 }, { background: true });
FoodPlaceSchema.index({ types: 1, rating: -1 }, { background: true });

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

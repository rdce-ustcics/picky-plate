const mongoose = require("mongoose");

const FoodPlaceSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ["google", "osm"], index: true },
    providerId: { type: String, index: true },   // google place id OR "node:123"/"way:456"
    googlePlaceId: { type: String, index: true, sparse: true, unique: true },
    osmId: { type: String, index: true, sparse: true, unique: true },

    name: { type: String, index: true },
    address: String,
    lat: { type: Number, index: true },
    lng: { type: Number, index: true },

    rating: Number,
    userRatingCount: Number,

    priceLevel: mongoose.Schema.Types.Mixed,   // can be enum string or 0..4
    priceLevelNum: { type: Number, min: 0, max: 4 },

    types: { type: [String], index: true },

    googleMapsUri: String,
    websiteUri: String,

    source: { type: String, default: "crawler" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, index: true },
  },
  { versionKey: false }
);

// Composite (also used to dedupe non-google/non-osm future providers)
FoodPlaceSchema.index({ provider: 1, providerId: 1 }, { unique: true, sparse: true, background: true });
FoodPlaceSchema.index({ lat: 1, lng: 1 }, { background: true });

module.exports = mongoose.model("FoodPlace", FoodPlaceSchema);

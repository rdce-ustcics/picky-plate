// /server/models/Restaurant.js
// Model for the new restaurants_2025 collection
// Supports both new and old (foodplaces) collections via RESTAURANT_COLLECTION env var

const mongoose = require("mongoose");

// Configurable collection name - allows easy rollback
const COLLECTION_NAME = process.env.RESTAURANT_COLLECTION || "restaurants_2025";

const RestaurantSchema = new mongoose.Schema(
  {
    // Basic info
    name: { type: String, required: true, index: true },

    // GeoJSON location for 2dsphere geospatial queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    },

    // Flat coordinates for easier querying
    latitude: { type: Number, index: true },
    longitude: { type: Number, index: true },

    // Structured address
    address: {
      formatted: String,
      street: String,
      barangay: String,
      city: { type: String, index: true },
      province: String,
      postalCode: String
    },

    // Contact info
    contact: {
      phone: String,
      website: String,
      email: String
    },

    // Cuisine/type
    cuisine: { type: String, index: true },
    cuisines: [String],
    type: {
      type: String,
      enum: ["restaurant", "fast_food", "cafe", "bakery", "bar", "ice_cream", "food_court", "food_stand"],
      index: true
    },

    // Brand/chain info
    brand: { type: String, index: true },

    // Operating hours (OSM format)
    openingHours: String,

    // Source tracking
    source: { type: String, index: true }, // osm, overture, merged
    sourceId: { type: String, index: true },

    // Quality metrics
    confidence: Number,

    // Status
    isActive: { type: Boolean, default: true, index: true }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
    versionKey: false
  }
);

// Indexes
RestaurantSchema.index({ location: "2dsphere" });
RestaurantSchema.index({ source: 1, sourceId: 1 }, { unique: true, sparse: true });
RestaurantSchema.index({ name: "text", brand: "text" });
RestaurantSchema.index({ latitude: 1, longitude: 1 });
RestaurantSchema.index({ "address.city": 1, cuisine: 1 });

// Virtual getters for backward compatibility with old schema
RestaurantSchema.virtual("lat").get(function () {
  return this.latitude;
});

RestaurantSchema.virtual("lng").get(function () {
  return this.longitude;
});

RestaurantSchema.virtual("city").get(function () {
  return this.address?.city;
});

RestaurantSchema.virtual("types").get(function () {
  // Convert single type to array for backward compatibility
  return this.type ? [this.type] : [];
});

RestaurantSchema.virtual("websiteUri").get(function () {
  return this.contact?.website;
});

RestaurantSchema.virtual("phone").get(function () {
  return this.contact?.phone;
});

// Ensure virtuals are included in JSON output
RestaurantSchema.set("toJSON", { virtuals: true });
RestaurantSchema.set("toObject", { virtuals: true });

// Static method to get formatted address
RestaurantSchema.methods.getFormattedAddress = function () {
  return this.address?.formatted || "";
};

// Static helper to normalize coordinates
RestaurantSchema.statics.normalizeCoordinates = function (doc) {
  if (!doc.latitude && doc.location?.coordinates) {
    doc.latitude = doc.location.coordinates[1];
    doc.longitude = doc.location.coordinates[0];
  }
  return doc;
};

// Export with model name based on collection
const modelName = COLLECTION_NAME === "foodplaces" ? "FoodPlace" : "Restaurant";

module.exports =
  mongoose.models[modelName] || mongoose.model(modelName, RestaurantSchema);

// Also export the collection name for reference
module.exports.COLLECTION_NAME = COLLECTION_NAME;

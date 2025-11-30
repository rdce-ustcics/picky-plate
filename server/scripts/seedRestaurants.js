/**
 * Seed script to import restaurant data from JSON files into MongoDB
 * with GeoJSON location field for 2dsphere geospatial queries
 *
 * Run: node server/scripts/seedRestaurants.js
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load environment variables from server/.env
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const FoodPlace = require("../models/FoodPlace");

const BATCH_SIZE = 500; // Insert in batches for better performance

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pickaplate";
  const dbName = process.env.MONGODB_DB || process.env.DB_NAME || "pickaplate";

  await mongoose.connect(uri, {
    dbName,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
  });
  console.log("Connected to MongoDB");
}

function transformRestaurant(item, source) {
  // Skip items without valid coordinates
  if (!item.lat || !item.lng || isNaN(item.lat) || isNaN(item.lng)) {
    return null;
  }

  // Skip items without a valid name
  if (!item.name || typeof item.name !== "string" || !item.name.trim()) {
    return null;
  }

  // Validate coordinate ranges
  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lng);

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  // Determine provider based on ID format
  let provider = "zomato";
  let providerId = String(item.id);

  if (typeof item.id === "string" && item.id.startsWith("osm_")) {
    provider = "osm";
    providerId = item.id;
  }

  // Normalize price level to number 0-4
  let priceLevelNum = item.priceLevelNum;
  if (!priceLevelNum && item.priceLevel) {
    const levelMap = {
      "PRICE_LEVEL_FREE": 0,
      "PRICE_LEVEL_INEXPENSIVE": 1,
      "PRICE_LEVEL_MODERATE": 2,
      "PRICE_LEVEL_EXPENSIVE": 3,
      "PRICE_LEVEL_VERY_EXPENSIVE": 4
    };
    priceLevelNum = levelMap[item.priceLevel] || 0;
  }

  return {
    providerId,
    provider,
    name: item.name.trim(),
    address: item.address || "",
    lat,
    lng,
    // GeoJSON location - CRITICAL: longitude first, then latitude
    location: {
      type: "Point",
      coordinates: [lng, lat]
    },
    rating: item.rating || null,
    userRatingCount: item.userRatingCount || 0,
    priceLevel: item.priceLevel || null,
    priceLevelNum: priceLevelNum || 0,
    types: Array.isArray(item.types) ? item.types : [],
    cuisine: item.cuisine || "",
    locality: item.locality || "",
    city: item.city || "Metro Manila",
    hasOnlineDelivery: Boolean(item.hasOnlineDelivery),
    hasTableBooking: Boolean(item.hasTableBooking),
    isDeliveringNow: Boolean(item.isDeliveringNow),
    averageCostForTwo: item.averageCostForTwo || 0,
    currency: item.currency || "P",
    googleMapsUri: item.googleMapsUri || "",
    zomatoUrl: item.zomatoUrl || item.osmUrl || "",
    source: source,
  };
}

async function loadJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(data);
    return parsed.items || parsed;
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err.message);
    return [];
  }
}

async function seedRestaurants() {
  console.log("Starting restaurant seed...\n");

  const publicDataPath = path.join(__dirname, "../../public/data");

  // Load both JSON files
  const ncrPlaces = await loadJsonFile(path.join(publicDataPath, "ncr_food_places2.json"));
  const osmPlaces = await loadJsonFile(path.join(publicDataPath, "osm_restaurants.json"));

  console.log(`Loaded ${ncrPlaces.length} from ncr_food_places2.json`);
  console.log(`Loaded ${osmPlaces.length} from osm_restaurants.json`);

  // Transform all restaurants
  const allRestaurants = [];
  const seen = new Set(); // Track duplicates by coordinates

  // Process NCR places first (they have ratings)
  for (const item of ncrPlaces) {
    const transformed = transformRestaurant(item, "zomato");
    if (transformed) {
      const key = `${transformed.lat.toFixed(5)}_${transformed.lng.toFixed(5)}_${transformed.name.toLowerCase().substring(0, 20)}`;
      if (!seen.has(key)) {
        seen.add(key);
        allRestaurants.push(transformed);
      }
    }
  }

  // Process OSM places
  for (const item of osmPlaces) {
    const transformed = transformRestaurant(item, "osm");
    if (transformed) {
      const key = `${transformed.lat.toFixed(5)}_${transformed.lng.toFixed(5)}_${transformed.name.toLowerCase().substring(0, 20)}`;
      if (!seen.has(key)) {
        seen.add(key);
        allRestaurants.push(transformed);
      }
    }
  }

  console.log(`\nTotal unique restaurants: ${allRestaurants.length}`);

  // Clear existing data
  console.log("\nClearing existing FoodPlace collection...");
  await FoodPlace.deleteMany({});

  // Insert in batches
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < allRestaurants.length; i += BATCH_SIZE) {
    const batch = allRestaurants.slice(i, i + BATCH_SIZE);

    try {
      await FoodPlace.insertMany(batch, { ordered: false });
      inserted += batch.length;
      process.stdout.write(`\rInserted: ${inserted}/${allRestaurants.length}`);
    } catch (err) {
      // Handle duplicate key errors gracefully
      if (err.code === 11000) {
        const successCount = err.result?.nInserted || 0;
        inserted += successCount;
        errors += batch.length - successCount;
      } else {
        console.error(`\nBatch error:`, err.message);
        errors += batch.length;
      }
    }
  }

  console.log(`\n\nSeed complete!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Errors/Duplicates: ${errors}`);

  // Create indexes
  console.log("\nEnsuring indexes...");
  await FoodPlace.collection.createIndex({ location: "2dsphere" });
  await FoodPlace.collection.createIndex({ city: 1, rating: -1 });
  await FoodPlace.collection.createIndex({ types: 1 });
  await FoodPlace.collection.createIndex({ name: "text" });
  console.log("Indexes created!");

  // Verify
  const count = await FoodPlace.countDocuments();
  console.log(`\nVerification: ${count} documents in FoodPlace collection`);

  // Test geospatial query
  const sample = await FoodPlace.findOne({ "location.coordinates": { $exists: true } });
  if (sample) {
    console.log("\nSample document:");
    console.log(`  Name: ${sample.name}`);
    console.log(`  Location: [${sample.location.coordinates[0]}, ${sample.location.coordinates[1]}]`);
    console.log(`  City: ${sample.city}`);
  }
}

async function main() {
  try {
    await connectDB();
    await seedRestaurants();
  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
  }
}

main();

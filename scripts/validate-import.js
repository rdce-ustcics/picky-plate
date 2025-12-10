/**
 * Validate Import
 *
 * Verifies data quality and tests geospatial queries after import
 * Run: node scripts/validate-import.js
 */

const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const FoodPlace = require("../server/models/FoodPlace");

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pickaplate";
  const dbName = process.env.MONGODB_DB || "pickaplate";

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri, {
    dbName,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000
  });
  console.log("Connected to MongoDB\n");
}

async function validateData() {
  console.log("=== Validate Restaurant Data Import ===\n");

  const issues = [];

  // 1. Total count
  console.log("--- Basic Counts ---");
  const totalCount = await FoodPlace.countDocuments();
  console.log(`Total documents: ${totalCount}`);

  if (totalCount === 0) {
    console.log("\nERROR: No documents in collection!");
    return { success: false, issues: ["No documents found"] };
  }

  // Count by provider
  const byProvider = await FoodPlace.aggregate([
    { $group: { _id: "$provider", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log("\nBy Provider:");
  byProvider.forEach((p) => {
    console.log(`  ${p._id || "unknown"}: ${p.count}`);
  });

  // Count by source
  const bySource = await FoodPlace.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log("\nBy Source:");
  bySource.forEach((s) => {
    console.log(`  ${s._id || "unknown"}: ${s.count}`);
  });

  // 2. Data completeness
  console.log("\n--- Data Completeness ---");

  const completenessChecks = [
    { field: "name", query: { name: { $exists: true, $ne: "" } } },
    { field: "lat", query: { lat: { $exists: true, $ne: null } } },
    { field: "lng", query: { lng: { $exists: true, $ne: null } } },
    { field: "location.coordinates", query: { "location.coordinates": { $exists: true } } },
    { field: "address", query: { address: { $exists: true, $ne: "" } } },
    { field: "city", query: { city: { $exists: true, $ne: "" } } },
    { field: "cuisine", query: { cuisine: { $exists: true, $ne: "" } } },
    { field: "types", query: { types: { $exists: true, $not: { $size: 0 } } } },
    { field: "rating", query: { rating: { $exists: true, $ne: null } } },
    { field: "websiteUri", query: { websiteUri: { $exists: true, $ne: "" } } }
  ];

  for (const check of completenessChecks) {
    const count = await FoodPlace.countDocuments(check.query);
    const pct = ((count / totalCount) * 100).toFixed(1);
    console.log(`  ${check.field}: ${count}/${totalCount} (${pct}%)`);
  }

  // 3. By Amenity Type
  console.log("\n--- By Amenity Type ---");
  const byType = await FoodPlace.aggregate([
    { $unwind: "$types" },
    { $match: { types: { $in: ["restaurant", "fast_food", "cafe", "food_court", "bar"] } } },
    { $group: { _id: "$types", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  byType.forEach((t) => {
    console.log(`  ${t._id}: ${t.count}`);
  });

  // 4. Top cuisines
  console.log("\n--- Top 10 Cuisines ---");
  const topCuisines = await FoodPlace.aggregate([
    { $match: { cuisine: { $exists: true, $ne: "" } } },
    { $group: { _id: "$cuisine", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  topCuisines.forEach((c) => {
    console.log(`  ${c._id}: ${c.count}`);
  });

  // 5. By city
  console.log("\n--- By City (Top 15) ---");
  const byCity = await FoodPlace.aggregate([
    { $group: { _id: "$city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 }
  ]);
  byCity.forEach((c) => {
    console.log(`  ${c._id || "Unknown"}: ${c.count}`);
  });

  // 6. Test geospatial queries
  console.log("\n--- Geospatial Query Tests ---");

  // Test locations around Metro Manila
  const testLocations = [
    { name: "Makati CBD", coords: [121.0244, 14.5547] },
    { name: "BGC Taguig", coords: [121.0509, 14.5500] },
    { name: "Ortigas Pasig", coords: [121.0615, 14.5873] },
    { name: "Manila Bay", coords: [120.9799, 14.5839] },
    { name: "Quezon City", coords: [121.0437, 14.6760] }
  ];

  for (const loc of testLocations) {
    try {
      const nearby = await FoodPlace.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: loc.coords },
            $maxDistance: 1000 // 1km radius
          }
        }
      }).limit(5);

      console.log(`\n${loc.name} (1km radius): ${nearby.length} results`);
      if (nearby.length > 0) {
        nearby.slice(0, 3).forEach((r, i) => {
          const dist = calculateDistance(
            loc.coords[1],
            loc.coords[0],
            r.lat,
            r.lng
          );
          console.log(`    ${i + 1}. ${r.name} (${Math.round(dist)}m)`);
        });
      } else {
        issues.push(`No restaurants found near ${loc.name}`);
      }
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      if (err.message.includes("2dsphere")) {
        issues.push("2dsphere index missing on location field");
      }
    }
  }

  // 7. Data quality checks
  console.log("\n--- Data Quality Checks ---");

  // Check for documents with invalid coordinates
  const invalidCoords = await FoodPlace.countDocuments({
    $or: [
      { lat: { $lt: 14.3 } },
      { lat: { $gt: 14.9 } },
      { lng: { $lt: 120.8 } },
      { lng: { $gt: 121.3 } }
    ]
  });
  console.log(`Documents outside Metro Manila bounds: ${invalidCoords}`);
  if (invalidCoords > 0) {
    issues.push(`${invalidCoords} documents have coordinates outside Metro Manila`);
  }

  // Check for missing location field
  const missingLocation = await FoodPlace.countDocuments({
    $or: [
      { location: { $exists: false } },
      { "location.coordinates": { $exists: false } }
    ]
  });
  console.log(`Documents missing GeoJSON location: ${missingLocation}`);
  if (missingLocation > 0) {
    issues.push(`${missingLocation} documents missing GeoJSON location`);
  }

  // Check for duplicate names at same location
  const potentialDupes = await FoodPlace.aggregate([
    {
      $group: {
        _id: {
          name: { $toLower: "$name" },
          lat: { $round: ["$lat", 4] },
          lng: { $round: ["$lng", 4] }
        },
        count: { $sum: 1 },
        ids: { $push: "$_id" }
      }
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  console.log(`Potential duplicate entries: ${potentialDupes.length}`);
  if (potentialDupes.length > 0) {
    console.log("  Top potential duplicates:");
    potentialDupes.forEach((d) => {
      console.log(`    "${d._id.name}" at (${d._id.lat}, ${d._id.lng}): ${d.count} entries`);
    });
  }

  // 8. Sample documents
  console.log("\n--- Sample Documents ---");
  const samples = await FoodPlace.find({}).limit(5);
  samples.forEach((doc, i) => {
    console.log(`\nSample ${i + 1}:`);
    console.log(`  _id: ${doc._id}`);
    console.log(`  providerId: ${doc.providerId}`);
    console.log(`  name: ${doc.name}`);
    console.log(`  city: ${doc.city}`);
    console.log(`  cuisine: ${doc.cuisine || "N/A"}`);
    console.log(`  location: [${doc.location?.coordinates?.[0]}, ${doc.location?.coordinates?.[1]}]`);
    console.log(`  types: [${doc.types?.join(", ") || "N/A"}]`);
  });

  // 9. Index verification
  console.log("\n--- Index Verification ---");
  const indexes = await FoodPlace.collection.indexes();
  console.log(`Total indexes: ${indexes.length}`);
  indexes.forEach((idx) => {
    const keys = Object.keys(idx.key).join(", ");
    console.log(`  ${idx.name}: {${keys}}`);
  });

  const has2dsphere = indexes.some(
    (idx) => idx.key.location === "2dsphere"
  );
  if (!has2dsphere) {
    issues.push("Missing 2dsphere index on location field");
  }

  // Summary
  console.log("\n=== Validation Summary ===");
  console.log(`Total Documents: ${totalCount}`);
  console.log(`Issues Found: ${issues.length}`);

  if (issues.length > 0) {
    console.log("\nIssues:");
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  } else {
    console.log("\nAll validation checks passed!");
  }

  return {
    success: issues.length === 0,
    totalCount,
    issues
  };
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function main() {
  try {
    await connectDB();
    const result = await validateData();

    if (result.success) {
      console.log("\n Validation PASSED");
    } else {
      console.log("\n Validation COMPLETED with issues");
    }
  } catch (err) {
    console.error("\nError:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
  }
}

main();

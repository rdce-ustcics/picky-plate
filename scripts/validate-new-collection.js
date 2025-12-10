/**
 * Validate New Collection
 *
 * Verifies data quality in 'restaurants_2025' collection
 * Tests geospatial queries and data completeness
 *
 * Run: node scripts/validate-new-collection.js
 */

const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const COLLECTION_NAME = "restaurants_2025";

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
  return mongoose.connection.db;
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
  console.log("=".repeat(60));
  console.log("VALIDATE NEW COLLECTION");
  console.log("=".repeat(60));
  console.log(`\nCollection: ${COLLECTION_NAME}\n`);

  const issues = [];
  let db;

  try {
    db = await connectDB();
    const collection = db.collection(COLLECTION_NAME);

    // 1. Basic counts
    console.log("--- BASIC COUNTS ---\n");

    const totalCount = await collection.countDocuments();
    console.log(`Total documents: ${totalCount.toLocaleString()}`);

    if (totalCount === 0) {
      console.log("\nERROR: No documents in collection!");
      issues.push("Collection is empty");
      return { success: false, issues };
    }

    // By source
    const bySource = await collection.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log("\nBy Source:");
    bySource.forEach((s) => {
      console.log(`  ${s._id || "unknown"}: ${s.count.toLocaleString()}`);
    });

    // By type
    const byType = await collection.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]).toArray();

    console.log("\nBy Type (Top 15):");
    byType.forEach((t) => {
      console.log(`  ${t._id || "unknown"}: ${t.count.toLocaleString()}`);
    });

    // 2. Data completeness
    console.log("\n--- DATA COMPLETENESS ---\n");

    const completenessChecks = [
      { field: "name", query: { name: { $exists: true, $ne: "" } } },
      { field: "latitude", query: { latitude: { $exists: true, $ne: null } } },
      { field: "longitude", query: { longitude: { $exists: true, $ne: null } } },
      { field: "location.coordinates", query: { "location.coordinates": { $exists: true } } },
      { field: "address.formatted", query: { "address.formatted": { $exists: true, $ne: null } } },
      { field: "address.city", query: { "address.city": { $exists: true, $ne: "" } } },
      { field: "cuisine", query: { cuisine: { $exists: true, $ne: null } } },
      { field: "contact.phone", query: { "contact.phone": { $exists: true, $ne: null } } },
      { field: "contact.website", query: { "contact.website": { $exists: true, $ne: null } } },
      { field: "brand", query: { brand: { $exists: true, $ne: null } } },
      { field: "openingHours", query: { openingHours: { $exists: true, $ne: null } } }
    ];

    for (const check of completenessChecks) {
      const count = await collection.countDocuments(check.query);
      const pct = ((count / totalCount) * 100).toFixed(1);
      console.log(`  ${check.field}: ${count.toLocaleString()} (${pct}%)`);
    }

    // 3. By city
    console.log("\n--- BY CITY (Top 15) ---\n");

    const byCity = await collection.aggregate([
      { $group: { _id: "$address.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]).toArray();

    byCity.forEach((c) => {
      console.log(`  ${c._id || "Unknown"}: ${c.count.toLocaleString()}`);
    });

    // 4. Top cuisines
    console.log("\n--- TOP 15 CUISINES ---\n");

    const topCuisines = await collection.aggregate([
      { $match: { cuisine: { $exists: true, $ne: null } } },
      { $group: { _id: "$cuisine", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]).toArray();

    topCuisines.forEach((c) => {
      console.log(`  ${c._id}: ${c.count.toLocaleString()}`);
    });

    // 5. Geospatial query tests
    console.log("\n--- GEOSPATIAL QUERY TESTS ---\n");

    const testLocations = [
      { name: "Makati CBD", coords: [121.0244, 14.5547] },
      { name: "BGC Taguig", coords: [121.0509, 14.5500] },
      { name: "Ortigas Pasig", coords: [121.0615, 14.5873] },
      { name: "Manila Bay", coords: [120.9799, 14.5839] },
      { name: "Quezon City (Cubao)", coords: [121.0547, 14.6177] },
      { name: "SM North EDSA", coords: [121.0311, 14.6564] }
    ];

    for (const loc of testLocations) {
      try {
        const nearby = await collection.find({
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: loc.coords },
              $maxDistance: 1000 // 1km radius
            }
          }
        }).limit(5).toArray();

        console.log(`${loc.name} (1km radius): ${nearby.length} results`);
        if (nearby.length > 0) {
          nearby.slice(0, 3).forEach((r, i) => {
            const dist = calculateDistance(
              loc.coords[1],
              loc.coords[0],
              r.latitude,
              r.longitude
            );
            console.log(`    ${i + 1}. ${r.name} (${Math.round(dist)}m, ${r.type})`);
          });
        } else {
          issues.push(`No restaurants found near ${loc.name}`);
        }
      } catch (err) {
        console.log(`  ERROR testing ${loc.name}: ${err.message}`);
        if (err.message.includes("2dsphere")) {
          issues.push("2dsphere index missing on location field");
        }
      }
    }

    // 6. Data quality checks
    console.log("\n--- DATA QUALITY CHECKS ---\n");

    // Check for invalid coordinates
    const invalidCoords = await collection.countDocuments({
      $or: [
        { latitude: { $lt: 14.3 } },
        { latitude: { $gt: 14.9 } },
        { longitude: { $lt: 120.8 } },
        { longitude: { $gt: 121.3 } }
      ]
    });
    console.log(`Outside Metro Manila bounds: ${invalidCoords.toLocaleString()}`);
    if (invalidCoords > 100) {
      issues.push(`${invalidCoords} documents have coordinates outside Metro Manila`);
    }

    // Check for missing location
    const missingLocation = await collection.countDocuments({
      $or: [
        { location: { $exists: false } },
        { "location.coordinates": { $exists: false } }
      ]
    });
    console.log(`Missing GeoJSON location: ${missingLocation.toLocaleString()}`);
    if (missingLocation > 0) {
      issues.push(`${missingLocation} documents missing GeoJSON location`);
    }

    // Check for duplicate sourceIds
    const duplicateSourceIds = await collection.aggregate([
      { $group: { _id: "$sourceId", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "duplicates" }
    ]).toArray();

    const dupeCount = duplicateSourceIds[0]?.duplicates || 0;
    console.log(`Duplicate sourceIds: ${dupeCount.toLocaleString()}`);
    if (dupeCount > 0) {
      issues.push(`${dupeCount} duplicate sourceIds found`);
    }

    // 7. Index verification
    console.log("\n--- INDEX VERIFICATION ---\n");

    const indexes = await collection.indexes();
    console.log(`Total indexes: ${indexes.length}`);
    indexes.forEach((idx) => {
      const keys = Object.keys(idx.key).join(", ");
      console.log(`  ${idx.name}: {${keys}}`);
    });

    const has2dsphere = indexes.some((idx) => idx.key.location === "2dsphere");
    if (!has2dsphere) {
      issues.push("Missing 2dsphere index on location field");
    }

    // 8. Sample documents
    console.log("\n--- SAMPLE DOCUMENTS ---\n");

    const samples = await collection.aggregate([{ $sample: { size: 3 } }]).toArray();
    samples.forEach((doc, i) => {
      console.log(`Sample ${i + 1}:`);
      console.log(`  name: ${doc.name}`);
      console.log(`  type: ${doc.type}`);
      console.log(`  city: ${doc.address?.city}`);
      console.log(`  cuisine: ${doc.cuisine || "N/A"}`);
      console.log(`  source: ${doc.source}`);
      console.log(`  location: [${doc.location?.coordinates?.[0]}, ${doc.location?.coordinates?.[1]}]`);
      console.log();
    });

    // Summary
    console.log("=".repeat(60));
    console.log("VALIDATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`\nCollection: ${COLLECTION_NAME}`);
    console.log(`Total Documents: ${totalCount.toLocaleString()}`);
    console.log(`Issues Found: ${issues.length}`);

    if (issues.length > 0) {
      console.log("\nIssues:");
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
      console.log("\nValidation: COMPLETED WITH ISSUES");
    } else {
      console.log("\nAll validation checks passed!");
      console.log("Validation: PASSED");
    }

    console.log("\n" + "=".repeat(60));
    console.log("NEXT STEP");
    console.log("=".repeat(60));
    console.log("\nRun: node scripts/compare-collections.js");
    console.log("To compare old vs new data.\n");

    return { success: issues.length === 0, totalCount, issues };

  } catch (err) {
    console.error("\nERROR:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

main();

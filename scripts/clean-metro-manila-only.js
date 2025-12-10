/**
 * Clean Metro Manila Only
 *
 * Removes records that are:
 * 1. From non-NCR cities (even if within bounding box)
 * 2. Low confidence records (< 0.5)
 *
 * Run: node scripts/clean-metro-manila-only.js
 */

const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const COLLECTION_NAME = "restaurants_2025";

// NCR cities and common variations
const NCR_CITIES = [
  // 16 cities + 1 municipality of NCR
  "Manila", "City of Manila",
  "Quezon City", "Quezon city",
  "Caloocan", "Caloocan City", "Caloocan City North", "Caloocan City South",
  "Las Piñas", "Las Pinas", "Las Piñas City",
  "Makati", "Makati City",
  "Malabon", "Malabon City",
  "Mandaluyong", "Mandaluyong City",
  "Marikina", "Marikina City",
  "Muntinlupa", "Muntinlupa City",
  "Navotas", "Navotas City",
  "Parañaque", "Paranaque", "Parañaque City",
  "Pasay", "Pasay City",
  "Pasig", "Pasig City",
  "San Juan", "San Juan City",
  "Taguig", "Taguig City",
  "Valenzuela", "Valenzuela City",
  "Pateros", // The only municipality
  // Common variations and Metro Manila label
  "Metro Manila", "NCR", "National Capital Region"
];

// Known NON-NCR cities that appear in data (but within bounding box)
const NON_NCR_CITIES = [
  // Cavite
  "Bacoor", "Imus", "Dasmariñas", "Dasmarinas", "Kawit", "Noveleta", "Rosario",
  "General Trias", "Cavite City", "Tanza", "Silang",
  // Rizal
  "Cainta", "Taytay", "Antipolo", "San Mateo", "Rodriguez", "Montalban",
  "Angono", "Binangonan", "Teresa", "Morong", "Baras", "Tanay", "Pililla",
  // Bulacan
  "Marilao", "Meycauayan", "San Jose del Monte", "Obando", "Bocaue",
  "Valenzuela", "Santa Maria", "Norzagaray", "Pandi", "Guiguinto",
  // Laguna
  "San Pedro", "Biñan", "Binan", "Santa Rosa", "Cabuyao", "Calamba"
];

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "pickaplate";

  console.log("=".repeat(60));
  console.log("CLEAN METRO MANILA DATA");
  console.log("=".repeat(60));

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const col = db.collection(COLLECTION_NAME);

  const beforeCount = await col.countDocuments();
  console.log(`\nBefore cleaning: ${beforeCount.toLocaleString()} records\n`);

  // Step 1: Remove low confidence records (< 0.5)
  console.log("--- STEP 1: Remove Low Confidence Records ---");
  const lowConfResult = await col.deleteMany({
    confidence: { $lt: 0.5 }
  });
  console.log(`  Deleted: ${lowConfResult.deletedCount.toLocaleString()} low confidence records`);

  // Step 2: Build regex patterns for non-NCR cities
  console.log("\n--- STEP 2: Remove Non-NCR Cities ---");

  // Create case-insensitive regex patterns
  const nonNcrPatterns = NON_NCR_CITIES.map(city => new RegExp(`^${city}$`, "i"));

  // Also match partial matches for safety
  const nonNcrPartialPatterns = NON_NCR_CITIES.map(city =>
    new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i")
  );

  // First, check which non-NCR cities have data
  console.log("\n  Non-NCR cities found:");
  let totalNonNcr = 0;
  for (const city of NON_NCR_CITIES) {
    const count = await col.countDocuments({
      "address.city": { $regex: new RegExp(`^${city}`, "i") }
    });
    if (count > 0) {
      console.log(`    ${city}: ${count.toLocaleString()}`);
      totalNonNcr += count;
    }
  }
  console.log(`  Total non-NCR: ${totalNonNcr.toLocaleString()}`);

  // Delete non-NCR cities
  const deleteResult = await col.deleteMany({
    $and: [
      { "address.city": { $exists: true, $ne: null } },
      {
        $or: NON_NCR_CITIES.map(city => ({
          "address.city": { $regex: new RegExp(`^${city}`, "i") }
        }))
      }
    ]
  });
  console.log(`\n  Deleted: ${deleteResult.deletedCount.toLocaleString()} non-NCR records`);

  // Step 3: Remove records with unknown/empty cities that aren't NCR
  console.log("\n--- STEP 3: Check Remaining Unknown Cities ---");

  const unknownCities = await col.aggregate([
    { $group: { _id: "$address.city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 }
  ]).toArray();

  console.log("  Top cities remaining:");
  unknownCities.forEach((c) => {
    const cityName = c._id || "Unknown/Empty";
    const isNcr = NCR_CITIES.some(ncr =>
      cityName.toLowerCase().includes(ncr.toLowerCase()) ||
      ncr.toLowerCase().includes(cityName.toLowerCase())
    );
    const marker = isNcr ? "" : " [CHECK]";
    console.log(`    ${cityName}: ${c.count.toLocaleString()}${marker}`);
  });

  // Final count
  const afterCount = await col.countDocuments();
  const removed = beforeCount - afterCount;

  console.log("\n" + "=".repeat(60));
  console.log("CLEANING COMPLETE");
  console.log("=".repeat(60));
  console.log(`\nBefore: ${beforeCount.toLocaleString()} records`);
  console.log(`After:  ${afterCount.toLocaleString()} records`);
  console.log(`Removed: ${removed.toLocaleString()} records (${((removed/beforeCount)*100).toFixed(1)}%)`);

  // Verify data quality
  console.log("\n--- DATA QUALITY CHECK ---");

  const bySource = await col.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log("\nBy source:");
  bySource.forEach((s) => {
    console.log(`  ${s._id}: ${s.count.toLocaleString()}`);
  });

  // Confidence distribution (remaining)
  const confDist = await col.aggregate([
    { $match: { confidence: { $exists: true, $ne: null } } },
    {
      $bucket: {
        groupBy: "$confidence",
        boundaries: [0.5, 0.7, 0.9, 1.01],
        default: "other",
        output: { count: { $sum: 1 } }
      }
    }
  ]).toArray();

  console.log("\nConfidence distribution (remaining):");
  confDist.forEach((c) => {
    const label = c._id === "other" ? "other" : `${c._id}+`;
    console.log(`  ${label}: ${c.count.toLocaleString()}`);
  });

  const osmCount = await col.countDocuments({
    $or: [{ confidence: null }, { confidence: { $exists: false } }]
  });
  console.log(`  OSM (no confidence): ${osmCount.toLocaleString()}`);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS");
  console.log("=".repeat(60));
  console.log("\n1. Run: node scripts/validate-new-collection.js");
  console.log("2. Run: node scripts/compare-collections.js\n");

  await mongoose.connection.close();
}

main().catch(console.error);

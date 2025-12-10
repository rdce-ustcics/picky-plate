/**
 * Final Reduction to Target
 *
 * Aggressively reduces to target of 18,000-25,000 records
 *
 * Strategy:
 * 1. Keep only core types: restaurant, cafe, fast_food, bakery
 * 2. Remove all bars, pubs, ice_cream, etc.
 * 3. Remove Overture duplicates (same location within 50m + similar name)
 *
 * Run: node scripts/final-reduction.js
 */

const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const COLLECTION_NAME = "restaurants_2025";
const TARGET_MAX = 25000;

// Core types to keep
const CORE_TYPES = ["restaurant", "fast_food", "cafe", "bakery"];

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "pickaplate";

  console.log("=".repeat(60));
  console.log("FINAL REDUCTION");
  console.log("=".repeat(60));

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const col = db.collection(COLLECTION_NAME);

  const beforeCount = await col.countDocuments();
  console.log(`\nCurrent count: ${beforeCount.toLocaleString()}\n`);

  // Step 1: Remove all non-core types
  console.log("--- STEP 1: Keep Only Core Types ---");
  console.log(`  Core types: ${CORE_TYPES.join(", ")}`);

  const nonCoreResult = await col.deleteMany({
    type: { $nin: CORE_TYPES }
  });
  console.log(`  Removed: ${nonCoreResult.deletedCount.toLocaleString()} non-core records`);

  let currentCount = await col.countDocuments();
  console.log(`  Current: ${currentCount.toLocaleString()}\n`);

  // Step 2: If still over, prioritize OSM and merged, limit Overture
  if (currentCount > TARGET_MAX) {
    console.log("--- STEP 2: Limit Overture Records ---");

    const osmCount = await col.countDocuments({ source: "osm" });
    const mergedCount = await col.countDocuments({ source: "merged" });
    const overtureCount = await col.countDocuments({ source: "overture" });

    console.log(`  OSM: ${osmCount.toLocaleString()}`);
    console.log(`  Merged: ${mergedCount.toLocaleString()}`);
    console.log(`  Overture: ${overtureCount.toLocaleString()}`);

    const targetOverture = TARGET_MAX - osmCount - mergedCount;
    console.log(`  Target Overture: ${targetOverture.toLocaleString()}`);

    if (overtureCount > targetOverture && targetOverture > 0) {
      // Get Overture records sorted by confidence (highest first)
      // Keep only the top N
      const overtureToKeep = await col.find(
        { source: "overture" },
        { projection: { _id: 1, confidence: 1 } }
      )
        .sort({ confidence: -1 })
        .limit(targetOverture)
        .toArray();

      const keepIds = new Set(overtureToKeep.map(r => r._id.toString()));

      // Delete Overture records not in keep list
      const allOverture = await col.find(
        { source: "overture" },
        { projection: { _id: 1 } }
      ).toArray();

      const deleteIds = allOverture
        .filter(r => !keepIds.has(r._id.toString()))
        .map(r => r._id);

      if (deleteIds.length > 0) {
        const deleteResult = await col.deleteMany({
          _id: { $in: deleteIds }
        });
        console.log(`  Removed: ${deleteResult.deletedCount.toLocaleString()} lower-confidence Overture`);
      }
    }

    currentCount = await col.countDocuments();
    console.log(`  Current: ${currentCount.toLocaleString()}\n`);
  }

  // Final stats
  console.log("=".repeat(60));
  console.log("FINAL RESULTS");
  console.log("=".repeat(60));

  const finalCount = await col.countDocuments();
  console.log(`\nBefore: ${beforeCount.toLocaleString()}`);
  console.log(`After:  ${finalCount.toLocaleString()}`);
  console.log(`Removed: ${(beforeCount - finalCount).toLocaleString()}`);

  // Breakdown
  const bySource = await col.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log("\nBy source:");
  bySource.forEach(s => console.log(`  ${s._id}: ${s.count.toLocaleString()}`));

  const byType = await col.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log("\nBy type:");
  byType.forEach(t => console.log(`  ${t._id}: ${t.count.toLocaleString()}`));

  // Status check
  if (finalCount <= TARGET_MAX && finalCount >= 18000) {
    console.log(`\n✓ SUCCESS: Within target range (18,000-25,000)`);
  } else if (finalCount < 18000) {
    console.log(`\n⚠ Below minimum (18,000). Consider less aggressive filtering.`);
  } else {
    console.log(`\n⚠ Still above ${TARGET_MAX.toLocaleString()}. May need more aggressive deduplication.`);
  }

  await mongoose.connection.close();
}

main().catch(console.error);

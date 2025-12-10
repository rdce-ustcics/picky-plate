/**
 * Reduce Collection to Target Size
 *
 * Applies stricter filtering to get to target range of 18,000-25,000 records
 * Options:
 * 1. Keep only high-confidence Overture records (≥0.9)
 * 2. Prioritize OSM + merged records (more verified)
 * 3. Remove bars and other non-core categories
 *
 * Run: node scripts/reduce-to-target.js
 */

const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const COLLECTION_NAME = "restaurants_2025";
const TARGET_MIN = 18000;
const TARGET_MAX = 25000;

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "pickaplate";

  console.log("=".repeat(60));
  console.log("REDUCE TO TARGET SIZE");
  console.log("=".repeat(60));
  console.log(`\nTarget range: ${TARGET_MIN.toLocaleString()} - ${TARGET_MAX.toLocaleString()} records\n`);

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const col = db.collection(COLLECTION_NAME);

  const beforeCount = await col.countDocuments();
  console.log(`Current count: ${beforeCount.toLocaleString()} records\n`);

  if (beforeCount <= TARGET_MAX) {
    console.log("Already within target range. No action needed.");
    await mongoose.connection.close();
    return;
  }

  // Strategy: Remove medium-confidence Overture records first
  // Keep: OSM (no confidence), merged, and high-confidence Overture (≥0.9)

  console.log("--- STRATEGY ---");
  console.log("Priority order:");
  console.log("  1. Keep all OSM records (community-verified)");
  console.log("  2. Keep all merged records (deduplicated matches)");
  console.log("  3. Keep only high-confidence Overture (≥0.9)");
  console.log("  4. If still over target, reduce Overture by strictness\n");

  // Count by source and confidence
  const osmCount = await col.countDocuments({ source: "osm" });
  const mergedCount = await col.countDocuments({ source: "merged" });
  const overtureHighConf = await col.countDocuments({
    source: "overture",
    confidence: { $gte: 0.9 }
  });
  const overtureMedConf = await col.countDocuments({
    source: "overture",
    confidence: { $gte: 0.7, $lt: 0.9 }
  });
  const overtureLowConf = await col.countDocuments({
    source: "overture",
    confidence: { $gte: 0.5, $lt: 0.7 }
  });

  console.log("--- CURRENT BREAKDOWN ---");
  console.log(`  OSM records: ${osmCount.toLocaleString()}`);
  console.log(`  Merged records: ${mergedCount.toLocaleString()}`);
  console.log(`  Overture (conf ≥ 0.9): ${overtureHighConf.toLocaleString()}`);
  console.log(`  Overture (conf 0.7-0.9): ${overtureMedConf.toLocaleString()}`);
  console.log(`  Overture (conf 0.5-0.7): ${overtureLowConf.toLocaleString()}`);

  const baseCount = osmCount + mergedCount;
  const withHighConf = baseCount + overtureHighConf;
  const withMedConf = withHighConf + overtureMedConf;

  console.log(`\n  Base (OSM + Merged): ${baseCount.toLocaleString()}`);
  console.log(`  + High confidence: ${withHighConf.toLocaleString()}`);
  console.log(`  + Medium confidence: ${withMedConf.toLocaleString()}`);

  // Determine what to remove
  let targetAfterRemoval;
  let removeQuery;

  if (withHighConf <= TARGET_MAX && withHighConf >= TARGET_MIN) {
    // Perfect - remove medium and low confidence
    console.log(`\n  Removing medium confidence (0.5-0.9) Overture records...`);
    removeQuery = {
      source: "overture",
      confidence: { $lt: 0.9 }
    };
    targetAfterRemoval = withHighConf;
  } else if (withHighConf > TARGET_MAX) {
    // Even high-conf is too many - need to filter further
    // Remove lower categories first (bars, ice_cream, food_stand, etc.)
    console.log(`\n  High-confidence alone exceeds target.`);
    console.log(`  Removing non-core types from Overture medium-confidence...`);

    // Step 1: Remove medium/low confidence
    removeQuery = {
      source: "overture",
      confidence: { $lt: 0.9 }
    };
    targetAfterRemoval = withHighConf;
  } else {
    // Need some medium confidence records
    console.log(`\n  Need to include some medium-confidence records.`);
    // Remove only low confidence (0.5-0.7)
    removeQuery = {
      source: "overture",
      confidence: { $lt: 0.7 }
    };
    targetAfterRemoval = withMedConf;
  }

  // Execute removal
  console.log("\n--- EXECUTING CLEANUP ---");
  const deleteResult = await col.deleteMany(removeQuery);
  console.log(`  Deleted: ${deleteResult.deletedCount.toLocaleString()} records`);

  let currentCount = await col.countDocuments();
  console.log(`  Current count: ${currentCount.toLocaleString()}`);

  // If still over target, remove non-core types from Overture
  if (currentCount > TARGET_MAX) {
    console.log("\n--- STEP 2: Remove Non-Core Types ---");

    // Non-core types to remove (keep restaurants, cafes, fast_food)
    const nonCoreTypes = ["bar", "pub", "ice_cream", "food_stand", "pastry", "butcher",
                          "confectionery", "deli", "tea", "food_court", "coffee"];

    const nonCoreResult = await col.deleteMany({
      source: "overture",
      type: { $in: nonCoreTypes }
    });
    console.log(`  Deleted ${nonCoreResult.deletedCount.toLocaleString()} non-core type records`);

    currentCount = await col.countDocuments();
    console.log(`  Current count: ${currentCount.toLocaleString()}`);
  }

  // If still over target, reduce confidence threshold further
  if (currentCount > TARGET_MAX) {
    console.log("\n--- STEP 3: Further Confidence Filter ---");

    // Remove Overture with confidence < 0.95
    const highConfResult = await col.deleteMany({
      source: "overture",
      confidence: { $lt: 0.95 }
    });
    console.log(`  Deleted ${highConfResult.deletedCount.toLocaleString()} records (conf < 0.95)`);

    currentCount = await col.countDocuments();
    console.log(`  Current count: ${currentCount.toLocaleString()}`);
  }

  // Final stats
  const finalCount = await col.countDocuments();
  const removed = beforeCount - finalCount;

  console.log("\n" + "=".repeat(60));
  console.log("REDUCTION COMPLETE");
  console.log("=".repeat(60));
  console.log(`\nBefore: ${beforeCount.toLocaleString()}`);
  console.log(`After:  ${finalCount.toLocaleString()}`);
  console.log(`Removed: ${removed.toLocaleString()} (${((removed/beforeCount)*100).toFixed(1)}%)`);

  if (finalCount >= TARGET_MIN && finalCount <= TARGET_MAX) {
    console.log(`\n✓ Within target range (${TARGET_MIN.toLocaleString()} - ${TARGET_MAX.toLocaleString()})`);
  } else if (finalCount < TARGET_MIN) {
    console.log(`\n⚠ Below target minimum. Consider re-importing with looser filters.`);
  } else {
    console.log(`\n⚠ Still above target. May need manual review.`);
  }

  // Show final breakdown
  console.log("\n--- FINAL BREAKDOWN ---");
  const finalBySource = await col.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  finalBySource.forEach((s) => {
    console.log(`  ${s._id}: ${s.count.toLocaleString()}`);
  });

  const finalByType = await col.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();

  console.log("\n  Top types:");
  finalByType.forEach((t) => {
    console.log(`    ${t._id}: ${t.count.toLocaleString()}`);
  });

  await mongoose.connection.close();
}

main().catch(console.error);

/**
 * Fix duplicate 2dsphere indexes on FoodPlace collection
 *
 * Run: node server/scripts/fixDuplicateIndexes.js
 */

const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function fixIndexes() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pickaplate";
  const dbName = process.env.MONGODB_DB || process.env.DB_NAME || "pickaplate";

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri, { dbName });
  console.log("Connected!\n");

  const collection = mongoose.connection.collection("foodplaces");

  // Get current indexes
  const indexes = await collection.indexes();
  console.log("Current indexes:");
  indexes.forEach((idx, i) => {
    console.log(`  ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  // Find duplicate 2dsphere indexes
  const sphereIndexes = indexes.filter(idx => {
    const keyStr = JSON.stringify(idx.key);
    return keyStr.includes("2dsphere");
  });

  console.log(`\nFound ${sphereIndexes.length} 2dsphere index(es):`);
  sphereIndexes.forEach(idx => {
    console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  if (sphereIndexes.length > 1) {
    console.log("\nDropping duplicate 2dsphere indexes...");

    // Keep only location_2dsphere, drop others
    for (const idx of sphereIndexes) {
      if (idx.name !== "location_2dsphere" && idx.name !== "_id_") {
        console.log(`  Dropping: ${idx.name}`);
        try {
          await collection.dropIndex(idx.name);
          console.log(`  ✅ Dropped ${idx.name}`);
        } catch (err) {
          console.log(`  ⚠️ Could not drop ${idx.name}: ${err.message}`);
        }
      }
    }

    // Ensure the correct index exists
    console.log("\nEnsuring correct 2dsphere index on 'location' field...");
    try {
      await collection.createIndex({ location: "2dsphere" }, { background: true });
      console.log("✅ Index created/verified: location_2dsphere");
    } catch (err) {
      console.log(`⚠️ Index creation note: ${err.message}`);
    }
  } else {
    console.log("\n✅ No duplicate indexes to fix");
  }

  // Show final indexes
  const finalIndexes = await collection.indexes();
  console.log("\nFinal indexes:");
  finalIndexes.forEach((idx, i) => {
    console.log(`  ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  await mongoose.connection.close();
  console.log("\n✅ Done!");
}

fixIndexes().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

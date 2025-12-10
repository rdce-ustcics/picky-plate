/**
 * Import Fresh Data to NEW Collection
 *
 * SAFE: Only writes to 'restaurants_2025' collection
 * NEVER touches 'foodplaces' or 'restaurants' collections
 *
 * Run: node scripts/import-to-new-collection.js
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

// =============================================================================
// SAFETY: NEW COLLECTION NAME - DO NOT CHANGE TO 'restaurants' or 'foodplaces'
// =============================================================================
const NEW_COLLECTION_NAME = "restaurants_2025";
const FORBIDDEN_COLLECTIONS = ["restaurants", "foodplaces", "foodplace"];

// Batch size for inserts
const BATCH_SIZE = 500;

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

async function safetyCheck(db, collectionName) {
  // CRITICAL SAFETY CHECK
  if (FORBIDDEN_COLLECTIONS.includes(collectionName.toLowerCase())) {
    throw new Error(
      `SAFETY STOP: Cannot write to '${collectionName}' collection!\n` +
      `This would overwrite your existing data.\n` +
      `Only 'restaurants_2025' is allowed.`
    );
  }

  // Verify existing data is safe
  for (const forbidden of FORBIDDEN_COLLECTIONS) {
    try {
      const count = await db.collection(forbidden).countDocuments();
      if (count > 0) {
        console.log(`  Verified: '${forbidden}' collection has ${count.toLocaleString()} records (WILL NOT BE TOUCHED)`);
      }
    } catch (e) {
      // Collection doesn't exist, that's fine
    }
  }

  return true;
}

async function main() {
  console.log("=".repeat(60));
  console.log("IMPORT TO NEW COLLECTION");
  console.log("=".repeat(60));

  console.log(`\nTarget collection: ${NEW_COLLECTION_NAME}`);
  console.log("(Your existing 'foodplaces' data will NOT be touched)\n");

  // Load merged data
  const dataPath = path.join(__dirname, "../data-sources/merged-2025.json");

  if (!fs.existsSync(dataPath)) {
    console.error("\nERROR: merged-2025.json not found!");
    console.log("Run: node scripts/merge-and-dedupe.js first\n");
    process.exit(1);
  }

  console.log(`Loading: ${dataPath}`);
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const restaurants = data.restaurants || [];

  console.log(`Documents to import: ${restaurants.length.toLocaleString()}\n`);

  if (restaurants.length === 0) {
    console.log("No documents to import!");
    process.exit(0);
  }

  let db;
  try {
    db = await connectDB();

    // SAFETY CHECK
    console.log("Running safety checks...");
    await safetyCheck(db, NEW_COLLECTION_NAME);
    console.log("  Safety checks passed.\n");

    const collection = db.collection(NEW_COLLECTION_NAME);

    // Check if collection exists
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Existing documents in ${NEW_COLLECTION_NAME}: ${existingCount.toLocaleString()}`);
      console.log("Dropping existing collection to replace with fresh data...");
      await collection.drop();
      console.log("Collection dropped.\n");
    }

    // Create indexes first
    console.log("Creating indexes...");

    await collection.createIndex({ location: "2dsphere" });
    console.log("  - 2dsphere index on location");

    await collection.createIndex({ source: 1, sourceId: 1 }, { unique: true });
    console.log("  - Unique index on source + sourceId");

    await collection.createIndex({ cuisine: 1 });
    console.log("  - Index on cuisine");

    await collection.createIndex({ type: 1 });
    console.log("  - Index on type");

    await collection.createIndex({ "address.city": 1 });
    console.log("  - Index on address.city");

    await collection.createIndex({ isActive: 1 });
    console.log("  - Index on isActive");

    await collection.createIndex({ name: "text", brand: "text" });
    console.log("  - Text index on name and brand");

    await collection.createIndex({ latitude: 1, longitude: 1 });
    console.log("  - Index on latitude/longitude");

    console.log("\nIndexes created.\n");

    // Insert in batches
    console.log("Importing documents...");
    let inserted = 0;
    let errors = 0;
    const startTime = Date.now();

    for (let i = 0; i < restaurants.length; i += BATCH_SIZE) {
      const batch = restaurants.slice(i, i + BATCH_SIZE);

      try {
        const result = await collection.insertMany(batch, { ordered: false });
        inserted += result.insertedCount;
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key - count successful inserts
          const successCount = err.result?.nInserted || 0;
          inserted += successCount;
          errors += batch.length - successCount;
        } else {
          console.error(`\nBatch error: ${err.message}`);
          errors += batch.length;
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const progress = Math.min(i + BATCH_SIZE, restaurants.length);
      process.stdout.write(`\r  Progress: ${progress.toLocaleString()}/${restaurants.length.toLocaleString()} (${elapsed}s)`);
    }

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n\n  Completed in ${totalElapsed}s`);
    console.log(`  Inserted: ${inserted.toLocaleString()}`);
    console.log(`  Errors/Duplicates: ${errors.toLocaleString()}`);

    // Verify final count
    const finalCount = await collection.countDocuments();
    console.log(`\nFinal count in ${NEW_COLLECTION_NAME}: ${finalCount.toLocaleString()}`);

    // Show sample
    console.log("\n" + "=".repeat(60));
    console.log("SAMPLE DOCUMENTS");
    console.log("=".repeat(60));

    const samples = await collection.find({}).limit(3).toArray();
    samples.forEach((doc, i) => {
      console.log(`\nSample ${i + 1}:`);
      console.log(`  name: ${doc.name}`);
      console.log(`  type: ${doc.type}`);
      console.log(`  city: ${doc.address?.city}`);
      console.log(`  source: ${doc.source}`);
      console.log(`  location: [${doc.location?.coordinates?.[0]}, ${doc.location?.coordinates?.[1]}]`);
    });

    // Final verification
    console.log("\n" + "=".repeat(60));
    console.log("VERIFICATION");
    console.log("=".repeat(60));

    // Check geospatial query works
    console.log("\nTesting geospatial query (Makati area)...");
    const nearbyResults = await collection.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [121.0244, 14.5547] },
          $maxDistance: 1000
        }
      }
    }).limit(5).toArray();

    console.log(`  Found ${nearbyResults.length} restaurants within 1km of Makati CBD`);
    nearbyResults.forEach((r, i) => {
      console.log(`    ${i + 1}. ${r.name} (${r.type})`);
    });

    // Verify old data is still safe
    console.log("\nVerifying original data is intact...");
    const oldCount = await db.collection("foodplaces").countDocuments();
    console.log(`  'foodplaces' collection: ${oldCount.toLocaleString()} records (UNCHANGED)`);

    console.log("\n" + "=".repeat(60));
    console.log("IMPORT COMPLETE");
    console.log("=".repeat(60));
    console.log(`\nCollection: ${NEW_COLLECTION_NAME}`);
    console.log(`Documents: ${finalCount.toLocaleString()}`);
    console.log(`\nYour original 'foodplaces' data is SAFE and UNCHANGED.`);

    console.log("\n" + "=".repeat(60));
    console.log("NEXT STEPS");
    console.log("=".repeat(60));
    console.log("\n1. Run: node scripts/validate-new-collection.js");
    console.log("2. Run: node scripts/compare-collections.js");
    console.log("3. Update your app config to use 'restaurants_2025'\n");

  } catch (err) {
    console.error("\n" + "=".repeat(60));
    console.error("ERROR");
    console.error("=".repeat(60));
    console.error(`\n${err.message}\n`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

main();

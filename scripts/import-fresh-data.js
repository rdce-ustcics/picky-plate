/**
 * Import Fresh Data to MongoDB
 *
 * Imports transformed OSM data into the FoodPlace collection
 * Supports multiple migration strategies: replace, upsert, merge
 *
 * Run: node scripts/import-fresh-data.js [strategy]
 *
 * Strategies:
 *   --replace   : Clear collection and import fresh data (default)
 *   --upsert    : Upsert by providerId, mark unmatched as inactive
 *   --merge     : Match by location + name, merge data
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const FoodPlace = require("../server/models/FoodPlace");

const BATCH_SIZE = 500;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let strategy = "replace"; // default
  let skipConfirm = false;

  args.forEach((arg) => {
    if (arg === "--replace") strategy = "replace";
    if (arg === "--upsert") strategy = "upsert";
    if (arg === "--merge") strategy = "merge";
    if (arg === "-y" || arg === "--yes") skipConfirm = true;
  });

  return { strategy, skipConfirm };
}

// Prompt for confirmation
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

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

// Strategy 1: Full Replace
async function replaceStrategy(documents) {
  console.log("Strategy: FULL REPLACE");
  console.log("This will delete all existing data and import fresh data.\n");

  const existingCount = await FoodPlace.countDocuments();
  console.log(`Existing documents: ${existingCount}`);
  console.log(`New documents: ${documents.length}\n`);

  // Delete all existing
  console.log("Clearing existing data...");
  await FoodPlace.deleteMany({});
  console.log("Existing data cleared.\n");

  // Insert new data in batches
  console.log("Importing new data...");
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);

    try {
      const result = await FoodPlace.insertMany(batch, { ordered: false });
      inserted += result.length;
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

    process.stdout.write(`\rProgress: ${inserted}/${documents.length}`);
  }

  console.log(`\n\nInserted: ${inserted}`);
  console.log(`Errors/Duplicates: ${errors}`);

  return { inserted, errors, updated: 0 };
}

// Strategy 2: Upsert by providerId
async function upsertStrategy(documents) {
  console.log("Strategy: UPSERT BY PROVIDER ID");
  console.log("Existing OSM records will be updated, new ones inserted.\n");

  const existingCount = await FoodPlace.countDocuments();
  console.log(`Existing documents: ${existingCount}`);
  console.log(`New documents: ${documents.length}\n`);

  // Mark all OSM records as potentially inactive
  console.log("Marking existing OSM records...");
  await FoodPlace.updateMany(
    { provider: "osm" },
    { $set: { _pendingUpdate: true } }
  );

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  console.log("Upserting documents...");

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);

    const operations = batch.map((doc) => ({
      updateOne: {
        filter: { providerId: doc.providerId },
        update: {
          $set: {
            ...doc,
            _pendingUpdate: false,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    try {
      const result = await FoodPlace.bulkWrite(operations, { ordered: false });
      inserted += result.upsertedCount || 0;
      updated += result.modifiedCount || 0;
    } catch (err) {
      console.error(`\nBatch error: ${err.message}`);
      errors += batch.length;
    }

    process.stdout.write(`\rProgress: ${i + batch.length}/${documents.length}`);
  }

  // Remove the pending flag from updated records
  await FoodPlace.updateMany(
    { _pendingUpdate: false },
    { $unset: { _pendingUpdate: "" } }
  );

  // Count records that weren't in the new dataset
  const staleCount = await FoodPlace.countDocuments({ _pendingUpdate: true });
  console.log(`\n\nStale OSM records (not in new data): ${staleCount}`);

  // Clean up pending flag
  await FoodPlace.updateMany(
    { _pendingUpdate: true },
    { $unset: { _pendingUpdate: "" } }
  );

  console.log(`\nInserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);

  return { inserted, updated, errors };
}

// Strategy 3: Merge by location + name
async function mergeStrategy(documents) {
  console.log("Strategy: MERGE BY LOCATION + NAME");
  console.log("Matches by proximity and name similarity.\n");

  const existingCount = await FoodPlace.countDocuments();
  console.log(`Existing documents: ${existingCount}`);
  console.log(`New documents: ${documents.length}\n`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  console.log("Processing documents...");

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    try {
      // Find existing by location proximity (50 meters)
      const nearby = await FoodPlace.find({
        location: {
          $near: {
            $geometry: doc.location,
            $maxDistance: 50 // meters
          }
        }
      }).limit(5);

      // Check for name match
      const nameLower = doc.name.toLowerCase();
      const match = nearby.find((existing) => {
        const existingNameLower = existing.name.toLowerCase();
        return (
          existingNameLower === nameLower ||
          existingNameLower.includes(nameLower) ||
          nameLower.includes(existingNameLower)
        );
      });

      if (match) {
        // Update existing record with new data (preserve ratings if present)
        const updateData = {
          ...doc,
          rating: match.rating || doc.rating,
          userRatingCount: match.userRatingCount || doc.userRatingCount,
          zomatoUrl: match.zomatoUrl || doc.zomatoUrl,
          updatedAt: new Date()
        };
        delete updateData._id;

        await FoodPlace.findByIdAndUpdate(match._id, { $set: updateData });
        updated++;
      } else {
        // Insert as new
        await FoodPlace.create(doc);
        inserted++;
      }
    } catch (err) {
      if (err.code !== 11000) {
        // Ignore duplicate key errors
        errors++;
      }
    }

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`\rProgress: ${i + 1}/${documents.length}`);
    }
  }

  console.log(`\n\nInserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);

  return { inserted, updated, errors };
}

// Ensure indexes exist
async function ensureIndexes() {
  console.log("\nEnsuring indexes...");

  try {
    await FoodPlace.collection.createIndex({ location: "2dsphere" });
    console.log("  2dsphere index on location");
  } catch (e) {
    // Index may already exist
  }

  try {
    await FoodPlace.collection.createIndex({ providerId: 1 }, { sparse: true });
    console.log("  Index on providerId");
  } catch (e) {}

  try {
    await FoodPlace.collection.createIndex({ city: 1, rating: -1 });
    console.log("  Index on city + rating");
  } catch (e) {}

  try {
    await FoodPlace.collection.createIndex({ types: 1 });
    console.log("  Index on types");
  } catch (e) {}

  try {
    await FoodPlace.collection.createIndex({ name: "text" });
    console.log("  Text index on name");
  } catch (e) {}

  console.log("Indexes verified.\n");
}

async function main() {
  const { strategy, skipConfirm } = parseArgs();

  console.log("=== Import Fresh Data to MongoDB ===\n");

  // Load transformed data
  const dataPath = path.join(__dirname, "../data/osm-transformed-data.json");

  if (!fs.existsSync(dataPath)) {
    console.error("Error: osm-transformed-data.json not found!");
    console.log("Run: node scripts/transform-osm-data.js first\n");
    process.exit(1);
  }

  console.log(`Loading: ${dataPath}`);
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const documents = data.documents || [];

  console.log(`Documents to import: ${documents.length}\n`);

  if (documents.length === 0) {
    console.log("No documents to import!");
    process.exit(0);
  }

  // Confirm before proceeding
  if (!skipConfirm) {
    console.log(`Selected strategy: ${strategy.toUpperCase()}`);

    if (strategy === "replace") {
      console.log("WARNING: This will DELETE all existing restaurant data!\n");
    }

    const confirmed = await confirm("Proceed with import?");
    if (!confirmed) {
      console.log("Import cancelled.");
      process.exit(0);
    }
    console.log();
  }

  try {
    await connectDB();

    // Remove the _osm field before import (it was for debugging)
    const cleanedDocs = documents.map((doc) => {
      const { _osm, ...rest } = doc;
      return {
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    let result;

    switch (strategy) {
      case "upsert":
        result = await upsertStrategy(cleanedDocs);
        break;
      case "merge":
        result = await mergeStrategy(cleanedDocs);
        break;
      case "replace":
      default:
        result = await replaceStrategy(cleanedDocs);
        break;
    }

    // Ensure indexes
    await ensureIndexes();

    // Final count
    const finalCount = await FoodPlace.countDocuments();
    console.log(`Final document count: ${finalCount}`);

    // Quick verification
    console.log("\n=== Quick Verification ===");
    const sample = await FoodPlace.findOne({ provider: "osm" });
    if (sample) {
      console.log("\nSample imported document:");
      console.log(`  Name: ${sample.name}`);
      console.log(`  City: ${sample.city}`);
      console.log(`  Location: [${sample.location?.coordinates?.[0]}, ${sample.location?.coordinates?.[1]}]`);
      console.log(`  Provider: ${sample.provider}`);
    }

    console.log("\n=== Import Complete ===");
    console.log(`Strategy: ${strategy}`);
    console.log(`Inserted: ${result.inserted}`);
    console.log(`Updated: ${result.updated || 0}`);
    console.log(`Errors: ${result.errors}`);
    console.log(`Total in DB: ${finalCount}`);

    console.log("\n=== Next Step ===");
    console.log("Run: node scripts/validate-import.js");
    console.log("This will verify the data quality and test geospatial queries.\n");
  } catch (err) {
    console.error("\nError:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

main();

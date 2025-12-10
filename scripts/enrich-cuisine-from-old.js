/**
 * Enrich Cuisine Data from Old Collection
 *
 * Fills in missing cuisine fields in restaurants_2025 by matching
 * records from foodplaces (which has Zomato cuisine data)
 *
 * Matching criteria:
 * - Location within 50 meters
 * - Name similarity > 0.6 (Dice coefficient)
 *
 * Run: node scripts/enrich-cuisine-from-old.js
 */

const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const NEW_COLLECTION = "restaurants_2025";
const OLD_COLLECTION = "foodplaces";
const MAX_DISTANCE_METERS = 50;
const MIN_NAME_SIMILARITY = 0.6;
const BATCH_SIZE = 100;

// Calculate Dice coefficient for string similarity
function diceCoefficient(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = new Set();
  for (let i = 0; i < s1.length - 1; i++) {
    bigrams1.add(s1.substring(i, i + 2));
  }

  const bigrams2 = new Set();
  for (let i = 0; i < s2.length - 1; i++) {
    bigrams2.add(s2.substring(i, i + 2));
  }

  let intersection = 0;
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) intersection++;
  }

  return (2 * intersection) / (bigrams1.size + bigrams2.size);
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
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "pickaplate";

  console.log("=".repeat(60));
  console.log("ENRICH CUISINE FROM OLD COLLECTION");
  console.log("=".repeat(60));

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;

  const newCol = db.collection(NEW_COLLECTION);
  const oldCol = db.collection(OLD_COLLECTION);

  // Check collections
  const newTotal = await newCol.countDocuments();
  const oldTotal = await oldCol.countDocuments();

  console.log(`\n${NEW_COLLECTION}: ${newTotal.toLocaleString()} records`);
  console.log(`${OLD_COLLECTION}: ${oldTotal.toLocaleString()} records`);

  // Count records needing cuisine
  const noCuisineCount = await newCol.countDocuments({
    $or: [
      { cuisine: null },
      { cuisine: { $exists: false } },
      { cuisine: "" }
    ]
  });

  console.log(`\nRecords without cuisine: ${noCuisineCount.toLocaleString()}`);

  if (noCuisineCount === 0) {
    console.log("All records have cuisine. Nothing to enrich.");
    await mongoose.connection.close();
    return;
  }

  // Check old collection has cuisine data
  const oldWithCuisine = await oldCol.countDocuments({
    cuisine: { $exists: true, $ne: "", $ne: null }
  });
  console.log(`Old records with cuisine: ${oldWithCuisine.toLocaleString()}`);

  // Get records without cuisine
  console.log("\n--- ENRICHMENT PROCESS ---\n");

  const cursor = newCol.find({
    $or: [
      { cuisine: null },
      { cuisine: { $exists: false } },
      { cuisine: "" }
    ]
  });

  let processed = 0;
  let enriched = 0;
  let noMatch = 0;
  const enrichedCuisines = {};
  const startTime = Date.now();

  // Process in batches
  let batch = [];
  while (await cursor.hasNext()) {
    const record = await cursor.next();
    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      const results = await processBatch(batch, oldCol);
      enriched += results.enriched;
      noMatch += results.noMatch;
      for (const cuisine of results.cuisines) {
        enrichedCuisines[cuisine] = (enrichedCuisines[cuisine] || 0) + 1;
      }
      processed += batch.length;

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\r  Processed: ${processed.toLocaleString()} | Enriched: ${enriched.toLocaleString()} | No match: ${noMatch.toLocaleString()} (${elapsed}s)`);

      batch = [];
    }
  }

  // Process remaining
  if (batch.length > 0) {
    const results = await processBatch(batch, oldCol);
    enriched += results.enriched;
    noMatch += results.noMatch;
    for (const cuisine of results.cuisines) {
      enrichedCuisines[cuisine] = (enrichedCuisines[cuisine] || 0) + 1;
    }
    processed += batch.length;
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n\n--- RESULTS ---\n`);
  console.log(`Processed: ${processed.toLocaleString()}`);
  console.log(`Enriched: ${enriched.toLocaleString()} (${((enriched/processed)*100).toFixed(1)}%)`);
  console.log(`No match found: ${noMatch.toLocaleString()}`);
  console.log(`Time: ${totalElapsed}s`);

  // Top cuisines enriched
  if (Object.keys(enrichedCuisines).length > 0) {
    console.log("\nTop cuisines enriched:");
    Object.entries(enrichedCuisines)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([cuisine, count]) => {
        console.log(`  ${cuisine}: ${count.toLocaleString()}`);
      });
  }

  // Final cuisine coverage
  const finalWithCuisine = await newCol.countDocuments({
    cuisine: { $exists: true, $ne: null, $ne: "" }
  });
  const finalCoverage = ((finalWithCuisine / newTotal) * 100).toFixed(1);

  console.log("\n" + "=".repeat(60));
  console.log("ENRICHMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`\nBefore: ${((newTotal - noCuisineCount) / newTotal * 100).toFixed(1)}% cuisine coverage`);
  console.log(`After: ${finalCoverage}% cuisine coverage`);
  console.log(`Records with cuisine: ${finalWithCuisine.toLocaleString()} / ${newTotal.toLocaleString()}`);

  await mongoose.connection.close();

  async function processBatch(records, oldCollection) {
    const results = { enriched: 0, noMatch: 0, cuisines: [] };
    const updates = [];

    for (const record of records) {
      const lat = record.latitude;
      const lon = record.longitude;
      const name = record.name;

      if (!lat || !lon || !name) {
        results.noMatch++;
        continue;
      }

      // Find nearby records in old collection with cuisine
      try {
        const nearby = await oldCollection.find({
          cuisine: { $exists: true, $ne: "", $ne: null },
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: [lon, lat] },
              $maxDistance: MAX_DISTANCE_METERS
            }
          }
        }).limit(10).toArray();

        if (nearby.length === 0) {
          results.noMatch++;
          continue;
        }

        // Find best match by name similarity
        let bestMatch = null;
        let bestSimilarity = 0;

        for (const old of nearby) {
          const similarity = diceCoefficient(name, old.name);
          if (similarity > bestSimilarity && similarity >= MIN_NAME_SIMILARITY) {
            bestSimilarity = similarity;
            bestMatch = old;
          }
        }

        if (bestMatch && bestMatch.cuisine) {
          updates.push({
            updateOne: {
              filter: { _id: record._id },
              update: { $set: { cuisine: bestMatch.cuisine } }
            }
          });
          results.enriched++;
          results.cuisines.push(bestMatch.cuisine);
        } else {
          results.noMatch++;
        }
      } catch (err) {
        // Skip on error (e.g., missing geospatial index)
        results.noMatch++;
      }
    }

    // Execute bulk update
    if (updates.length > 0) {
      await newCol.bulkWrite(updates);
    }

    return results;
  }
}

main().catch(console.error);

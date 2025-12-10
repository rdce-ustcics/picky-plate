/**
 * Infer Cuisine from Brand Names and Keywords
 *
 * Fills in missing cuisine fields by analyzing:
 * 1. Brand names (Jollibee → Filipino, McDonald's → American)
 * 2. Restaurant name keywords (Sushi → Japanese, Pizza → Italian)
 * 3. Type field (cafe → coffee, bakery → bakery)
 *
 * Run: node scripts/infer-cuisine.js
 */

const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const COLLECTION_NAME = "restaurants_2025";

// Brand to cuisine mapping
const BRAND_CUISINE_MAP = {
  // Filipino Fast Food
  "jollibee": "filipino",
  "mang inasal": "filipino",
  "chowking": "filipino",
  "greenwich": "pizza",
  "red ribbon": "bakery",
  "goldilocks": "bakery",
  "max's": "filipino",
  "inasal": "filipino",
  "sisig": "filipino",
  "lechon": "filipino",
  "karinderya": "filipino",
  "turo-turo": "filipino",
  "carinderia": "filipino",

  // American Fast Food
  "mcdonald": "american",
  "mcdonald's": "american",
  "burger king": "american",
  "wendy's": "american",
  "kfc": "chicken",
  "popeyes": "chicken",
  "texas chicken": "chicken",
  "army navy": "american",

  // Coffee
  "starbucks": "coffee_shop",
  "coffee bean": "coffee_shop",
  "tim hortons": "coffee_shop",
  "dunkin": "coffee_shop",
  "bo's coffee": "coffee_shop",
  "coffee project": "coffee_shop",
  "krispy kreme": "donut",

  // Pizza
  "pizza hut": "pizza",
  "domino": "pizza",
  "shakey's": "pizza",
  "yellow cab": "pizza",
  "papa john": "pizza",
  "sbarro": "pizza",
  "s&r": "pizza",

  // Chinese
  "chowking": "chinese",
  "dimsum": "chinese",
  "din tai fung": "chinese",
  "tim ho wan": "chinese",
  "banawe": "chinese",

  // Japanese
  "tokyo tokyo": "japanese",
  "ramen": "japanese",
  "sushi": "japanese",
  "teriyaki": "japanese",
  "yakiniku": "japanese",
  "takoyaki": "japanese",
  "tempura": "japanese",
  "udon": "japanese",
  "yoshinoya": "japanese",
  "marugame": "japanese",
  "ippudo": "japanese",

  // Korean
  "samgyup": "korean",
  "samgyeopsal": "korean",
  "korean bbq": "korean",
  "k-bbq": "korean",
  "bulgogi": "korean",
  "bibimbap": "korean",
  "bonchon": "korean",
  "kyochon": "korean",

  // Burgers
  "zark": "burger",
  "minute burger": "burger",
  "angel's burger": "burger",
  "brothers burger": "burger",
  "8 cuts": "burger",

  // Seafood
  "dampa": "seafood",
  "seafood": "seafood",
  "talaba": "seafood",
  "oyster": "seafood",

  // Thai
  "thai": "thai",
  "pad thai": "thai",
  "tom yum": "thai",

  // Indian
  "curry": "indian",
  "masala": "indian",
  "tandoori": "indian",
  "naan": "indian",

  // Italian
  "pasta": "italian",
  "spaghetti": "italian",
  "italian": "italian",

  // Mexican
  "taco": "mexican",
  "burrito": "mexican",
  "nacho": "mexican",

  // Bakery/Dessert
  "bakery": "bakery",
  "panaderya": "bakery",
  "bread": "bakery",
  "cake": "bakery",
  "cupcake": "bakery",
  "ice cream": "ice_cream",
  "gelato": "ice_cream",

  // Bubble tea
  "milk tea": "bubble_tea",
  "boba": "bubble_tea",
  "tiger sugar": "bubble_tea",
  "gong cha": "bubble_tea",
  "coco": "bubble_tea",
  "happy lemon": "bubble_tea"
};

// Type to cuisine fallback
const TYPE_CUISINE_MAP = {
  "cafe": "coffee_shop",
  "bakery": "bakery",
  "fast_food": "fast_food"
};

function inferCuisine(name, brand, type) {
  const nameLower = (name || "").toLowerCase();
  const brandLower = (brand || "").toLowerCase();

  // Check brand first (most reliable)
  for (const [key, cuisine] of Object.entries(BRAND_CUISINE_MAP)) {
    if (brandLower.includes(key)) {
      return cuisine;
    }
  }

  // Check name keywords
  for (const [key, cuisine] of Object.entries(BRAND_CUISINE_MAP)) {
    if (nameLower.includes(key)) {
      return cuisine;
    }
  }

  // Fallback to type
  if (type && TYPE_CUISINE_MAP[type]) {
    return TYPE_CUISINE_MAP[type];
  }

  return null;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "pickaplate";

  console.log("=".repeat(60));
  console.log("INFER CUISINE FROM NAMES AND BRANDS");
  console.log("=".repeat(60));

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const col = db.collection(COLLECTION_NAME);

  // Count records needing cuisine
  const total = await col.countDocuments();
  const noCuisineCount = await col.countDocuments({
    $or: [
      { cuisine: null },
      { cuisine: { $exists: false } },
      { cuisine: "" }
    ]
  });

  console.log(`\nTotal records: ${total.toLocaleString()}`);
  console.log(`Without cuisine: ${noCuisineCount.toLocaleString()}`);

  if (noCuisineCount === 0) {
    console.log("All records have cuisine. Nothing to infer.");
    await mongoose.connection.close();
    return;
  }

  // Process records without cuisine
  console.log("\n--- INFERRING CUISINES ---\n");

  const cursor = col.find({
    $or: [
      { cuisine: null },
      { cuisine: { $exists: false } },
      { cuisine: "" }
    ]
  });

  let processed = 0;
  let inferred = 0;
  const inferredCuisines = {};
  const updates = [];
  const startTime = Date.now();

  while (await cursor.hasNext()) {
    const record = await cursor.next();
    processed++;

    const cuisine = inferCuisine(record.name, record.brand, record.type);

    if (cuisine) {
      updates.push({
        updateOne: {
          filter: { _id: record._id },
          update: { $set: { cuisine } }
        }
      });
      inferred++;
      inferredCuisines[cuisine] = (inferredCuisines[cuisine] || 0) + 1;
    }

    // Bulk update every 500 records
    if (updates.length >= 500) {
      await col.bulkWrite(updates);
      updates.length = 0;

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\r  Processed: ${processed.toLocaleString()} | Inferred: ${inferred.toLocaleString()} (${elapsed}s)`);
    }
  }

  // Final bulk update
  if (updates.length > 0) {
    await col.bulkWrite(updates);
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n\n--- RESULTS ---\n`);
  console.log(`Processed: ${processed.toLocaleString()}`);
  console.log(`Inferred: ${inferred.toLocaleString()} (${((inferred/processed)*100).toFixed(1)}%)`);
  console.log(`Time: ${totalElapsed}s`);

  // Top inferred cuisines
  if (Object.keys(inferredCuisines).length > 0) {
    console.log("\nCuisines inferred:");
    Object.entries(inferredCuisines)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cuisine, count]) => {
        console.log(`  ${cuisine}: ${count.toLocaleString()}`);
      });
  }

  // Final cuisine coverage
  const finalWithCuisine = await col.countDocuments({
    cuisine: { $exists: true, $ne: null, $ne: "" }
  });
  const beforeCoverage = ((total - noCuisineCount) / total * 100).toFixed(1);
  const afterCoverage = ((finalWithCuisine / total) * 100).toFixed(1);

  console.log("\n" + "=".repeat(60));
  console.log("INFERENCE COMPLETE");
  console.log("=".repeat(60));
  console.log(`\nBefore: ${beforeCoverage}% cuisine coverage`);
  console.log(`After: ${afterCoverage}% cuisine coverage`);
  console.log(`Records with cuisine: ${finalWithCuisine.toLocaleString()} / ${total.toLocaleString()}`);

  // Top cuisines overall
  console.log("\n--- TOP CUISINES NOW ---");
  const topCuisines = await col.aggregate([
    { $match: { cuisine: { $exists: true, $ne: null, $ne: "" } } },
    { $group: { _id: "$cuisine", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]).toArray();

  topCuisines.forEach(c => {
    console.log(`  ${c._id}: ${c.count.toLocaleString()}`);
  });

  await mongoose.connection.close();
}

main().catch(console.error);

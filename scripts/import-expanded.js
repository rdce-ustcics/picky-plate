/**
 * Import Expanded Restaurant Dataset
 *
 * Reimports restaurants_2025 with more records:
 * - All OSM records (no confidence filter)
 * - Overture records with confidence >= 0.70
 * - Strict Metro Manila bounds filtering
 * - Full replace of existing collection
 *
 * Target: 35,000 - 45,000 records
 *
 * Run: node scripts/import-expanded.js
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const COLLECTION_NAME = "restaurants_2025";

// Strict Metro Manila bounds
const METRO_MANILA_BOUNDS = {
  north: 14.80,
  south: 14.35,
  east: 121.15,
  west: 120.90
};

// Valid NCR cities (normalized to lowercase for matching)
const VALID_NCR_CITIES = new Set([
  "manila", "quezon city", "caloocan", "las piñas", "las pinas",
  "makati", "malabon", "mandaluyong", "marikina", "muntinlupa",
  "navotas", "parañaque", "paranaque", "pasay", "pasig",
  "pateros", "san juan", "taguig", "valenzuela",
  // Common variations
  "metro manila", "ncr", "national capital region",
  "quezon", "qc", "makati city", "pasig city", "taguig city",
  "manila city", "caloocan city", "malabon city", "navotas city",
  "valenzuela city", "marikina city", "san juan city",
  "mandaluyong city", "parañaque city", "paranaque city",
  "las piñas city", "las pinas city", "muntinlupa city", "pasay city"
]);

// Cities definitely outside NCR
const NON_NCR_CITIES = new Set([
  "bacoor", "imus", "dasmariñas", "dasmarinas", "cavite", "cavite city",
  "tagaytay", "silang", "carmona", "general trias", "trece martires",
  "naic", "noveleta", "kawit", "rosario cavite",
  "antipolo", "cainta", "taytay", "angono", "binangonan", "rodriguez",
  "san mateo", "marikina heights", "montalban", "teresa",
  "meycauayan", "marilao", "bocaue", "balagtas", "guiguinto",
  "pandi", "plaridel", "bustos", "baliuag", "pulilan", "calumpit",
  "san rafael", "san ildefonso", "san miguel bulacan", "obando",
  "sta. maria", "santa maria", "bulacan", "malolos",
  "san pedro", "biñan", "binan", "santa rosa", "cabuyao",
  "calamba", "bay", "los baños", "los banos", "laguna",
  "batangas", "lipa", "tanauan", "pampanga", "angeles", "san fernando",
  "rizal", "bulacan province"
]);

// Brand to cuisine mapping
const BRAND_CUISINE_MAP = {
  "jollibee": "filipino", "mang inasal": "filipino", "chowking": "filipino",
  "greenwich": "pizza", "red ribbon": "bakery", "goldilocks": "bakery",
  "max's": "filipino", "inasal": "filipino", "sisig": "filipino",
  "mcdonald": "american", "burger king": "american", "wendy's": "american",
  "kfc": "chicken", "popeyes": "chicken", "texas chicken": "chicken",
  "starbucks": "coffee_shop", "coffee bean": "coffee_shop", "tim hortons": "coffee_shop",
  "dunkin": "coffee_shop", "bo's coffee": "coffee_shop", "krispy kreme": "donut",
  "pizza hut": "pizza", "domino": "pizza", "shakey's": "pizza",
  "yellow cab": "pizza", "papa john": "pizza", "sbarro": "pizza",
  "dimsum": "chinese", "din tai fung": "chinese", "tim ho wan": "chinese",
  "tokyo tokyo": "japanese", "ramen": "japanese", "sushi": "japanese",
  "teriyaki": "japanese", "yoshinoya": "japanese", "marugame": "japanese",
  "samgyup": "korean", "samgyeopsal": "korean", "bonchon": "korean",
  "zark": "burger", "minute burger": "burger", "angel's burger": "burger",
  "dampa": "seafood", "seafood": "seafood",
  "thai": "thai", "pad thai": "thai",
  "curry": "indian", "masala": "indian",
  "pasta": "italian", "spaghetti": "italian",
  "taco": "mexican", "burrito": "mexican",
  "bakery": "bakery", "panaderya": "bakery", "cake": "bakery",
  "ice cream": "ice_cream", "gelato": "ice_cream",
  "milk tea": "bubble_tea", "boba": "bubble_tea", "tiger sugar": "bubble_tea",
  "gong cha": "bubble_tea", "coco": "bubble_tea"
};

const TYPE_CUISINE_MAP = {
  "cafe": "coffee_shop",
  "bakery": "bakery",
  "fast_food": "fast_food"
};

function isWithinBounds(lat, lng) {
  return lat >= METRO_MANILA_BOUNDS.south &&
         lat <= METRO_MANILA_BOUNDS.north &&
         lng >= METRO_MANILA_BOUNDS.west &&
         lng <= METRO_MANILA_BOUNDS.east;
}

function isValidNCRCity(city) {
  if (!city) return true; // No city means we rely on coords only
  const normalized = city.toLowerCase().trim();

  // Check if it's a known non-NCR city
  if (NON_NCR_CITIES.has(normalized)) return false;

  // Check if it's a known valid NCR city
  if (VALID_NCR_CITIES.has(normalized)) return true;

  // Unknown city - rely on coordinates
  return true;
}

function inferCuisine(name, brand, type, existingCuisine) {
  if (existingCuisine) return existingCuisine;

  const nameLower = (name || "").toLowerCase();
  const brandLower = (brand || "").toLowerCase();

  for (const [key, cuisine] of Object.entries(BRAND_CUISINE_MAP)) {
    if (brandLower.includes(key) || nameLower.includes(key)) {
      return cuisine;
    }
  }

  if (type && TYPE_CUISINE_MAP[type]) {
    return TYPE_CUISINE_MAP[type];
  }

  return null;
}

// Dice coefficient for string similarity
function diceCoefficient(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = new Set();
  for (let i = 0; i < s1.length - 1; i++) {
    bigrams1.add(s1.slice(i, i + 2));
  }

  let matches = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    if (bigrams1.has(s2.slice(i, i + 2))) matches++;
  }

  return (2 * matches) / (s1.length - 1 + s2.length - 1);
}

async function main() {
  console.log("=".repeat(70));
  console.log("EXPANDED IMPORT: TARGET 35,000-45,000 RESTAURANTS");
  console.log("=".repeat(70));

  const osmPath = path.join(__dirname, "../data-sources/osm-transformed.json");
  const overturePath = path.join(__dirname, "../data-sources/overture-transformed.json");

  // Check files exist
  if (!fs.existsSync(osmPath)) {
    console.error("ERROR: osm-transformed.json not found");
    return;
  }
  if (!fs.existsSync(overturePath)) {
    console.error("ERROR: overture-transformed.json not found");
    return;
  }

  // --- STEP 1: Load and filter OSM data ---
  console.log("\n--- STEP 1: Load OSM Data ---");
  const osmData = JSON.parse(fs.readFileSync(osmPath, "utf-8"));
  console.log(`  Raw OSM records: ${osmData.restaurants.length.toLocaleString()}`);

  const osmFiltered = osmData.restaurants.filter(r => {
    const lat = r.latitude;
    const lng = r.longitude;
    if (!isWithinBounds(lat, lng)) return false;
    if (!isValidNCRCity(r.address?.city)) return false;
    return true;
  });
  console.log(`  After bounds+city filter: ${osmFiltered.length.toLocaleString()}`);

  // --- STEP 2: Load and filter Overture data ---
  console.log("\n--- STEP 2: Load Overture Data (confidence >= 0.70) ---");
  const overtureData = JSON.parse(fs.readFileSync(overturePath, "utf-8"));
  console.log(`  Raw Overture records: ${overtureData.restaurants.length.toLocaleString()}`);

  const overtureFiltered = overtureData.restaurants.filter(r => {
    const lat = r.latitude;
    const lng = r.longitude;
    if (!isWithinBounds(lat, lng)) return false;
    if (!isValidNCRCity(r.address?.city)) return false;
    if (r.confidence !== undefined && r.confidence < 0.70) return false;
    return true;
  });
  console.log(`  After bounds+city+confidence filter: ${overtureFiltered.length.toLocaleString()}`);

  // --- STEP 3: Merge and deduplicate ---
  console.log("\n--- STEP 3: Merge and Deduplicate ---");

  // Build spatial index for OSM records
  const GRID_SIZE = 0.001; // ~100m
  const osmGrid = new Map();

  osmFiltered.forEach(r => {
    const gridKey = `${Math.floor(r.latitude / GRID_SIZE)},${Math.floor(r.longitude / GRID_SIZE)}`;
    if (!osmGrid.has(gridKey)) osmGrid.set(gridKey, []);
    osmGrid.get(gridKey).push(r);
  });

  // Add OSM records with source marking
  const merged = osmFiltered.map(r => ({ ...r, source: "osm" }));
  let duplicatesSkipped = 0;

  // Add Overture records, checking for duplicates
  for (const overtureRecord of overtureFiltered) {
    const lat = overtureRecord.latitude;
    const lng = overtureRecord.longitude;
    const gridKey = `${Math.floor(lat / GRID_SIZE)},${Math.floor(lng / GRID_SIZE)}`;

    // Check nearby cells
    const nearbyOsm = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const checkKey = `${Math.floor(lat / GRID_SIZE) + dx},${Math.floor(lng / GRID_SIZE) + dy}`;
        if (osmGrid.has(checkKey)) {
          nearbyOsm.push(...osmGrid.get(checkKey));
        }
      }
    }

    // Check for duplicate
    let isDuplicate = false;
    for (const osmRecord of nearbyOsm) {
      const distance = Math.sqrt(
        Math.pow((lat - osmRecord.latitude) * 111000, 2) +
        Math.pow((lng - osmRecord.longitude) * 111000 * Math.cos(lat * Math.PI / 180), 2)
      );

      if (distance < 50) { // Within 50m
        const similarity = diceCoefficient(overtureRecord.name, osmRecord.name);
        if (similarity > 0.6) {
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) {
      merged.push({ ...overtureRecord, source: "overture" });
    } else {
      duplicatesSkipped++;
    }
  }

  console.log(`  OSM records: ${osmFiltered.length.toLocaleString()}`);
  console.log(`  Overture records added: ${(overtureFiltered.length - duplicatesSkipped).toLocaleString()}`);
  console.log(`  Duplicates skipped: ${duplicatesSkipped.toLocaleString()}`);
  console.log(`  Total merged: ${merged.length.toLocaleString()}`);

  // --- STEP 4: Infer cuisines ---
  console.log("\n--- STEP 4: Infer Cuisines ---");
  let cuisineInferred = 0;

  merged.forEach(r => {
    const newCuisine = inferCuisine(r.name, r.brand, r.type, r.cuisine);
    if (newCuisine && !r.cuisine) {
      r.cuisine = newCuisine;
      cuisineInferred++;
    }
  });

  const withCuisine = merged.filter(r => r.cuisine).length;
  console.log(`  Cuisines inferred: ${cuisineInferred.toLocaleString()}`);
  console.log(`  Total with cuisine: ${withCuisine.toLocaleString()} (${((withCuisine/merged.length)*100).toFixed(1)}%)`);

  // --- STEP 5: Prepare documents for import ---
  console.log("\n--- STEP 5: Prepare Documents ---");

  const documents = merged.map(r => ({
    name: r.name,
    location: {
      type: "Point",
      coordinates: [r.longitude, r.latitude]
    },
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address || {},
    contact: r.contact || {},
    cuisine: r.cuisine || null,
    cuisines: r.cuisines || [],
    type: r.type || "restaurant",
    brand: r.brand || null,
    openingHours: r.openingHours || null,
    source: r.source,
    sourceId: r.sourceId || null,
    confidence: r.confidence || null,
    isActive: true
  }));

  // --- STEP 6: Import to MongoDB ---
  console.log("\n--- STEP 6: Import to MongoDB ---");

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "pickaplate";

  console.log(`  Connecting to ${dbName}...`);
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;

  // Get current count for comparison
  const col = db.collection(COLLECTION_NAME);
  const oldCount = await col.countDocuments();
  console.log(`  Current ${COLLECTION_NAME} count: ${oldCount.toLocaleString()}`);

  // Drop and recreate collection
  console.log(`  Dropping ${COLLECTION_NAME}...`);
  try {
    await db.dropCollection(COLLECTION_NAME);
  } catch (e) {
    // Collection might not exist
  }

  // Insert in batches
  console.log(`  Inserting ${documents.length.toLocaleString()} documents...`);
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    await db.collection(COLLECTION_NAME).insertMany(batch);
    inserted += batch.length;
    process.stdout.write(`\r  Inserted: ${inserted.toLocaleString()} / ${documents.length.toLocaleString()}`);
  }
  console.log();

  // Create indexes
  console.log("  Creating indexes...");
  await col.createIndex({ location: "2dsphere" });
  await col.createIndex({ name: "text", brand: "text" });
  await col.createIndex({ latitude: 1, longitude: 1 });
  await col.createIndex({ "address.city": 1, cuisine: 1 });
  await col.createIndex({ source: 1, sourceId: 1 }, { sparse: true });
  await col.createIndex({ isActive: 1 });

  // --- STEP 7: Show final statistics ---
  console.log("\n" + "=".repeat(70));
  console.log("IMPORT COMPLETE");
  console.log("=".repeat(70));

  const finalCount = await col.countDocuments();
  console.log(`\nCollection: ${COLLECTION_NAME}`);
  console.log(`Previous count: ${oldCount.toLocaleString()}`);
  console.log(`New count: ${finalCount.toLocaleString()}`);
  console.log(`Change: ${finalCount > oldCount ? "+" : ""}${(finalCount - oldCount).toLocaleString()}`);

  // Source breakdown
  console.log("\n--- BY SOURCE ---");
  const sources = await col.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  sources.forEach(s => console.log(`  ${s._id}: ${s.count.toLocaleString()}`));

  // Type breakdown
  console.log("\n--- BY TYPE ---");
  const types = await col.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  types.forEach(t => console.log(`  ${t._id}: ${t.count.toLocaleString()}`));

  // Top cities
  console.log("\n--- TOP 10 CITIES ---");
  const cities = await col.aggregate([
    { $group: { _id: "$address.city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();
  cities.forEach(c => console.log(`  ${c._id || "(no city)"}: ${c.count.toLocaleString()}`));

  // Cuisine coverage
  const cuisineCount = await col.countDocuments({ cuisine: { $exists: true, $ne: null, $ne: "" } });
  console.log(`\n--- CUISINE COVERAGE ---`);
  console.log(`  With cuisine: ${cuisineCount.toLocaleString()} (${((cuisineCount/finalCount)*100).toFixed(1)}%)`);

  // Top cuisines
  console.log("\n--- TOP 15 CUISINES ---");
  const cuisines = await col.aggregate([
    { $match: { cuisine: { $exists: true, $ne: null, $ne: "" } } },
    { $group: { _id: "$cuisine", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 }
  ]).toArray();
  cuisines.forEach(c => console.log(`  ${c._id}: ${c.count.toLocaleString()}`));

  // Target check
  console.log("\n" + "=".repeat(70));
  if (finalCount >= 35000 && finalCount <= 45000) {
    console.log(`✓ SUCCESS: ${finalCount.toLocaleString()} records (within target 35k-45k)`);
  } else if (finalCount < 35000) {
    console.log(`⚠ BELOW TARGET: ${finalCount.toLocaleString()} records (target: 35k-45k)`);
    console.log("  Consider lowering confidence threshold further");
  } else {
    console.log(`⚠ ABOVE TARGET: ${finalCount.toLocaleString()} records (target: 35k-45k)`);
    console.log("  Consider raising confidence threshold");
  }
  console.log("=".repeat(70));

  await mongoose.connection.close();
}

main().catch(console.error);

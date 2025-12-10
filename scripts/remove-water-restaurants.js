/**
 * Remove Restaurants in Water Bodies
 *
 * Identifies and removes restaurants incorrectly placed in:
 * - Laguna de Bay (lake east of Metro Manila)
 * - Manila Bay (west of Metro Manila)
 *
 * Run: node scripts/remove-water-restaurants.js
 */

const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const COLLECTION_NAME = "restaurants_2025";

// Water body definitions
const LAGUNA_DE_BAY = {
  name: "Laguna de Bay",
  // The lake is roughly bounded by these coordinates
  // More restrictive to avoid false positives
  bounds: {
    minLat: 14.28,
    maxLat: 14.52,
    minLng: 121.08,
    maxLng: 121.40
  }
};

const MANILA_BAY = {
  name: "Manila Bay",
  // West of the coastline
  bounds: {
    minLat: 14.40,
    maxLat: 14.70,
    minLng: 120.90,
    maxLng: 120.94  // Coastline is roughly at 120.95-120.96
  }
};

// Valid cities that are near water but ON LAND
const LAKESIDE_CITIES = [
  "binangonan", "cardona", "morong", "tanay", "taytay", "angono",
  "jala-jala", "pililla", "teresa", "baras",
  "san pedro", "binan", "sta. rosa", "santa rosa", "cabuyao",
  "calamba", "los banos", "bay", "victoria", "pila",
  "rizal", "laguna"
];

const COASTAL_CITIES = [
  "manila", "pasay", "paranaque", "las pinas", "cavite city",
  "bacoor", "kawit", "noveleta", "rosario", "tanza"
];

function isInLagunaDeBay(lat, lng, city) {
  // Check if in lake bounding box
  if (lat >= LAGUNA_DE_BAY.bounds.minLat &&
      lat <= LAGUNA_DE_BAY.bounds.maxLat &&
      lng >= LAGUNA_DE_BAY.bounds.minLng &&
      lng <= LAGUNA_DE_BAY.bounds.maxLng) {

    // If it has a valid lakeside city, it's probably on land
    if (city) {
      const cityLower = city.toLowerCase();
      if (LAKESIDE_CITIES.some(c => cityLower.includes(c))) {
        return false; // Valid lakeside city - not in water
      }
    }

    // No valid city = suspicious, likely in the lake
    return true;
  }
  return false;
}

function isInManilaBay(lat, lng, city) {
  // Check if in bay bounding box (too far west)
  if (lat >= MANILA_BAY.bounds.minLat &&
      lat <= MANILA_BAY.bounds.maxLat &&
      lng >= MANILA_BAY.bounds.minLng &&
      lng <= MANILA_BAY.bounds.maxLng) {

    // If it has a valid coastal city, might be on land (port area, etc.)
    if (city) {
      const cityLower = city.toLowerCase();
      if (COASTAL_CITIES.some(c => cityLower.includes(c))) {
        // Still suspicious if longitude is very low
        if (lng < 120.92) {
          return true; // Definitely in water even with coastal city
        }
        return false; // Might be valid coastal location
      }
    }

    return true; // No valid city or too far west
  }
  return false;
}

async function main() {
  console.log("=".repeat(70));
  console.log("REMOVE RESTAURANTS IN WATER BODIES");
  console.log("=".repeat(70));

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "pickaplate";

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const col = db.collection(COLLECTION_NAME);

  const totalBefore = await col.countDocuments();
  console.log(`\nTotal restaurants before: ${totalBefore.toLocaleString()}`);

  // --- Find restaurants in Laguna de Bay ---
  console.log("\n--- SCANNING LAGUNA DE BAY ---");
  console.log(`Bounds: Lat ${LAGUNA_DE_BAY.bounds.minLat}-${LAGUNA_DE_BAY.bounds.maxLat}, Lng ${LAGUNA_DE_BAY.bounds.minLng}-${LAGUNA_DE_BAY.bounds.maxLng}`);

  const lagunaCandidates = await col.find({
    latitude: { $gte: LAGUNA_DE_BAY.bounds.minLat, $lte: LAGUNA_DE_BAY.bounds.maxLat },
    longitude: { $gte: LAGUNA_DE_BAY.bounds.minLng, $lte: LAGUNA_DE_BAY.bounds.maxLng }
  }).toArray();

  console.log(`  Candidates in area: ${lagunaCandidates.length}`);

  const lagunaWater = lagunaCandidates.filter(r =>
    isInLagunaDeBay(r.latitude, r.longitude, r.address?.city)
  );

  console.log(`  Confirmed in water: ${lagunaWater.length}`);

  if (lagunaWater.length > 0) {
    console.log("\n  Sample (first 10):");
    lagunaWater.slice(0, 10).forEach(r => {
      console.log(`    - ${r.name}`);
      console.log(`      Lat: ${r.latitude}, Lng: ${r.longitude}`);
      console.log(`      City: ${r.address?.city || "(none)"}`);
    });
  }

  // --- Find restaurants in Manila Bay ---
  console.log("\n--- SCANNING MANILA BAY ---");
  console.log(`Bounds: Lat ${MANILA_BAY.bounds.minLat}-${MANILA_BAY.bounds.maxLat}, Lng ${MANILA_BAY.bounds.minLng}-${MANILA_BAY.bounds.maxLng}`);

  const manilaCandidates = await col.find({
    latitude: { $gte: MANILA_BAY.bounds.minLat, $lte: MANILA_BAY.bounds.maxLat },
    longitude: { $gte: MANILA_BAY.bounds.minLng, $lte: MANILA_BAY.bounds.maxLng }
  }).toArray();

  console.log(`  Candidates in area: ${manilaCandidates.length}`);

  const manilaWater = manilaCandidates.filter(r =>
    isInManilaBay(r.latitude, r.longitude, r.address?.city)
  );

  console.log(`  Confirmed in water: ${manilaWater.length}`);

  if (manilaWater.length > 0) {
    console.log("\n  Sample (first 10):");
    manilaWater.slice(0, 10).forEach(r => {
      console.log(`    - ${r.name}`);
      console.log(`      Lat: ${r.latitude}, Lng: ${r.longitude}`);
      console.log(`      City: ${r.address?.city || "(none)"}`);
    });
  }

  // --- Additional check: Extreme coordinates ---
  console.log("\n--- SCANNING EXTREME COORDINATES ---");

  // Too far east (definitely in Laguna de Bay or beyond)
  const tooFarEast = await col.find({
    longitude: { $gt: 121.15 }
  }).toArray();
  console.log(`  Too far east (lng > 121.15): ${tooFarEast.length}`);

  // Too far west (in Manila Bay)
  const tooFarWest = await col.find({
    longitude: { $lt: 120.92 }
  }).toArray();
  console.log(`  Too far west (lng < 120.92): ${tooFarWest.length}`);

  if (tooFarEast.length > 0) {
    console.log("\n  Too far east samples:");
    tooFarEast.slice(0, 5).forEach(r => {
      console.log(`    - ${r.name} (${r.latitude}, ${r.longitude}) - ${r.address?.city || "no city"}`);
    });
  }

  if (tooFarWest.length > 0) {
    console.log("\n  Too far west samples:");
    tooFarWest.slice(0, 5).forEach(r => {
      console.log(`    - ${r.name} (${r.latitude}, ${r.longitude}) - ${r.address?.city || "no city"}`);
    });
  }

  // --- Combine all water restaurants ---
  const allWaterIds = new Set();

  lagunaWater.forEach(r => allWaterIds.add(r._id.toString()));
  manilaWater.forEach(r => allWaterIds.add(r._id.toString()));
  tooFarEast.forEach(r => allWaterIds.add(r._id.toString()));
  tooFarWest.forEach(r => allWaterIds.add(r._id.toString()));

  const totalWater = allWaterIds.size;

  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`\nTotal restaurants: ${totalBefore.toLocaleString()}`);
  console.log(`In Laguna de Bay: ${lagunaWater.length}`);
  console.log(`In Manila Bay: ${manilaWater.length}`);
  console.log(`Too far east: ${tooFarEast.length}`);
  console.log(`Too far west: ${tooFarWest.length}`);
  console.log(`\nTotal to remove (deduplicated): ${totalWater}`);

  if (totalWater === 0) {
    console.log("\n✓ No restaurants in water detected!");
    await mongoose.connection.close();
    return;
  }

  // --- Delete water restaurants ---
  console.log("\n--- DELETING WATER RESTAURANTS ---");

  const idsToDelete = [...allWaterIds].map(id => new mongoose.Types.ObjectId(id));

  const deleteResult = await col.deleteMany({
    _id: { $in: idsToDelete }
  });

  console.log(`  Deleted: ${deleteResult.deletedCount}`);

  const totalAfter = await col.countDocuments();
  console.log(`\nTotal restaurants after: ${totalAfter.toLocaleString()}`);
  console.log(`Removed: ${totalBefore - totalAfter}`);

  // --- Verify remaining data ---
  console.log("\n--- VERIFICATION ---");

  // Check easternmost restaurants
  const easternmost = await col.find({}).sort({ longitude: -1 }).limit(5).toArray();
  console.log("\nEasternmost restaurants (should be on land):");
  easternmost.forEach(r => {
    console.log(`  - ${r.name} (${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}) - ${r.address?.city || "no city"}`);
  });

  // Check westernmost restaurants
  const westernmost = await col.find({}).sort({ longitude: 1 }).limit(5).toArray();
  console.log("\nWesternmost restaurants (should be on land):");
  westernmost.forEach(r => {
    console.log(`  - ${r.name} (${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}) - ${r.address?.city || "no city"}`);
  });

  console.log("\n" + "=".repeat(70));
  console.log("CLEANUP COMPLETE");
  console.log("=".repeat(70));

  await mongoose.connection.close();
}

main().catch(console.error);

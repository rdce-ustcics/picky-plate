/**
 * Merge and Deduplicate Restaurant Data
 *
 * Combines OSM and Overture data, removes duplicates
 * Uses location proximity + name similarity for matching
 *
 * Run: node scripts/merge-and-dedupe.js
 *
 * Expected output: 18,000 - 22,000+ unique restaurants
 */

const fs = require("fs");
const path = require("path");

// Distance threshold in degrees (~50 meters)
const DISTANCE_THRESHOLD = 0.0005;

// Name similarity threshold (0-1)
const NAME_SIMILARITY_THRESHOLD = 0.6;

// Simple string similarity using Dice coefficient
function similarity(s1, s2) {
  if (!s1 || !s2) return 0;

  // Normalize strings
  s1 = s1.toLowerCase().replace(/[^a-z0-9]/g, "");
  s2 = s2.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  // Count bigrams in s1
  const bigrams = new Map();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.substring(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
  }

  // Count matching bigrams in s2
  let intersect = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    if (bigrams.get(bigram) > 0) {
      bigrams.set(bigram, bigrams.get(bigram) - 1);
      intersect++;
    }
  }

  return (2.0 * intersect) / (s1.length + s2.length - 2);
}

// Check if two places are duplicates
function isDuplicate(place1, place2) {
  const latDiff = Math.abs(place1.latitude - place2.latitude);
  const lonDiff = Math.abs(place1.longitude - place2.longitude);

  // If more than ~50 meters apart, not a duplicate
  if (latDiff > DISTANCE_THRESHOLD || lonDiff > DISTANCE_THRESHOLD) {
    return false;
  }

  // Check name similarity
  const nameSim = similarity(place1.name, place2.name);
  return nameSim >= NAME_SIMILARITY_THRESHOLD;
}

// Merge two place records (prefer OSM, fill with Overture)
function mergePlaces(osmPlace, overturePlace) {
  return {
    name: osmPlace.name || overturePlace.name,
    location: osmPlace.location || overturePlace.location,
    latitude: osmPlace.latitude || overturePlace.latitude,
    longitude: osmPlace.longitude || overturePlace.longitude,
    address: {
      formatted: osmPlace.address.formatted || overturePlace.address.formatted,
      street: osmPlace.address.street || overturePlace.address.street,
      barangay: osmPlace.address.barangay || overturePlace.address.barangay,
      city: osmPlace.address.city || overturePlace.address.city,
      province: "NCR",
      postalCode: osmPlace.address.postalCode || overturePlace.address.postalCode
    },
    contact: {
      phone: osmPlace.contact.phone || overturePlace.contact.phone,
      website: osmPlace.contact.website || overturePlace.contact.website,
      email: osmPlace.contact.email || overturePlace.contact.email
    },
    cuisine: osmPlace.cuisine || overturePlace.cuisine,
    cuisines: osmPlace.cuisines.length > 0 ? osmPlace.cuisines : overturePlace.cuisines,
    type: osmPlace.type || overturePlace.type,
    brand: osmPlace.brand || overturePlace.brand,
    openingHours: osmPlace.openingHours || overturePlace.openingHours,
    source: "merged",
    sourceId: osmPlace.sourceId, // Keep OSM ID as primary
    confidence: overturePlace.confidence, // Use Overture's confidence score
    isActive: true,
    _sources: ["osm", "overture"],
    _osmTags: osmPlace._osmTags || null
  };
}

// Build spatial index for faster lookups
function buildSpatialIndex(places) {
  // Group places by grid cell (~100m cells)
  const gridSize = 0.001; // ~100 meters
  const index = new Map();

  places.forEach((place, i) => {
    const gridX = Math.floor(place.longitude / gridSize);
    const gridY = Math.floor(place.latitude / gridSize);
    const key = `${gridX},${gridY}`;

    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key).push(i);
  });

  return { index, gridSize };
}

// Find potential duplicates using spatial index
function findPotentialDuplicates(place, places, spatialIndex) {
  const { index, gridSize } = spatialIndex;
  const gridX = Math.floor(place.longitude / gridSize);
  const gridY = Math.floor(place.latitude / gridSize);

  // Check current cell and 8 neighbors
  const candidates = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${gridX + dx},${gridY + dy}`;
      if (index.has(key)) {
        candidates.push(...index.get(key));
      }
    }
  }

  return candidates;
}

async function main() {
  console.log("=".repeat(60));
  console.log("MERGE AND DEDUPLICATE");
  console.log("=".repeat(60));

  const dataDir = path.join(__dirname, "../data-sources");

  // Load OSM data
  const osmPath = path.join(dataDir, "osm-transformed.json");
  if (!fs.existsSync(osmPath)) {
    console.error("\nERROR: osm-transformed.json not found!");
    console.log("Run: node scripts/transform-osm.js first\n");
    process.exit(1);
  }

  console.log(`\nLoading OSM data...`);
  const osmData = JSON.parse(fs.readFileSync(osmPath, "utf8"));
  const osmPlaces = osmData.restaurants || [];
  console.log(`  OSM restaurants: ${osmPlaces.length.toLocaleString()}`);

  // Load Overture data (may be empty)
  const overturePath = path.join(dataDir, "overture-transformed.json");
  let overturePlaces = [];

  if (fs.existsSync(overturePath)) {
    console.log(`Loading Overture data...`);
    const overtureData = JSON.parse(fs.readFileSync(overturePath, "utf8"));
    overturePlaces = overtureData.restaurants || [];
    console.log(`  Overture restaurants: ${overturePlaces.length.toLocaleString()}`);
  } else {
    console.log(`  Overture data not found, using OSM only`);
  }

  const totalInput = osmPlaces.length + overturePlaces.length;
  console.log(`\nTotal input: ${totalInput.toLocaleString()}`);

  // Start with all OSM places
  console.log("\nMerging datasets...");
  const merged = [...osmPlaces];

  if (overturePlaces.length > 0) {
    // Build spatial index for OSM data
    console.log("Building spatial index...");
    const spatialIndex = buildSpatialIndex(osmPlaces);

    // For each Overture place, check if it's a duplicate
    let duplicatesFound = 0;
    let uniqueAdded = 0;

    console.log("Processing Overture places...");

    overturePlaces.forEach((overturePlace, i) => {
      if ((i + 1) % 1000 === 0) {
        process.stdout.write(`\r  Processed ${i + 1}/${overturePlaces.length}`);
      }

      // Find potential duplicates using spatial index
      const candidates = findPotentialDuplicates(overturePlace, osmPlaces, spatialIndex);

      let foundDuplicate = false;

      for (const idx of candidates) {
        if (isDuplicate(osmPlaces[idx], overturePlace)) {
          // Merge the data (update OSM record with Overture data)
          merged[idx] = mergePlaces(merged[idx], overturePlace);
          duplicatesFound++;
          foundDuplicate = true;
          break;
        }
      }

      if (!foundDuplicate) {
        // Add as unique place
        merged.push({
          ...overturePlace,
          source: "overture"
        });
        uniqueAdded++;
      }
    });

    console.log(`\r  Processed ${overturePlaces.length}/${overturePlaces.length}`);
    console.log(`\n  Duplicates merged: ${duplicatesFound.toLocaleString()}`);
    console.log(`  Unique Overture added: ${uniqueAdded.toLocaleString()}`);
  }

  // Now deduplicate within the merged set (catch OSM internal duplicates)
  console.log("\nDeduplicating merged set...");

  const seen = new Set();
  const unique = [];
  let internalDupes = 0;

  // Build spatial index for merged data
  const mergedIndex = buildSpatialIndex(merged);

  merged.forEach((place, i) => {
    if (seen.has(i)) return;

    const candidates = findPotentialDuplicates(place, merged, mergedIndex);

    for (const idx of candidates) {
      if (idx > i && !seen.has(idx) && isDuplicate(place, merged[idx])) {
        // Mark as seen (duplicate)
        seen.add(idx);
        internalDupes++;

        // Merge any additional data
        if (merged[idx].contact.phone && !place.contact.phone) {
          place.contact.phone = merged[idx].contact.phone;
        }
        if (merged[idx].contact.website && !place.contact.website) {
          place.contact.website = merged[idx].contact.website;
        }
      }
    }

    unique.push(place);
    seen.add(i);

    if ((i + 1) % 5000 === 0) {
      process.stdout.write(`\r  Processed ${i + 1}/${merged.length}`);
    }
  });

  console.log(`\r  Processed ${merged.length}/${merged.length}`);
  console.log(`  Internal duplicates removed: ${internalDupes.toLocaleString()}`);

  // Add timestamps
  const finalData = unique.map((place) => ({
    ...place,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  // Calculate final statistics
  const stats = {
    total: finalData.length,
    fromOsm: finalData.filter((r) => r.source === "osm" || r.source === "merged").length,
    fromOverture: finalData.filter((r) => r.source === "overture").length,
    merged: finalData.filter((r) => r.source === "merged").length,
    withPhone: finalData.filter((r) => r.contact.phone).length,
    withWebsite: finalData.filter((r) => r.contact.website).length,
    withCuisine: finalData.filter((r) => r.cuisine).length,
    withAddress: finalData.filter((r) => r.address.formatted).length,
    withBrand: finalData.filter((r) => r.brand).length,
    byType: {},
    byCity: {},
    bySource: {}
  };

  finalData.forEach((r) => {
    stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
    stats.byCity[r.address.city] = (stats.byCity[r.address.city] || 0) + 1;
    stats.bySource[r.source] = (stats.bySource[r.source] || 0) + 1;
  });

  // Print final statistics
  console.log("\n" + "=".repeat(60));
  console.log("FINAL STATISTICS");
  console.log("=".repeat(60));

  console.log(`\nTotal unique restaurants: ${stats.total.toLocaleString()}`);
  console.log(`\nBy Source:`);
  Object.entries(stats.bySource)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`  ${source}: ${count.toLocaleString()}`);
    });

  console.log(`\nData Completeness:`);
  const pct = (n) => ((n / stats.total) * 100).toFixed(1);
  console.log(`  With phone: ${stats.withPhone.toLocaleString()} (${pct(stats.withPhone)}%)`);
  console.log(`  With website: ${stats.withWebsite.toLocaleString()} (${pct(stats.withWebsite)}%)`);
  console.log(`  With cuisine: ${stats.withCuisine.toLocaleString()} (${pct(stats.withCuisine)}%)`);
  console.log(`  With address: ${stats.withAddress.toLocaleString()} (${pct(stats.withAddress)}%)`);
  console.log(`  With brand: ${stats.withBrand.toLocaleString()} (${pct(stats.withBrand)}%)`);

  console.log(`\nBy Type (Top 15):`);
  Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count.toLocaleString()}`);
    });

  console.log(`\nBy City (Top 15):`);
  Object.entries(stats.byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([city, count]) => {
      console.log(`  ${city}: ${count.toLocaleString()}`);
    });

  // Save merged data
  const outputPath = path.join(dataDir, "merged-2025.json");
  const outputData = {
    metadata: {
      mergedAt: new Date().toISOString(),
      inputCounts: {
        osm: osmPlaces.length,
        overture: overturePlaces.length,
        total: totalInput
      },
      outputCount: finalData.length,
      duplicatesRemoved: totalInput - finalData.length,
      stats
    },
    restaurants: finalData
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf8");
  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);

  console.log("\n" + "=".repeat(60));
  console.log("OUTPUT");
  console.log("=".repeat(60));
  console.log(`\nFile: ${outputPath}`);
  console.log(`Size: ${fileSizeMB} MB`);
  console.log(`Unique restaurants: ${finalData.length.toLocaleString()}`);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEP");
  console.log("=".repeat(60));
  console.log("\nRun: node scripts/import-to-new-collection.js");
  console.log("This will import to the NEW 'restaurants_2025' collection.\n");
  console.log("REMINDER: Your existing 'foodplaces' data will NOT be touched.\n");

  return stats;
}

main();

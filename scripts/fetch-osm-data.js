/**
 * Fetch Fresh Restaurant Data from OpenStreetMap
 *
 * Uses Overpass API to get current Metro Manila restaurants, cafes, and fast food
 * Saves raw data to osm-raw-data.json for inspection before transformation
 *
 * Run: node scripts/fetch-osm-data.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Metro Manila OSM Area ID (relation 147488 + 3600000000)
const METRO_MANILA_AREA_ID = 3600147488;

// Overpass API endpoint
const OVERPASS_API = "https://overpass-api.de/api/interpreter";

// Build the Overpass query using Area ID for better coverage
function buildOverpassQuery() {
  return `
[out:json][timeout:300];
area(id:${METRO_MANILA_AREA_ID})->.searchArea;
(
  nwr["amenity"="restaurant"](area.searchArea);
  nwr["amenity"="fast_food"](area.searchArea);
  nwr["amenity"="cafe"](area.searchArea);
  nwr["amenity"="food_court"](area.searchArea);
  nwr["amenity"="bar"]["food"="yes"](area.searchArea);
);
out center;
`.trim();
}

// Make HTTP POST request to Overpass API
function fetchFromOverpass(query) {
  return new Promise((resolve, reject) => {
    const postData = `data=${encodeURIComponent(query)}`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
        "User-Agent": "PickyPlate-DataRefresh/1.0"
      }
    };

    console.log("Sending request to Overpass API...");
    console.log("(This may take 2-5 minutes for Metro Manila)\n");

    const req = https.request(OVERPASS_API, options, (res) => {
      let data = "";
      let chunks = 0;

      res.on("data", (chunk) => {
        data += chunk;
        chunks++;
        if (chunks % 50 === 0) {
          process.stdout.write(".");
        }
      });

      res.on("end", () => {
        console.log("\n\nResponse received!");

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 500)}`));
          return;
        }

        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}\nFirst 500 chars: ${data.substring(0, 500)}`));
        }
      });
    });

    req.on("error", (e) => {
      reject(new Error(`Request failed: ${e.message}`));
    });

    // Set timeout for long requests
    req.setTimeout(360000, () => {
      req.destroy();
      reject(new Error("Request timeout (6 minutes)"));
    });

    req.write(postData);
    req.end();
  });
}

// Analyze the raw OSM data
function analyzeOsmData(osmData) {
  const elements = osmData.elements || [];

  const stats = {
    total: elements.length,
    byType: { node: 0, way: 0, relation: 0 },
    byAmenity: {},
    withName: 0,
    withCuisine: 0,
    withPhone: 0,
    withWebsite: 0,
    withAddress: 0,
    withOpeningHours: 0,
    withBrand: 0,
    topCuisines: {},
    topBrands: {}
  };

  elements.forEach((el) => {
    // Count by OSM element type
    stats.byType[el.type] = (stats.byType[el.type] || 0) + 1;

    const tags = el.tags || {};

    // Count by amenity type
    const amenity = tags.amenity || "unknown";
    stats.byAmenity[amenity] = (stats.byAmenity[amenity] || 0) + 1;

    // Track data completeness
    if (tags.name) stats.withName++;
    if (tags.cuisine) {
      stats.withCuisine++;
      // Track top cuisines
      tags.cuisine.split(";").forEach((c) => {
        const cuisine = c.trim().toLowerCase();
        stats.topCuisines[cuisine] = (stats.topCuisines[cuisine] || 0) + 1;
      });
    }
    if (tags.phone || tags["contact:phone"]) stats.withPhone++;
    if (tags.website || tags["contact:website"]) stats.withWebsite++;
    if (tags["addr:street"] || tags["addr:full"]) stats.withAddress++;
    if (tags.opening_hours) stats.withOpeningHours++;
    if (tags.brand) {
      stats.withBrand++;
      stats.topBrands[tags.brand] = (stats.topBrands[tags.brand] || 0) + 1;
    }
  });

  return stats;
}

// Print statistics
function printStats(stats) {
  console.log("\n=== OSM Data Statistics ===\n");
  console.log(`Total elements: ${stats.total}`);

  console.log("\nBy OSM Element Type:");
  Object.entries(stats.byType).forEach(([type, count]) => {
    if (count > 0) console.log(`  ${type}: ${count}`);
  });

  console.log("\nBy Amenity Type:");
  Object.entries(stats.byAmenity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([amenity, count]) => {
      console.log(`  ${amenity}: ${count}`);
    });

  console.log("\nData Completeness:");
  const completeness = [
    ["Has name", stats.withName],
    ["Has cuisine", stats.withCuisine],
    ["Has phone", stats.withPhone],
    ["Has website", stats.withWebsite],
    ["Has address", stats.withAddress],
    ["Has opening hours", stats.withOpeningHours],
    ["Has brand", stats.withBrand]
  ];
  completeness.forEach(([field, count]) => {
    const pct = ((count / stats.total) * 100).toFixed(1);
    console.log(`  ${field}: ${count} (${pct}%)`);
  });

  console.log("\nTop 10 Cuisines:");
  Object.entries(stats.topCuisines)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cuisine, count]) => {
      console.log(`  ${cuisine}: ${count}`);
    });

  console.log("\nTop 10 Brands:");
  Object.entries(stats.topBrands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count}`);
    });
}

async function main() {
  console.log("=== Fetch OSM Restaurant Data ===\n");
  console.log(`Target Area: Metro Manila (OSM Area ID: ${METRO_MANILA_AREA_ID})`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  const query = buildOverpassQuery();
  console.log("Overpass Query:");
  console.log("─".repeat(50));
  console.log(query);
  console.log("─".repeat(50));
  console.log();

  try {
    // Fetch data from Overpass
    const osmData = await fetchFromOverpass(query);

    // Analyze the data
    const stats = analyzeOsmData(osmData);
    printStats(stats);

    // Ensure output directory exists
    const outputDir = path.join(__dirname, "../data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save raw data
    const rawOutputPath = path.join(outputDir, "osm-raw-data.json");
    const outputData = {
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: "OpenStreetMap via Overpass API",
        areaId: METRO_MANILA_AREA_ID,
        area: "Metro Manila, Philippines",
        stats
      },
      elements: osmData.elements
    };

    fs.writeFileSync(rawOutputPath, JSON.stringify(outputData, null, 2), "utf8");
    const fileSizeMB = (fs.statSync(rawOutputPath).size / (1024 * 1024)).toFixed(2);

    console.log(`\n✓ Raw data saved to: ${rawOutputPath}`);
    console.log(`  File size: ${fileSizeMB} MB`);
    console.log(`  Elements: ${stats.total}`);

    console.log("\n=== Next Step ===");
    console.log("Run: node scripts/transform-osm-data.js");
    console.log("This will transform the raw data to match your FoodPlace schema.\n");

    return stats;
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
}

main();

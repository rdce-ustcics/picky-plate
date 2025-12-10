/**
 * Fetch EXPANDED Restaurant Data from OpenStreetMap
 *
 * Uses expanded Overpass query to get MORE food-related places:
 * - Restaurants, fast food, cafes, food courts
 * - Ice cream, juice bars, bakeries
 * - Bars and pubs (may serve food)
 * - Any place with a cuisine tag
 *
 * Run: node scripts/fetch-osm-expanded.js
 *
 * Expected: 14,000 - 17,000 elements
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Metro Manila OSM Area ID
const METRO_MANILA_AREA_ID = 3600147488;

// Overpass API endpoint
const OVERPASS_API = "https://overpass-api.de/api/interpreter";

// Build EXPANDED Overpass query
function buildExpandedQuery() {
  return `
[out:json][timeout:600];
area(id:${METRO_MANILA_AREA_ID})->.searchArea;
(
  // Main dining
  nwr["amenity"="restaurant"](area.searchArea);
  nwr["amenity"="fast_food"](area.searchArea);
  nwr["amenity"="cafe"](area.searchArea);
  nwr["amenity"="food_court"](area.searchArea);
  nwr["amenity"="ice_cream"](area.searchArea);
  nwr["amenity"="juice_bar"](area.searchArea);

  // Bars that might serve food
  nwr["amenity"="bar"](area.searchArea);
  nwr["amenity"="pub"](area.searchArea);

  // Food shops
  nwr["shop"="bakery"](area.searchArea);
  nwr["shop"="pastry"](area.searchArea);
  nwr["shop"="coffee"](area.searchArea);
  nwr["shop"="deli"](area.searchArea);
  nwr["shop"="ice_cream"](area.searchArea);
  nwr["shop"="confectionery"](area.searchArea);
  nwr["shop"="tea"](area.searchArea);
  nwr["shop"="butcher"](area.searchArea);
  nwr["shop"="seafood"](area.searchArea);

  // Catch-all: anything with cuisine tag in Metro Manila
  nwr["cuisine"](area.searchArea);
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
        "User-Agent": "PickyPlate-2025-Refresh/1.0"
      }
    };

    console.log("Sending request to Overpass API...");
    console.log("(This may take 3-8 minutes for expanded Metro Manila query)\n");

    const req = https.request(OVERPASS_API, options, (res) => {
      let data = "";
      let chunks = 0;
      const startTime = Date.now();

      res.on("data", (chunk) => {
        data += chunk;
        chunks++;
        if (chunks % 100 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          process.stdout.write(`\rReceiving data... ${elapsed}s elapsed, ${(data.length / 1024 / 1024).toFixed(1)} MB`);
        }
      });

      res.on("end", () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n\nResponse received in ${elapsed}s!`);

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 500)}`));
          return;
        }

        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on("error", (e) => {
      reject(new Error(`Request failed: ${e.message}`));
    });

    // 10 minute timeout for large query
    req.setTimeout(600000, () => {
      req.destroy();
      reject(new Error("Request timeout (10 minutes)"));
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
    byShop: {},
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
    stats.byType[el.type] = (stats.byType[el.type] || 0) + 1;

    const tags = el.tags || {};

    // Count by amenity type
    if (tags.amenity) {
      stats.byAmenity[tags.amenity] = (stats.byAmenity[tags.amenity] || 0) + 1;
    }

    // Count by shop type
    if (tags.shop) {
      stats.byShop[tags.shop] = (stats.byShop[tags.shop] || 0) + 1;
    }

    // Track data completeness
    if (tags.name) stats.withName++;
    if (tags.cuisine) {
      stats.withCuisine++;
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
  console.log("\n" + "=".repeat(60));
  console.log("OSM EXPANDED DATA STATISTICS");
  console.log("=".repeat(60));

  console.log(`\nTotal elements: ${stats.total.toLocaleString()}`);

  console.log("\nBy OSM Element Type:");
  Object.entries(stats.byType).forEach(([type, count]) => {
    if (count > 0) console.log(`  ${type}: ${count.toLocaleString()}`);
  });

  console.log("\nBy Amenity Type:");
  Object.entries(stats.byAmenity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([amenity, count]) => {
      console.log(`  ${amenity}: ${count.toLocaleString()}`);
    });

  if (Object.keys(stats.byShop).length > 0) {
    console.log("\nBy Shop Type:");
    Object.entries(stats.byShop)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([shop, count]) => {
        console.log(`  ${shop}: ${count.toLocaleString()}`);
      });
  }

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
    console.log(`  ${field}: ${count.toLocaleString()} (${pct}%)`);
  });

  console.log("\nTop 15 Cuisines:");
  Object.entries(stats.topCuisines)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([cuisine, count]) => {
      console.log(`  ${cuisine}: ${count.toLocaleString()}`);
    });

  console.log("\nTop 15 Brands:");
  Object.entries(stats.topBrands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count.toLocaleString()}`);
    });
}

async function main() {
  console.log("=".repeat(60));
  console.log("FETCH EXPANDED OSM RESTAURANT DATA");
  console.log("=".repeat(60));
  console.log(`\nTarget Area: Metro Manila (OSM Area ID: ${METRO_MANILA_AREA_ID})`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Expected: 14,000 - 17,000 elements\n`);

  const query = buildExpandedQuery();
  console.log("Query categories:");
  console.log("  - Restaurants, fast food, cafes, food courts");
  console.log("  - Ice cream, juice bars");
  console.log("  - Bars, pubs");
  console.log("  - Bakeries, pastries, delis, coffee shops");
  console.log("  - All places with cuisine tags");
  console.log();

  try {
    const osmData = await fetchFromOverpass(query);

    const stats = analyzeOsmData(osmData);
    printStats(stats);

    // Ensure output directory exists
    const outputDir = path.join(__dirname, "../data-sources");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save raw data
    const rawOutputPath = path.join(outputDir, "osm-expanded-raw.json");
    const outputData = {
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: "OpenStreetMap via Overpass API (Expanded Query)",
        areaId: METRO_MANILA_AREA_ID,
        area: "Metro Manila, Philippines",
        queryType: "expanded",
        stats
      },
      elements: osmData.elements
    };

    fs.writeFileSync(rawOutputPath, JSON.stringify(outputData, null, 2), "utf8");
    const fileSizeMB = (fs.statSync(rawOutputPath).size / (1024 * 1024)).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log("OUTPUT");
    console.log("=".repeat(60));
    console.log(`\nFile: ${rawOutputPath}`);
    console.log(`Size: ${fileSizeMB} MB`);
    console.log(`Elements: ${stats.total.toLocaleString()}`);

    console.log("\n" + "=".repeat(60));
    console.log("NEXT STEP");
    console.log("=".repeat(60));
    console.log("\nRun: node scripts/fetch-overture.js");
    console.log("To fetch additional data from Overture Maps.\n");

    return stats;
  } catch (err) {
    console.error("\nERROR:", err.message);
    process.exit(1);
  }
}

main();

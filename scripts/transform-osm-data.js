/**
 * Transform OSM Data to FoodPlace Schema
 *
 * Reads osm-raw-data.json and transforms to match the FoodPlace MongoDB schema
 * Handles coordinate extraction, field mapping, and data normalization
 *
 * Run: node scripts/transform-osm-data.js
 */

const fs = require("fs");
const path = require("path");

// Metro Manila city mapping based on barangays/suburbs
const CITY_MAPPINGS = {
  // Major cities
  makati: "Makati",
  manila: "Manila",
  "quezon city": "Quezon City",
  pasig: "Pasig",
  taguig: "Taguig",
  mandaluyong: "Mandaluyong",
  "san juan": "San Juan",
  pasay: "Pasay",
  paranaque: "Parañaque",
  "parañaque": "Parañaque",
  "las pinas": "Las Piñas",
  "las piñas": "Las Piñas",
  muntinlupa: "Muntinlupa",
  marikina: "Marikina",
  caloocan: "Caloocan",
  valenzuela: "Valenzuela",
  malabon: "Malabon",
  navotas: "Navotas",
  pateros: "Pateros",
  // BGC is in Taguig
  bgc: "Taguig",
  "bonifacio global city": "Taguig",
  // Ortigas spans multiple cities
  ortigas: "Pasig",
  // Alabang is in Muntinlupa
  alabang: "Muntinlupa"
};

// Normalize city name
function normalizeCity(cityStr) {
  if (!cityStr) return "Metro Manila";
  const lower = cityStr.toLowerCase().trim();
  return CITY_MAPPINGS[lower] || cityStr;
}

// Price level estimation based on OSM tags
function estimatePriceLevel(tags, amenity) {
  // Fast food is typically inexpensive
  if (amenity === "fast_food") {
    return { priceLevel: "PRICE_LEVEL_INEXPENSIVE", priceLevelNum: 1 };
  }

  // Check for explicit price indicators
  if (tags.cost) {
    const cost = parseFloat(tags.cost);
    if (cost < 200) return { priceLevel: "PRICE_LEVEL_INEXPENSIVE", priceLevelNum: 1 };
    if (cost < 500) return { priceLevel: "PRICE_LEVEL_MODERATE", priceLevelNum: 2 };
    if (cost < 1000) return { priceLevel: "PRICE_LEVEL_EXPENSIVE", priceLevelNum: 3 };
    return { priceLevel: "PRICE_LEVEL_VERY_EXPENSIVE", priceLevelNum: 4 };
  }

  // Infer from other tags
  if (tags.wheelchair === "yes" && tags["payment:credit_cards"] === "yes") {
    return { priceLevel: "PRICE_LEVEL_MODERATE", priceLevelNum: 2 };
  }

  // Cafe typically moderate
  if (amenity === "cafe") {
    return { priceLevel: "PRICE_LEVEL_MODERATE", priceLevelNum: 2 };
  }

  return { priceLevel: null, priceLevelNum: 0 };
}

// Build address from OSM tags
function buildAddress(tags) {
  const parts = [];

  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:barangay"]) parts.push(`Brgy. ${tags["addr:barangay"]}`);
  if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  // Fallback to addr:full
  if (tags["addr:full"]) {
    return tags["addr:full"];
  }

  return "";
}

// Extract types/categories from OSM data
function extractTypes(tags) {
  const types = [];

  // Primary amenity type
  if (tags.amenity) types.push(tags.amenity);

  // Cuisines as types
  if (tags.cuisine) {
    tags.cuisine.split(";").forEach((c) => {
      const cuisine = c.trim().toLowerCase().replace(/\s+/g, "_");
      if (cuisine && !types.includes(cuisine)) {
        types.push(cuisine);
      }
    });
  }

  // Brand as type
  if (tags.brand) {
    const brand = tags.brand.toLowerCase().replace(/\s+/g, "_");
    if (!types.includes(brand)) {
      types.push(brand);
    }
  }

  // Additional type indicators
  if (tags.takeaway === "yes") types.push("takeaway");
  if (tags.delivery === "yes") types.push("delivery");
  if (tags.outdoor_seating === "yes") types.push("outdoor_seating");
  if (tags.diet_vegan === "yes" || tags["diet:vegan"] === "yes") types.push("vegan");
  if (tags.diet_vegetarian === "yes" || tags["diet:vegetarian"] === "yes") types.push("vegetarian");
  if (tags.diet_halal === "yes" || tags["diet:halal"] === "yes") types.push("halal");

  return types;
}

// Transform a single OSM element to FoodPlace schema
function transformElement(element) {
  const tags = element.tags || {};

  // Extract coordinates (handle nodes vs ways)
  const lat = element.center?.lat || element.lat;
  const lon = element.center?.lon || element.lon;

  // Skip if no valid coordinates
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  // Validate coordinate ranges (Metro Manila bounds check)
  if (lat < 14.3 || lat > 14.9 || lon < 120.8 || lon > 121.3) {
    return null;
  }

  // Skip if no name
  const name = tags.name || tags["name:en"] || tags.brand;
  if (!name) {
    return null;
  }

  const amenity = tags.amenity || "restaurant";
  const { priceLevel, priceLevelNum } = estimatePriceLevel(tags, amenity);

  // Determine city
  let city = normalizeCity(tags["addr:city"]);
  if (city === "Metro Manila" && tags["addr:suburb"]) {
    city = normalizeCity(tags["addr:suburb"]);
  }

  // Extract phone (try multiple tags)
  const phone = tags.phone || tags["contact:phone"] || tags["phone:mobile"] || "";

  // Extract website
  const website = tags.website || tags["contact:website"] || tags.url || "";

  // Build the transformed document
  return {
    // Provider identification
    providerId: `osm_${element.type}_${element.id}`,
    provider: "osm",

    // Basic info
    name: name.trim(),
    address: buildAddress(tags),

    // Coordinates
    lat: parseFloat(lat),
    lng: parseFloat(lon),

    // GeoJSON location (IMPORTANT: longitude first!)
    location: {
      type: "Point",
      coordinates: [parseFloat(lon), parseFloat(lat)]
    },

    // Ratings (OSM doesn't have ratings)
    rating: null,
    userRatingCount: 0,

    // Price
    priceLevel,
    priceLevelNum,

    // Categories
    types: extractTypes(tags),
    cuisine: tags.cuisine?.split(";")[0]?.trim() || "",

    // Location details
    locality: tags["addr:barangay"] || tags["addr:suburb"] || "",
    city,

    // Features
    hasOnlineDelivery: tags.delivery === "yes",
    hasTableBooking: tags.reservation === "yes" || tags.reservations === "yes",
    isDeliveringNow: false,

    // Cost
    averageCostForTwo: 0,
    currency: "PHP",

    // Links
    googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    websiteUri: website,
    zomatoUrl: "",

    // Source tracking
    source: "osm",

    // Additional OSM data (useful for debugging/enrichment)
    _osm: {
      id: element.id,
      type: element.type,
      amenity,
      brand: tags.brand || "",
      phone,
      openingHours: tags.opening_hours || "",
      wheelchair: tags.wheelchair === "yes",
      outdoorSeating: tags.outdoor_seating === "yes",
      takeaway: tags.takeaway === "yes",
      internet: tags.internet_access || "",
      smoking: tags.smoking || "",
      operator: tags.operator || ""
    }
  };
}

async function main() {
  console.log("=== Transform OSM Data to FoodPlace Schema ===\n");

  // Load raw data
  const rawDataPath = path.join(__dirname, "../data/osm-raw-data.json");

  if (!fs.existsSync(rawDataPath)) {
    console.error("❌ Error: osm-raw-data.json not found!");
    console.log("Run: node scripts/fetch-osm-data.js first\n");
    process.exit(1);
  }

  console.log(`Loading: ${rawDataPath}`);
  const rawData = JSON.parse(fs.readFileSync(rawDataPath, "utf8"));

  const elements = rawData.elements || [];
  console.log(`Raw elements: ${elements.length}\n`);

  // Transform each element
  console.log("Transforming elements...");
  const transformed = [];
  const skipped = { noCoords: 0, noName: 0, outOfBounds: 0 };

  elements.forEach((element) => {
    const result = transformElement(element);
    if (result) {
      transformed.push(result);
    } else {
      // Track why elements were skipped
      const tags = element.tags || {};
      if (!element.lat && !element.center?.lat) {
        skipped.noCoords++;
      } else if (!tags.name && !tags.brand) {
        skipped.noName++;
      } else {
        skipped.outOfBounds++;
      }
    }
  });

  console.log(`✓ Transformed: ${transformed.length}`);
  console.log(`  Skipped (no coords): ${skipped.noCoords}`);
  console.log(`  Skipped (no name): ${skipped.noName}`);
  console.log(`  Skipped (out of bounds): ${skipped.outOfBounds}`);

  // Analyze transformed data
  console.log("\n=== Transformed Data Analysis ===\n");

  const stats = {
    total: transformed.length,
    withAddress: transformed.filter((r) => r.address).length,
    withCuisine: transformed.filter((r) => r.cuisine).length,
    withPhone: transformed.filter((r) => r._osm.phone).length,
    withWebsite: transformed.filter((r) => r.websiteUri).length,
    withOpeningHours: transformed.filter((r) => r._osm.openingHours).length,
    withBrand: transformed.filter((r) => r._osm.brand).length,
    byAmenity: {},
    byCity: {},
    topCuisines: {}
  };

  transformed.forEach((r) => {
    const amenity = r._osm.amenity;
    stats.byAmenity[amenity] = (stats.byAmenity[amenity] || 0) + 1;

    stats.byCity[r.city] = (stats.byCity[r.city] || 0) + 1;

    if (r.cuisine) {
      stats.topCuisines[r.cuisine] = (stats.topCuisines[r.cuisine] || 0) + 1;
    }
  });

  console.log("Data Completeness:");
  const completeness = [
    ["With address", stats.withAddress],
    ["With cuisine", stats.withCuisine],
    ["With phone", stats.withPhone],
    ["With website", stats.withWebsite],
    ["With opening hours", stats.withOpeningHours],
    ["With brand", stats.withBrand]
  ];
  completeness.forEach(([field, count]) => {
    const pct = ((count / stats.total) * 100).toFixed(1);
    console.log(`  ${field}: ${count} (${pct}%)`);
  });

  console.log("\nBy Amenity Type:");
  Object.entries(stats.byAmenity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  console.log("\nBy City (Top 10):");
  Object.entries(stats.byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([city, count]) => {
      console.log(`  ${city}: ${count}`);
    });

  console.log("\nTop 10 Cuisines:");
  Object.entries(stats.topCuisines)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cuisine, count]) => {
      console.log(`  ${cuisine}: ${count}`);
    });

  // Show sample transformed documents
  console.log("\n=== Sample Transformed Documents ===\n");
  transformed.slice(0, 3).forEach((doc, i) => {
    console.log(`Sample ${i + 1}:`);
    console.log(`  providerId: ${doc.providerId}`);
    console.log(`  name: ${doc.name}`);
    console.log(`  location: [${doc.location.coordinates[0]}, ${doc.location.coordinates[1]}]`);
    console.log(`  city: ${doc.city}`);
    console.log(`  cuisine: ${doc.cuisine || "N/A"}`);
    console.log(`  types: [${doc.types.join(", ")}]`);
    console.log(`  address: ${doc.address || "N/A"}`);
    console.log();
  });

  // Save transformed data
  const outputDir = path.join(__dirname, "../data");
  const outputPath = path.join(outputDir, "osm-transformed-data.json");

  const outputData = {
    metadata: {
      transformedAt: new Date().toISOString(),
      source: "OpenStreetMap via Overpass API",
      originalCount: elements.length,
      transformedCount: transformed.length,
      skipped,
      stats
    },
    documents: transformed
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf8");
  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);

  console.log(`✓ Transformed data saved to: ${outputPath}`);
  console.log(`  File size: ${fileSizeMB} MB`);
  console.log(`  Documents: ${transformed.length}`);

  console.log("\n=== Next Step ===");
  console.log("Review the transformed data, then run:");
  console.log("  node scripts/import-fresh-data.js");
  console.log("\nThis will import the data into MongoDB.\n");

  return stats;
}

main();

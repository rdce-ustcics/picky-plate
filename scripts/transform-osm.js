/**
 * Transform OSM Data for restaurants_2025 Collection
 *
 * Reads osm-expanded-raw.json and transforms to unified schema
 *
 * Run: node scripts/transform-osm.js
 */

const fs = require("fs");
const path = require("path");

// Metro Manila city mappings
const CITY_MAPPINGS = {
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
  bgc: "Taguig",
  "bonifacio global city": "Taguig",
  ortigas: "Pasig",
  alabang: "Muntinlupa"
};

function normalizeCity(cityStr) {
  if (!cityStr) return "Metro Manila";
  const lower = cityStr.toLowerCase().trim();
  return CITY_MAPPINGS[lower] || cityStr;
}

function transformOsmElement(element) {
  const tags = element.tags || {};
  const lat = element.center?.lat || element.lat;
  const lon = element.center?.lon || element.lon;

  // Skip if no valid coordinates
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  // Validate coordinate ranges (Metro Manila bounds)
  if (lat < 14.3 || lat > 14.9 || lon < 120.8 || lon > 121.3) {
    return null;
  }

  // Parse multiple cuisines (OSM uses semicolon)
  const cuisines = tags.cuisine
    ? tags.cuisine.split(";").map((c) => c.trim().toLowerCase())
    : [];

  // Determine type from amenity or shop tag
  const amenity = tags.amenity || null;
  const shop = tags.shop || null;
  let type = amenity || shop || "restaurant";

  // Get name
  const name = tags.name || tags["name:en"] || tags.brand;
  if (!name) {
    return null;
  }

  // Build formatted address
  const addressParts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:barangay"] || tags["addr:suburb"],
    tags["addr:city"]
  ].filter(Boolean);

  const formattedAddress = addressParts.length > 0
    ? addressParts.join(", ")
    : tags["addr:full"] || null;

  // Determine city
  let city = normalizeCity(tags["addr:city"]);
  if (city === "Metro Manila" && tags["addr:suburb"]) {
    city = normalizeCity(tags["addr:suburb"]);
  }

  return {
    name: name.trim(),
    location: {
      type: "Point",
      coordinates: [parseFloat(lon), parseFloat(lat)] // GeoJSON: [longitude, latitude]
    },
    latitude: parseFloat(lat),
    longitude: parseFloat(lon),
    address: {
      formatted: formattedAddress,
      street: tags["addr:street"] || null,
      barangay: tags["addr:barangay"] || tags["addr:suburb"] || null,
      city: city,
      province: "NCR",
      postalCode: tags["addr:postcode"] || null
    },
    contact: {
      phone: tags.phone || tags["contact:phone"] || null,
      website: tags.website || tags["contact:website"] || null,
      email: tags.email || tags["contact:email"] || null
    },
    cuisine: cuisines[0] || null,
    cuisines: cuisines,
    type: type,
    brand: tags.brand || null,
    openingHours: tags.opening_hours || null,
    source: "osm",
    sourceId: `${element.type}/${element.id}`,
    confidence: null,
    isActive: true,
    // Extra OSM tags that might be useful
    _osmTags: {
      wheelchair: tags.wheelchair || null,
      outdoorSeating: tags.outdoor_seating === "yes",
      takeaway: tags.takeaway === "yes",
      delivery: tags.delivery === "yes",
      smoking: tags.smoking || null,
      internetAccess: tags.internet_access || null,
      operator: tags.operator || null
    }
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("TRANSFORM OSM DATA");
  console.log("=".repeat(60));

  // Load raw data
  const inputPath = path.join(__dirname, "../data-sources/osm-expanded-raw.json");

  if (!fs.existsSync(inputPath)) {
    console.error("\nERROR: osm-expanded-raw.json not found!");
    console.log("Run: node scripts/fetch-osm-expanded.js first\n");
    process.exit(1);
  }

  console.log(`\nLoading: ${inputPath}`);
  const rawData = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const elements = rawData.elements || [];

  console.log(`Raw elements: ${elements.length.toLocaleString()}\n`);
  console.log("Transforming elements...");

  // Transform each element
  const transformed = [];
  const skipped = { noCoords: 0, noName: 0, outOfBounds: 0 };

  elements.forEach((element) => {
    const result = transformOsmElement(element);
    if (result) {
      transformed.push(result);
    } else {
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

  console.log(`\nTransformed: ${transformed.length.toLocaleString()}`);
  console.log(`Skipped (no coords): ${skipped.noCoords.toLocaleString()}`);
  console.log(`Skipped (no name): ${skipped.noName.toLocaleString()}`);
  console.log(`Skipped (out of bounds): ${skipped.outOfBounds.toLocaleString()}`);

  // Analyze transformed data
  const stats = {
    total: transformed.length,
    withAddress: transformed.filter((r) => r.address.formatted).length,
    withCuisine: transformed.filter((r) => r.cuisine).length,
    withPhone: transformed.filter((r) => r.contact.phone).length,
    withWebsite: transformed.filter((r) => r.contact.website).length,
    withOpeningHours: transformed.filter((r) => r.openingHours).length,
    withBrand: transformed.filter((r) => r.brand).length,
    byType: {},
    byCity: {},
    topCuisines: {}
  };

  transformed.forEach((r) => {
    stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
    stats.byCity[r.address.city] = (stats.byCity[r.address.city] || 0) + 1;
    if (r.cuisine) {
      stats.topCuisines[r.cuisine] = (stats.topCuisines[r.cuisine] || 0) + 1;
    }
  });

  // Print stats
  console.log("\n" + "=".repeat(60));
  console.log("TRANSFORMED DATA STATISTICS");
  console.log("=".repeat(60));

  console.log("\nData Completeness:");
  const pct = (n) => ((n / stats.total) * 100).toFixed(1);
  console.log(`  With address: ${stats.withAddress.toLocaleString()} (${pct(stats.withAddress)}%)`);
  console.log(`  With cuisine: ${stats.withCuisine.toLocaleString()} (${pct(stats.withCuisine)}%)`);
  console.log(`  With phone: ${stats.withPhone.toLocaleString()} (${pct(stats.withPhone)}%)`);
  console.log(`  With website: ${stats.withWebsite.toLocaleString()} (${pct(stats.withWebsite)}%)`);
  console.log(`  With opening hours: ${stats.withOpeningHours.toLocaleString()} (${pct(stats.withOpeningHours)}%)`);
  console.log(`  With brand: ${stats.withBrand.toLocaleString()} (${pct(stats.withBrand)}%)`);

  console.log("\nBy Type:");
  Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count.toLocaleString()}`);
    });

  console.log("\nBy City (Top 15):");
  Object.entries(stats.byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([city, count]) => {
      console.log(`  ${city}: ${count.toLocaleString()}`);
    });

  console.log("\nTop 15 Cuisines:");
  Object.entries(stats.topCuisines)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([cuisine, count]) => {
      console.log(`  ${cuisine}: ${count.toLocaleString()}`);
    });

  // Show samples
  console.log("\n" + "=".repeat(60));
  console.log("SAMPLE DOCUMENTS");
  console.log("=".repeat(60));

  transformed.slice(0, 3).forEach((doc, i) => {
    console.log(`\nSample ${i + 1}:`);
    console.log(`  name: ${doc.name}`);
    console.log(`  type: ${doc.type}`);
    console.log(`  cuisine: ${doc.cuisine || "N/A"}`);
    console.log(`  city: ${doc.address.city}`);
    console.log(`  location: [${doc.location.coordinates[0]}, ${doc.location.coordinates[1]}]`);
    console.log(`  sourceId: ${doc.sourceId}`);
  });

  // Save transformed data
  const outputDir = path.join(__dirname, "../data-sources");
  const outputPath = path.join(outputDir, "osm-transformed.json");

  const outputData = {
    metadata: {
      transformedAt: new Date().toISOString(),
      source: "OpenStreetMap",
      originalCount: elements.length,
      transformedCount: transformed.length,
      skipped,
      stats
    },
    restaurants: transformed
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf8");
  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);

  console.log("\n" + "=".repeat(60));
  console.log("OUTPUT");
  console.log("=".repeat(60));
  console.log(`\nFile: ${outputPath}`);
  console.log(`Size: ${fileSizeMB} MB`);
  console.log(`Restaurants: ${transformed.length.toLocaleString()}`);

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEP");
  console.log("=".repeat(60));
  console.log("\nRun: node scripts/transform-overture.js");
  console.log("Or if skipping Overture: node scripts/merge-and-dedupe.js\n");

  return stats;
}

main();

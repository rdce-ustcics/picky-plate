/**
 * Transform Overture Maps Data for restaurants_2025 Collection
 *
 * Reads overture-places.json and transforms to unified schema
 *
 * Run: node scripts/transform-overture.js
 */

const fs = require("fs");
const path = require("path");

// Category to type mapping
const CATEGORY_TO_TYPE = {
  restaurant: "restaurant",
  fast_food_restaurant: "fast_food",
  cafe: "cafe",
  coffee_shop: "cafe",
  bakery: "bakery",
  pastry_shop: "bakery",
  dessert_shop: "dessert",
  ice_cream_shop: "ice_cream",
  bar: "bar",
  pub: "bar",
  sports_bar: "bar",
  wine_bar: "bar",
  food_court: "food_court",
  food_stand: "food_stand",
  food_truck: "food_truck",
  deli: "deli",
  juice_bar: "juice_bar",
  tea_house: "tea_house",
  bubble_tea_shop: "bubble_tea"
};

// Category to cuisine mapping
const CATEGORY_TO_CUISINE = {
  filipino_restaurant: "filipino",
  chinese_restaurant: "chinese",
  japanese_restaurant: "japanese",
  korean_restaurant: "korean",
  italian_restaurant: "italian",
  american_restaurant: "american",
  mexican_restaurant: "mexican",
  seafood_restaurant: "seafood",
  pizza_restaurant: "pizza",
  burger_restaurant: "burger",
  chicken_restaurant: "chicken",
  noodle_restaurant: "noodle",
  sushi_restaurant: "japanese",
  bbq_restaurant: "bbq",
  steakhouse: "steak",
  asian_restaurant: "asian",
  buffet_restaurant: "buffet",
  vegetarian_restaurant: "vegetarian",
  vegan_restaurant: "vegan",
  indian_restaurant: "indian",
  thai_restaurant: "thai",
  vietnamese_restaurant: "vietnamese"
};

function transformOverturePlace(place) {
  // Skip if no valid coordinates
  if (!place.latitude || !place.longitude) {
    return null;
  }

  // Validate coordinate ranges
  if (place.latitude < 14.3 || place.latitude > 14.9 ||
      place.longitude < 120.8 || place.longitude > 121.3) {
    return null;
  }

  // Skip if no name
  if (!place.name) {
    return null;
  }

  const category = place.category || "";

  // Determine type
  let type = CATEGORY_TO_TYPE[category];
  if (!type) {
    if (category.includes("restaurant")) type = "restaurant";
    else if (category.includes("cafe") || category.includes("coffee")) type = "cafe";
    else if (category.includes("bar") || category.includes("pub")) type = "bar";
    else if (category.includes("bakery")) type = "bakery";
    else type = "restaurant";
  }

  // Determine cuisine
  let cuisine = CATEGORY_TO_CUISINE[category] || null;
  const cuisines = cuisine ? [cuisine] : [];

  // Normalize city name
  let city = place.city || "Metro Manila";
  if (city === "City of Makati") city = "Makati";
  if (city === "Quezon City, Metro Manila") city = "Quezon City";

  return {
    name: place.name.trim(),
    location: {
      type: "Point",
      coordinates: [place.longitude, place.latitude]
    },
    latitude: place.latitude,
    longitude: place.longitude,
    address: {
      formatted: place.address || null,
      street: null,
      barangay: null,
      city: city,
      province: "NCR",
      postalCode: place.postal_code || null
    },
    contact: {
      phone: place.phone || null,
      website: place.website || null,
      email: place.email || null
    },
    cuisine: cuisine,
    cuisines: cuisines,
    type: type,
    brand: place.brand || null,
    openingHours: null,
    source: "overture",
    sourceId: place.id,
    confidence: place.confidence || null,
    isActive: true,
    _overtureCategory: category
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("TRANSFORM OVERTURE DATA");
  console.log("=".repeat(60));

  // Load raw data
  const inputPath = path.join(__dirname, "../data-sources/overture-places.json");

  if (!fs.existsSync(inputPath)) {
    console.log("\nWARNING: overture-places.json not found!");
    console.log("Overture data will be skipped. Continuing with OSM only.\n");

    // Create empty file so merge script doesn't fail
    const outputPath = path.join(__dirname, "../data-sources/overture-transformed.json");
    const emptyData = {
      metadata: {
        transformedAt: new Date().toISOString(),
        source: "Overture Maps",
        status: "skipped - no input file",
        transformedCount: 0
      },
      restaurants: []
    };
    fs.writeFileSync(outputPath, JSON.stringify(emptyData, null, 2), "utf8");
    console.log(`Created empty: ${outputPath}`);
    console.log("\nContinue with: node scripts/merge-and-dedupe.js\n");
    return;
  }

  console.log(`\nLoading: ${inputPath}`);
  const rawData = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const places = rawData.places || [];

  console.log(`Raw places: ${places.length.toLocaleString()}\n`);
  console.log("Transforming places...");

  // Transform each place
  const transformed = [];
  const skipped = { noCoords: 0, noName: 0, outOfBounds: 0 };

  places.forEach((place) => {
    const result = transformOverturePlace(place);
    if (result) {
      transformed.push(result);
    } else {
      if (!place.latitude || !place.longitude) {
        skipped.noCoords++;
      } else if (!place.name) {
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
    withBrand: transformed.filter((r) => r.brand).length,
    avgConfidence: 0,
    byType: {},
    byCity: {},
    topCuisines: {}
  };

  let totalConfidence = 0;
  transformed.forEach((r) => {
    stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
    stats.byCity[r.address.city] = (stats.byCity[r.address.city] || 0) + 1;
    if (r.cuisine) {
      stats.topCuisines[r.cuisine] = (stats.topCuisines[r.cuisine] || 0) + 1;
    }
    if (r.confidence) {
      totalConfidence += r.confidence;
    }
  });
  stats.avgConfidence = (totalConfidence / transformed.length).toFixed(3);

  // Print stats
  console.log("\n" + "=".repeat(60));
  console.log("TRANSFORMED DATA STATISTICS");
  console.log("=".repeat(60));

  console.log(`\nAverage Confidence: ${stats.avgConfidence}`);

  console.log("\nData Completeness:");
  const pct = (n) => ((n / stats.total) * 100).toFixed(1);
  console.log(`  With address: ${stats.withAddress.toLocaleString()} (${pct(stats.withAddress)}%)`);
  console.log(`  With cuisine: ${stats.withCuisine.toLocaleString()} (${pct(stats.withCuisine)}%)`);
  console.log(`  With phone: ${stats.withPhone.toLocaleString()} (${pct(stats.withPhone)}%)`);
  console.log(`  With website: ${stats.withWebsite.toLocaleString()} (${pct(stats.withWebsite)}%)`);
  console.log(`  With brand: ${stats.withBrand.toLocaleString()} (${pct(stats.withBrand)}%)`);

  console.log("\nBy Type:");
  Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count.toLocaleString()}`);
    });

  console.log("\nBy City (Top 10):");
  Object.entries(stats.byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([city, count]) => {
      console.log(`  ${city}: ${count.toLocaleString()}`);
    });

  console.log("\nTop 10 Cuisines:");
  Object.entries(stats.topCuisines)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
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
    console.log(`  confidence: ${doc.confidence}`);
    console.log(`  sourceId: ${doc.sourceId}`);
  });

  // Save transformed data
  const outputDir = path.join(__dirname, "../data-sources");
  const outputPath = path.join(outputDir, "overture-transformed.json");

  const outputData = {
    metadata: {
      transformedAt: new Date().toISOString(),
      source: "Overture Maps",
      originalCount: places.length,
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
  console.log("\nRun: node scripts/merge-and-dedupe.js\n");

  return stats;
}

main();

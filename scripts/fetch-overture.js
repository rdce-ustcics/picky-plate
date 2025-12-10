/**
 * Fetch Restaurant Data from Overture Maps
 *
 * Uses DuckDB to query Overture Places directly from S3
 * No download needed - queries parquet files in place
 *
 * Run: npm install duckdb (if not installed)
 * Run: node scripts/fetch-overture.js
 *
 * Expected: 8,000 - 15,000 places
 */

const fs = require("fs");
const path = require("path");

// Metro Manila bounding box
const BBOX = {
  minLon: 120.90,
  maxLon: 121.15,
  minLat: 14.35,
  maxLat: 14.80
};

// Overture release (use latest - November 2025)
const OVERTURE_RELEASE = "2025-11-19.0";
const OVERTURE_S3_PATH = `s3://overturemaps-us-west-2/release/${OVERTURE_RELEASE}/theme=places/type=place/*`;

async function fetchOverturePlaces() {
  console.log("=".repeat(60));
  console.log("FETCH OVERTURE MAPS DATA");
  console.log("=".repeat(60));
  console.log(`\nRelease: ${OVERTURE_RELEASE}`);
  console.log(`Bounding Box: [${BBOX.minLon}, ${BBOX.minLat}] to [${BBOX.maxLon}, ${BBOX.maxLat}]`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  let duckdb;
  try {
    duckdb = require("duckdb");
  } catch (e) {
    console.log("DuckDB not installed. Installing...");
    const { execSync } = require("child_process");
    try {
      execSync("npm install duckdb", { stdio: "inherit", cwd: path.join(__dirname, "..") });
      duckdb = require("duckdb");
    } catch (installErr) {
      console.error("\nFailed to install DuckDB:", installErr.message);
      console.log("\nManual installation:");
      console.log("  cd " + path.join(__dirname, ".."));
      console.log("  npm install duckdb");
      console.log("\nThen run this script again.\n");
      process.exit(1);
    }
  }

  const db = new duckdb.Database(":memory:");
  const conn = db.connect();

  // Helper to run queries
  function runQuery(sql) {
    return new Promise((resolve, reject) => {
      conn.all(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  try {
    console.log("Setting up DuckDB with spatial and httpfs extensions...");

    // Install and load extensions
    await runQuery("INSTALL spatial;");
    await runQuery("INSTALL httpfs;");
    await runQuery("LOAD spatial;");
    await runQuery("LOAD httpfs;");
    await runQuery("SET s3_region='us-west-2';");

    console.log("Extensions loaded.\n");
    console.log("Querying Overture Maps (this may take 5-15 minutes)...\n");

    const startTime = Date.now();

    // Food-related categories to search for
    const foodCategories = [
      "restaurant", "fast_food_restaurant", "cafe", "coffee_shop",
      "bakery", "pastry_shop", "dessert_shop", "ice_cream_shop",
      "bar", "pub", "sports_bar", "wine_bar",
      "food_court", "food_stand", "food_truck",
      "filipino_restaurant", "chinese_restaurant", "japanese_restaurant",
      "korean_restaurant", "seafood_restaurant", "asian_restaurant",
      "american_restaurant", "italian_restaurant", "mexican_restaurant",
      "pizza_restaurant", "burger_restaurant", "chicken_restaurant",
      "noodle_restaurant", "sushi_restaurant", "buffet_restaurant",
      "bbq_restaurant", "steakhouse", "tea_house", "bubble_tea_shop",
      "deli", "juice_bar"
    ];

    const categoryList = foodCategories.map(c => `'${c}'`).join(", ");

    const query = `
      SELECT
        id,
        names.primary AS name,
        categories.primary AS category,
        addresses[1].freeform AS address,
        addresses[1].locality AS city,
        addresses[1].postcode AS postal_code,
        phones[1] AS phone,
        websites[1] AS website,
        brand.names.primary AS brand,
        confidence,
        ST_X(geometry) AS longitude,
        ST_Y(geometry) AS latitude
      FROM read_parquet('${OVERTURE_S3_PATH}')
      WHERE
        bbox.xmin >= ${BBOX.minLon} AND bbox.xmax <= ${BBOX.maxLon}
        AND bbox.ymin >= ${BBOX.minLat} AND bbox.ymax <= ${BBOX.maxLat}
        AND (
          categories.primary IN (${categoryList})
          OR categories.primary ILIKE '%restaurant%'
          OR categories.primary ILIKE '%food%'
          OR categories.primary ILIKE '%cafe%'
          OR categories.primary ILIKE '%coffee%'
          OR categories.primary ILIKE '%bakery%'
          OR categories.primary ILIKE '%bar%'
          OR categories.primary ILIKE '%pizza%'
          OR categories.primary ILIKE '%ice_cream%'
        )
    `;

    console.log("Running query...");
    const results = await runQuery(query);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nQuery completed in ${elapsed}s`);
    console.log(`Results: ${results.length.toLocaleString()} places`);

    // Analyze results
    const stats = {
      total: results.length,
      withName: results.filter(r => r.name).length,
      withPhone: results.filter(r => r.phone).length,
      withWebsite: results.filter(r => r.website).length,
      withAddress: results.filter(r => r.address).length,
      withBrand: results.filter(r => r.brand).length,
      byCategory: {},
      byCity: {},
      avgConfidence: 0
    };

    let totalConfidence = 0;
    results.forEach(r => {
      if (r.category) {
        stats.byCategory[r.category] = (stats.byCategory[r.category] || 0) + 1;
      }
      if (r.city) {
        stats.byCity[r.city] = (stats.byCity[r.city] || 0) + 1;
      }
      if (r.confidence) {
        totalConfidence += r.confidence;
      }
    });
    stats.avgConfidence = (totalConfidence / results.length).toFixed(3);

    // Print stats
    console.log("\n" + "=".repeat(60));
    console.log("OVERTURE DATA STATISTICS");
    console.log("=".repeat(60));

    console.log(`\nTotal places: ${stats.total.toLocaleString()}`);
    console.log(`Average confidence: ${stats.avgConfidence}`);

    console.log("\nData Completeness:");
    console.log(`  Has name: ${stats.withName.toLocaleString()} (${((stats.withName/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Has phone: ${stats.withPhone.toLocaleString()} (${((stats.withPhone/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Has website: ${stats.withWebsite.toLocaleString()} (${((stats.withWebsite/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Has address: ${stats.withAddress.toLocaleString()} (${((stats.withAddress/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Has brand: ${stats.withBrand.toLocaleString()} (${((stats.withBrand/stats.total)*100).toFixed(1)}%)`);

    console.log("\nTop 15 Categories:");
    Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count.toLocaleString()}`);
      });

    console.log("\nTop 10 Cities:");
    Object.entries(stats.byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([city, count]) => {
        console.log(`  ${city || "Unknown"}: ${count.toLocaleString()}`);
      });

    // Save results
    const outputDir = path.join(__dirname, "../data-sources");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "overture-places.json");
    const outputData = {
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: "Overture Maps",
        release: OVERTURE_RELEASE,
        boundingBox: BBOX,
        stats
      },
      places: results
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf8");
    const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log("OUTPUT");
    console.log("=".repeat(60));
    console.log(`\nFile: ${outputPath}`);
    console.log(`Size: ${fileSizeMB} MB`);
    console.log(`Places: ${results.length.toLocaleString()}`);

    console.log("\n" + "=".repeat(60));
    console.log("NEXT STEP");
    console.log("=".repeat(60));
    console.log("\nRun: node scripts/transform-osm.js");
    console.log("Then: node scripts/transform-overture.js\n");

    return results;

  } catch (err) {
    console.error("\nERROR:", err.message);

    if (err.message.includes("httpfs") || err.message.includes("s3")) {
      console.log("\nNote: Overture query requires internet access to S3.");
      console.log("If this fails, you can skip Overture and use OSM data only.");
      console.log("\nTo continue without Overture:");
      console.log("  1. Run: node scripts/transform-osm.js");
      console.log("  2. Skip Overture transform");
      console.log("  3. Run: node scripts/merge-and-dedupe.js (will use OSM only)\n");
    }

    process.exit(1);
  } finally {
    conn.close();
    db.close();
  }
}

fetchOverturePlaces();

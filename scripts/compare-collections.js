/**
 * Compare Collections Report
 *
 * Shows side-by-side comparison of old (foodplaces) vs new (restaurants_2025)
 *
 * Run: node scripts/compare-collections.js
 */

const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const OLD_COLLECTION = "foodplaces";
const NEW_COLLECTION = "restaurants_2025";

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pickaplate";
  const dbName = process.env.MONGODB_DB || "pickaplate";

  await mongoose.connect(uri, {
    dbName,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000
  });
  return mongoose.connection.db;
}

// Get collection statistics
async function getCollectionStats(db, collectionName) {
  const collection = db.collection(collectionName);

  const total = await collection.countDocuments();

  if (total === 0) {
    return { total: 0, exists: false };
  }

  // For old collection (foodplaces schema)
  const isOldSchema = collectionName === OLD_COLLECTION;

  const stats = {
    total,
    exists: true,
    withPhone: 0,
    withWebsite: 0,
    withCuisine: 0,
    withAddress: 0,
    withRating: 0,
    withHours: 0,
    byType: {},
    byCity: {},
    bySource: {}
  };

  if (isOldSchema) {
    // Old schema queries (FoodPlace model)
    stats.withPhone = await collection.countDocuments({ phone: { $exists: true, $ne: "" } });
    stats.withWebsite = await collection.countDocuments({ websiteUri: { $exists: true, $ne: "" } });
    stats.withCuisine = await collection.countDocuments({ cuisine: { $exists: true, $ne: "" } });
    stats.withAddress = await collection.countDocuments({ address: { $exists: true, $ne: "" } });
    stats.withRating = await collection.countDocuments({ rating: { $exists: true, $ne: null } });

    // By type (types array)
    const types = await collection.aggregate([
      { $unwind: "$types" },
      { $group: { _id: "$types", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    types.forEach((t) => {
      stats.byType[t._id] = t.count;
    });

    // By city
    const cities = await collection.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    cities.forEach((c) => {
      stats.byCity[c._id || "Unknown"] = c.count;
    });

    // By source
    const sources = await collection.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    sources.forEach((s) => {
      stats.bySource[s._id || "unknown"] = s.count;
    });

  } else {
    // New schema queries (restaurants_2025)
    stats.withPhone = await collection.countDocuments({ "contact.phone": { $exists: true, $ne: null } });
    stats.withWebsite = await collection.countDocuments({ "contact.website": { $exists: true, $ne: null } });
    stats.withCuisine = await collection.countDocuments({ cuisine: { $exists: true, $ne: null } });
    stats.withAddress = await collection.countDocuments({ "address.formatted": { $exists: true, $ne: null } });
    stats.withHours = await collection.countDocuments({ openingHours: { $exists: true, $ne: null } });

    // By type
    const types = await collection.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    types.forEach((t) => {
      stats.byType[t._id] = t.count;
    });

    // By city
    const cities = await collection.aggregate([
      { $group: { _id: "$address.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    cities.forEach((c) => {
      stats.byCity[c._id || "Unknown"] = c.count;
    });

    // By source
    const sources = await collection.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    sources.forEach((s) => {
      stats.bySource[s._id || "unknown"] = s.count;
    });
  }

  return stats;
}

function formatNumber(n) {
  if (n === undefined || n === null) return "-";
  return n.toLocaleString();
}

function formatPercent(n, total) {
  if (!total || n === undefined) return "-";
  return ((n / total) * 100).toFixed(1) + "%";
}

function padRight(str, len) {
  return String(str).padEnd(len);
}

function padLeft(str, len) {
  return String(str).padStart(len);
}

async function main() {
  console.log("\n");

  let db;
  try {
    db = await connectDB();

    console.log("Gathering statistics...\n");

    const oldStats = await getCollectionStats(db, OLD_COLLECTION);
    const newStats = await getCollectionStats(db, NEW_COLLECTION);

    // Print report
    const width = 70;
    const col1 = 25;
    const col2 = 20;
    const col3 = 20;

    console.log("+" + "=".repeat(width - 2) + "+");
    console.log("|" + " COLLECTION COMPARISON REPORT ".padStart((width + 30) / 2).padEnd(width - 2) + "|");
    console.log("+" + "=".repeat(width - 2) + "+");

    // Header
    console.log("|" + padRight(" Metric", col1) + "|" + padLeft(OLD_COLLECTION, col2) + " |" + padLeft(NEW_COLLECTION, col3) + " |");
    console.log("+" + "-".repeat(col1) + "+" + "-".repeat(col2 + 1) + "+" + "-".repeat(col3 + 1) + "+");

    // Total count
    console.log("|" + padRight(" Total Count", col1) + "|" + padLeft(formatNumber(oldStats.total), col2) + " |" + padLeft(formatNumber(newStats.total), col3) + " |");

    // Data completeness
    console.log("+" + "-".repeat(col1) + "+" + "-".repeat(col2 + 1) + "+" + "-".repeat(col3 + 1) + "+");
    console.log("|" + padRight(" With Phone", col1) + "|" + padLeft(formatPercent(oldStats.withPhone, oldStats.total), col2) + " |" + padLeft(formatPercent(newStats.withPhone, newStats.total), col3) + " |");
    console.log("|" + padRight(" With Website", col1) + "|" + padLeft(formatPercent(oldStats.withWebsite, oldStats.total), col2) + " |" + padLeft(formatPercent(newStats.withWebsite, newStats.total), col3) + " |");
    console.log("|" + padRight(" With Cuisine", col1) + "|" + padLeft(formatPercent(oldStats.withCuisine, oldStats.total), col2) + " |" + padLeft(formatPercent(newStats.withCuisine, newStats.total), col3) + " |");
    console.log("|" + padRight(" With Address", col1) + "|" + padLeft(formatPercent(oldStats.withAddress, oldStats.total), col2) + " |" + padLeft(formatPercent(newStats.withAddress, newStats.total), col3) + " |");
    console.log("|" + padRight(" With Rating", col1) + "|" + padLeft(formatPercent(oldStats.withRating, oldStats.total), col2) + " |" + padLeft("-", col3) + " |");
    console.log("|" + padRight(" With Hours", col1) + "|" + padLeft("-", col2) + " |" + padLeft(formatPercent(newStats.withHours, newStats.total), col3) + " |");

    // By type
    console.log("+" + "-".repeat(col1) + "+" + "-".repeat(col2 + 1) + "+" + "-".repeat(col3 + 1) + "+");
    console.log("|" + padRight(" BY TYPE:", col1) + "|" + " ".repeat(col2) + " |" + " ".repeat(col3) + " |");

    const allTypes = new Set([...Object.keys(oldStats.byType), ...Object.keys(newStats.byType)]);
    const typeList = [...allTypes].slice(0, 8);
    typeList.forEach((type) => {
      const oldCount = oldStats.byType[type] || 0;
      const newCount = newStats.byType[type] || 0;
      console.log("|" + padRight(`   ${type}`, col1) + "|" + padLeft(formatNumber(oldCount), col2) + " |" + padLeft(formatNumber(newCount), col3) + " |");
    });

    // By source
    console.log("+" + "-".repeat(col1) + "+" + "-".repeat(col2 + 1) + "+" + "-".repeat(col3 + 1) + "+");
    console.log("|" + padRight(" DATA SOURCES:", col1) + "|" + " ".repeat(col2) + " |" + " ".repeat(col3) + " |");

    const allSources = new Set([...Object.keys(oldStats.bySource), ...Object.keys(newStats.bySource)]);
    [...allSources].forEach((source) => {
      const oldCount = oldStats.bySource[source] || 0;
      const newCount = newStats.bySource[source] || 0;
      console.log("|" + padRight(`   ${source}`, col1) + "|" + padLeft(formatNumber(oldCount), col2) + " |" + padLeft(formatNumber(newCount), col3) + " |");
    });

    console.log("+" + "=".repeat(width - 2) + "+");

    // Recommendation
    console.log("\n");
    console.log("=".repeat(width));
    console.log(" RECOMMENDATION");
    console.log("=".repeat(width));

    const newTotal = newStats.total || 0;
    const oldTotal = oldStats.total || 0;

    if (!newStats.exists) {
      console.log("\n  New collection does not exist yet.");
      console.log("  Run: node scripts/import-to-new-collection.js\n");
    } else if (newTotal >= oldTotal * 0.8) {
      console.log("\n  The new collection has comparable or more data.");
      console.log("  You can safely switch to 'restaurants_2025'.");
      console.log("\n  To switch:");
      console.log("  1. Update your server routes to use 'restaurants_2025'");
      console.log("  2. Or add an environment variable:");
      console.log("     RESTAURANT_COLLECTION=restaurants_2025");
      console.log("\n  Your original 'foodplaces' remains as backup.\n");
    } else {
      console.log("\n  The new collection has significantly fewer records.");
      console.log("  You may want to review the data before switching.");
      console.log(`\n  Old: ${oldTotal.toLocaleString()} | New: ${newTotal.toLocaleString()}\n`);
    }

    // Summary
    console.log("=".repeat(width));
    console.log(" COLLECTION SUMMARY");
    console.log("=".repeat(width));
    console.log(`\n  ${OLD_COLLECTION}: ${formatNumber(oldTotal)} records (UNCHANGED - your backup)`);
    console.log(`  ${NEW_COLLECTION}: ${formatNumber(newTotal)} records (fresh 2025 data)\n`);

  } catch (err) {
    console.error("\nERROR:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

main();

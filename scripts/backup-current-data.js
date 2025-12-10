/**
 * Backup Current Restaurant Data
 *
 * Exports current FoodPlace collection to a JSON backup file
 * Run: node scripts/backup-current-data.js
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const FoodPlace = require("../server/models/FoodPlace");

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pickaplate";
  const dbName = process.env.MONGODB_DB || "pickaplate";

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri, {
    dbName,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
  });
  console.log("✓ Connected to MongoDB\n");
}

async function backupData() {
  console.log("=== Restaurant Data Backup ===\n");

  // Get current count
  const totalCount = await FoodPlace.countDocuments();
  console.log(`Current documents in FoodPlace: ${totalCount}`);

  if (totalCount === 0) {
    console.log("⚠ No data to backup!");
    return;
  }

  // Fetch all documents
  console.log("\nFetching all documents...");
  const allDocs = await FoodPlace.find({}).lean();
  console.log(`✓ Retrieved ${allDocs.length} documents`);

  // Get schema field analysis
  const fieldCounts = {};
  allDocs.forEach(doc => {
    Object.keys(doc).forEach(key => {
      if (doc[key] !== null && doc[key] !== undefined && doc[key] !== "") {
        fieldCounts[key] = (fieldCounts[key] || 0) + 1;
      }
    });
  });

  console.log("\n--- Data Analysis ---");
  console.log(`Total records: ${allDocs.length}`);

  // Show field completeness
  const importantFields = ['name', 'lat', 'lng', 'location', 'address', 'cuisine', 'city', 'phone', 'websiteUri', 'rating'];
  console.log("\nField Completeness:");
  importantFields.forEach(field => {
    const count = fieldCounts[field] || 0;
    const percent = ((count / allDocs.length) * 100).toFixed(1);
    console.log(`  ${field}: ${count}/${allDocs.length} (${percent}%)`);
  });

  // Show by provider/source
  const byProvider = {};
  const bySource = {};
  allDocs.forEach(doc => {
    const provider = doc.provider || 'unknown';
    const source = doc.source || 'unknown';
    byProvider[provider] = (byProvider[provider] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
  });

  console.log("\nBy Provider:");
  Object.entries(byProvider).sort((a, b) => b[1] - a[1]).forEach(([p, c]) => {
    console.log(`  ${p}: ${c}`);
  });

  console.log("\nBy Source:");
  Object.entries(bySource).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
    console.log(`  ${s}: ${c}`);
  });

  // Show sample documents
  console.log("\n--- Sample Documents ---");
  const samples = allDocs.slice(0, 3);
  samples.forEach((doc, i) => {
    console.log(`\nSample ${i + 1}:`);
    console.log(`  Name: ${doc.name}`);
    console.log(`  Location: [${doc.lng}, ${doc.lat}]`);
    console.log(`  City: ${doc.city}`);
    console.log(`  Cuisine: ${doc.cuisine || 'N/A'}`);
    console.log(`  Provider: ${doc.provider}`);
  });

  // Create backup file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(__dirname, "../backups");

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, `foodplaces-backup-${timestamp}.json`);

  const backupData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalCount: allDocs.length,
      database: process.env.MONGODB_DB || "pickaplate",
      collection: "foodplaces",
      fieldCounts,
      byProvider,
      bySource
    },
    documents: allDocs
  };

  console.log(`\nSaving backup to: ${backupPath}`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf8");

  const fileSizeMB = (fs.statSync(backupPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ Backup saved! (${fileSizeMB} MB)`);

  // Also save a smaller summary file
  const summaryPath = path.join(backupDir, `backup-summary-${timestamp}.json`);
  const summaryData = {
    ...backupData.metadata,
    sampleDocuments: samples
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2), "utf8");
  console.log(`✓ Summary saved to: ${summaryPath}`);

  return {
    backupPath,
    totalCount: allDocs.length,
    fieldCounts
  };
}

async function main() {
  try {
    await connectDB();
    const result = await backupData();

    console.log("\n=== Backup Complete ===");
    if (result) {
      console.log(`Backed up ${result.totalCount} documents`);
      console.log(`File: ${result.backupPath}`);
    }
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
  }
}

main();

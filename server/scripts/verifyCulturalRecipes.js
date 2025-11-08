require("dotenv").config();
const mongoose = require("mongoose");
const CulturalRecipe = require("../models/CulturalRecipe");

/**
 * Verification script for Cultural Recipes database
 *
 * This script connects to the database and verifies:
 * - Total recipe count
 * - Regional distribution
 * - Data integrity (required fields, image URLs, etc.)
 * - Sample recipe details
 */

async function verifyCulturalRecipes() {
  try {
    console.log("🔍 Cultural Recipes Verification Script\n");
    console.log("=" . repeat(60) + "\n");

    // Connect to MongoDB
    const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'pickaplate';
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    await mongoose.connect(uri, {
      dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
    });

    console.log(`✅ Connected to: ${mongoose.connection.name}\n`);

    // 1. Count total recipes
    const total = await CulturalRecipe.countDocuments({ isActive: true });
    console.log(`📊 Total Active Recipes: ${total}\n`);

    if (total === 0) {
      console.log("⚠️  No recipes found! Run the seeder first:");
      console.log("   node scripts/seedCulturalRecipes.js\n");
      process.exit(0);
    }

    // 2. Count by region
    console.log("📍 Regional Distribution:");
    const luzon = await CulturalRecipe.countDocuments({ region: "Luzon", isActive: true });
    const visayas = await CulturalRecipe.countDocuments({ region: "Visayas", isActive: true });
    const mindanao = await CulturalRecipe.countDocuments({ region: "Mindanao", isActive: true });

    console.log(`   • Luzon: ${luzon} recipes`);
    console.log(`   • Visayas: ${visayas} recipes`);
    console.log(`   • Mindanao: ${mindanao} recipes\n`);

    // 3. Data integrity checks
    console.log("🔎 Data Integrity Checks:");

    const missingNames = await CulturalRecipe.countDocuments({ name: { $in: ["", null] }, isActive: true });
    const missingDesc = await CulturalRecipe.countDocuments({ desc: { $in: ["", null] }, isActive: true });
    const missingRegion = await CulturalRecipe.countDocuments({ region: { $in: ["", null] }, isActive: true });
    const emptyRecipes = await CulturalRecipe.countDocuments({ recipe: { $size: 0 }, isActive: true });

    console.log(`   ✓ Recipes with names: ${total - missingNames}/${total}`);
    console.log(`   ✓ Recipes with descriptions: ${total - missingDesc}/${total}`);
    console.log(`   ✓ Recipes with regions: ${total - missingRegion}/${total}`);
    console.log(`   ✓ Recipes with ingredients/steps: ${total - emptyRecipes}/${total}\n`);

    if (missingNames > 0 || missingDesc > 0 || missingRegion > 0 || emptyRecipes > 0) {
      console.log("⚠️  Some data integrity issues found!\n");
    } else {
      console.log("✅ All integrity checks passed!\n");
    }

    // 4. Sample recipes from each region
    console.log("🍽️  Sample Recipes:\n");

    for (const region of ["Luzon", "Visayas", "Mindanao"]) {
      const sample = await CulturalRecipe.findOne({ region, isActive: true }).lean();
      if (sample) {
        console.log(`   [${region}] ${sample.name}`);
        console.log(`   └─ ${sample.desc.substring(0, 70)}...`);
        console.log(`   └─ ${sample.recipe.length} ingredients/steps`);
        console.log(`   └─ Image: ${sample.img ? '✓' : '✗'}\n`);
      }
    }

    // 5. List all recipe names
    console.log("=" . repeat(60));
    console.log("📋 Complete Recipe List:\n");

    const allRecipes = await CulturalRecipe.find({ isActive: true })
      .select('name region')
      .sort({ region: 1, name: 1 })
      .lean();

    let currentRegion = '';
    allRecipes.forEach(recipe => {
      if (recipe.region !== currentRegion) {
        currentRegion = recipe.region;
        console.log(`\n${currentRegion.toUpperCase()}:`);
      }
      console.log(`   • ${recipe.name}`);
    });

    console.log("\n" + "=" . repeat(60));
    console.log("✅ Verification Complete!\n");
    console.log("🌐 API Endpoints to test:");
    console.log("   • All recipes: http://localhost:4000/api/cultural-recipes");
    console.log("   • Luzon: http://localhost:4000/api/cultural-recipes?region=Luzon");
    console.log("   • Visayas: http://localhost:4000/api/cultural-recipes?region=Visayas");
    console.log("   • Mindanao: http://localhost:4000/api/cultural-recipes?region=Mindanao\n");
    console.log("🍴 Frontend: http://localhost:3000/explorer\n");

  } catch (error) {
    console.error("\n❌ Verification Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("📡 Database connection closed");
    process.exit(0);
  }
}

// Run verification
verifyCulturalRecipes();

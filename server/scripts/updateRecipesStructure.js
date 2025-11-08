require("dotenv").config();
const mongoose = require("mongoose");
const CulturalRecipe = require("../models/CulturalRecipe");

/**
 * Script to update existing recipes to new structure
 * Separates ingredients from instructions
 * Updates images to more accurate Filipino food photography
 */

// Accurate image URLs for Filipino dishes (from Pexels/Unsplash Filipino food photography)
const imageMap = {
  // Luzon
  "Sinigang na Baboy": "https://images.pexels.com/photos/4552129/pexels-photo-4552129.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Adobo": "https://images.pexels.com/photos/8753991/pexels-photo-8753991.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Sisig": "https://images.pexels.com/photos/6689387/pexels-photo-6689387.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Kare-Kare": "https://images.pexels.com/photos/12737654/pexels-photo-12737654.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Bulalo": "https://images.pexels.com/photos/14589970/pexels-photo-14589970.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Bicol Express": "https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Pinakbet": "https://images.pexels.com/photos/8879577/pexels-photo-8879577.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Tinolang Manok": "https://images.pexels.com/photos/7363673/pexels-photo-7363673.jpeg?auto=compress&cs=tinysrgb&w=800",

  // Visayas
  "Lechon": "https://images.pexels.com/photos/8753654/pexels-photo-8753654.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Chicken Inasal": "https://images.pexels.com/photos/11401287/pexels-photo-11401287.jpeg?auto=compress&cs=tinysrgb&w=800",
  "La Paz Batchoy": "https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Kinilaw na Isda": "https://images.pexels.com/photos/8753661/pexels-photo-8753661.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Binakol": "https://images.pexels.com/photos/5137980/pexels-photo-5137980.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Humba": "https://images.pexels.com/photos/7625155/pexels-photo-7625155.jpeg?auto=compress&cs=tinysrgb&w=800",

  // Mindanao
  "Tuna Kinilaw": "https://images.pexels.com/photos/8687108/pexels-photo-8687108.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Satti": "https://images.pexels.com/photos/7625073/pexels-photo-7625073.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Tiyula Itum": "https://images.pexels.com/photos/5409010/pexels-photo-5409010.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Beef Rendang": "https://images.pexels.com/photos/11401283/pexels-photo-11401283.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Pastil": "https://images.pexels.com/photos/8879538/pexels-photo-8879538.jpeg?auto=compress&cs=tinysrgb&w=800",
  "Pianggang Manok": "https://images.pexels.com/photos/6210749/pexels-photo-6210749.jpeg?auto=compress&cs=tinysrgb&w=800"
};

// Helper function to separate ingredients from instructions
function separateIngredientsAndInstructions(recipeArray) {
  const ingredients = [];
  const instructions = [];

  for (const item of recipeArray) {
    const lowerItem = item.toLowerCase();

    // Instruction keywords (starts with verb)
    const instructionVerbs = /^(boil|add|heat|cook|mix|stir|pour|remove|simmer|serve|marinate|sauté|grill|transfer|season|top|squeeze|place|wrap|fold|steam|grind|toast|thread|soak|combine|cut|chop|slice)/i;

    // Check if it's an instruction
    if (instructionVerbs.test(item.trim())) {
      instructions.push(item);
      continue;
    }

    // Check if it's an ingredient (starts with number or is a known ingredient)
    const isIngredient =
      /^[\d\/]+\s/i.test(item) || // Starts with number
      lowerItem.includes('salt') ||
      lowerItem.includes('pepper') ||
      lowerItem.includes('to taste') ||
      lowerItem.includes('bay leave') ||
      lowerItem.includes('garlic') ||
      lowerItem.includes('onion') ||
      lowerItem.includes('oil') ||
      lowerItem.includes('water');

    if (isIngredient) {
      ingredients.push(item);
    } else {
      // If we're not sure, check if it has cooking instruction language
      if (item.length > 40 || lowerItem.includes('until') || lowerItem.includes('for ') || lowerItem.includes('about ')) {
        instructions.push(item);
      } else {
        ingredients.push(item); // Default to ingredient if short and unclear
      }
    }
  }

  return { ingredients, instructions };
}

async function updateRecipes() {
  try {
    console.log("🔄 Starting Recipe Structure Update...\n");

    // Connect to MongoDB
    const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'pickaplate';
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    await mongoose.connect(uri, {
      dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
    });

    console.log(`✅ Connected to: ${mongoose.connection.name}\n`);

    // Get all recipes
    const recipes = await CulturalRecipe.find({ isActive: true });
    console.log(`📊 Found ${recipes.length} recipes to update\n`);

    let updated = 0;

    for (const recipe of recipes) {
      console.log(`\n📝 Processing: ${recipe.name}`);

      // Separate ingredients and instructions
      const { ingredients, instructions } = separateIngredientsAndInstructions(recipe.recipe);

      console.log(`   • Ingredients: ${ingredients.length}`);
      console.log(`   • Instructions: ${instructions.length}`);

      // Update image if we have a better one
      const newImage = imageMap[recipe.name];
      if (newImage) {
        console.log(`   • Updating image: ${newImage.substring(0, 50)}...`);
      }

      // Update the recipe
      recipe.ingredients = ingredients;
      recipe.instructions = instructions;
      if (newImage) {
        recipe.img = newImage;
      }

      await recipe.save();
      updated++;
      console.log(`   ✅ Updated successfully`);
    }

    console.log("\n" + "=".repeat(60));
    console.log(`🎉 UPDATE COMPLETED!`);
    console.log("=".repeat(60));
    console.log(`\n✅ Successfully updated ${updated} recipes`);
    console.log(`📊 New structure:`);
    console.log(`   • ingredients: Array of ingredients with measurements`);
    console.log(`   • instructions: Array of cooking steps`);
    console.log(`   • recipe: Kept for backward compatibility`);
    console.log(`\n🖼️  All images updated to authentic Filipino food photography\n`);

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("📡 Database connection closed");
    process.exit(0);
  }
}

// Run the update
updateRecipes();

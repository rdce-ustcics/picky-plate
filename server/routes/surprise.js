// server/routes/surprise.js
const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const CulturalRecipe = require("../models/CulturalRecipe");

/**
 * GET /api/surprise
 * Fetch random recipes from both community recipes and cultural recipes
 * Returns a mix of recipes for the "Surprise Me" feature
 */
router.get("/", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const maxLimit = Math.min(parseInt(limit, 10) || 10, 50);

    // Fetch active community recipes (not flagged, not deleted, not under review)
    const communityRecipes = await Recipe.find({
      isDeleted: false,
      isFlagged: false,
      state: { $ne: "forReview" }
    })
      .select('title author image prepTime cookTime difficulty servings description ingredients instructions tags allergens notes')
      .lean();

    // Fetch active cultural recipes
    const culturalRecipes = await CulturalRecipe.find({
      isActive: true
    })
      .select('name desc region img ingredients instructions recipe')
      .lean();

    // Transform recipes to a common format
    const formattedCommunityRecipes = communityRecipes.map(recipe => ({
      id: recipe._id,
      name: recipe.title,
      type: "community",
      author: recipe.author || "Community",
      restaurant: `By ${recipe.author || "Community"}`,
      image: recipe.image || "https://images.unsplash.com/photo-1546548970-71785318a17b?w=800&q=80",
      description: recipe.description || "",
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      tags: recipe.tags || [],
      allergens: recipe.allergens || [],
      notes: recipe.notes || ""
    }));

    const formattedCulturalRecipes = culturalRecipes.map(recipe => ({
      id: recipe._id,
      name: recipe.name,
      type: "cultural",
      author: "Cultural Recipe",
      restaurant: `Traditional ${recipe.region} Cuisine`,
      image: recipe.img || "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
      description: recipe.desc || "",
      region: recipe.region,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      recipe: recipe.recipe || []
    }));

    // Combine both types of recipes
    const allRecipes = [...formattedCommunityRecipes, ...formattedCulturalRecipes];

    // Shuffle the array
    const shuffled = allRecipes.sort(() => Math.random() - 0.5);

    // Return limited number of recipes
    const result = shuffled.slice(0, maxLimit);

    res.json({
      success: true,
      recipes: result,
      total: allRecipes.length
    });
  } catch (e) {
    console.error("surprise_recipes_error:", e);
    res.status(500).json({
      success: false,
      error: "Failed to fetch surprise recipes"
    });
  }
});

/**
 * GET /api/surprise/random
 * Get a single random recipe
 */
router.get("/random", async (req, res) => {
  try {
    // Fetch active community recipes
    const communityRecipes = await Recipe.find({
      isDeleted: false,
      isFlagged: false,
      state: { $ne: "forReview" }
    })
      .select('title author image prepTime cookTime difficulty servings description')
      .lean();

    // Fetch active cultural recipes
    const culturalRecipes = await CulturalRecipe.find({
      isActive: true
    })
      .select('name desc region img ingredients instructions recipe')
      .lean();

    // Transform recipes to a common format
    const formattedCommunityRecipes = communityRecipes.map(recipe => ({
      id: recipe._id,
      name: recipe.title,
      type: "community",
      author: recipe.author || "Community",
      restaurant: `By ${recipe.author || "Community"}`,
      image: recipe.image || "https://images.unsplash.com/photo-1546548970-71785318a17b?w=800&q=80",
      description: recipe.description || "",
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      tags: recipe.tags || [],
      allergens: recipe.allergens || [],
      notes: recipe.notes || ""
    }));

    const formattedCulturalRecipes = culturalRecipes.map(recipe => ({
      id: recipe._id,
      name: recipe.name,
      type: "cultural",
      author: "Cultural Recipe",
      restaurant: `Traditional ${recipe.region} Cuisine`,
      image: recipe.img || "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
      description: recipe.desc || "",
      region: recipe.region,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      recipe: recipe.recipe || []
    }));

    // Combine both types of recipes
    const allRecipes = [...formattedCommunityRecipes, ...formattedCulturalRecipes];

    if (allRecipes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No recipes available"
      });
    }

    // Get a random recipe
    const randomIndex = Math.floor(Math.random() * allRecipes.length);
    const randomRecipe = allRecipes[randomIndex];

    res.json({
      success: true,
      recipe: randomRecipe
    });
  } catch (e) {
    console.error("random_recipe_error:", e);
    res.status(500).json({
      success: false,
      error: "Failed to fetch random recipe"
    });
  }
});

module.exports = router;

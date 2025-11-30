// server/routes/surprise.js
const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const CulturalRecipe = require("../models/CulturalRecipe");

/**
 * GET /api/surprise
 * Fetch random recipes using MongoDB $sample (FAST)
 */
router.get("/", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const maxLimit = Math.min(parseInt(limit, 10) || 10, 50);
    const halfLimit = Math.ceil(maxLimit / 2);

    // Use $sample aggregation for fast random selection
    const [communityRecipes, culturalRecipes] = await Promise.all([
      Recipe.aggregate([
        { $match: { isDeleted: false, isFlagged: false, state: { $ne: "forReview" } } },
        { $sample: { size: halfLimit } },
        { $project: { title: 1, author: 1, image: 1, prepTime: 1, cookTime: 1, difficulty: 1, servings: 1, description: 1, ingredients: 1, instructions: 1, tags: 1, allergens: 1, notes: 1 } }
      ]),
      CulturalRecipe.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: halfLimit } },
        { $project: { name: 1, desc: 1, region: 1, img: 1, ingredients: 1, instructions: 1, recipe: 1 } }
      ])
    ]);

    // Transform to common format
    const formattedCommunity = communityRecipes.map(r => ({
      id: r._id,
      name: r.title,
      type: "community",
      author: r.author || "Community",
      restaurant: `By ${r.author || "Community"}`,
      image: r.image || "https://images.unsplash.com/photo-1546548970-71785318a17b?w=800&q=80",
      description: r.description || "",
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      difficulty: r.difficulty,
      servings: r.servings,
      ingredients: r.ingredients || [],
      instructions: r.instructions || [],
      tags: r.tags || [],
      allergens: r.allergens || [],
      notes: r.notes || ""
    }));

    const formattedCultural = culturalRecipes.map(r => ({
      id: r._id,
      name: r.name,
      type: "cultural",
      author: "Cultural Recipe",
      restaurant: `Traditional ${r.region} Cuisine`,
      image: r.img || "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
      description: r.desc || "",
      region: r.region,
      ingredients: r.ingredients || [],
      instructions: r.instructions || [],
      recipe: r.recipe || []
    }));

    // Combine and shuffle
    const allRecipes = [...formattedCommunity, ...formattedCultural]
      .sort(() => Math.random() - 0.5)
      .slice(0, maxLimit);

    res.json({ success: true, recipes: allRecipes, total: allRecipes.length });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch surprise recipes" });
  }
});

/**
 * GET /api/surprise/random
 * Get a single random recipe using MongoDB $sample (VERY FAST)
 */
router.get("/random", async (req, res) => {
  try {
    // Randomly choose which collection to sample from (50/50 chance)
    const useCultural = Math.random() > 0.5;

    let recipe = null;

    if (useCultural) {
      // Try cultural first
      const [culturalRecipe] = await CulturalRecipe.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 1 } },
        { $project: { name: 1, desc: 1, region: 1, img: 1, ingredients: 1, instructions: 1, recipe: 1 } }
      ]);

      if (culturalRecipe) {
        recipe = {
          id: culturalRecipe._id,
          name: culturalRecipe.name,
          type: "cultural",
          author: "Cultural Recipe",
          restaurant: `Traditional ${culturalRecipe.region} Cuisine`,
          image: culturalRecipe.img || "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
          description: culturalRecipe.desc || "",
          region: culturalRecipe.region,
          ingredients: culturalRecipe.ingredients || [],
          instructions: culturalRecipe.instructions || [],
          recipe: culturalRecipe.recipe || []
        };
      }
    }

    // If no cultural recipe or we chose community
    if (!recipe) {
      const [communityRecipe] = await Recipe.aggregate([
        { $match: { isDeleted: false, isFlagged: false, state: { $ne: "forReview" } } },
        { $sample: { size: 1 } },
        { $project: { title: 1, author: 1, image: 1, prepTime: 1, cookTime: 1, difficulty: 1, servings: 1, description: 1, ingredients: 1, instructions: 1, tags: 1, allergens: 1, notes: 1 } }
      ]);

      if (communityRecipe) {
        recipe = {
          id: communityRecipe._id,
          name: communityRecipe.title,
          type: "community",
          author: communityRecipe.author || "Community",
          restaurant: `By ${communityRecipe.author || "Community"}`,
          image: communityRecipe.image || "https://images.unsplash.com/photo-1546548970-71785318a17b?w=800&q=80",
          description: communityRecipe.description || "",
          prepTime: communityRecipe.prepTime,
          cookTime: communityRecipe.cookTime,
          difficulty: communityRecipe.difficulty,
          servings: communityRecipe.servings,
          ingredients: communityRecipe.ingredients || [],
          instructions: communityRecipe.instructions || [],
          tags: communityRecipe.tags || [],
          allergens: communityRecipe.allergens || [],
          notes: communityRecipe.notes || ""
        };
      }
    }

    // Fallback: try the other collection if first was empty
    if (!recipe) {
      const [fallback] = await CulturalRecipe.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 1 } }
      ]);

      if (fallback) {
        recipe = {
          id: fallback._id,
          name: fallback.name,
          type: "cultural",
          author: "Cultural Recipe",
          restaurant: `Traditional ${fallback.region} Cuisine`,
          image: fallback.img || "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
          description: fallback.desc || "",
          region: fallback.region,
          ingredients: fallback.ingredients || [],
          instructions: fallback.instructions || [],
          recipe: fallback.recipe || []
        };
      }
    }

    if (!recipe) {
      return res.status(404).json({ success: false, error: "No recipes available" });
    }

    res.json({ success: true, recipe });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch random recipe" });
  }
});

module.exports = router;

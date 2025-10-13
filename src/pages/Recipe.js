import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Clock, TrendingUp, X, ChefHat, Users } from "lucide-react";

export default function CommunityRecipes() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const recipes = [
    {
      id: 1,
      title: "Spaghetti Carbonara",
      author: "marcus.smith",
      prepTime: "20min",
      cookTime: "15min",
      difficulty: "Easy",
      image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&h=300&fit=crop",
      description: "A classic Italian pasta dish with a creamy egg-based sauce, crispy pancetta, and Parmesan cheese. Simple yet elegant.",
      ingredients: [
        "400g spaghetti",
        "200g pancetta or guanciale, diced",
        "4 large eggs",
        "100g Parmesan cheese, grated",
        "2 cloves garlic, minced",
        "Salt and black pepper to taste",
        "Fresh parsley for garnish"
      ],
      instructions: [
        "Bring a large pot of salted water to boil and cook spaghetti according to package instructions.",
        "While pasta cooks, fry pancetta in a large pan over medium heat until crispy (about 5-7 minutes).",
        "In a bowl, whisk together eggs, Parmesan cheese, and a generous amount of black pepper.",
        "Reserve 1 cup of pasta water, then drain the spaghetti.",
        "Remove pan from heat and add the hot pasta to the pancetta.",
        "Quickly pour in the egg mixture, tossing constantly. Add pasta water gradually to create a creamy sauce.",
        "Serve immediately with extra Parmesan and black pepper."
      ],
      servings: "4 servings",
      notes: "The key is to work quickly off the heat so the eggs don't scramble. The residual heat from the pasta will cook the eggs perfectly into a silky sauce."
    },
    {
      id: 2,
      title: "Chicken Tikka Masala",
      author: "jonathan.tyler",
      prepTime: "30min",
      cookTime: "40min",
      difficulty: "Medium",
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=300&fit=crop",
      description: "Tender marinated chicken in a rich, creamy tomato-based sauce with aromatic spices. A beloved Indian restaurant favorite.",
      ingredients: [
        "800g chicken breast, cubed",
        "1 cup yogurt",
        "2 tbsp tikka masala spice blend",
        "3 tbsp vegetable oil",
        "1 large onion, diced",
        "4 cloves garlic, minced",
        "1 tbsp ginger, grated",
        "400g crushed tomatoes",
        "1 cup heavy cream",
        "2 tsp garam masala",
        "1 tsp cumin",
        "Fresh cilantro",
        "Salt to taste"
      ],
      instructions: [
        "Mix chicken with yogurt, 1 tbsp tikka masala, and salt. Marinate for at least 2 hours or overnight.",
        "Heat oil in a large pan and cook marinated chicken until browned. Set aside.",
        "In the same pan, sauté onion until golden (8-10 minutes).",
        "Add garlic and ginger, cook for 1 minute until fragrant.",
        "Stir in remaining tikka masala, garam masala, and cumin. Cook for 30 seconds.",
        "Add crushed tomatoes and simmer for 10 minutes.",
        "Blend the sauce until smooth (optional for creamier texture).",
        "Return chicken to pan, add cream, and simmer for 15 minutes.",
        "Garnish with cilantro and serve with rice or naan."
      ],
      servings: "6 servings",
      notes: "Marinating the chicken overnight enhances the flavor significantly. This dish tastes even better the next day!"
    },
    {
      id: 3,
      title: "Vegetable Stir-Fry",
      author: "ryan.gosling",
      prepTime: "15min",
      cookTime: "10min",
      difficulty: "Easy",
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=300&fit=crop",
      description: "A colorful, healthy mix of fresh vegetables cooked quickly over high heat with a savory Asian-inspired sauce.",
      ingredients: [
        "2 cups broccoli florets",
        "1 red bell pepper, sliced",
        "1 yellow bell pepper, sliced",
        "2 carrots, julienned",
        "200g snap peas",
        "3 cloves garlic, minced",
        "1 tbsp ginger, grated",
        "3 tbsp soy sauce",
        "1 tbsp sesame oil",
        "2 tbsp vegetable oil",
        "1 tsp cornstarch",
        "Sesame seeds for garnish"
      ],
      instructions: [
        "Mix soy sauce, sesame oil, cornstarch, and 2 tbsp water in a small bowl. Set aside.",
        "Heat vegetable oil in a wok or large pan over high heat.",
        "Add garlic and ginger, stir-fry for 30 seconds.",
        "Add carrots and broccoli first, stir-fry for 3 minutes.",
        "Add bell peppers and snap peas, stir-fry for another 3 minutes.",
        "Pour in the sauce and toss everything together for 1-2 minutes until vegetables are crisp-tender and coated.",
        "Garnish with sesame seeds and serve immediately over rice or noodles."
      ],
      servings: "4 servings",
      notes: "The key to a great stir-fry is high heat and constant movement. Don't overcook the vegetables - they should retain some crunch!"
    },
    {
      id: 4,
      title: "Blueberry Muffins",
      author: "kurt.peter",
      prepTime: "15min",
      cookTime: "25min",
      difficulty: "Easy",
      image: "https://images.unsplash.com/photo-1426869884541-df7117556757?w=500&h=300&fit=crop",
      description: "Moist, fluffy muffins bursting with fresh blueberries. Perfect for breakfast or a sweet afternoon snack.",
      ingredients: [
        "2 cups all-purpose flour",
        "3/4 cup sugar",
        "2 tsp baking powder",
        "1/2 tsp salt",
        "1/3 cup vegetable oil",
        "1 large egg",
        "1 cup milk",
        "1 tsp vanilla extract",
        "1.5 cups fresh blueberries",
        "2 tbsp sugar for topping"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C). Line a 12-cup muffin tin with paper liners.",
        "In a large bowl, whisk together flour, sugar, baking powder, and salt.",
        "In another bowl, mix oil, egg, milk, and vanilla until well combined.",
        "Pour wet ingredients into dry ingredients and stir until just combined (don't overmix).",
        "Gently fold in blueberries.",
        "Divide batter evenly among muffin cups (about 3/4 full).",
        "Sprinkle tops with remaining sugar.",
        "Bake for 22-25 minutes until golden and a toothpick comes out clean.",
        "Cool in pan for 5 minutes, then transfer to a wire rack."
      ],
      servings: "12 muffins",
      notes: "Toss blueberries in a tablespoon of flour before adding to prevent them from sinking. Frozen blueberries work too - no need to thaw!"
    },
    {
      id: 5,
      title: "Tomahawk Steak",
      author: "thomas.anderson",
      prepTime: "10min",
      cookTime: "30min",
      difficulty: "Medium",
      image: "https://images.unsplash.com/photo-1558030006-450675393462?w=500&h=300&fit=crop",
      description: "An impressive, bone-in ribeye steak with a long rib bone. Perfectly seared and finished to your desired doneness.",
      ingredients: [
        "1 tomahawk steak (about 1.5-2 kg)",
        "3 tbsp olive oil",
        "4 cloves garlic, crushed",
        "4 sprigs fresh rosemary",
        "4 sprigs fresh thyme",
        "Coarse sea salt",
        "Freshly ground black pepper",
        "4 tbsp butter"
      ],
      instructions: [
        "Remove steak from refrigerator 1 hour before cooking to bring to room temperature.",
        "Preheat oven to 400°F (200°C).",
        "Pat steak completely dry with paper towels and season generously with salt and pepper on all sides.",
        "Heat a large cast-iron skillet over high heat until smoking hot.",
        "Add olive oil and sear steak for 3-4 minutes per side until a dark crust forms.",
        "Add butter, garlic, and herbs to the pan. Transfer to oven.",
        "Roast for 15-20 minutes for medium-rare (internal temp 130°F/54°C).",
        "Remove from oven, baste with pan juices, and let rest for 10 minutes before slicing.",
        "Slice against the grain and serve with pan drippings."
      ],
      servings: "2-3 servings",
      notes: "Use a meat thermometer for perfect results. The bone helps with heat distribution and adds incredible flavor. Don't skip the resting time!"
    },
    {
      id: 6,
      title: "Sinigang na Baboy",
      author: "samantha.morgue",
      prepTime: "20min",
      cookTime: "90min",
      difficulty: "Medium",
      image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&h=300&fit=crop",
      description: "A beloved Filipino sour soup with tender pork ribs, fresh vegetables, and a distinctive tamarind-based broth. Comfort food at its finest.",
      ingredients: [
        "1 kg pork ribs or belly, cut into pieces",
        "2 medium tomatoes, quartered",
        "1 large onion, quartered",
        "2 cups taro root (gabi), cubed",
        "1 bunch kangkong (water spinach)",
        "2 pieces long green chili (siling haba)",
        "1 medium radish (labanos), sliced",
        "1 pack sinigang mix or fresh tamarind",
        "8 cups water",
        "Fish sauce (patis) to taste",
        "Salt and pepper to taste"
      ],
      instructions: [
        "In a large pot, bring water to boil and add pork ribs. Skim off any scum that rises.",
        "Add onions and tomatoes. Simmer for 1 hour until pork is tender.",
        "Add taro root and radish, cook for 10 minutes until vegetables are tender.",
        "Stir in sinigang mix (or tamarind juice) to achieve desired sourness.",
        "Add long green chilies and cook for 2 minutes.",
        "Season with fish sauce, salt, and pepper to taste.",
        "Turn off heat and add kangkong. Let it wilt in the residual heat.",
        "Serve hot with steamed white rice."
      ],
      servings: "6-8 servings",
      notes: "This is a traditional Filipino dish that's especially comforting on rainy days. The sourness level can be adjusted to preference. Some regions use other souring agents like guava or green mango. Best enjoyed with family!"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Community Recipes</h1>
            <Link 
              to="/recipes/upload"
              className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-full flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload Recipe
            </Link>
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {recipes.map((recipe) => (
            <div 
              key={recipe.id} 
              className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition cursor-pointer group"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <div className="relative overflow-hidden">
                <img 
                  src={recipe.image} 
                  alt={recipe.title}
                  className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition"></div>
              </div>
              
              <div className="p-4 sm:p-5">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 group-hover:text-yellow-500 transition">
                  {recipe.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3">
                  By <span className="text-gray-700 font-medium">{recipe.author}</span>
                </p>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Prep: {recipe.prepTime}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{recipe.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto" onClick={() => setSelectedRecipe(null)}>
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl my-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header with Image */}
            <div className="relative h-48 sm:h-64">
              <img 
                src={selectedRecipe.image} 
                alt={selectedRecipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 hover:bg-white rounded-full p-2 transition"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </button>
              <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-6 right-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">{selectedRecipe.title}</h2>
                <p className="text-sm sm:text-base text-white/90">By {selectedRecipe.author}</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 md:p-8">
              {/* Description */}
              <div className="mb-4 sm:mb-6">
                <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed">{selectedRecipe.description}</p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 p-3 sm:p-4 bg-yellow-50 rounded-xl">
                <div className="text-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-yellow-600" />
                  <p className="text-xs text-gray-600 mb-1">Prep Time</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.prepTime}</p>
                </div>
                <div className="text-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-yellow-600" />
                  <p className="text-xs text-gray-600 mb-1">Cook Time</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.cookTime}</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-yellow-600" />
                  <p className="text-xs text-gray-600 mb-1">Difficulty</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.difficulty}</p>
                </div>
                <div className="text-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-yellow-600" />
                  <p className="text-xs text-gray-600 mb-1">Servings</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.servings}</p>
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                  Ingredients
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span className="text-sm sm:text-base text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Step-by-Step Instructions</h3>
                <div className="space-y-3 sm:space-y-4">
                  {selectedRecipe.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base">
                        {index + 1}
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 pt-0.5 sm:pt-1">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedRecipe.notes && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 sm:p-6 rounded-r-xl">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">💡 Chef's Notes</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{selectedRecipe.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
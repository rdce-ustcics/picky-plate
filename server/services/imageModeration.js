// server/services/imageModeration.js
// Google Cloud Vision API integration for image moderation (using REST API with API Key)

// Get API key at runtime (not at module load time)
function getApiKey() {
  return process.env.GOOGLE_CLOUD_VISION_API_KEY;
}

// SafeSearch likelihood levels (ordered from safe to unsafe)
const LIKELIHOOD_ORDER = [
  'UNKNOWN',
  'VERY_UNLIKELY',
  'UNLIKELY',
  'POSSIBLE',
  'LIKELY',
  'VERY_LIKELY'
];

// Threshold index - anything at or above this is flagged
// POSSIBLE = 3, LIKELY = 4, VERY_LIKELY = 5
const UNSAFE_THRESHOLD = 4; // LIKELY or VERY_LIKELY

// STRICT food-related labels - actual food items only, not utensils/kitchen items
const FOOD_RELATED_LABELS = [
  // General food terms
  'food', 'dish', 'meal', 'cuisine', 'recipe',
  // Proteins
  'meat', 'seafood', 'chicken', 'beef', 'pork', 'fish', 'shrimp', 'crab', 'lobster',
  'lamb', 'turkey', 'duck', 'bacon', 'sausage', 'ham', 'steak',
  // Vegetables & Fruits
  'vegetable', 'fruit', 'salad', 'tomato', 'potato', 'carrot', 'onion', 'garlic',
  'lettuce', 'broccoli', 'spinach', 'corn', 'pepper', 'mushroom', 'avocado',
  'apple', 'banana', 'orange', 'strawberry', 'grape', 'mango', 'pineapple',
  // Grains & Carbs
  'rice', 'noodles', 'pasta', 'bread', 'pizza', 'burger', 'sandwich', 'taco',
  'spaghetti', 'ramen', 'pho', 'dumpling', 'spring roll', 'wrap',
  // Prepared dishes
  'soup', 'stew', 'curry', 'casserole', 'roast', 'stir fry',
  // Dairy & Eggs
  'egg', 'cheese', 'omelette', 'scrambled egg',
  // Desserts & Baked goods
  'dessert', 'cake', 'cookie', 'pastry', 'pie', 'donut', 'ice cream', 'pudding',
  'brownie', 'muffin', 'cupcake', 'chocolate', 'candy',
  // Meals
  'breakfast', 'lunch', 'dinner', 'snack', 'appetizer',
  // Sauces & Condiments
  'sauce', 'gravy', 'dressing',
  // Beverages (food-related)
  'smoothie', 'milkshake',
  // Specific dishes
  'sushi', 'sashimi', 'tempura', 'fried rice', 'fried chicken',
  'bbq', 'barbecue', 'grilled', 'baked'
];

// Labels that should NOT count as food (even if detected)
const NON_FOOD_LABELS = [
  'fork', 'spoon', 'knife', 'utensil', 'cutlery', 'tableware',
  'plate', 'bowl', 'cup', 'glass', 'mug', 'bottle',
  'kitchen', 'restaurant', 'chef', 'cooking', 'culinary',
  'table', 'dining', 'menu', 'recipe book',
  'cartoon', 'illustration', 'drawing', 'clipart', 'icon', 'logo',
  'graphic', 'design', 'art', 'artwork', 'vector'
];

// Minimum confidence score for label detection (0-1)
const LABEL_CONFIDENCE_THRESHOLD = 0.6;

// Minimum number of food-related labels required (stricter)
const MIN_FOOD_LABELS = 2;

/**
 * Check if a likelihood level is considered unsafe
 */
function isUnsafe(likelihood) {
  const index = LIKELIHOOD_ORDER.indexOf(likelihood);
  return index >= UNSAFE_THRESHOLD;
}

/**
 * Call Google Cloud Vision API
 */
async function callVisionAPI(imageBase64, features) {
  const apiKey = getApiKey();
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  console.log('[Vision API] Making request with features:', features.map(f => f.type).join(', '));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        image: {
          content: imageBase64
        },
        features: features
      }]
    })
  });

  const data = await response.json();

  // Log the full response for debugging
  console.log('[Vision API] Response status:', response.status);

  if (!response.ok) {
    console.error('[Vision API] Error response:', JSON.stringify(data, null, 2));
    throw new Error(`Vision API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
  }

  if (data.responses && data.responses[0] && data.responses[0].error) {
    console.error('[Vision API] Response error:', data.responses[0].error);
    throw new Error(data.responses[0].error.message);
  }

  return data.responses[0];
}

/**
 * Analyze an image for inappropriate content and food relevance
 * @param {string} imageSource - Base64 image data or URL
 * @returns {Object} Analysis result
 */
async function analyzeImage(imageSource) {
  const apiKey = getApiKey();

  // Check if API key is available
  if (!apiKey) {
    console.warn('[Vision API] No API key configured - skipping moderation');
    return {
      success: true,
      approved: true,
      message: 'Image moderation not configured - image accepted',
      skipped: true
    };
  }

  console.log('[Vision API] API key found, analyzing image...');

  try {
    // Extract base64 content (remove data:image/xxx;base64, prefix if present)
    let base64Data = imageSource;
    if (imageSource.startsWith('data:image')) {
      base64Data = imageSource.split(',')[1];
    }

    // Call Vision API with both SafeSearch and Label detection
    const result = await callVisionAPI(base64Data, [
      { type: 'SAFE_SEARCH_DETECTION' },
      { type: 'LABEL_DETECTION', maxResults: 20 }
    ]);

    // Process SafeSearch results
    const safeSearch = result.safeSearchAnnotation || {};
    const safeSearchResults = {
      adult: safeSearch.adult || 'UNKNOWN',
      violence: safeSearch.violence || 'UNKNOWN',
      racy: safeSearch.racy || 'UNKNOWN',
      spoof: safeSearch.spoof || 'UNKNOWN',
      medical: safeSearch.medical || 'UNKNOWN'
    };

    console.log('[Vision API] SafeSearch results:', safeSearchResults);

    // Check for inappropriate content
    const inappropriateFlags = [];
    if (isUnsafe(safeSearchResults.adult)) {
      inappropriateFlags.push('adult content');
    }
    if (isUnsafe(safeSearchResults.violence)) {
      inappropriateFlags.push('violent content');
    }
    if (isUnsafe(safeSearchResults.racy)) {
      inappropriateFlags.push('racy content');
    }

    // Process Label Detection results
    const labels = result.labelAnnotations || [];
    const detectedLabels = labels.map(label => ({
      description: label.description.toLowerCase(),
      score: label.score
    }));

    console.log('[Vision API] Detected labels:', detectedLabels.slice(0, 10).map(l => `${l.description} (${(l.score * 100).toFixed(1)}%)`));

    // Check if image contains non-food items (utensils, cartoons, etc.)
    const hasNonFoodItems = detectedLabels.some(label =>
      NON_FOOD_LABELS.some(nonFoodTerm =>
        label.description.includes(nonFoodTerm) ||
        nonFoodTerm.includes(label.description)
      ) && label.score >= 0.5
    );

    // Check for food-related content
    const foodLabels = detectedLabels.filter(label =>
      FOOD_RELATED_LABELS.some(foodTerm =>
        label.description.includes(foodTerm) ||
        foodTerm.includes(label.description)
      ) && label.score >= LABEL_CONFIDENCE_THRESHOLD
    );

    // Must have enough food labels AND not be primarily non-food (like utensils/cartoons)
    const isFoodRelated = foodLabels.length >= MIN_FOOD_LABELS && !hasNonFoodItems;

    console.log('[Vision API] Has non-food items:', hasNonFoodItems);

    console.log('[Vision API] Food labels found:', foodLabels.map(l => l.description));
    console.log('[Vision API] Is food related:', isFoodRelated);

    // Build response
    const isApproved = inappropriateFlags.length === 0 && isFoodRelated;

    console.log('[Vision API] Final decision - Approved:', isApproved);

    return {
      success: true,
      approved: isApproved,
      safeSearch: safeSearchResults,
      inappropriateFlags,
      isInappropriate: inappropriateFlags.length > 0,
      isFoodRelated,
      hasNonFoodItems,
      foodLabels: foodLabels.map(l => l.description),
      allLabels: detectedLabels.slice(0, 10).map(l => l.description),
      message: generateMessage(inappropriateFlags, isFoodRelated, hasNonFoodItems)
    };

  } catch (error) {
    console.error('[Vision API] Error analyzing image:', error.message);
    // Return NOT approved when there's an error - don't silently allow
    return {
      success: false,
      approved: false,
      error: error.message,
      message: `Image analysis failed: ${error.message}`
    };
  }
}

/**
 * Generate user-friendly message based on analysis
 */
function generateMessage(inappropriateFlags, isFoodRelated, hasNonFoodItems) {
  if (inappropriateFlags.length > 0) {
    return `Image rejected: Contains ${inappropriateFlags.join(', ')}. Please upload an appropriate food image.`;
  }
  if (hasNonFoodItems) {
    return 'Image rejected: This appears to be a cartoon, illustration, or shows utensils/kitchenware instead of actual food. Please upload a real photo of your dish.';
  }
  if (!isFoodRelated) {
    return 'Image rejected: This doesn\'t appear to be a food-related image. Please upload a photo of your dish.';
  }
  return 'Image approved!';
}

/**
 * Quick check - only SafeSearch (faster, cheaper)
 */
async function quickSafetyCheck(imageSource) {
  const apiKey = getApiKey();

  // Check if API key is available
  if (!apiKey) {
    return {
      success: true,
      safe: true,
      message: 'Safety check not configured - skipped',
      skipped: true
    };
  }

  try {
    // Extract base64 content
    let base64Data = imageSource;
    if (imageSource.startsWith('data:image')) {
      base64Data = imageSource.split(',')[1];
    }

    const result = await callVisionAPI(base64Data, [
      { type: 'SAFE_SEARCH_DETECTION' }
    ]);

    const safeSearch = result.safeSearchAnnotation || {};

    const isUnsafeContent =
      isUnsafe(safeSearch.adult) ||
      isUnsafe(safeSearch.violence) ||
      isUnsafe(safeSearch.racy);

    return {
      success: true,
      safe: !isUnsafeContent,
      safeSearch: {
        adult: safeSearch.adult,
        violence: safeSearch.violence,
        racy: safeSearch.racy
      }
    };
  } catch (error) {
    console.error('[Vision API] Quick safety check error:', error.message);
    return {
      success: false,
      safe: false,
      error: error.message
    };
  }
}

module.exports = {
  analyzeImage,
  quickSafetyCheck,
  LIKELIHOOD_ORDER,
  FOOD_RELATED_LABELS
};

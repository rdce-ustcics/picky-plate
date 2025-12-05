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

// Labels that indicate NON-FOOD primary content (cartoons, graphics, etc.)
// NOTE: We ALLOW plates, bowls, utensils etc. since food is often served on them!
const REJECTION_LABELS = [
  // Only reject actual non-food content (cartoons, illustrations, etc.)
  'cartoon', 'illustration', 'drawing', 'clipart', 'icon', 'logo',
  'graphic', 'design', 'art', 'artwork', 'vector', 'animation',
  'sketch', 'painting', 'digital art', 'comic'
];

// These are ACCEPTABLE - food is typically served on/with these
const ACCEPTABLE_SERVING_ITEMS = [
  'plate', 'bowl', 'cup', 'glass', 'mug', 'bottle', 'dish', 'platter',
  'fork', 'spoon', 'knife', 'utensil', 'cutlery', 'tableware', 'chopsticks',
  'kitchen', 'restaurant', 'table', 'dining', 'napkin', 'tablecloth'
];

// Minimum confidence score for label detection (0-1)
const LABEL_CONFIDENCE_THRESHOLD = 0.5; // Lowered from 0.6 to be more lenient

// Minimum number of food-related labels required
const MIN_FOOD_LABELS = 1; // Lowered from 2 - even 1 good food label is enough

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

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
  }

  if (data.responses && data.responses[0] && data.responses[0].error) {
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
    return {
      success: true,
      approved: true,
      message: 'Image moderation not configured - image accepted',
      skipped: true
    };
  }

  try {
    // Validate input
    if (!imageSource || typeof imageSource !== 'string') {
      return {
        success: false,
        approved: false,
        message: 'Invalid image data provided.'
      };
    }

    // Extract base64 content (remove data:image/xxx;base64, prefix if present)
    let base64Data = imageSource;
    if (imageSource.startsWith('data:image')) {
      const parts = imageSource.split(',');
      if (parts.length !== 2) {
        return {
          success: false,
          approved: false,
          message: 'Invalid image format. Please try a different image.'
        };
      }
      base64Data = parts[1];
    }

    // Validate base64 data
    if (!base64Data || base64Data.length < 100) {
      return {
        success: false,
        approved: false,
        message: 'Image data is too small or empty.'
      };
    }

    // Check if base64 is valid (only contains valid base64 characters)
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(base64Data)) {
      return {
        success: false,
        approved: false,
        message: 'Invalid image encoding. Please try a different image.'
      };
    }

    // Check size limit (Cloud Vision API limit is ~10MB, we'll be more conservative)
    const imageSizeBytes = (base64Data.length * 3) / 4; // Approximate decoded size
    const maxSizeBytes = 4 * 1024 * 1024; // 4MB limit
    if (imageSizeBytes > maxSizeBytes) {
      return {
        success: false,
        approved: false,
        message: 'Image is too large. Please use a smaller image (under 4MB).'
      };
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

    // Check if image is primarily non-food content (cartoons, illustrations, etc.)
    // NOTE: We DO NOT reject plates, bowls, utensils - those are fine with food!
    const isCartoonOrIllustration = detectedLabels.some(label =>
      REJECTION_LABELS.some(rejectionTerm =>
        label.description.includes(rejectionTerm) ||
        rejectionTerm.includes(label.description)
      ) && label.score >= 0.6 // Higher threshold for rejection
    );

    // Check if serving items are present (plates, utensils, etc.) - this is GOOD, not bad
    const hasServingItems = detectedLabels.some(label =>
      ACCEPTABLE_SERVING_ITEMS.some(servingTerm =>
        label.description.includes(servingTerm) ||
        servingTerm.includes(label.description)
      ) && label.score >= 0.5
    );

    // Legacy variable name for compatibility
    const hasNonFoodItems = isCartoonOrIllustration;

    // Check for food-related content
    const foodLabels = detectedLabels.filter(label =>
      FOOD_RELATED_LABELS.some(foodTerm =>
        label.description.includes(foodTerm) ||
        foodTerm.includes(label.description)
      ) && label.score >= LABEL_CONFIDENCE_THRESHOLD
    );

    // Image is food-related if:
    // 1. Has enough food labels, OR
    // 2. Has serving items (plate/bowl/utensils) with at least some food indication
    // AND not a cartoon/illustration
    const hasSufficientFoodLabels = foodLabels.length >= MIN_FOOD_LABELS;
    const hasServingWithFood = hasServingItems && foodLabels.length >= 1;
    const isFoodRelated = (hasSufficientFoodLabels || hasServingWithFood) && !isCartoonOrIllustration;

    // Build response
    const isApproved = inappropriateFlags.length === 0 && isFoodRelated;

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
    // hasNonFoodItems now only refers to cartoons/illustrations
    return 'Image rejected: This appears to be a cartoon or illustration. Please upload a real photo of your dish.';
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

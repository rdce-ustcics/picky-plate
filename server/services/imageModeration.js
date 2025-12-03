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

// Food-related labels to check for
const FOOD_RELATED_LABELS = [
  'food', 'dish', 'meal', 'cuisine', 'recipe', 'cooking',
  'ingredient', 'vegetable', 'fruit', 'meat', 'seafood',
  'dessert', 'breakfast', 'lunch', 'dinner', 'snack',
  'baked goods', 'pastry', 'bread', 'soup', 'salad',
  'rice', 'noodles', 'pasta', 'pizza', 'burger',
  'sandwich', 'beverage', 'drink', 'plate', 'bowl',
  'kitchen', 'restaurant', 'chef', 'culinary',
  'cake', 'cookie', 'chicken', 'beef', 'pork', 'fish',
  'egg', 'cheese', 'sauce', 'curry', 'stew', 'grill',
  'fry', 'bake', 'roast', 'steam', 'boil'
];

// Minimum confidence score for label detection (0-1)
const LABEL_CONFIDENCE_THRESHOLD = 0.5;

// Minimum number of food-related labels required
const MIN_FOOD_LABELS = 1;

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

    // Check for food-related content
    const foodLabels = detectedLabels.filter(label =>
      FOOD_RELATED_LABELS.some(foodTerm =>
        label.description.includes(foodTerm) ||
        foodTerm.includes(label.description)
      ) && label.score >= LABEL_CONFIDENCE_THRESHOLD
    );

    const isFoodRelated = foodLabels.length >= MIN_FOOD_LABELS;

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
      foodLabels: foodLabels.map(l => l.description),
      allLabels: detectedLabels.slice(0, 10).map(l => l.description),
      message: generateMessage(inappropriateFlags, isFoodRelated)
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
function generateMessage(inappropriateFlags, isFoodRelated) {
  if (inappropriateFlags.length > 0) {
    return `Image rejected: Contains ${inappropriateFlags.join(', ')}. Please upload an appropriate food image.`;
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

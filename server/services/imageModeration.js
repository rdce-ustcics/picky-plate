// server/services/imageModeration.js
// Google Cloud Vision API integration for image moderation

let vision = null;
let client = null;

// Try to load Cloud Vision - gracefully handle if not installed
try {
  vision = require('@google-cloud/vision');
  client = new vision.ImageAnnotatorClient();
  console.log('Cloud Vision API initialized successfully');
} catch (err) {
  console.warn('Cloud Vision API not available:', err.message);
  console.warn('Image moderation will be skipped. Install with: npm install @google-cloud/vision');
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
  'kitchen', 'restaurant', 'chef', 'culinary'
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
 * Analyze an image for inappropriate content and food relevance
 * @param {string} imageSource - Base64 image data or URL
 * @returns {Object} Analysis result
 */
async function analyzeImage(imageSource) {
  // Check if Cloud Vision is available
  if (!client) {
    return {
      success: true,
      approved: true,
      message: 'Image moderation not configured - image accepted',
      skipped: true
    };
  }

  try {
    let imageRequest;

    // Determine if it's base64 or URL
    if (imageSource.startsWith('data:image')) {
      // Extract base64 content (remove data:image/xxx;base64, prefix)
      const base64Data = imageSource.split(',')[1];
      imageRequest = { image: { content: base64Data } };
    } else if (imageSource.startsWith('http')) {
      imageRequest = { image: { source: { imageUri: imageSource } } };
    } else {
      // Assume it's raw base64
      imageRequest = { image: { content: imageSource } };
    }

    // Perform both SafeSearch and Label detection in one request
    const [result] = await client.annotateImage({
      ...imageRequest,
      features: [
        { type: 'SAFE_SEARCH_DETECTION' },
        { type: 'LABEL_DETECTION', maxResults: 20 }
      ]
    });

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

    // Check for food-related content
    const foodLabels = detectedLabels.filter(label =>
      FOOD_RELATED_LABELS.some(foodTerm =>
        label.description.includes(foodTerm) ||
        foodTerm.includes(label.description)
      ) && label.score >= LABEL_CONFIDENCE_THRESHOLD
    );

    const isFoodRelated = foodLabels.length >= MIN_FOOD_LABELS;

    // Build response
    const isApproved = inappropriateFlags.length === 0 && isFoodRelated;

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
    console.error('Image moderation error:', error);
    return {
      success: false,
      approved: false,
      error: error.message,
      message: 'Failed to analyze image. Please try again.'
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
  // Check if Cloud Vision is available
  if (!client) {
    return {
      success: true,
      safe: true,
      message: 'Safety check not configured - skipped',
      skipped: true
    };
  }

  try {
    let imageRequest;

    if (imageSource.startsWith('data:image')) {
      const base64Data = imageSource.split(',')[1];
      imageRequest = { image: { content: base64Data } };
    } else if (imageSource.startsWith('http')) {
      imageRequest = { image: { source: { imageUri: imageSource } } };
    } else {
      imageRequest = { image: { content: imageSource } };
    }

    const [result] = await client.safeSearchDetection(imageRequest);
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
    console.error('Quick safety check error:', error);
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

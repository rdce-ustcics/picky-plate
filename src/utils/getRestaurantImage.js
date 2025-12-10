/**
 * Restaurant Image Utility
 *
 * Returns appropriate placeholder images from Unsplash based on
 * restaurant cuisine, type, or brand. Free to use, no API key needed.
 */

const UNSPLASH_IMAGES = {
  // By cuisine
  'filipino': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  'chinese': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop',
  'japanese': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop',
  'korean': 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop',
  'italian': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'american': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
  'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'seafood': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=300&fit=crop',
  'chicken': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
  'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
  'coffee_shop': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
  'thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop',
  'indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
  'mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop',
  'bubble_tea': 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=300&fit=crop',
  'donut': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop',
  'bakery': 'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=400&h=300&fit=crop',
  'ice_cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop',
  'asian': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
  'fast_food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop',

  // By type
  'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  'cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
  'bar': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop',
  'food_court': 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=300&fit=crop',
  'food_stand': 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400&h=300&fit=crop',

  // Default fallback
  'default': 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop'
};

// Brand keywords to cuisine mapping
const BRAND_CUISINE_MAP = {
  'jollibee': 'filipino',
  'mang inasal': 'filipino',
  'chowking': 'chinese',
  'max': 'filipino',
  'goldilocks': 'bakery',
  'red ribbon': 'bakery',
  'starbucks': 'cafe',
  'coffee bean': 'cafe',
  'tim hortons': 'cafe',
  'dunkin': 'donut',
  'krispy kreme': 'donut',
  'mcdonalds': 'fast_food',
  'mcdonald': 'fast_food',
  'burger king': 'burger',
  'wendy': 'burger',
  'kfc': 'chicken',
  'popeyes': 'chicken',
  'pizza hut': 'pizza',
  'domino': 'pizza',
  'shakey': 'pizza',
  'yellow cab': 'pizza',
  'tokyo tokyo': 'japanese',
  'ramen': 'japanese',
  'sushi': 'japanese',
  'samgyup': 'korean',
  'bonchon': 'korean',
  'gong cha': 'bubble_tea',
  'tiger sugar': 'bubble_tea',
  'coco': 'bubble_tea',
  'milk tea': 'bubble_tea'
};

/**
 * Get an appropriate image URL for a restaurant
 * @param {Object} restaurant - Restaurant object with cuisine, type, brand, name fields
 * @returns {string} Unsplash image URL
 */
export function getRestaurantImage(restaurant) {
  if (!restaurant) return UNSPLASH_IMAGES['default'];

  // First try cuisine field
  const cuisine = restaurant.cuisine?.toLowerCase();
  if (cuisine && UNSPLASH_IMAGES[cuisine]) {
    return UNSPLASH_IMAGES[cuisine];
  }

  // Then try type field
  const type = restaurant.type?.toLowerCase();
  if (type && UNSPLASH_IMAGES[type]) {
    return UNSPLASH_IMAGES[type];
  }

  // Check brand/name for known chains
  const searchText = `${restaurant.brand || ''} ${restaurant.name || ''}`.toLowerCase();

  for (const [keyword, cuisineType] of Object.entries(BRAND_CUISINE_MAP)) {
    if (searchText.includes(keyword)) {
      return UNSPLASH_IMAGES[cuisineType] || UNSPLASH_IMAGES['default'];
    }
  }

  // Default fallback
  return UNSPLASH_IMAGES['default'];
}

/**
 * Get image URL with custom dimensions
 * @param {Object} restaurant - Restaurant object
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Unsplash image URL with custom dimensions
 */
export function getRestaurantImageSized(restaurant, width = 400, height = 300) {
  const baseUrl = getRestaurantImage(restaurant);
  // Replace dimensions in URL
  return baseUrl.replace(/w=\d+/, `w=${width}`).replace(/h=\d+/, `h=${height}`);
}

/**
 * Get a category-specific image (for cuisine filter buttons, etc.)
 * @param {string} category - Cuisine or type name
 * @returns {string} Unsplash image URL
 */
export function getCategoryImage(category) {
  if (!category) return UNSPLASH_IMAGES['default'];
  const key = category.toLowerCase().replace(/\s+/g, '_');
  return UNSPLASH_IMAGES[key] || UNSPLASH_IMAGES['default'];
}

export default getRestaurantImage;

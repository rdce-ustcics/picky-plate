/**
 * Simple localStorage cache with TTL (Time-To-Live)
 * Data persists across page refreshes but expires after TTL
 */

const CACHE_PREFIX = 'pap:cache:';

/**
 * Get cached data if it exists and hasn't expired
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if expired/missing
 */
export function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Store data in cache with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlMinutes - Time to live in minutes (default: 10)
 */
export function setCache(key, data, ttlMinutes = 10) {
  try {
    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, expiry })
    );
  } catch {
    // localStorage full or unavailable - silently fail
  }
}

/**
 * Remove specific cache entry
 * @param {string} key - Cache key to remove
 */
export function clearCache(key) {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // ignore
  }
}

/**
 * Clear all app caches (useful on logout)
 */
export function clearAllCaches() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  } catch {
    // ignore
  }
}

/**
 * Session-only cache (clears on tab close)
 * Uses sessionStorage instead of localStorage
 */
export function getSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSessionCache(key, data) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Helper hook pattern for React components
 * Returns [cachedData, setCachedData, clearCachedData]
 */
export const CACHE_KEYS = {
  CULTURAL_RECIPES: 'cultural-recipes',
  CULTURAL_RECIPES_REGION: (region) => `cultural-recipes:${region}`,
  SURPRISE_RECIPES: 'surprise-recipes',
  USER_PREFERENCES: 'user-preferences',
  KIDS_PREFERENCES: 'kids-preferences',
  MEAL_PLANS: (start, end) => `meal-plans:${start}:${end}`,
};

// Default TTLs (in minutes)
export const CACHE_TTL = {
  CULTURAL_RECIPES: 30,    // Cultural recipes change rarely
  SURPRISE_RECIPES: 5,     // Surprise should feel fresh
  USER_PREFERENCES: 60,    // User prefs are stable
  KIDS_PREFERENCES: 60,    // Kids prefs are stable
  MEAL_PLANS: 15,          // Meal plans moderate refresh
};

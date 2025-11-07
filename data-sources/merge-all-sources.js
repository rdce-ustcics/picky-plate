// merge-all-sources.js
// Merges restaurant data from multiple sources (Zomato + OSM)
// Removes duplicates and creates comprehensive dataset

const fs = require('fs');
const path = require('path');

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Check if two restaurants are likely the same
function areSameRestaurant(r1, r2) {
  // If same source and ID, definitely same
  if (r1.id === r2.id) return true;

  // Calculate distance between them
  const distance = calculateDistance(r1.lat, r1.lng, r2.lat, r2.lng);

  // If more than 100m apart, different restaurants
  if (distance > 0.1) return false;

  // Check name similarity
  const name1 = String(r1.name || '').toLowerCase().trim();
  const name2 = String(r2.name || '').toLowerCase().trim();

  // Exact match
  if (name1 === name2) return true;

  // One name contains the other (e.g., "Jollibee" vs "Jollibee Makati")
  if (name1.includes(name2) || name2.includes(name1)) {
    return distance < 0.05; // Within 50m and similar name
  }

  return false;
}

// Merge data from two restaurant objects (prefer data with more info)
function mergeRestaurantData(existing, newData) {
  return {
    // Keep original ID
    id: existing.id,

    // Prefer non-empty values
    name: existing.name || newData.name,
    lat: existing.lat || newData.lat,
    lng: existing.lng || newData.lng,
    address: existing.address || newData.address,

    // Prefer Zomato ratings over OSM (OSM doesn't have ratings)
    rating: existing.rating || newData.rating || null,
    userRatingCount: existing.userRatingCount || newData.userRatingCount || 0,

    // Prefer Zomato price level
    priceLevel: existing.priceLevel || newData.priceLevel,
    priceLevelNum: existing.priceLevelNum || newData.priceLevelNum,

    // Combine cuisines
    cuisine: existing.cuisine && newData.cuisine
      ? `${existing.cuisine}, ${newData.cuisine}`
      : existing.cuisine || newData.cuisine || '',

    locality: existing.locality || newData.locality,
    city: existing.city || newData.city,

    // Combine boolean features (true if either says true)
    hasOnlineDelivery: existing.hasOnlineDelivery || newData.hasOnlineDelivery || false,
    hasTableBooking: existing.hasTableBooking || newData.hasTableBooking || false,
    isDeliveringNow: existing.isDeliveringNow || newData.isDeliveringNow || false,

    averageCostForTwo: existing.averageCostForTwo || newData.averageCostForTwo || 0,
    currency: existing.currency || newData.currency || 'PHP',

    googleMapsUri: existing.googleMapsUri || newData.googleMapsUri,

    // Combine types
    types: [...new Set([...(existing.types || []), ...(newData.types || [])])],

    // Include both source URLs if available
    zomatoUrl: existing.zomatoUrl || newData.zomatoUrl,
    osmUrl: newData.osmUrl || existing.osmUrl,

    // Include OSM-specific fields
    phone: newData.phone || existing.phone || '',
    website: newData.website || existing.website || '',
    openingHours: newData.openingHours || existing.openingHours || '',
    wheelchair: newData.wheelchair || existing.wheelchair || false,
    outdoor_seating: newData.outdoor_seating || existing.outdoor_seating || false,
    takeaway: newData.takeaway || existing.takeaway || false,

    // Track sources
    sources: [
      ...(existing.source ? [existing.source] : []),
      ...(newData.source ? [newData.source] : [])
    ]
  };
}

// Remove duplicates from restaurant array
function deduplicateRestaurants(restaurants) {
  const unique = [];
  const processed = new Set();

  console.log('Removing duplicates...');

  for (let i = 0; i < restaurants.length; i++) {
    if (processed.has(i)) continue;

    const current = restaurants[i];
    let merged = { ...current };

    // Check against all other restaurants
    for (let j = i + 1; j < restaurants.length; j++) {
      if (processed.has(j)) continue;

      if (areSameRestaurant(current, restaurants[j])) {
        // Merge data
        merged = mergeRestaurantData(merged, restaurants[j]);
        processed.add(j);
      }
    }

    unique.push(merged);
    processed.add(i);

    if ((i + 1) % 1000 === 0) {
      console.log(`  Processed ${i + 1}/${restaurants.length}...`);
    }
  }

  const duplicatesRemoved = restaurants.length - unique.length;
  console.log(`Removed ${duplicatesRemoved} duplicates (${unique.length} unique restaurants)\n`);

  return unique;
}

// Main merge function
function mergeAllSources() {
  console.log('Starting data merge process...\n');

  // Load Zomato data
  console.log('Loading Zomato data...');
  const zomatoPath = path.resolve('./public/data/ncr_food_places2.json');
  const zomatoData = JSON.parse(fs.readFileSync(zomatoPath, 'utf8'));
  const zomatoRestaurants = zomatoData.items.map(r => ({
    ...r,
    source: 'Zomato'
  }));
  console.log(`  Loaded ${zomatoRestaurants.length} restaurants from Zomato\n`);

  // Load OSM data
  console.log('Loading OpenStreetMap data...');
  const osmPath = path.resolve('./data/osm_restaurants.json');

  if (!fs.existsSync(osmPath)) {
    console.log('  ⚠ OSM data not found. Run fetch-osm-restaurants.js first.');
    console.log('  Using only Zomato data for now.\n');

    // Just save Zomato data as-is
    const output = {
      items: zomatoRestaurants,
      metadata: {
        sources: ['Zomato'],
        totalCount: zomatoRestaurants.length,
        generatedAt: new Date().toISOString(),
        coverage: 'Metro Manila, Philippines'
      }
    };

    const outPath = path.resolve('./public/data/ncr_food_places2.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✓ Saved ${zomatoRestaurants.length} restaurants to ${outPath}`);
    return;
  }

  const osmData = JSON.parse(fs.readFileSync(osmPath, 'utf8'));
  const osmRestaurants = osmData.items;
  console.log(`  Loaded ${osmRestaurants.length} restaurants from OSM\n`);

  // Combine all restaurants
  console.log('Combining data from all sources...');
  const allRestaurants = [...zomatoRestaurants, ...osmRestaurants];
  console.log(`  Total before deduplication: ${allRestaurants.length}\n`);

  // Remove duplicates
  const uniqueRestaurants = deduplicateRestaurants(allRestaurants);

  // Generate statistics
  const stats = {
    total: uniqueRestaurants.length,
    bySources: {},
    withRatings: uniqueRestaurants.filter(r => r.rating && r.rating > 0).length,
    withPhone: uniqueRestaurants.filter(r => r.phone).length,
    withWebsite: uniqueRestaurants.filter(r => r.website).length,
    withHours: uniqueRestaurants.filter(r => r.openingHours).length,
    byCity: {}
  };

  uniqueRestaurants.forEach(r => {
    const sources = Array.isArray(r.sources) ? r.sources : [r.source];
    sources.forEach(source => {
      stats.bySources[source] = (stats.bySources[source] || 0) + 1;
    });

    const city = r.city || 'Unknown';
    stats.byCity[city] = (stats.byCity[city] || 0) + 1;
  });

  console.log('--- Final Dataset Statistics ---');
  console.log(`Total unique restaurants: ${stats.total}`);
  console.log(`With ratings: ${stats.withRatings}`);
  console.log(`With phone numbers: ${stats.withPhone}`);
  console.log(`With websites: ${stats.withWebsite}`);
  console.log(`With opening hours: ${stats.withHours}\n`);

  console.log('By Source:');
  Object.entries(stats.bySources).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });

  console.log('\nTop Cities:');
  Object.entries(stats.byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([city, count]) => {
      console.log(`  ${city}: ${count}`);
    });

  // Save merged data
  const output = {
    items: uniqueRestaurants,
    metadata: {
      sources: ['Zomato', 'OpenStreetMap'],
      totalCount: uniqueRestaurants.length,
      generatedAt: new Date().toISOString(),
      coverage: 'Metro Manila, Philippines',
      duplicatesRemoved: allRestaurants.length - uniqueRestaurants.length
    }
  };

  const outPath = path.resolve('./public/data/ncr_food_places2.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\n✓ Merged data saved to ${outPath}`);
  console.log('\n🎉 All done! Your restaurant locator now has more comprehensive data!');
}

if (require.main === module) {
  mergeAllSources();
}

module.exports = { mergeAllSources, deduplicateRestaurants };

// fix-data-processor.js
// Fixed version that properly merges Zomato data for the React component

const fs = require('fs');
const path = require('path');

function readJSONSafe(label, filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`${label}: file not found at ${abs}`);
  }
  const raw = fs.readFileSync(abs, 'utf8').trim();
  if (!raw) throw new Error(`${label}: file is empty at ${abs}`);
  try {
    return JSON.parse(raw);
  } catch (e) {
    // console.error(`${label}: JSON parse failed. First 200 chars:\n`, raw.slice(0, 200));
    throw e;
  }
}

function mergeZomatoData() {
  // console.log('Starting Zomato data processing (FIXED VERSION)...\n');

  // Read the data files from data/ subfolder
  const locationData = readJSONSafe('location', './data/location.json');
  const ratingsData  = readJSONSafe('ratings',  './data/ratings.json');
  const zomatoData   = readJSONSafe('zomato',   './data/zomato.json');

  // console.log(`Location records: ${locationData.length}`);
  // console.log(`Ratings records:  ${ratingsData.length}`);
  // console.log(`Zomato records:   ${zomatoData.length}\n`);

  // Create lookup maps by ID
  const locById = new Map(locationData.map(d => [Number(d.id), d]));
  const ratById = new Map(ratingsData.map(d => [Number(d.id), d]));

  const merged = [];
  let skipped = 0;
  let missingLocation = 0;
  
  for (const r of zomatoData) {
    const id = Number(r.id);
    const loc = locById.get(id);
    const rat = ratById.get(id) || {};
    
    // Skip if no location data
    if (!loc) {
      missingLocation++;
      continue;
    }
    
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    
    // Skip if invalid coordinates
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      skipped++;
      continue;
    }

    // Convert price_range to priceLevel format expected by React component
    const priceLevelMap = {
      1: 'PRICE_LEVEL_INEXPENSIVE',
      2: 'PRICE_LEVEL_MODERATE', 
      3: 'PRICE_LEVEL_EXPENSIVE',
      4: 'PRICE_LEVEL_VERY_EXPENSIVE'
    };

    merged.push({
      id,
      name: r.name || '',
      
      // Direct lat/lng properties (React component expects these at root level)
      lat: lat,
      lng: lng,
      
      // Address at root level
      address: loc.address || '',
      
      // Rating at root level (React expects this)
      rating: rat.aggregate_rating != null ? Number(rat.aggregate_rating) : null,
      userRatingCount: rat.votes != null ? Number(rat.votes) : 0,
      
      // Price level in expected format
      priceLevel: priceLevelMap[r.price_range] || null,
      priceLevelNum: r.price_range || null,
      
      // Additional details
      cuisine: r.cuisines || '',
      locality: loc.locality || '',
      city: loc.city || 'Metro Manila',
      
      // Features
      hasOnlineDelivery: Number(r.has_online_delivery) === 1,
      hasTableBooking: Number(r.has_table_booking) === 1,
      isDeliveringNow: Number(r.is_delivering_now) === 1,
      
      // Cost info
      averageCostForTwo: r.average_cost_for_two != null ? Number(r.average_cost_for_two) : 0,
      currency: r.currency || 'PHP',
      
      // URLs
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      zomatoUrl: r.url || '',
      
      // Types (simulated from cuisines for compatibility)
      types: (r.cuisines || '').split(',').map(c => c.trim().toLowerCase().replace(/ /g, '_')).filter(Boolean)
    });
  }

  // console.log(`Total merged records: ${merged.length}`);
  // console.log(`Skipped due to missing location: ${missingLocation}`);
  // console.log(`Skipped due to invalid coordinates: ${skipped}\n`);

  // Check coordinate distribution
  checkCoordinateDistribution(merged);

  // Wrap in structure expected by React app
  const output = {
    items: merged,
    metadata: {
      source: 'Zomato Metro Manila Dataset',
      totalCount: merged.length,
      generatedAt: new Date().toISOString(),
      coverage: 'Metro Manila, Philippines'
    }
  };

  // Save the output to public/data/ subfolder
  const outPath = path.resolve('./public/data/ncr_food_places2.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  // console.log(`✓ Data saved to ${outPath}\n`);

  generateStatistics(merged);
  return output;
}

function checkCoordinateDistribution(items) {
  // console.log('--- Coordinate Distribution Check ---');

  // Find min/max coordinates
  const lats = items.map(r => r.lat);
  const lngs = items.map(r => r.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // console.log(`Latitude range: ${minLat.toFixed(6)} to ${maxLat.toFixed(6)}`);
  // console.log(`Longitude range: ${minLng.toFixed(6)} to ${maxLng.toFixed(6)}`);

  // Check for duplicates
  const coordPairs = items.map(r => `${r.lat},${r.lng}`);
  const uniqueCoords = new Set(coordPairs);
  const duplicateCount = items.length - uniqueCoords.size;

  // console.log(`Unique coordinate pairs: ${uniqueCoords.size}`);
  // console.log(`Duplicate coordinates: ${duplicateCount}`);

  // Sample first 5 coordinates to verify they're different
  // console.log('\nSample coordinates (first 5):');
  // items.slice(0, 5).forEach(r => {
  //   console.log(`  ${r.name}: (${r.lat.toFixed(6)}, ${r.lng.toFixed(6)})`);
  // });

  // console.log('');
}

function generateStatistics(items) {
  // console.log('--- Dataset Statistics ---');

  // Localities
  const localityCounts = {};
  for (const r of items) {
    const loc = r.locality || 'Unknown';
    localityCounts[loc] = (localityCounts[loc] || 0) + 1;
  }
  // console.log(`Unique Localities: ${Object.keys(localityCounts).length}`);

  // Top 5 localities
  const topLocalities = Object.entries(localityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  // console.log('Top 5 Localities:');
  // topLocalities.forEach(([loc, count]) => {
  //   console.log(`  ${loc}: ${count} restaurants`);
  // });

  // Cuisines
  const cuisines = {};
  for (const r of items) {
    (r.cuisine || '').split(',').forEach(c => {
      const k = c.trim();
      if (!k) return;
      cuisines[k] = (cuisines[k] || 0) + 1;
    });
  }
  // console.log(`\nUnique Cuisines: ${Object.keys(cuisines).length}`);

  // Ratings
  const rated = items.filter(r => r.rating && r.rating > 0);
  const avgRating = rated.length ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length) : 0;
  // console.log(`\nRated restaurants: ${rated.length} of ${items.length}`);
  // console.log(`Average Rating: ${avgRating.toFixed(2)}`);

  // Rating distribution
  const ratingBuckets = { '4.5+': 0, '4.0-4.5': 0, '3.5-4.0': 0, '3.0-3.5': 0, '<3.0': 0 };
  rated.forEach(r => {
    if (r.rating >= 4.5) ratingBuckets['4.5+']++;
    else if (r.rating >= 4.0) ratingBuckets['4.0-4.5']++;
    else if (r.rating >= 3.5) ratingBuckets['3.5-4.0']++;
    else if (r.rating >= 3.0) ratingBuckets['3.0-3.5']++;
    else ratingBuckets['<3.0']++;
  });
  // console.log('Rating Distribution:');
  // Object.entries(ratingBuckets).forEach(([range, count]) => {
  //   console.log(`  ${range}: ${count} restaurants`);
  // });

  // Price levels
  const priceLevels = {};
  items.forEach(r => {
    const level = r.priceLevelNum || 'Unknown';
    priceLevels[level] = (priceLevels[level] || 0) + 1;
  });
  // console.log('\nPrice Level Distribution:');
  // Object.entries(priceLevels).forEach(([level, count]) => {
  //   const label = {
  //     1: '₱ (Inexpensive)',
  //     2: '₱₱ (Moderate)',
  //     3: '₱₱₱ (Expensive)',
  //     4: '₱₱₱₱ (Very Expensive)',
  //     'Unknown': 'Not specified'
  //   }[level] || level;
  //   console.log(`  ${label}: ${count} restaurants`);
  // });

  // console.log('');
}

if (require.main === module) {
  mergeZomatoData();
}

module.exports = { mergeZomatoData };
/**
 * Update OSM Files for Existing Workflow
 *
 * Converts raw OSM data to the format expected by merge-all-sources.js
 * Updates both data-sources/data and public/data directories
 *
 * Run: node scripts/update-osm-files.js
 */

const fs = require('fs');
const path = require('path');

function main() {
  console.log('=== Update OSM Restaurant Files ===\n');

  // Read the raw OSM data
  const rawDataPath = path.join(__dirname, '../data/osm-raw-data.json');

  if (!fs.existsSync(rawDataPath)) {
    console.error('Error: osm-raw-data.json not found!');
    console.log('Run: node scripts/fetch-osm-data.js first\n');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
  const elements = rawData.elements || [];

  console.log(`Raw elements: ${elements.length}`);

  // Convert to the format expected by merge-all-sources.js
  const restaurants = [];

  elements.forEach((element) => {
    const tags = element.tags || {};
    const lat = element.center?.lat || element.lat;
    const lon = element.center?.lon || element.lon;

    // Skip if no coordinates or name
    if (!lat || !lon) return;
    if (!tags.name) return;

    // Build cuisines
    const cuisines = tags.cuisine
      ? tags.cuisine.split(';').map((c) => c.trim())
      : [];

    // Build types
    const types = [tags.amenity || 'restaurant'];
    if (cuisines.length > 0) {
      types.push(
        ...cuisines.map((c) => c.toLowerCase().replace(/ /g, '_'))
      );
    }

    // Build address
    const addressParts = [];
    if (tags['addr:street']) addressParts.push(tags['addr:street']);
    if (tags['addr:city']) addressParts.push(tags['addr:city']);
    if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);

    restaurants.push({
      id: `osm_${element.type}_${element.id}`,
      name: tags.name,
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      address: addressParts.join(', ') || '',
      rating: null,
      userRatingCount: 0,
      priceLevel:
        tags.amenity === 'fast_food' ? 'PRICE_LEVEL_INEXPENSIVE' : null,
      cuisine: cuisines.join(', ') || '',
      locality: tags['addr:suburb'] || tags['addr:barangay'] || '',
      city: tags['addr:city'] || 'Metro Manila',
      hasOnlineDelivery: tags.delivery === 'yes',
      hasTableBooking: false,
      isDeliveringNow: false,
      averageCostForTwo: 0,
      currency: 'PHP',
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
      osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      types: types,
      source: 'OpenStreetMap',
      phone: tags.phone || tags['contact:phone'] || '',
      website: tags.website || tags['contact:website'] || '',
      openingHours: tags.opening_hours || '',
      wheelchair: tags.wheelchair === 'yes',
      outdoor_seating: tags.outdoor_seating === 'yes',
      takeaway: tags.takeaway === 'yes'
    });
  });

  console.log(`Converted to ${restaurants.length} restaurants\n`);

  // Build output object
  const output = {
    items: restaurants,
    metadata: {
      source: 'OpenStreetMap via Overpass API',
      totalCount: restaurants.length,
      generatedAt: new Date().toISOString(),
      coverage: 'Metro Manila, Philippines',
      attribution: '© OpenStreetMap contributors'
    }
  };

  // Ensure directories exist
  const dataSourcesDir = path.join(__dirname, '../data-sources/data');
  const publicDataDir = path.join(__dirname, '../public/data');

  if (!fs.existsSync(dataSourcesDir)) {
    fs.mkdirSync(dataSourcesDir, { recursive: true });
  }

  // Write files
  const paths = [
    path.join(dataSourcesDir, 'osm_restaurants.json'),
    path.join(publicDataDir, 'osm_restaurants.json')
  ];

  paths.forEach((filePath) => {
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf8');
    const sizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
    console.log(`Written: ${filePath}`);
    console.log(`  Size: ${sizeMB} MB`);
    console.log(`  Count: ${restaurants.length}`);
    console.log();
  });

  console.log('=== Done ===');
  console.log('\nYou can now run:');
  console.log('  node data-sources/merge-all-sources.js');
  console.log('to merge with Zomato data, or');
  console.log('  node server/scripts/seedRestaurants.js');
  console.log('to directly seed the database.\n');
}

main();

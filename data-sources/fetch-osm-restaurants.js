// fetch-osm-restaurants.js
// Downloads restaurant data from OpenStreetMap using Overpass API

const fs = require('fs');
const path = require('path');
const https = require('https');

// Metro Manila bounding box
// [south, west, north, east] - coordinates covering all Metro Manila
const METRO_MANILA_BBOX = {
  south: 14.35,
  west: 120.90,
  north: 14.78,
  east: 121.15
};

// Overpass API query to get restaurants, cafes, and fast food
const buildOverpassQuery = () => {
  const { south, west, north, east } = METRO_MANILA_BBOX;

  return `[out:json][timeout:180];
(
  node["amenity"="restaurant"](${south},${west},${north},${east});
  way["amenity"="restaurant"](${south},${west},${north},${east});
  node["amenity"="cafe"](${south},${west},${north},${east});
  way["amenity"="cafe"](${south},${west},${north},${east});
  node["amenity"="fast_food"](${south},${west},${north},${east});
  way["amenity"="fast_food"](${south},${west},${north},${east});
  node["amenity"="food_court"](${south},${west},${north},${east});
  way["amenity"="food_court"](${south},${west},${north},${east});
);
out body;
>;
out skel qt;`;
};

// Convert OSM data to our format
const convertOSMToFormat = (osmData) => {
  const restaurants = [];

  osmData.elements.forEach((element) => {
    // Skip if no coordinates
    if (!element.lat || !element.lon) {
      // For ways, calculate center point
      if (element.center) {
        element.lat = element.center.lat;
        element.lon = element.center.lon;
      } else {
        return;
      }
    }

    const tags = element.tags || {};

    // Skip if no name
    if (!tags.name) return;

    // Determine cuisine/type
    const cuisines = [];
    if (tags.cuisine) {
      cuisines.push(...tags.cuisine.split(';').map(c => c.trim()));
    }

    // Determine amenity type
    const amenityType = tags.amenity || 'restaurant';
    const types = [amenityType];
    if (cuisines.length > 0) {
      types.push(...cuisines.map(c => c.toLowerCase().replace(/ /g, '_')));
    }

    // Build address
    const addressParts = [];
    if (tags['addr:street']) addressParts.push(tags['addr:street']);
    if (tags['addr:barangay']) addressParts.push(tags['addr:barangay']);
    if (tags['addr:city']) addressParts.push(tags['addr:city']);

    const address = addressParts.length > 0
      ? addressParts.join(', ')
      : tags['addr:full'] || '';

    // Estimate price level from tags
    let priceLevel = null;
    if (amenityType === 'fast_food') {
      priceLevel = 'PRICE_LEVEL_INEXPENSIVE';
    } else if (tags['payment:credit_cards'] === 'yes' || tags.wheelchair === 'yes') {
      priceLevel = 'PRICE_LEVEL_MODERATE';
    }

    const restaurant = {
      id: `osm_${element.type}_${element.id}`,
      name: tags.name,
      lat: parseFloat(element.lat),
      lng: parseFloat(element.lon),
      address: address || `${element.lat}, ${element.lon}`,
      rating: null, // OSM doesn't have ratings
      userRatingCount: 0,
      priceLevel: priceLevel,
      cuisine: cuisines.join(', ') || '',
      locality: tags['addr:suburb'] || tags['addr:barangay'] || '',
      city: tags['addr:city'] || 'Metro Manila',
      hasOnlineDelivery: tags.delivery === 'yes',
      hasTableBooking: false,
      isDeliveringNow: false,
      averageCostForTwo: 0,
      currency: 'PHP',
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${element.lat},${element.lon}`,
      osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      types: types,
      source: 'OpenStreetMap',

      // Additional OSM data
      phone: tags.phone || tags['contact:phone'] || '',
      website: tags.website || tags['contact:website'] || '',
      openingHours: tags.opening_hours || '',
      wheelchair: tags.wheelchair === 'yes',
      outdoor_seating: tags.outdoor_seating === 'yes',
      takeaway: tags.takeaway === 'yes'
    };

    restaurants.push(restaurant);
  });

  return restaurants;
};

// Fetch data from Overpass API
const fetchOSMData = () => {
  return new Promise((resolve, reject) => {
    const query = buildOverpassQuery();
    const url = 'https://overpass-api.de/api/interpreter';

    // console.log('Fetching restaurant data from OpenStreetMap...');
    // console.log('This may take 1-3 minutes for Metro Manila...\n');

    const postData = query;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
        process.stdout.write('.');
      });

      res.on('end', () => {
        // console.log('\n\nData received! Processing...\n');
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse OSM response: ' + e.message));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error('Failed to fetch from Overpass API: ' + e.message));
    });

    req.write(postData);
    req.end();
  });
};

// Main function
async function main() {
  try {
    // Fetch OSM data
    const osmData = await fetchOSMData();

    // console.log(`Received ${osmData.elements.length} OSM elements`);

    // Convert to our format
    const restaurants = convertOSMToFormat(osmData);

    // console.log(`Converted to ${restaurants.length} restaurants\n`);

    // Statistics
    const stats = {
      total: restaurants.length,
      byType: {},
      byCuisine: {},
      byCity: {},
      withPhone: restaurants.filter(r => r.phone).length,
      withWebsite: restaurants.filter(r => r.website).length,
      withHours: restaurants.filter(r => r.openingHours).length
    };

    restaurants.forEach(r => {
      const type = r.types[0] || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      const city = r.city || 'Unknown';
      stats.byCity[city] = (stats.byCity[city] || 0) + 1;
    });

    // console.log('--- OSM Data Statistics ---');
    // console.log(`Total restaurants: ${stats.total}`);
    // console.log(`With phone numbers: ${stats.withPhone}`);
    // console.log(`With websites: ${stats.withWebsite}`);
    // console.log(`With opening hours: ${stats.withHours}\n`);

    // console.log('By Type:');
    // Object.entries(stats.byType)
    //   .sort((a, b) => b[1] - a[1])
    //   .slice(0, 10)
    //   .forEach(([type, count]) => {
    //     console.log(`  ${type}: ${count}`);
    //   });

    // console.log('\nTop Cities:');
    // Object.entries(stats.byCity)
    //   .sort((a, b) => b[1] - a[1])
    //   .slice(0, 10)
    //   .forEach(([city, count]) => {
    //     console.log(`  ${city}: ${count}`);
    //   });

    // Save to file
    const output = {
      items: restaurants,
      metadata: {
        source: 'OpenStreetMap via Overpass API',
        totalCount: restaurants.length,
        generatedAt: new Date().toISOString(),
        coverage: 'Metro Manila, Philippines',
        bbox: METRO_MANILA_BBOX,
        attribution: '© OpenStreetMap contributors'
      }
    };

    const outPath = path.resolve('./data/osm_restaurants.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

    // console.log(`\n✓ Data saved to ${outPath}`);
    // console.log('\nNext step: Run merge-all-sources.js to combine with Zomato data');

  } catch (error) {
    // console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchOSMData, convertOSMToFormat };

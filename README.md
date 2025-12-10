# Picky Plate - Metro Manila Restaurant Locator

A restaurant discovery app featuring **44,000+ restaurants** in Metro Manila, Philippines with interactive maps, clustering, and smart search.

## Features

- **44,800+ Restaurants** - Comprehensive Metro Manila coverage from OSM + Overture Maps
- **Interactive Map** - Google Maps with SuperCluster marker clustering
- **Smart Search** - Search by name, cuisine, or location
- **Filters** - By type (restaurant, cafe, fast food, bakery, bar), price, rating
- **Near Me** - Find restaurants closest to your location
- **Google Maps Style UI** - Familiar popup design with images

## Database Info

| Field | Value |
|-------|-------|
| Database | MongoDB |
| Collection (Active) | `restaurants_2025` |
| Collection (Backup) | `foodplaces` |
| Total Records | 44,816 |
| Data Sources | OpenStreetMap + Overture Maps |
| Last Refresh | December 2025 |

## Data Coverage

| Type | Count |
|------|-------|
| Restaurants | ~15,000 |
| Fast Food | ~8,000 |
| Cafes | ~6,000 |
| Bakeries | ~3,000 |
| Bars | ~2,000 |
| Other | ~10,000 |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Maps API Key

### Installation

```bash
# Clone repo
git clone <your-repo-url>
cd picky-plate

# Install dependencies
npm install

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your values

# Start development server (runs both frontend and backend)
npm run dev
```

### Environment Variables

Key variables in `server/.env`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/pickaplate
RESTAURANT_COLLECTION=restaurants_2025
PORT=4000
```

Frontend variables in `.env`:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
REACT_APP_API_URL=http://localhost:4000
```

## Project Structure

```
picky-plate/
├── server/
│   ├── routes/
│   │   └── places.js              # Restaurant API endpoints
│   └── models/
│       └── Restaurant.js          # MongoDB schema for restaurants_2025
├── src/
│   ├── pages/
│   │   ├── RestaurantLocator.js   # Main map component
│   │   └── RestaurantLocator.css  # Google Maps style CSS
│   └── utils/
│       └── getRestaurantImage.js  # Cuisine-based placeholder images
├── scripts/                       # Data pipeline scripts
│   ├── fetch-osm-expanded.js      # Fetch from OpenStreetMap
│   ├── fetch-overture.js          # Fetch from Overture Maps
│   ├── transform-osm.js           # Transform OSM data
│   ├── transform-overture.js      # Transform Overture data
│   ├── merge-and-dedupe.js        # Merge & deduplicate
│   └── import-to-new-collection.js # Import to MongoDB
└── data-sources/                  # (gitignored) Raw data files
```

## Annual Data Refresh

To refresh data for a new year, see `docs/DATA_REFRESH_GUIDE.md`.

Quick steps:
```bash
# 1. Fetch fresh data
node scripts/fetch-osm-expanded.js
node scripts/fetch-overture.js

# 2. Transform
node scripts/transform-osm.js
node scripts/transform-overture.js

# 3. Merge and import
node scripts/merge-and-dedupe.js
node scripts/import-to-new-collection.js

# 4. Update .env
RESTAURANT_COLLECTION=restaurants_2026
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/places/nearby` | GET | Get restaurants near location |
| `/api/places/cuisines` | GET | List all cuisines |

### Query Parameters

```
GET /api/places/nearby?lat=14.5&lng=121.0&radius=2000&cuisine=filipino&limit=50
```

## Tech Stack

- **Frontend**: React.js, Google Maps API
- **Backend**: Node.js, Express
- **Database**: MongoDB with 2dsphere indexes
- **Clustering**: SuperCluster (use-supercluster)
- **Images**: Unsplash (cuisine-based placeholders)

## Data Sources & Attribution

- **OpenStreetMap**: Community-verified POIs - [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright)
- **Overture Maps**: Meta, Microsoft, Amazon, TomTom data - [overturemaps.org](https://overturemaps.org)

## Changelog

### December 2025
- Fresh 2025 data refresh (44,816 restaurants)
- Added SuperCluster marker clustering for 46k+ markers
- Google Maps style InfoWindow popup design
- Google Maps style teardrop pin markers
- Type-based marker colors with emojis
- Interactive map legend
- Fixed distance calculation (meters vs km)
- Removed water markers (Laguna de Bay, Manila Bay)
- Cuisine-based placeholder images

---

Made with love for Metro Manila food lovers

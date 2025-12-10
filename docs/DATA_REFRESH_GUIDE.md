# Data Refresh Guide

This guide explains how to refresh restaurant data annually for Picky Plate.

## Current Status

| Year | Collection | Records | Status |
|------|------------|---------|--------|
| 2025 | restaurants_2025 | 44,816 | Active |
| 2024 | foodplaces | ~18,000 | Backup |

## Refresh Schedule

- **When**: December each year
- **Why**: Catch new restaurants, remove closed ones, update info
- **Time needed**: ~1-2 hours

## Prerequisites

- Node.js 18+
- MongoDB running locally or Atlas connection
- ~500MB free disk space for data files

## Step-by-Step Refresh

### Step 1: Backup Current Data

```bash
# Export current collection as backup
mongoexport --db=pickaplate --collection=restaurants_2025 --out=backups/restaurants_2025_backup.json
```

### Step 2: Fetch Fresh Data from OpenStreetMap

```bash
node scripts/fetch-osm-expanded.js
```

This fetches all food-related POIs in Metro Manila:
- Bounding box: 14.35-14.80 lat, 120.90-121.15 lng
- Types: restaurant, fast_food, cafe, bakery, bar, ice_cream, food_court
- Output: `data-sources/osm-expanded-raw.json`
- Time: 2-5 minutes

### Step 3: Fetch Fresh Data from Overture Maps

```bash
node scripts/fetch-overture.js
```

This fetches from Overture Maps (requires internet):
- Source: S3 public bucket
- Filter: Metro Manila bounds + food categories
- Output: `data-sources/overture-places.json`
- Time: 5-10 minutes

### Step 4: Transform Both Sources

```bash
# Transform OSM data
node scripts/transform-osm.js

# Transform Overture data
node scripts/transform-overture.js
```

This normalizes data to our schema:
- Standardizes field names
- Extracts address components
- Infers cuisine from brand names
- Creates GeoJSON location field

### Step 5: Merge and Deduplicate

```bash
node scripts/merge-and-dedupe.js
```

This combines both sources:
- Removes duplicates by name + location proximity
- Prefers records with more data
- Output: `data-sources/merged-2025.json`

### Step 6: Import to New Collection

Before running, update the collection name in the script for the new year:

```javascript
// In import-to-new-collection.js, change:
const COLLECTION_NAME = "restaurants_2026";  // Update year!
```

Then run:
```bash
node scripts/import-to-new-collection.js
```

### Step 7: Validate Import

```bash
node scripts/validate-new-collection.js
```

Check for:
- Total record count (should be 40k-50k)
- All records have valid coordinates
- No records outside Metro Manila bounds
- Cuisine coverage percentage

### Step 8: Clean Up Bad Data

If there are markers in water or outside NCR:

```bash
node scripts/remove-water-restaurants.js
```

### Step 9: Switch to New Collection

Update `server/.env`:
```env
RESTAURANT_COLLECTION=restaurants_2026
```

Restart the server and test the app.

### Step 10: Verify in App

1. Open the app at http://localhost:3000
2. Check total count in header (should show ~44k)
3. Test map clustering
4. Test search functionality
5. Verify distances are correct

## Troubleshooting

### "Too many records" (>60k)
- Tighten bounding box
- Increase confidence threshold for Overture data
- Check for duplicates

### "Markers in water"
```bash
node scripts/remove-water-restaurants.js
```

### "Distance calculation wrong"
- Check if API returns meters or km
- Verify coordinate order: MongoDB uses [lng, lat]

### "Missing cuisines"
```bash
node scripts/infer-cuisine.js
```

## Metro Manila Bounds Reference

```javascript
const METRO_MANILA_BOUNDS = {
  north: 14.80,
  south: 14.35,
  east: 121.15,
  west: 120.90
};
```

## Valid NCR Cities

- Manila, Quezon City, Caloocan
- Las Pinas, Makati, Malabon, Mandaluyong
- Marikina, Muntinlupa, Navotas
- Paranaque, Pasay, Pasig, San Juan
- Taguig, Valenzuela, Pateros

Any city not in this list = outside NCR (should be removed)

## Data Sources

### OpenStreetMap
- API: Overpass API (free, no key)
- Endpoint: https://overpass-api.de/api/interpreter
- License: ODbL - must attribute

### Overture Maps
- Source: Meta, Microsoft, Amazon, TomTom
- Access: Public S3 bucket
- Releases: https://docs.overturemaps.org/release
- License: CDLA Permissive

## File Sizes (Approximate)

| File | Size |
|------|------|
| osm-expanded-raw.json | ~5 MB |
| overture-places.json | ~25 MB |
| osm-transformed.json | ~13 MB |
| overture-transformed.json | ~55 MB |
| merged-2025.json | ~70 MB |

Total: ~170 MB (all gitignored)

## Rollback Procedure

If something goes wrong, rollback to previous collection:

```env
# In server/.env
RESTAURANT_COLLECTION=restaurants_2025  # or foodplaces for 2024
```

Restart server. No data loss - old collection is preserved.

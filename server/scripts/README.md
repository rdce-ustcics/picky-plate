# Database Seeder Scripts

This directory contains database seeding scripts for the Picky Plate application.

## Available Seeders

### 1. seedCulturalRecipes.js

Seeds the database with authentic Filipino cultural recipes categorized by region (Luzon, Visayas, Mindanao).

**Usage:**
```bash
cd server
node scripts/seedCulturalRecipes.js
```

**What it does:**
- Connects to your MongoDB database
- Clears existing cultural recipes (optional - can be modified)
- Inserts 20+ authentic Filipino recipes with:
  - Complete ingredient lists
  - Step-by-step cooking instructions
  - Regional categorization (Luzon, Visayas, Mindanao)
  - High-quality food images from Unsplash
  - Cultural descriptions and context

**Recipe Distribution:**
- **Luzon (8 recipes)**: Sinigang na Baboy, Adobo, Sisig, Kare-Kare, Bulalo, Bicol Express, Pinakbet, Tinolang Manok
- **Visayas (6 recipes)**: Lechon, Chicken Inasal, La Paz Batchoy, Kinilaw na Isda, Binakol, Humba
- **Mindanao (6 recipes)**: Tuna Kinilaw, Satti, Tiyula Itum, Beef Rendang, Pastil, Pianggang Manok

**Data Sources:**
Recipes were carefully researched and compiled from:
- Islands Philippines regional cuisine guides
- Yummy.ph traditional recipe collections
- Cultural food heritage resources
- Expert Filipino cooking sources

**Data Quality:**
✅ Authentic traditional recipes
✅ Culturally accurate regional categorization
✅ Complete ingredient lists with measurements
✅ Detailed step-by-step instructions
✅ Cultural context and significance noted
✅ Professional food photography

**Note:** Make sure your `.env` file is properly configured with `MONGODB_URI` before running the seeder.

### 2. verifyCulturalRecipes.js

Verification script to check the integrity and completeness of cultural recipes data.

**Usage:**
```bash
cd server
node scripts/verifyCulturalRecipes.js
```

**What it does:**
- Connects to MongoDB and verifies database connection
- Counts total active recipes
- Shows regional distribution (Luzon, Visayas, Mindanao)
- Performs data integrity checks (missing fields, empty data)
- Displays sample recipes from each region
- Lists all recipe names organized by region
- Provides API endpoint URLs for testing

**When to use:**
- After running the seeder to verify data was inserted correctly
- To check database status before deployment
- To troubleshoot issues with recipe data
- To generate a quick summary of available recipes

**Sample Output:**
```
✅ Connected to: pickaplate
📊 Total Active Recipes: 20
📍 Regional Distribution:
   • Luzon: 8 recipes
   • Visayas: 6 recipes
   • Mindanao: 6 recipes
✅ All integrity checks passed!
```

### 3. seed.js

Original seeder for dish samples and user favorites (legacy).

## Adding New Seeders

To create a new seeder:

1. Create a new file in this directory (e.g., `seedRestaurants.js`)
2. Follow the pattern used in `seedCulturalRecipes.js`:
   - Connect to MongoDB using mongoose
   - Import necessary models
   - Create your data array
   - Insert data with error handling
   - Close connection and exit
3. Document it here in this README

## Troubleshooting

**Connection Errors:**
- Verify your `MONGODB_URI` in `.env` file
- Ensure MongoDB is running
- Check network connectivity

**Duplicate Key Errors:**
- The seeder clears existing data by default
- If you want to preserve existing data, comment out the `deleteMany()` line

**Missing Dependencies:**
```bash
npm install mongoose dotenv
```

## Environment Variables Required

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
DB_NAME=pappy_demo
```

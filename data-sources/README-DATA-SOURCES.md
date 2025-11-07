# 📊 Restaurant Data Sources Guide

This guide explains how to expand your restaurant dataset with data from multiple sources.

## 🎯 Quick Start

### Option 1: OpenStreetMap (FREE & Recommended)

```bash
# Step 1: Fetch OSM restaurant data
cd data-sources
node fetch-osm-restaurants.js

# Step 2: Merge with existing Zomato data
node merge-all-sources.js

# Step 3: Restart your React app
# Your restaurant locator now has 10,000+ more restaurants!
```

**Result:** ~16,000+ total restaurants (6,830 Zomato + ~10,000 OSM)

---

## 📍 Data Sources Comparison

| Source | Pros | Cons | Cost | Coverage |
|--------|------|------|------|----------|
| **OpenStreetMap** | ✅ Free<br>✅ Legal<br>✅ 10k+ restaurants<br>✅ Community data | ❌ No ratings<br>❌ May have outdated info | FREE | Good |
| **Zomato** (current) | ✅ Has ratings<br>✅ Reviews<br>✅ Price levels | ❌ Limited to 6,830<br>❌ API discontinued | FREE (existing) | Good |
| **Google Places** | ✅ Best coverage (30k+)<br>✅ Always updated<br>✅ Has ratings | ❌ Costs money<br>⚠️ Terms of Service | ~$200/10k | Excellent |
| **Foursquare** | ✅ Free tier<br>✅ Has check-ins | ❌ Smaller coverage<br>❌ Less data | FREE tier | Fair |

---

## 🗺️ Option 1: OpenStreetMap (Recommended)

### What You Get:
- ✅ **10,000+ restaurants** across Metro Manila
- ✅ Restaurant names, addresses, coordinates
- ✅ Phone numbers, websites, opening hours
- ✅ Cuisine types, delivery info, accessibility
- ✅ Completely FREE and legal

### How It Works:
The script uses the **Overpass API** to query OpenStreetMap data for:
- Restaurants (`amenity=restaurant`)
- Cafes (`amenity=cafe`)
- Fast food (`amenity=fast_food`)
- Food courts (`amenity=food_court`)

### Limitations:
- ❌ No ratings or reviews (OSM doesn't collect these)
- ❌ Some restaurants may be outdated
- ⚠️ Quality depends on community contributions

### Run It:
```bash
cd data-sources
node fetch-osm-restaurants.js
node merge-all-sources.js
```

---

## 🌐 Option 2: Google Places API (Paid, Most Comprehensive)

### What You Get:
- ✅ **30,000+ restaurants** in Metro Manila
- ✅ Real-time data (always up-to-date)
- ✅ Ratings, reviews, photos
- ✅ Price levels, opening hours
- ✅ Phone numbers, websites
- ✅ Popular times, busy hours

### Cost:
- **Text Search:** $32 per 1,000 requests
- **Nearby Search:** $32 per 1,000 requests
- **Place Details:** $17 per 1,000 requests

**Estimated Cost for Metro Manila:**
- ~30,000 restaurants ÷ 60 per search = ~500 searches
- 500 searches × $0.032 = **~$16** for searches
- 30,000 details × $0.017 = **~$510** for details
- **Total: ~$530** for full dataset

### How to Use Google Places API:

1. **Get API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Places API"
   - Create an API key

2. **Create `.env` file:**
   ```
   GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

3. **Run the script:**
   ```bash
   # I can create this script for you if you want to use Google Places
   node fetch-google-places.js
   ```

### ⚠️ Important - Terms of Service:
- You CAN use Google Places data in your app
- You CANNOT store/cache data for more than 30 days
- You MUST display data on a Google Map (or pay extra)
- Read: [Google Maps Platform Terms](https://cloud.google.com/maps-platform/terms)

---

## 🎪 Option 3: Foursquare API (Free Tier)

### What You Get:
- ✅ Free tier: 50,000 calls/month
- ✅ ~5,000+ restaurants in Metro Manila
- ✅ Ratings, tips, check-ins
- ✅ Categories, price tiers

### Cost:
- FREE tier: 50,000 API calls/month
- Paid: $49-$499/month

### How to Use:
1. Get API key from [Foursquare Developers](https://foursquare.com/developers/)
2. I can create a script for you

---

## 📦 What's Included in This Folder

```
data-sources/
├── fetch-osm-restaurants.js      ← Fetches OSM data (FREE)
├── merge-all-sources.js          ← Merges all sources, removes duplicates
├── fix-data-processor.js         ← Original Zomato processor
├── data/
│   ├── zomato.json              ← Zomato source data
│   ├── location.json            ← Zomato locations
│   ├── ratings.json             ← Zomato ratings
│   └── osm_restaurants.json     ← OSM data (after fetch)
└── README-DATA-SOURCES.md        ← This file
```

---

## 🔄 Data Merging Process

The `merge-all-sources.js` script:
1. Loads Zomato data (6,830 restaurants)
2. Loads OSM data (~10,000 restaurants)
3. **Removes duplicates** using:
   - Distance calculation (< 100m apart)
   - Name similarity matching
4. **Merges data** from both sources:
   - Keeps Zomato ratings (OSM doesn't have them)
   - Adds OSM phone numbers, websites, opening hours
   - Combines cuisine types
5. Saves to `public/data/ncr_food_places2.json`

---

## 📈 Expected Results

### Before (Zomato only):
- 6,830 restaurants
- Has ratings
- Limited phone/website info

### After (Zomato + OSM):
- **~16,000 restaurants** (after deduplication)
- Has ratings (from Zomato)
- More phone numbers and websites
- Opening hours for many restaurants
- Better coverage of small local eateries

---

## 🚀 Want Even More Data?

### Community Data Sources:
1. **GrabFood/FoodPanda** - Would need web scraping (ethical concerns)
2. **Facebook Places** - API access limited
3. **TripAdvisor** - Web scraping only (ToS violation)
4. **Government Data** - DTI business registrations (if available)

### Best Approach:
1. **Start with OSM** (free, easy, legal)
2. **Add Google Places** if you have budget
3. **Crowdsource** - Let users submit missing restaurants
4. **Keep updating** - Run scripts monthly to refresh data

---

## 🆘 Troubleshooting

### Error: "Request timeout"
- OSM Overpass API is busy
- Wait a few minutes and try again
- Or try a different time of day

### Error: "Too many requests"
- You're hitting rate limits
- Wait 1 hour before retrying
- Or use a smaller bounding box

### Error: "No OSM data found"
- Make sure you run `fetch-osm-restaurants.js` first
- Check `data/osm_restaurants.json` exists

---

## 📝 Next Steps

1. **Try OSM first** (it's free!)
   ```bash
   cd data-sources
   node fetch-osm-restaurants.js
   node merge-all-sources.js
   ```

2. **Check the results** in your React app

3. **Consider Google Places** if you need:
   - More comprehensive data
   - Real-time updates
   - Professional/commercial use

4. **Set up automatic updates** (monthly cron job)

---

## ❓ Questions?

- OSM taking too long? It fetches 10k+ restaurants, can take 2-3 minutes
- Need help with Google Places API? Let me know!
- Want to scrape other sources? Ask for guidance on ethics/legality

---

**Made with ❤️ for PickAPlate**

// /server/routes/places.js
/* eslint-disable no-await-in-loop */
const express = require("express");
const axios = require("axios");

// Use new Restaurant model (supports both restaurants_2025 and foodplaces via env var)
const Restaurant = require("../models/Restaurant");

// Legacy import for backward compatibility (if needed for some operations)
// const Restaurant = require("../models/Restaurant");

const {
  // bounds / filters
  NCR_BOUNDS, withinNCR, toPriceNum, isOpenAt,
  // seeds / normalize / strict NCR
  GENERIC_TEXT_SEEDS, normalizeForDb, filterStrictNCR,
  // headers
  getPlacesHeaders, PLACES_FIELD_MASK,
} = require("../lib/places-helpers");

const { crawlGridPass, cityCenterSweep } = require("../lib/places-crawl");

const router = express.Router();

// -------- Admin guard ----------
function requireAdmin(req, res, next) {
  const token = req.get("X-Admin-Token");
  if (token && token === process.env.ADMIN_TOKEN) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// -------- Health ----------
router.get("/ping", (_req, res) => res.json({ ok: true }));

// ============================================================
// GEOSPATIAL NEARBY SEARCH - Uses 2dsphere index for speed
// ============================================================
router.get("/nearby", async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 5000,      // Default 5km radius in meters
      limit = 100,        // Max restaurants to return
      page = 1,
      cuisine,            // Filter by cuisine type
      minRating,          // Minimum rating filter
      priceLevel,         // Price level filter (1-4)
      search,             // Text search for name
      city,               // Filter by city
      sortBy = "distance" // "distance" | "rating" | "name"
    } = req.query;

    // Validate required params
    if (!lat || !lng) {
      return res.status(400).json({
        error: "Missing required parameters: lat and lng"
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    // Allow up to 100km radius, or 0 for "all restaurants" mode
    const radiusParam = parseInt(radius);
    const maxDistance = radiusParam === 0 ? null : Math.min(radiusParam || 5000, 100000); // Max 100km or null for all
    const pageNum = Math.max(parseInt(page) || 1, 1);
    // When fetching ALL restaurants (radius=0), allow much higher limit
    const requestedLimit = parseInt(limit) || 100;
    const limitNum = maxDistance === null
      ? Math.min(requestedLimit, 50000) // Allow up to 50k for "all" mode
      : Math.min(requestedLimit, 20000); // Allow up to 20k for geo queries
    const skip = (pageNum - 1) * limitNum;

    // Build match conditions for filtering
    const matchConditions = {};

    // ALWAYS filter to Metro Manila (NCR) only
    // Based on research: Metro Manila boundaries
    // Sources: OpenStreetMap, PhilAtlas, latitude.to
    const METRO_MANILA_BOUNDS = {
      south: 14.35,  // Muntinlupa/Las Piñas southern edge
      north: 14.78,  // Caloocan/Valenzuela northern edge
      west: 120.90,  // Manila Bay western edge
      east: 121.15   // Marikina/Rizal eastern edge
    };

    // Add NCR boundary conditions (use latitude/longitude for new schema)
    matchConditions.latitude = {
      $gte: METRO_MANILA_BOUNDS.south,
      $lte: METRO_MANILA_BOUNDS.north
    };
    matchConditions.longitude = {
      $gte: METRO_MANILA_BOUNDS.west,
      $lte: METRO_MANILA_BOUNDS.east
    };

    if (cuisine) {
      const cuisineTypes = cuisine.split(",").map(c => c.trim().toLowerCase());
      matchConditions.$or = [
        { type: { $in: cuisineTypes } },
        { cuisine: { $regex: cuisineTypes.join("|"), $options: "i" } }
      ];
    }

    if (minRating) {
      matchConditions.rating = { $gte: parseFloat(minRating) };
    }

    if (priceLevel) {
      matchConditions.priceLevelNum = parseInt(priceLevel);
    }

    if (city) {
      matchConditions["address.city"] = { $regex: city, $options: "i" };
    }

    if (search) {
      matchConditions.name = { $regex: search, $options: "i" };
    }

    let restaurants, total;

    if (maxDistance === null) {
      // "All restaurants" mode - no distance filter, use simple find
      const query = Object.keys(matchConditions).length > 0 ? matchConditions : {};

      total = await Restaurant.countDocuments(query);

      let sortOption = { rating: -1 }; // Default sort by rating
      if (sortBy === "name") sortOption = { name: 1 };

      restaurants = await Restaurant.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Add distance field (will be calculated client-side)
      restaurants = restaurants.map(r => ({ ...r, distance: null }));
    } else {
      // Use $geoNear aggregation for geospatial query with distance
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [longitude, latitude]
            },
            distanceField: "distance",
            maxDistance: maxDistance,
            spherical: true,
            query: matchConditions,
            key: "location"  // Specify which 2dsphere index to use
          }
        }
      ];

      // Add sorting
      if (sortBy === "rating") {
        pipeline.push({ $sort: { rating: -1, distance: 1 } });
      } else if (sortBy === "name") {
        pipeline.push({ $sort: { name: 1 } });
      }
      // Default sort by distance is already applied by $geoNear

      // Get total count (without pagination)
      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await Restaurant.aggregate(countPipeline);
      total = countResult[0]?.total || 0;

      // Add pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limitNum });

      // Execute query
      restaurants = await Restaurant.aggregate(pipeline);
    }

    // Format response to match frontend expectations
    // Maps new schema fields to old field names for backward compatibility
    const formattedRestaurants = restaurants.map(r => ({
      id: r.sourceId || r._id.toString(),
      name: r.name,
      // Map new field names to old for frontend compatibility
      lat: r.latitude || r.lat,
      lng: r.longitude || r.lng,
      address: r.address?.formatted || r.address,
      rating: r.rating || null,
      userRatingCount: r.userRatingCount || null,
      priceLevel: r.priceLevel || null,
      priceLevelNum: r.priceLevelNum || null,
      cuisine: r.cuisine,
      locality: r.locality || r.address?.barangay,
      city: r.address?.city || r.city,
      hasOnlineDelivery: r.hasOnlineDelivery || false,
      hasTableBooking: r.hasTableBooking || false,
      isDeliveringNow: r.isDeliveringNow || false,
      averageCostForTwo: r.averageCostForTwo || null,
      currency: r.currency || "₱",
      googleMapsUri: r.googleMapsUri || null,
      zomatoUrl: r.zomatoUrl || null,
      // New schema has single type, convert to array for frontend
      types: r.types || (r.type ? [r.type] : []),
      // New fields from restaurants_2025
      type: r.type,
      brand: r.brand,
      phone: r.contact?.phone,
      website: r.contact?.website,
      openingHours: r.openingHours,
      // Handle distance - $geoNear returns METERS, convert to KM for frontend
      // When radius=0 (all mode), distance is null and frontend calculates client-side
      distance: r.distance != null ? (r.distance / 1000) : null,  // Convert to km
      distanceKm: r.distance != null ? (r.distance / 1000).toFixed(2) : null
    }));

    res.json({
      restaurants: formattedRestaurants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + restaurants.length < total
      },
      query: {
        lat: latitude,
        lng: longitude,
        radius: maxDistance
      }
    });

  } catch (err) {
    res.status(500).json({
      error: "Nearby search failed",
      detail: err.message
    });
  }
});

// Get all unique cities for dropdown filter
router.get("/cities", async (_req, res) => {
  try {
    const cities = await Restaurant.distinct("address.city");
    const filtered = cities.filter(c => c && c.trim()).sort();
    res.json({ cities: filtered });
  } catch (err) {
    res.status(500).json({ error: "Failed to get cities" });
  }
});

// Get all unique cuisine types for filter
router.get("/cuisines", async (_req, res) => {
  try {
    // Get both cuisine field and type field for comprehensive list
    const [cuisines, types] = await Promise.all([
      Restaurant.distinct("cuisine"),
      Restaurant.distinct("type")
    ]);
    // Combine and filter
    const combined = [...new Set([...cuisines, ...types])];
    const filtered = combined.filter(t => t && t.trim()).sort();
    res.json({ cuisines: filtered });
  } catch (err) {
    res.status(500).json({ error: "Failed to get cuisines" });
  }
});

// Get restaurant stats
router.get("/stats", async (_req, res) => {
  try {
    const [total, withCuisine, cities] = await Promise.all([
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ cuisine: { $exists: true, $ne: null } }),
      Restaurant.distinct("address.city")
    ]);
    res.json({
      total,
      withCuisine,
      cities: cities.filter(c => c).length
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// -------- Details ----------
router.get("/details/:placeId", async (req, res) => {
  try {
    const { placeId } = req.params;
    const headers = getPlacesHeaders([
      "id","displayName","formattedAddress","nationalPhoneNumber",
      "websiteUri","googleMapsUri","location","rating","userRatingCount",
      "priceLevel","types","currentOpeningHours","regularOpeningHours","editorialSummary"
    ].join(","));
    const { data } = await axios.get(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      { headers }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Place details failed", detail: err?.response?.data || err.message });
  }
});

// -------- Saved list / export ----------
router.get("/saved", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const skip = Math.max(parseInt(req.query.skip || "0", 10), 0);
    const countOnly = ["1","true"].includes(String(req.query.countOnly));

    const filter = {};
    if (req.query.types) {
      const arr = String(req.query.types).split(",").map(s => s.trim()).filter(Boolean);
      if (arr.length) filter.type = { $in: arr };
    }
    if (req.query.provider) filter.source = String(req.query.provider);

    if (countOnly) {
      const total = await Restaurant.countDocuments(filter);
      return res.json({ count: total });
    }

    const [docs, total] = await Promise.all([
      Restaurant.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments(filter),
    ]);
    res.json({ places: docs, total, skip, limit });
  } catch (err) {
    res.status(500).json({ error: "Saved list failed" });
  }
});

router.get("/saved/export", async (req, res) => {
  try {
    const filter = {};
    if (req.query.types) {
      const arr = String(req.query.types).split(",").map(s => s.trim()).filter(Boolean);
      if (arr.length) filter.type = { $in: arr };
    }
    if (req.query.provider) filter.source = String(req.query.provider);

    const docs = await Restaurant.find(filter).sort({ name: 1 }).lean();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", 'attachment; filename="ncr_food_places.json"');
    res.send(JSON.stringify({ exportedAt: new Date().toISOString(), count: docs.length, places: docs }, null, 2));
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
});

// -------- High-recall NCR sweep (with Mongo fallback) ----------
router.get("/search-ncr", async (req, res) => {
  const {
    types = "",
    keyword,
    minPrice, maxPrice, ratingMin, openNow, weekday, time,
    strict = "0",
    coverage = "high",                 // default trimmed from "ultra"
    passes = "nearby,generic,brand",   // still comprehensive
    citySweep = "1",
  } = req.query;

  try {
    const STRICT = ["1","true"].includes(String(strict));
    const CITY_SWEEP = ["1","true"].includes(String(citySweep));

    // Coverage presets (kept compact)
    const preset = (cov) => {
      if (cov === "ultra") return { rows: 9, cols: 9, radius: 6000, pageCap: 10 };
      if (cov === "max")   return { rows: 7, cols: 7, radius: 7000, pageCap: 8 };
      if (cov === "high")  return { rows: 5, cols: 5, radius: 9000, pageCap: 5 };
      return { rows: 3, cols: 3, radius: 10000, pageCap: 3 };
    };
    const { rows, cols, radius, pageCap } = preset(String(coverage).toLowerCase());

    const includedTypes = String(types || "").split(",").map(t => t.trim()).filter(Boolean);
    const want = new Set(String(passes).split(",").map(s => s.trim().toLowerCase()).filter(Boolean));

    // Passes
    const bag = new Map();

    if (want.has("nearby")) {
      const a = await crawlGridPass({ rows, cols, radius, pageCap, useText:false, includedTypes, rankPreference:"POPULARITY" });
      a.forEach((v,k)=>bag.set(k,v));
      const a2 = await crawlGridPass({ rows, cols, radius, pageCap, useText:false, includedTypes, rankPreference:"DISTANCE" });
      a2.forEach((v,k)=>bag.set(k,v));
    }

    if (want.has("text") && keyword && keyword.trim()) {
      const b = await crawlGridPass({ rows, cols, radius, pageCap, useText:true, textQuery: keyword.trim() });
      b.forEach((v,k)=>bag.set(k,v));
    }

    if (want.has("generic")) {
      for (const seed of GENERIC_TEXT_SEEDS) {
        const c = await crawlGridPass({ rows, cols, radius, pageCap, useText:true, textQuery: seed });
        c.forEach((v,k)=>bag.set(k,v));
      }
    }

    if (want.has("brand")) {
      // brand seeds are done inside city sweep to reduce requests,
      // but we'll include one grid pass too (light)
      const d = await crawlGridPass({ rows, cols, radius, pageCap, useText:true, textQuery: "Jollibee" });
      d.forEach((v,k)=>bag.set(k,v));
    }

    if (CITY_SWEEP) {
      const extra = await cityCenterSweep({ radiusNearby: 4200, pageCapNearby: 6, radiusText: 4800, pageCapText: 5 });
      extra.forEach((v,k)=>bag.set(k,v));
    }

    // Filter + (optional) strict NCR
    let places = Array.from(bag.values());

    if (minPrice !== "" || maxPrice !== "") {
      const lo = minPrice !== "" ? Number(minPrice) : 0;
      const hi = maxPrice !== "" ? Number(maxPrice) : 4;
      places = places.filter((p) => {
        const n = toPriceNum(p);
        return n === null ? true : n >= lo && n <= hi;
      });
    }
    if (ratingMin) places = places.filter((p) => (p.rating || 0) >= Number(ratingMin));
    if (String(openNow) === "true") {
      places = places.filter(
        (p) => p.currentOpeningHours?.openNow === true || p.regularOpeningHours?.openNow === true
      );
    }
    if (weekday !== undefined && weekday !== "" && time) {
      places = places.filter((p) => isOpenAt(p, Number(weekday), time));
    }
    if (STRICT) places = await filterStrictNCR(places);

    res.json({
      places,
      center: { lat: 14.5995, lng: 120.9842 },
      usedEndpoint: `grid-NCR/${coverage}/${Array.from(want).join("+")}${CITY_SWEEP?"-city":""}${STRICT?"-strict":""}`,
    });
  } catch (err) {
    // ---- Mongo fallback (online/offline) ----
    const q = { latitude: { $gte: NCR_BOUNDS.south, $lte: NCR_BOUNDS.north },
                longitude: { $gte: NCR_BOUNDS.west, $lte: NCR_BOUNDS.east } };
    if (keyword && keyword.trim()) {
      const re = new RegExp(keyword.trim(), "i");
      q.$or = [{ name: re }, { "address.formatted": re }];
    }
    if (types) {
      const t = String(types).split(",").map(s=>s.trim()).filter(Boolean);
      if (t.length) q.type = { $in: t };
    }

    const docs = await Restaurant.find(q).limit(20000).lean();
    const places = docs.map((d) => ({
      id: d.sourceId || d._id.toString(),
      displayName: { text: d.name },
      formattedAddress: d.address?.formatted || d.address,
      location: { latitude: d.latitude, longitude: d.longitude },
      rating: d.rating || null,
      userRatingCount: d.userRatingCount || null,
      priceLevel: d.priceLevelNum || d.priceLevel || null,
      types: d.type ? [d.type] : [],
      googleMapsUri: d.googleMapsUri || "",
      websiteUri: d.contact?.website || "",
    }));
    res.json({ places, center: { lat: 14.5995, lng: 120.9842 }, usedEndpoint: "offline-mongo" });
  }
});

// -------- Admin: crawl & upsert to Mongo ----------
router.post("/admin/crawl-ncr-food", requireAdmin, async (req, res) => {
  try {
    const {
      types = "",
      strict = "0",
      coverage = "high",
      passes = "nearby,generic,brand",
      citySweep = "1",
      keyword = "",
    } = req.body || {};

    const STRICT = ["1","true"].includes(String(strict));
    const CITY_SWEEP = ["1","true"].includes(String(citySweep));

    const preset = (cov) => {
      if (cov === "ultra") return { rows: 9, cols: 9, radius: 6000, pageCap: 10 };
      if (cov === "max")   return { rows: 7, cols: 7, radius: 7000, pageCap: 8 };
      if (cov === "high")  return { rows: 5, cols: 5, radius: 9000, pageCap: 5 };
      return { rows: 3, cols: 3, radius: 10000, pageCap: 3 };
    };
    const { rows, cols, radius, pageCap } = preset(String(coverage).toLowerCase());
    const includedTypes = String(types || "").split(",").map(t => t.trim()).filter(Boolean);
    const want = new Set(String(passes).split(",").map(s => s.trim().toLowerCase()).filter(Boolean));

    const bag = new Map();

    if (want.has("nearby")) {
      const a = await crawlGridPass({ rows, cols, radius, pageCap, useText:false, includedTypes, rankPreference:"POPULARITY" });
      a.forEach((v,k)=>bag.set(k,v));
      const a2 = await crawlGridPass({ rows, cols, radius, pageCap, useText:false, includedTypes, rankPreference:"DISTANCE" });
      a2.forEach((v,k)=>bag.set(k,v));
    }
    if (want.has("text") && keyword && keyword.trim()) {
      const b = await crawlGridPass({ rows, cols, radius, pageCap, useText:true, textQuery: keyword.trim() });
      b.forEach((v,k)=>bag.set(k,v));
    }
    if (want.has("generic")) {
      for (const seed of GENERIC_TEXT_SEEDS) {
        const c = await crawlGridPass({ rows, cols, radius, pageCap, useText:true, textQuery: seed });
        c.forEach((v,k)=>bag.set(k,v));
      }
    }
    if (want.has("brand")) {
      const d = await crawlGridPass({ rows, cols, radius, pageCap, useText:true, textQuery: "Jollibee" });
      d.forEach((v,k)=>bag.set(k,v));
    }
    if (CITY_SWEEP) {
      const extra = await cityCenterSweep({});
      extra.forEach((v,k)=>bag.set(k,v));
    }

    let places = Array.from(bag.values());
    if (STRICT) places = await filterStrictNCR(places);

    const ops = places.map((p) => {
      const doc = normalizeForDb(p);
      return {
        updateOne: {
          filter: { googlePlaceId: doc.googlePlaceId },
          update: { $set: doc, $setOnInsert: { createdAt: new Date() } },
          upsert: true,
        },
      };
    });
    const result = ops.length ? await Restaurant.bulkWrite(ops, { ordered: false }) : null;

    res.json({
      ok: true,
      scanned: places.length,
      upserts: result ? (result.upsertedCount || 0) : 0,
      modified: result ? (result.modifiedCount || 0) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: "crawl failed", detail: err?.response?.data || err.message });
  }
});

// -------- Admin: fix indexes (safe to re-run) ----------
router.post("/admin/fix-indexes", requireAdmin, async (_req, res) => {
  try {
    try { await Restaurant.collection.dropIndex("placeId_1"); } catch {}
    await Restaurant.collection.createIndex({ googlePlaceId: 1 }, { unique: true, background: true, sparse: true });
    await Restaurant.collection.createIndex({ provider: 1, providerId: 1 }, { unique: true, background: true, sparse: true });
    await Restaurant.collection.createIndex({ name: 1 }, { background: true });
    await Restaurant.collection.createIndex({ lat: 1, lng: 1 }, { background: true });
    const idx = await Restaurant.collection.indexes();
    res.json({ ok: true, indexes: idx });
  } catch (err) {
    res.status(500).json({ error: "index fix failed", detail: err.message });
  }
});

module.exports = router;

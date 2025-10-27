// /server/routes/places.js
/* eslint-disable no-await-in-loop */
const express = require("express");
const axios = require("axios");
const FoodPlace = require("../models/FoodPlace");

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
      if (arr.length) filter.types = { $in: arr };
    }
    if (req.query.provider) filter.provider = String(req.query.provider);

    if (countOnly) {
      const total = await FoodPlace.countDocuments(filter);
      return res.json({ count: total });
    }

    const [docs, total] = await Promise.all([
      FoodPlace.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      FoodPlace.countDocuments(filter),
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
      if (arr.length) filter.types = { $in: arr };
    }
    if (req.query.provider) filter.provider = String(req.query.provider);

    const docs = await FoodPlace.find(filter).sort({ name: 1 }).lean();
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
    const q = { lat: { $gte: NCR_BOUNDS.south, $lte: NCR_BOUNDS.north },
                lng: { $gte: NCR_BOUNDS.west, $lte: NCR_BOUNDS.east } };
    if (keyword && keyword.trim()) {
      const re = new RegExp(keyword.trim(), "i");
      q.$or = [{ name: re }, { address: re }];
    }
    if (types) {
      const t = String(types).split(",").map(s=>s.trim()).filter(Boolean);
      if (t.length) q.types = { $in: t };
    }
    if (ratingMin) q.rating = { $gte: Number(ratingMin) };

    const docs = await FoodPlace.find(q).limit(20000).lean();
    const places = docs.map((d) => ({
      id: d.googlePlaceId || d.providerId || d._id.toString(),
      displayName: { text: d.name },
      formattedAddress: d.address,
      location: { latitude: d.lat, longitude: d.lng },
      rating: d.rating,
      userRatingCount: d.userRatingCount,
      priceLevel: Number.isFinite(d.priceLevelNum) ? d.priceLevelNum : d.priceLevel,
      types: d.types || [],
      googleMapsUri: d.googleMapsUri || "",
      websiteUri: d.websiteUri || "",
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
    const result = ops.length ? await FoodPlace.bulkWrite(ops, { ordered: false }) : null;

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
    try { await FoodPlace.collection.dropIndex("placeId_1"); } catch {}
    await FoodPlace.collection.createIndex({ googlePlaceId: 1 }, { unique: true, background: true, sparse: true });
    await FoodPlace.collection.createIndex({ provider: 1, providerId: 1 }, { unique: true, background: true, sparse: true });
    await FoodPlace.collection.createIndex({ name: 1 }, { background: true });
    await FoodPlace.collection.createIndex({ lat: 1, lng: 1 }, { background: true });
    const idx = await FoodPlace.collection.indexes();
    res.json({ ok: true, indexes: idx });
  } catch (err) {
    res.status(500).json({ error: "index fix failed", detail: err.message });
  }
});

module.exports = router;

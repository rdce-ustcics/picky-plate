/* eslint-disable no-await-in-loop */
const express = require("express");
const axios = require("axios");
const FoodPlace = require("../models/FoodPlace");

const router = express.Router();

// ======================== CONFIG / CONSTANTS ========================

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn("[Places] Missing GOOGLE_MAPS_API_KEY in /server/.env");
}

// Admin guard (for crawl / fix-index only)
function requireAdmin(req, res, next) {
  const token = req.get("X-Admin-Token");
  if (token && token === process.env.ADMIN_TOKEN) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// NCR bounding box (Metro Manila)
const NCR_BOUNDS = { north: 14.90, south: 14.28, east: 121.18, west: 120.92 };
function withinNCR(lat, lng) {
  return (
    lat >= NCR_BOUNDS.south &&
    lat <= NCR_BOUNDS.north &&
    lng >= NCR_BOUNDS.west &&
    lng <= NCR_BOUNDS.east
  );
}

// City centers (extra sweep catches edges like Navotas)
const CITY_CENTERS = [
  { name: "Manila",       lat: 14.5995, lng: 120.9842 },
  { name: "Quezon City",  lat: 14.6760, lng: 121.0437 },
  { name: "Caloocan",     lat: 14.6495, lng: 120.9820 },
  { name: "Makati",       lat: 14.5547, lng: 121.0244 },
  { name: "Pasig",        lat: 14.5764, lng: 121.0851 },
  { name: "Taguig",       lat: 14.5176, lng: 121.0509 },
  { name: "Mandaluyong",  lat: 14.5836, lng: 121.0409 },
  { name: "Marikina",     lat: 14.6507, lng: 121.1029 },
  { name: "Pasay",        lat: 14.5378, lng: 121.0014 },
  { name: "Parañaque",    lat: 14.4799, lng: 121.0198 },
  { name: "Las Piñas",    lat: 14.4511, lng: 120.9820 },
  { name: "Muntinlupa",   lat: 14.4081, lng: 121.0415 },
  { name: "Valenzuela",   lat: 14.7011, lng: 120.9830 },
  { name: "Navotas",      lat: 14.6664, lng: 120.9536 }, // 👈 your city
  { name: "Malabon",      lat: 14.6686, lng: 120.9566 },
  { name: "San Juan",     lat: 14.6019, lng: 121.0359 },
  { name: "Pateros",      lat: 14.5449, lng: 121.0661 },
];

// Optional strict city confirmation (reverse geocode)
const NCR_CITIES = new Set(CITY_CENTERS.map(c => c.name));

const _geocodeCache = new Map(); // "lat,lng" -> true/false

async function geocodeIsInNCR(lat, lng) {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (_geocodeCache.has(key)) return _geocodeCache.get(key);

  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}` +
    `&key=${GOOGLE_API_KEY}&result_type=administrative_area_level_1|administrative_area_level_2|locality`;

  try {
    const { data } = await axios.get(url);
    let ok = false;
    for (const r of data.results || []) {
      for (const c of r.address_components || []) {
        const t = c.types || [];
        const name = (c.long_name || "").toLowerCase();
        // Region (NCR)
        if (t.includes("administrative_area_level_1") &&
            (name.includes("metro manila") || name.includes("national capital region") || name === "ncr")) {
          ok = true; break;
        }
        // City / locality
        if ((t.includes("locality") || t.includes("administrative_area_level_2")) &&
            NCR_CITIES.has(c.long_name)) {
          ok = true; break;
        }
      }
      if (ok) break;
    }
    _geocodeCache.set(key, ok);
    return ok;
  } catch {
    _geocodeCache.set(key, false);
    return false;
  }
}

async function filterStrictNCR(places, concurrency = 6) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < places.length) {
      const idx = i++;
      const p = places[idx];
      const lat = p?.location?.latitude;
      const lng = p?.location?.longitude;
      if (lat == null || lng == null) continue;
      if (!withinNCR(lat, lng)) continue;
      const ok = await geocodeIsInNCR(lat, lng);
      if (ok) out.push(p);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, places.length) }, () => worker())
  );
  return out;
}

// Price helpers (Google Places v1 enums)
const PRICE_ENUM_TO_NUM = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};
const toPriceNum = (p) =>
  typeof p?.priceLevel === "number" ? p.priceLevel : PRICE_ENUM_TO_NUM[p.priceLevel] ?? null;

function normPriceNum(priceLevel) {
  if (typeof priceLevel === "number") return priceLevel;
  if (priceLevel in PRICE_ENUM_TO_NUM) return PRICE_ENUM_TO_NUM[priceLevel];
  return null;
}

// Opening hours helpers
const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
function isOpenAt(place, weekday, hhmm) {
  if (!hhmm || !place?.regularOpeningHours?.periods?.length) return true;
  const target = toMinutes(hhmm);
  const periods = place.regularOpeningHours.periods;
  // UI: 0=Sun..6=Sat; Google: 0=Mon..6=Sun
  const gWeekday = weekday === 0 ? 6 : weekday - 1;
  return periods.some((p) => {
    if (!p.open || !p.close) return false;
    if (p.open.day !== gWeekday) return false;
    const openMins = (p.open.hour || 0) * 60 + (p.open.minute || 0);
    const closeMins = (p.close.hour || 0) * 60 + (p.close.minute || 0);
    const spansNext = p.close.day !== p.open.day;
    if (spansNext) return target >= openMins || target < closeMins;
    return target >= openMins && target < closeMins;
  });
}

// Normalize a Google place to DB doc
function normalizeForDb(p) {
  return {
    googlePlaceId: p.id,
    provider: "google",
    providerId: p.id,
    name: p.displayName?.text || "",
    address: p.formattedAddress || "",
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    rating: p.rating ?? null,
    userRatingCount: p.userRatingCount ?? 0,
    priceLevel: p.priceLevel ?? null,
    priceLevelNum: normPriceNum(p.priceLevel),
    types: p.types || [],
    googleMapsUri: p.googleMapsUri || "",
    websiteUri: p.websiteUri || "",
    source: "crawler",
    updatedAt: new Date(),
  };
}

// Broad food types (safe for Nearby)
const WIDE_FOOD_TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "bar",
  "food_court",
  "meal_takeaway",
  "meal_delivery",
  "convenience_store",
  "supermarket",
  "ice_cream_shop",  // if unsupported, API ignores
  "juice_shop",      // if unsupported, API ignores
  "tea_house"        // if unsupported, API ignores
];

// Text seeds (generic + brands) to maximize recall
const GENERIC_TEXT_SEEDS = [
  "restaurant","food","eatery","fast food","cafe","bar","bakery",
  "milk tea","coffee shop","grill","bbq","pizza","silog","carinderia",
  "ihaw-ihaw","gotohan","tapsihan","pares","lomi","pancit","lugawan"
];

const BRAND_TEXT_SEEDS = [
  // big chains
  "Jollibee","McDonald's","KFC","Chowking","Greenwich","Mang Inasal",
  "Red Ribbon","Goldilocks","Starbucks","Tim Hortons","Dunkin",
  "Krispy Kreme","Shakey's","Pizza Hut","Yellow Cab","Burger King",
  "Wendy's","Subway","Bonchon","Army Navy","J.CO","Tiger Sugar",
  "Serenitea","Chatime","Gong cha","CoCo","Macao Imperial",
  // PH favorites & QSR
  "Andok's","Chooks-to-Go","Kenny Rogers Roasters","Max's Restaurant",
  "North Park","Classic Savory","Pancake House","Teriyaki Boy",
  "Tokyo Tokyo","Mary Grace","Conti's","Seattle's Best Coffee","Figaro",
  "Angel's Burger","Minute Burger","Burger Machine","Angel's Pizza",
  "Turks","Shawarma Shack","Potato Corner","Zark's Burger","ArmyNavy"
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ============================== CORE CRAWLERS ==============================

/**
 * Crawl one grid pass (Nearby or Text) and fill into a Map(id -> place).
 * Runs 20-per-page paging up to pageCap. Optional rankPreference for Nearby.
 */
async function crawlGridPass({
  rows, cols, radius, pageCap,
  useText, textQuery, includedTypes,
  headers, fieldMask,
  rankPreference, // "POPULARITY" | "DISTANCE"
  throttleMs = 100,
}) {
  const latStep = (NCR_BOUNDS.north - NCR_BOUNDS.south) / (rows - 1);
  const lngStep = (NCR_BOUNDS.east - NCR_BOUNDS.west) / (cols - 1);
  const all = new Map();

  const fetchPages = async (url, body, pageCapLocal = pageCap) => {
    let token = null, page = 0;
    do {
      const payload = { ...body };
      if (token) payload.pageToken = token;
      const { data } = await axios.post(url, payload, { headers });
      const list = data.places || [];
      for (const p of list) {
        const la = p?.location?.latitude, lo = p?.location?.longitude;
        if (!la || !lo) continue;
        if (!withinNCR(la, lo)) continue;
        all.set(p.id, p);
      }
      token = data.nextPageToken || null;
      page += 1;
      if (page >= pageCapLocal) token = null;
      if (throttleMs) await sleep(throttleMs);
    } while (token);
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lat = NCR_BOUNDS.south + r * latStep;
      const lng = NCR_BOUNDS.west + c * lngStep;

      if (useText) {
        const url = "https://places.googleapis.com/v1/places:searchText";
        const body = {
          textQuery: String(textQuery),
          languageCode: "en",
          regionCode: "PH",
          locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
          maxResultCount: 20,
        };
        if (includedTypes && includedTypes.length) body.includedTypes = includedTypes;
        await fetchPages(url, body);
      } else {
        const url = "https://places.googleapis.com/v1/places:searchNearby";
        const body = {
          languageCode: "en",
          regionCode: "PH",
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
          includedTypes: includedTypes && includedTypes.length ? includedTypes : WIDE_FOOD_TYPES,
          maxResultCount: 20,
        };
        if (rankPreference) body.rankPreference = rankPreference;
        await fetchPages(url, body);
      }
    }
  }

  return all; // Map
}

/** City-center sweep: per NCR city, do Nearby (POPULARITY + DISTANCE) and brand seeds */
async function cityCenterSweep({
  radiusNearby = 4000,
  pageCapNearby = 8,
  radiusText = 4500,
  pageCapText = 6,
  headers, fieldMask,
}) {
  const bag = new Map();

  // Nearby POPULARITY + DISTANCE
  for (const pref of ["POPULARITY", "DISTANCE"]) {
    const mapN = await (async () => {
      const all = new Map();
      for (const city of CITY_CENTERS) {
        const url = "https://places.googleapis.com/v1/places:searchNearby";
        const fetchPages = async (body) => {
          let token = null, page = 0;
          do {
            const payload = { ...body };
            if (token) payload.pageToken = token;
            const { data } = await axios.post(url, payload, { headers });
            const list = data.places || [];
            for (const p of list) {
              const la = p?.location?.latitude, lo = p?.location?.longitude;
              if (!la || !lo) continue;
              if (!withinNCR(la, lo)) continue;
              all.set(p.id, p);
            }
            token = data.nextPageToken || null;
            page += 1;
            if (page >= pageCapNearby) token = null;
            await sleep(80);
          } while (token);
        };

        await fetchPages({
          languageCode: "en",
          regionCode: "PH",
          locationRestriction: { circle: { center: { latitude: city.lat, longitude: city.lng }, radius: radiusNearby } },
          includedTypes: WIDE_FOOD_TYPES,
          rankPreference: pref,
          maxResultCount: 20,
        });
      }
      return all;
    })();
    mapN.forEach((v, k) => bag.set(k, v));
  }

  // Brand seeds per city
  for (const city of CITY_CENTERS) {
    for (const seed of BRAND_TEXT_SEEDS) {
      const url = "https://places.googleapis.com/v1/places:searchText";
      let token = null, page = 0;
      do {
        const body = {
          textQuery: seed,
          languageCode: "en",
          regionCode: "PH",
          locationBias: { circle: { center: { latitude: city.lat, longitude: city.lng }, radius: radiusText } },
          maxResultCount: 20,
          pageToken: token || undefined,
        };
        const { data } = await axios.post(url, body, { headers });
        const list = data.places || [];
        for (const p of list) {
          const la = p?.location?.latitude, lo = p?.location?.longitude;
          if (!la || !lo) continue;
          if (!withinNCR(la, lo)) continue;
          bag.set(p.id, p);
        }
        token = data.nextPageToken || null;
        page += 1;
        if (page >= pageCapText) token = null;
        await sleep(80);
      } while (token);
    }
  }

  return bag;
}

// ============================== ROUTES ==============================

// Health
router.get("/ping", (_req, res) => res.json({ ok: true }));

// ----------- Search (single center) -----------
router.get("/search", async (req, res) => {
  try {
    const {
      lat = 14.5995,
      lng = 120.9842,
      radius = 25000,
      types = "restaurant",
      keyword,
      minPrice,
      maxPrice,
      ratingMin,
      openNow,
      weekday,
      time,
      pageToken,
    } = req.query;

    const includedTypes = String(types || "")
      .split(",").map((t) => t.trim()).filter(Boolean);

    const useText = Boolean(keyword && String(keyword).trim().length > 0);

    // Only include types with Text Search if the user explicitly provided them
    const rawTypes = (req.query.types || "").trim();
    const shouldIncludeTypes =
      !useText || (useText && includedTypes.length > 0 && rawTypes !== "restaurant");

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.rating",
      "places.userRatingCount",
      "places.priceLevel",
      "places.types",
      "places.businessStatus",
      "places.currentOpeningHours",
      "places.regularOpeningHours",
      "places.googleMapsUri",
      "places.websiteUri",
    ].join(",");

    const headers = {
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": fieldMask,
    };

    let url, body;
    if (useText) {
      url = "https://places.googleapis.com/v1/places:searchText";
      body = {
        textQuery: String(keyword),
        languageCode: "en",
        regionCode: "PH",
        pageToken: pageToken || undefined,
        locationBias: {
          circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: Number(radius) }
        },
        maxResultCount: 20,
      };
      if (shouldIncludeTypes) body.includedTypes = includedTypes;
    } else {
      url = "https://places.googleapis.com/v1/places:searchNearby";
      body = {
        languageCode: "en",
        regionCode: "PH",
        pageToken: pageToken || undefined,
        locationRestriction: {
          circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: Number(radius) }
        },
        includedTypes: includedTypes.length ? includedTypes : ["restaurant"],
        maxResultCount: 20,
      };
    }

    const { data } = await axios.post(url, body, { headers });

    let places = (data.places || []).filter((p) => {
      const la = p?.location?.latitude, lo = p?.location?.longitude;
      return la && lo ? withinNCR(la, lo) : true;
    });

    // Filters
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

    res.json({
      places,
      nextPageToken: data.nextPageToken || null,
      center: { lat: Number(lat), lng: Number(lng) },
      usedEndpoint: useText ? "searchText" : "searchNearby",
    });
  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error("[Places search] error:", detail);
    res.status(500).json({ error: "Places search failed", detail });
  }
});

// ----------- Details -----------
router.get("/details/:placeId", async (req, res) => {
  try {
    const { placeId } = req.params;
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const headers = {
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": [
        "id","displayName","formattedAddress","nationalPhoneNumber",
        "websiteUri","googleMapsUri","location","rating","userRatingCount",
        "priceLevel","types","currentOpeningHours","regularOpeningHours","editorialSummary"
      ].join(","),
    };
    const { data } = await axios.get(url, { headers });
    res.json(data);
  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error("[Places details] error:", detail);
    res.status(500).json({ error: "Place details failed", detail });
  }
});

// ----------- High-recall NCR sweep (multi-pass + city sweep) -----------
/**
 * Query params:
 * - keyword
 * - types
 * - minPrice, maxPrice, ratingMin, openNow, weekday, time
 * - strict=0|1                    (optional reverse-geocode confirmation)
 * - coverage=normal|high|max|ultra
 * - passes=nearby|text|generic|brand (comma; default: nearby,generic)
 * - citySweep=0|1                 (extra per-city passes; default: 1)
 */
router.get("/search-ncr", async (req, res) => {
  try {
    const {
      types = "",
      keyword,
      minPrice,
      maxPrice,
      ratingMin,
      openNow,
      weekday,
      time,
      strict = "0",
      coverage = "ultra",
      passes = "nearby,generic,brand",
      citySweep = "1",
    } = req.query;

    const STRICT = strict === "1" || strict === "true";
    const CITY_SWEEP = citySweep === "1" || citySweep === "true";

    // Coverage presets
    const preset = (cov) => {
      if (cov === "ultra") return { rows: 9, cols: 9, radius: 6000, pageCap: 10 };
      if (cov === "max")   return { rows: 7, cols: 7, radius: 7000, pageCap: 8 };
      if (cov === "high")  return { rows: 5, cols: 5, radius: 9000, pageCap: 5 };
      return { rows: 3, cols: 3, radius: 10000, pageCap: 3 };
    };
    const { rows, cols, radius, pageCap } = preset(String(coverage).toLowerCase());

    const includedTypes = String(types || "")
      .split(",").map((t) => t.trim()).filter(Boolean);

    const fieldMask = [
      "places.id","places.displayName","places.formattedAddress","places.location",
      "places.rating","places.userRatingCount","places.priceLevel","places.types",
      "places.businessStatus","places.currentOpeningHours","places.regularOpeningHours",
      "places.googleMapsUri","places.websiteUri",
    ].join(",");

    const headers = {
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": fieldMask,
    };

    const want = new Set(
      String(passes || "nearby,generic")
        .split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    );

    const bag = new Map();

    // Pass A: Nearby POPULARITY
    if (want.has("nearby")) {
      const mapA = await crawlGridPass({
        rows, cols, radius, pageCap,
        useText: false, textQuery: null,
        includedTypes, headers, fieldMask,
        rankPreference: "POPULARITY",
      });
      mapA.forEach((v, k) => bag.set(k, v));

      // Pass A.2: Nearby DISTANCE (catches different set)
      const mapA2 = await crawlGridPass({
        rows, cols, radius, pageCap,
        useText: false, textQuery: null,
        includedTypes, headers, fieldMask,
        rankPreference: "DISTANCE",
      });
      mapA2.forEach((v, k) => bag.set(k, v));
    }

    // Pass B: Text with user keyword (if provided)
    if (want.has("text") && keyword && keyword.trim()) {
      const mapB = await crawlGridPass({
        rows, cols, radius, pageCap,
        useText: true,
        textQuery: keyword.trim(),
        includedTypes: [], // avoid over-restrict
        headers, fieldMask,
      });
      mapB.forEach((v, k) => bag.set(k, v));
    }

    // Pass C: Generic text seeds
    if (want.has("generic")) {
      for (const seed of GENERIC_TEXT_SEEDS) {
        const mapC = await crawlGridPass({
          rows, cols, radius, pageCap,
          useText: true,
          textQuery: seed,
          includedTypes: [],
          headers, fieldMask,
        });
        mapC.forEach((v, k) => bag.set(k, v));
      }
    }

    // Pass D: Brand seeds
    if (want.has("brand")) {
      for (const seed of BRAND_TEXT_SEEDS) {
        const mapD = await crawlGridPass({
          rows, cols, radius, pageCap,
          useText: true,
          textQuery: seed,
          includedTypes: [],
          headers, fieldMask,
        });
        mapD.forEach((v, k) => bag.set(k, v));
      }
    }

    // Extra per-city sweep (Navotas et al.)
    if (CITY_SWEEP) {
      const cityBag = await cityCenterSweep({
        radiusNearby: 4200,
        pageCapNearby: 8,
        radiusText: 4800,
        pageCapText: 6,
        headers, fieldMask,
      });
      cityBag.forEach((v, k) => bag.set(k, v));
    }

    let places = Array.from(bag.values());

    // Light filters (preserve recall)
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

    if (STRICT) {
      places = await filterStrictNCR(places);
    }

    res.json({
      places,
      center: { lat: 14.5995, lng: 120.9842 },
      usedEndpoint: `grid-NCR/${coverage}/${Array.from(want).join("+")}${CITY_SWEEP ? "-city" : ""}${STRICT ? "-strict" : ""}`,
    });
  } catch (err) {
    // -------- OFFLINE FALLBACK from Mongo --------
    console.error("[Places search-ncr] error, falling back to Mongo:", err?.response?.data || err.message);

    const {
      types = "",
      keyword,
      minPrice,
      maxPrice,
      ratingMin,
    } = req.query;

    const q = {
      lat: { $gte: NCR_BOUNDS.south, $lte: NCR_BOUNDS.north },
      lng: { $gte: NCR_BOUNDS.west, $lte: NCR_BOUNDS.east },
    };

    if (keyword && keyword.trim()) {
      const re = new RegExp(keyword.trim(), "i");
      q.$or = [{ name: re }, { address: re }];
    }

    const typeList = String(types || "").split(",").map(t => t.trim()).filter(Boolean);
    if (typeList.length) q.types = { $in: typeList };
    if (ratingMin) q.rating = { $gte: Number(ratingMin) };
    if (minPrice !== "" || maxPrice !== "") {
      const lo = minPrice !== "" ? Number(minPrice) : 0;
      const hi = maxPrice !== "" ? Number(maxPrice) : 4;
      q.priceLevelNum = { $gte: lo, $lte: hi };
    }

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

    res.json({
      places,
      center: { lat: 14.5995, lng: 120.9842 },
      usedEndpoint: "offline-mongo",
    });
  }
});

// ----------- ADMIN: crawl Google (multi-pass + city sweep) & upsert to Mongo -----------
/**
 * Body:
 * {
 *   "types": "restaurant,cafe,...",       // optional; Nearby pass
 *   "strict": "0|1",                      // optional reverse-geocode confirmation
 *   "coverage": "normal|high|max|ultra",  // default: ultra
 *   "passes": "nearby,text,generic,brand",// default: nearby,generic,brand
 *   "citySweep": "0|1",                   // default: 1
 *   "keyword": ""                         // optional single seed
 * }
 */
router.post("/admin/crawl-ncr-food", requireAdmin, async (req, res) => {
  try {
    const {
      types = "",
      strict = "0",
      coverage = "ultra",
      passes = "nearby,generic,brand",
      citySweep = "1",
      keyword = "",
    } = req.body || {};

    const STRICT = strict === "1" || strict === "true";
    const CITY_SWEEP = citySweep === "1" || citySweep === "true";

    const preset = (cov) => {
      if (cov === "ultra") return { rows: 9, cols: 9, radius: 6000, pageCap: 10 };
      if (cov === "max")   return { rows: 7, cols: 7, radius: 7000, pageCap: 8 };
      if (cov === "high")  return { rows: 5, cols: 5, radius: 9000, pageCap: 5 };
      return { rows: 3, cols: 3, radius: 10000, pageCap: 3 };
    };
    const { rows, cols, radius, pageCap } = preset(String(coverage).toLowerCase());

    const includedTypes = String(types || "")
      .split(",").map((t) => t.trim()).filter(Boolean);

    const fieldMask = [
      "places.id","places.displayName","places.formattedAddress","places.location",
      "places.rating","places.userRatingCount","places.priceLevel","places.types",
      "places.businessStatus","places.currentOpeningHours","places.regularOpeningHours",
      "places.googleMapsUri","places.websiteUri",
    ].join(",");

    const headers = {
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": fieldMask,
    };

    const want = new Set(
      String(passes || "nearby,generic,brand")
        .split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    );

    const bag = new Map();

    // Nearby POPULARITY + DISTANCE
    if (want.has("nearby")) {
      const mapA = await crawlGridPass({
        rows, cols, radius, pageCap,
        useText: false, textQuery: null,
        includedTypes, headers, fieldMask,
        rankPreference: "POPULARITY",
      });
      mapA.forEach((v, k) => bag.set(k, v));
      const mapA2 = await crawlGridPass({
        rows, cols, radius, pageCap,
        useText: false, textQuery: null,
        includedTypes, headers, fieldMask,
        rankPreference: "DISTANCE",
      });
      mapA2.forEach((v, k) => bag.set(k, v));
    }

    // Optional one text keyword
    if (want.has("text") && keyword && keyword.trim()) {
      const mapB = await crawlGridPass({
        rows, cols, radius, pageCap,
        useText: true, textQuery: keyword.trim(),
        includedTypes: [], headers, fieldMask,
      });
      mapB.forEach((v, k) => bag.set(k, v));
    }

    // Generic text seeds
    if (want.has("generic")) {
      for (const seed of GENERIC_TEXT_SEEDS) {
        const mapC = await crawlGridPass({
          rows, cols, radius, pageCap,
          useText: true, textQuery: seed,
          includedTypes: [], headers, fieldMask,
        });
        mapC.forEach((v, k) => bag.set(k, v));
      }
    }

    // Brand seeds
    if (want.has("brand")) {
      for (const seed of BRAND_TEXT_SEEDS) {
        const mapD = await crawlGridPass({
          rows, cols, radius, pageCap,
          useText: true, textQuery: seed,
          includedTypes: [], headers, fieldMask,
        });
        mapD.forEach((v, k) => bag.set(k, v));
      }
    }

    // Extra per-city sweep
    if (CITY_SWEEP) {
      const cityBag = await cityCenterSweep({
        radiusNearby: 4200,
        pageCapNearby: 8,
        radiusText: 4800,
        pageCapText: 6,
        headers, fieldMask,
      });
      cityBag.forEach((v, k) => bag.set(k, v));
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
    console.error("[admin/crawl-ncr-food] error:", err?.response?.data || err.message);
    res.status(500).json({ error: "crawl failed", detail: err?.response?.data || err.message });
  }
});

// ----------- ADMIN: OSM crawl (optional extra coverage) -----------
router.post("/admin/osm-crawl", requireAdmin, async (_req, res) => {
  try {
    const bbox = `${NCR_BOUNDS.south},${NCR_BOUNDS.west},${NCR_BOUNDS.north},${NCR_BOUNDS.east}`;
    const query = `
[out:json][timeout:120];
(
  node["amenity"~"restaurant|fast_food|cafe|bar|food_court"]["name"](${bbox});
  way["amenity"~"restaurant|fast_food|cafe|bar|food_court"]["name"](${bbox});
  relation["amenity"~"restaurant|fast_food|cafe|bar|food_court"]["name"](${bbox});
  node["shop"~"bakery|convenience|supermarket"]["name"](${bbox});
  way["shop"~"bakery|convenience|supermarket"]["name"](${bbox});
  relation["shop"~"bakery|convenience|supermarket"]["name"](${bbox});
);
out center;
`.trim();

    const { data } = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query,
      { headers: { "Content-Type": "text/plain" } }
    );

    const elements = Array.isArray(data?.elements) ? data.elements : [];
    if (!elements.length) return res.json({ ok: true, scanned: 0, upserts: 0, modified: 0 });

    const ops = [];
    for (const el of elements) {
      const tags = el.tags || {};
      const name = tags.name;
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!name || lat == null || lng == null) continue;
      if (!withinNCR(lat, lng)) continue;

      const types = [];
      if (tags.amenity) types.push(tags.amenity);
      if (tags.shop) types.push(tags.shop);

      const doc = {
        provider: "osm",
        providerId: `${el.type}/${el.id}`,
        googlePlaceId: undefined,
        name,
        address: tags["addr:full"] || "",
        lat, lng,
        rating: null,
        userRatingCount: 0,
        priceLevel: null,
        priceLevelNum: null,
        types,
        googleMapsUri: "",
        websiteUri: tags.website || "",
        source: "osm",
        updatedAt: new Date(),
      };

      ops.push({
        updateOne: {
          filter: { provider: "osm", providerId: doc.providerId },
          update: { $set: doc, $setOnInsert: { createdAt: new Date() } },
          upsert: true,
        },
      });
    }

    const result = ops.length ? await FoodPlace.bulkWrite(ops, { ordered: false }) : null;
    res.json({
      ok: true,
      scanned: elements.length,
      upserts: result ? (result.upsertedCount || 0) : 0,
      modified: result ? (result.modifiedCount || 0) : 0,
    });
  } catch (err) {
    console.error("[admin/osm-crawl] error:", err?.response?.data || err.message);
    res.status(500).json({ error: "osm crawl failed", detail: err?.response?.data || err.message });
  }
});

// ----------- ADMIN: fix indexes (safe to re-run) -----------
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

// ----------- Saved list (UI & export) -----------
router.get("/saved", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const skip = Math.max(parseInt(req.query.skip || "0", 10), 0);
    const countOnly = req.query.countOnly === "1" || req.query.countOnly === "true";

    const filter = {};
    if (req.query.types) {
      const arr = String(req.query.types)
        .split(",").map(s => s.trim()).filter(Boolean);
      if (arr.length) filter.types = { $in: arr };
    }
    if (req.query.provider) {
      filter.provider = String(req.query.provider);
    }

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
    console.error("[/saved] error:", err);
    res.status(500).json({ error: "Saved list failed" });
  }
});

router.get("/saved/export", async (req, res) => {
  try {
    const filter = {};
    if (req.query.types) {
      const arr = String(req.query.types)
        .split(",").map(s => s.trim()).filter(Boolean);
      if (arr.length) filter.types = { $in: arr };
    }
    if (req.query.provider) {
      filter.provider = String(req.query.provider);
    }

    const docs = await FoodPlace.find(filter).sort({ name: 1 }).lean();

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", 'attachment; filename="ncr_food_places.json"');

    res.send(
      JSON.stringify(
        { exportedAt: new Date().toISOString(), count: docs.length, places: docs },
        null,
        2
      )
    );
  } catch (err) {
    console.error("[/saved/export] error:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

module.exports = router;

// /server/lib/places-helpers.js
/* eslint-disable no-await-in-loop */
const axios = require("axios");

// ======== ENV / GOOGLE ========
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn("[Places] Missing GOOGLE_MAPS_API_KEY in /server/.env");
}
const PLACES_FIELD_MASK = [
  "places.id","places.displayName","places.formattedAddress","places.location",
  "places.rating","places.userRatingCount","places.priceLevel","places.types",
  "places.businessStatus","places.currentOpeningHours","places.regularOpeningHours",
  "places.googleMapsUri","places.websiteUri",
].join(",");

function getPlacesHeaders(fieldMask = PLACES_FIELD_MASK) {
  return { "X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": fieldMask };
}

// ======== NCR / BOUNDS / CITIES ========
const NCR_BOUNDS = { north: 14.90, south: 14.28, east: 121.18, west: 120.92 };
function withinNCR(lat, lng) {
  return lat >= NCR_BOUNDS.south && lat <= NCR_BOUNDS.north &&
         lng >= NCR_BOUNDS.west && lng <= NCR_BOUNDS.east;
}

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
  { name: "Navotas",      lat: 14.6664, lng: 120.9536 },
  { name: "Malabon",      lat: 14.6686, lng: 120.9566 },
  { name: "San Juan",     lat: 14.6019, lng: 121.0359 },
  { name: "Pateros",      lat: 14.5449, lng: 121.0661 },
];

const NCR_CITIES = new Set(CITY_CENTERS.map(c => c.name));

// ======== PRICE / OPEN HOURS ========
const PRICE_ENUM_TO_NUM = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};
const toPriceNum = (p) =>
  typeof p?.priceLevel === "number" ? p.priceLevel : PRICE_ENUM_TO_NUM[p.priceLevel] ?? null;
const normPriceNum = (priceLevel) => {
  if (typeof priceLevel === "number") return priceLevel;
  if (priceLevel in PRICE_ENUM_TO_NUM) return PRICE_ENUM_TO_NUM[priceLevel];
  return null;
};

const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
function isOpenAt(place, weekday, hhmm) {
  if (!hhmm || !place?.regularOpeningHours?.periods?.length) return true;
  const target = toMinutes(hhmm);
  const periods = place.regularOpeningHours.periods;
  const gWeekday = weekday === 0 ? 6 : weekday - 1; // UI 0=Sun .. Google 6=Sun
  return periods.some((p) => {
    if (!p.open || !p.close) return false;
    if (p.open.day !== gWeekday) return false;
    const openMins = (p.open.hour || 0) * 60 + (p.open.minute || 0);
    const closeMins = (p.close.hour || 0) * 60 + (p.close.minute || 0);
    const spans = p.close.day !== p.open.day;
    if (spans) return target >= openMins || target < closeMins;
    return target >= openMins && target < closeMins;
  });
}

// ======== SEEDS / TYPES ========
const WIDE_FOOD_TYPES = [
  "restaurant","cafe","bakery","bar","food_court",
  "meal_takeaway","meal_delivery","convenience_store","supermarket",
  "ice_cream_shop","juice_shop","tea_house" // ignored if unsupported
];

const GENERIC_TEXT_SEEDS = [
  "restaurant","food","eatery","fast food","cafe","bar","bakery",
  "milk tea","coffee shop","grill","bbq","pizza","silog","carinderia",
  "ihaw-ihaw","gotohan","tapsihan","pares","lomi","pancit","lugawan"
];

const BRAND_TEXT_SEEDS = [
  "Jollibee","McDonald's","KFC","Chowking","Greenwich","Mang Inasal",
  "Red Ribbon","Goldilocks","Starbucks","Tim Hortons","Dunkin",
  "Krispy Kreme","Shakey's","Pizza Hut","Yellow Cab","Burger King",
  "Wendy's","Subway","Bonchon","Army Navy","J.CO","Tiger Sugar",
  "Serenitea","Chatime","Gong cha","CoCo","Macao Imperial",
  "Andok's","Chooks-to-Go","Kenny Rogers Roasters","Max's Restaurant",
  "North Park","Classic Savory","Pancake House","Tokyo Tokyo",
  "Mary Grace","Conti's","Seattle's Best Coffee","Figaro",
  "Angel's Burger","Minute Burger","Burger Machine","Angel's Pizza",
  "Turks","Shawarma Shack","Potato Corner","Zark's Burger","ArmyNavy"
];

// ======== REVERSE GEOCODE (strict NCR) ========
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
        if (t.includes("administrative_area_level_1") &&
            (name.includes("metro manila") || name.includes("national capital region") || name === "ncr")) { ok = true; break; }
        if ((t.includes("locality") || t.includes("administrative_area_level_2")) &&
            NCR_CITIES.has(c.long_name)) { ok = true; break; }
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
      const la = p?.location?.latitude, lo = p?.location?.longitude;
      if (la == null || lo == null) continue;
      if (!withinNCR(la, lo)) continue;
      if (await geocodeIsInNCR(la, lo)) out.push(p);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, places.length) }, () => worker()));
  return out;
}

// ======== NORMALIZER ========
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

// ======== UTILS ========
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
  // env / headers
  PLACES_FIELD_MASK, getPlacesHeaders,
  // bounds / cities
  NCR_BOUNDS, withinNCR, CITY_CENTERS, NCR_CITIES,
  // price / hours
  toPriceNum, normPriceNum, isOpenAt,
  // seeds / types
  WIDE_FOOD_TYPES, GENERIC_TEXT_SEEDS, BRAND_TEXT_SEEDS,
  // geocode strict NCR
  geocodeIsInNCR, filterStrictNCR,
  // normalizer
  normalizeForDb,
  // utils
  sleep,
};

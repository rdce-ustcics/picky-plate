// /server/lib/places-crawl.js
/* eslint-disable no-await-in-loop */
const axios = require("axios");
const {
  NCR_BOUNDS, withinNCR, CITY_CENTERS,
  WIDE_FOOD_TYPES, BRAND_TEXT_SEEDS,
  getPlacesHeaders, PLACES_FIELD_MASK, sleep,
} = require("./places-helpers");

// One grid pass (Nearby or Text). Returns Map<id, place>
async function crawlGridPass({
  rows, cols, radius, pageCap,
  useText, textQuery, includedTypes,
  rankPreference, // "POPULARITY" | "DISTANCE"
  throttleMs = 80,
}) {
  const headers = getPlacesHeaders(PLACES_FIELD_MASK);
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
        if (includedTypes?.length) body.includedTypes = includedTypes;
        await fetchPages(url, body);
      } else {
        const url = "https://places.googleapis.com/v1/places:searchNearby";
        const body = {
          languageCode: "en",
          regionCode: "PH",
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
          includedTypes: includedTypes?.length ? includedTypes : WIDE_FOOD_TYPES,
          maxResultCount: 20,
          rankPreference,
        };
        await fetchPages(url, body);
      }
    }
  }
  return all;
}

// Extra passes per city (Nearby POPULARITY/DISTANCE + brand seeds)
async function cityCenterSweep({
  radiusNearby = 4200, pageCapNearby = 6,
  radiusText = 4800, pageCapText = 5,
}) {
  const headers = getPlacesHeaders(PLACES_FIELD_MASK);
  const bag = new Map();

  // Nearby POPULARITY + DISTANCE
  for (const pref of ["POPULARITY", "DISTANCE"]) {
    for (const city of CITY_CENTERS) {
      const url = "https://places.googleapis.com/v1/places:searchNearby";
      let token = null, page = 0;
      do {
        const body = {
          languageCode: "en",
          regionCode: "PH",
          locationRestriction: { circle: { center: { latitude: city.lat, longitude: city.lng }, radius: radiusNearby } },
          includedTypes: WIDE_FOOD_TYPES,
          maxResultCount: 20,
          rankPreference: pref,
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
        if (page >= pageCapNearby) token = null;
        await sleep(60);
      } while (token);
    }
  }

  // Brand text per city
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
        await sleep(60);
      } while (token);
    }
  }
  return bag;
}

module.exports = { crawlGridPass, cityCenterSweep };

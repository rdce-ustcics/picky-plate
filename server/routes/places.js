// server/routes/places.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn("[Places] Missing GOOGLE_MAPS_API_KEY in /server/.env");
}

// Metro Manila (NCR) bounds
const NCR_BOUNDS = { north: 14.90, south: 14.28, east: 121.18, west: 120.92 };
function withinNCR(lat, lng) {
  return (
    lat >= NCR_BOUNDS.south &&
    lat <= NCR_BOUNDS.north &&
    lng >= NCR_BOUNDS.west &&
    lng <= NCR_BOUNDS.east
  );
}

// ---- helpers ----

// "open at" filtering
const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

// weekday: 0=Sun..6=Sat (from UI) ; Google v1 uses 0=Mon..6=Sun
function isOpenAt(place, weekday, hhmm) {
  if (!hhmm || !place?.regularOpeningHours?.periods?.length) return true;
  const target = toMinutes(hhmm);
  const periods = place.regularOpeningHours.periods;
  const gWeekday = weekday === 0 ? 6 : weekday - 1;

  return periods.some((p) => {
    if (!p.open || !p.close) return false;
    if (p.open.day !== gWeekday) return false;

    const openMins = (p.open.hour || 0) * 60 + (p.open.minute || 0);
    const closeMins = (p.close.hour || 0) * 60 + (p.close.minute || 0);
    const spansNextDay = p.close.day !== p.open.day;

    if (spansNextDay) return target >= openMins || target < closeMins;
    return target >= openMins && target < closeMins;
  });
}

// Map Places v1 price enums -> 0..4 (for min/max filtering)
const PRICE_MAP = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};
const toPriceNum = (p) =>
  typeof p?.priceLevel === "number" ? p.priceLevel : PRICE_MAP[p.priceLevel] ?? null;

// ------------------

router.get("/ping", (_req, res) => res.json({ ok: true }));

/**
 * GET /api/places/search
 * Query: lat,lng,radius,types,keyword,minPrice,maxPrice,ratingMin,openNow,weekday,time,pageToken
 */
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

    const includedTypes = String(types)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // Use searchText when keyword is present, else searchNearby
    const useText = Boolean(keyword && String(keyword).trim().length > 0);

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
        locationRestriction: {
          rectangle: {
            low: { latitude: NCR_BOUNDS.south, longitude: NCR_BOUNDS.west },
            high: { latitude: NCR_BOUNDS.north, longitude: NCR_BOUNDS.east },
          },
        },
        includedTypes: includedTypes.length ? includedTypes : undefined,
        maxResultCount: 20,
      };
    } else {
      url = "https://places.googleapis.com/v1/places:searchNearby";
      body = {
        languageCode: "en",
        regionCode: "PH",
        pageToken: pageToken || undefined,
        locationRestriction: {
          circle: {
            center: { latitude: Number(lat), longitude: Number(lng) },
            radius: Number(radius),
          },
        },
        includedTypes: includedTypes.length ? includedTypes : ["restaurant"],
        maxResultCount: 20,
      };
    }

    const { data } = await axios.post(url, body, { headers });

    let places = (data.places || []).filter((p) =>
      p?.location?.latitude && p?.location?.longitude
        ? withinNCR(p.location.latitude, p.location.longitude)
        : true
    );

    // Price filter (expects min/max as 0..4)
    if (minPrice || maxPrice) {
      const lo = minPrice !== undefined && minPrice !== "" ? Number(minPrice) : 0;
      const hi = maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : 4;
      places = places.filter((p) => {
        const n = toPriceNum(p);
        return n === null ? true : n >= lo && n <= hi;
      });
    }

    // Rating filter
    if (ratingMin) {
      places = places.filter((p) => (p.rating || 0) >= Number(ratingMin));
    }

    // Open now (check both current and regular as some results only fill one)
    if (String(openNow) === "true") {
      places = places.filter(
        (p) => p.currentOpeningHours?.openNow === true || p.regularOpeningHours?.openNow === true
      );
    }

    // Open at specific weekday/time
    if (weekday !== undefined && weekday !== "" && time) {
      places = places.filter((p) => isOpenAt(p, Number(weekday), time));
    }

    res.json({
      places,
      nextPageToken: data.nextPageToken || null, // top-level; not in FieldMask
      center: { lat: Number(lat), lng: Number(lng) },
      usedEndpoint: useText ? "searchText" : "searchNearby",
    });
  } catch (err) {
    const detail = err?.response?.data || err.message;
    console.error("[Places search] error:", detail);
    res.status(500).json({ error: "Places search failed", detail });
  }
});

// Details
router.get("/details/:placeId", async (req, res) => {
  try {
    const { placeId } = req.params;
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const headers = {
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": [
        "id",
        "displayName",
        "formattedAddress",
        "nationalPhoneNumber",
        "websiteUri",
        "googleMapsUri",
        "location",
        "rating",
        "userRatingCount",
        "priceLevel",
        "types",
        "currentOpeningHours",
        "regularOpeningHours",
        "editorialSummary",
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

module.exports = router;

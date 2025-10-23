// src/pages/RestaurantLocator.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./RestaurantLocator.css";

// Helper (no hooks here)
const priceSymbols = (priceLevel) => {
  if (priceLevel === null || priceLevel === undefined) return null;
  const map = {
    PRICE_LEVEL_FREE: 1,
    PRICE_LEVEL_INEXPENSIVE: 2,
    PRICE_LEVEL_MODERATE: 3,
    PRICE_LEVEL_EXPENSIVE: 4,
    PRICE_LEVEL_VERY_EXPENSIVE: 5,
  };
  const n = typeof priceLevel === "number" ? priceLevel + 1 : map[priceLevel] || 0;
  return n ? "₱".repeat(n) : null;
};

const NCR_CENTER = { lat: 14.5995, lng: 120.9842 };
const NCR_BOUNDS = { north: 14.90, south: 14.28, east: 121.18, west: 120.92 };

export default function RestaurantLocator() {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const markersByIdRef = useRef(new Map());
  const infoWindowRef = useRef(null);

  const [results, setResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [types, setTypes] = useState("restaurant");
  const [radius, setRadius] = useState(25000);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [weekday, setWeekday] = useState("");
  const [time, setTime] = useState("");

  // Load Google Maps script once
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Map helpers
  const showInfoWindow = (marker, place) => {
    const price = priceSymbols(place.priceLevel);
    const priceHtml = price
      ? `<span style="font-weight: 600; color: #059669;">${price}</span>`
      : '<span style="color: #9ca3af;">Price N/A</span>';

    const rating = place.rating
      ? `<div style="display: flex; align-items: center; gap: 0.25rem;">
           <span style="color: #fbbf24;">⭐</span>
           <span style="font-weight: 600; color: #1f2937;">${place.rating}</span>
           <span style="color: #9ca3af;">(${place.userRatingCount || 0})</span>
         </div>`
      : "";

    const content = `
      <div style="max-width: 280px; padding: 0.5rem;">
        <h3 style="margin: 0 0 0.75rem 0; color: #1f2937; font-size: 1.125rem; font-weight: 700;">
          ${place.displayName?.text || "Unknown"}
        </h3>
        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">
          📍 ${place.formattedAddress || ""}
        </div>
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.875rem;">
          ${priceHtml}
          ${rating}
        </div>
        <a href="${place.googleMapsUri || "#"}" target="_blank" rel="noopener noreferrer"
           style="display: inline-block; padding: 0.5rem 1rem; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                  color: white; text-decoration: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;">
          Open in Google Maps →
        </a>
      </div>
    `;
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(googleMapRef.current, marker);
  };

  const displayResults = (places) => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    markersByIdRef.current = new Map();

    // Add new markers
    places.forEach((place) => {
      if (!place?.location?.latitude || !place?.location?.longitude) return;

      const marker = new window.google.maps.Marker({
        position: {
          lat: place.location.latitude,
          lng: place.location.longitude,
        },
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#fbbf24",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => showInfoWindow(marker, place));
      markersRef.current.push(marker);
      if (place.id) markersByIdRef.current.set(place.id, { marker, place });
    });
  };

  const focusPlace = (place) => {
    const rec = place?.id ? markersByIdRef.current.get(place.id) : null;
    const marker = rec?.marker;
    if (marker && googleMapRef.current) {
      googleMapRef.current.panTo(marker.getPosition());
      googleMapRef.current.setZoom(Math.max(googleMapRef.current.getZoom(), 15));
      showInfoWindow(marker, place);
    } else if (place?.location?.latitude && place?.location?.longitude) {
      googleMapRef.current.panTo({
        lat: place.location.latitude,
        lng: place.location.longitude,
      });
      googleMapRef.current.setZoom(15);
    }
  };

  // Fetch places (NCR sweep) — memoized so effects can depend on it cleanly
  const fetchPlaces = useCallback(async () => {
    if (!googleMapRef.current) return;
    setIsSearching(true);

    const params = new URLSearchParams();

    const useText = !!keyword.trim();
    if (!useText && types) params.append("types", types);

    if (useText) params.append("keyword", keyword.trim());
    if (minPrice !== "") params.append("minPrice", String(minPrice));
    if (maxPrice !== "") params.append("maxPrice", String(maxPrice));
    if (ratingMin !== "") params.append("ratingMin", String(ratingMin));
    if (openNow) params.append("openNow", "true");
    if (weekday !== "") params.append("weekday", String(weekday));
    if (time) params.append("time", time);

    // Map radius selection to coverage preset
    const cov =
      radius >= 25000 ? "ultra" :
      radius >= 15000 ? "high" :
      radius >= 10000 ? "high" : "normal";

    // maximize recall & accuracy
    params.append("coverage", cov);
    params.append("passes", "nearby,generic,brand");
    params.append("citySweep", "1");
    // strict NCR confirmation: 1 = on (more accurate, slower); set "0" if you prefer raw recall/speed
    params.append("strict", "1");

    try {
      const res = await fetch(`/api/places/search-ncr?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("API (/search-ncr) error:", res.status, err);
        setResults([]);
        displayResults([]);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data.places) ? data.places : [];
      setResults(list);
      displayResults(list);
    } catch (err) {
      console.error("Error fetching places:", err);
      setResults([]);
      displayResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [
    keyword,
    types,
    radius,
    minPrice,
    maxPrice,
    ratingMin,
    openNow,
    weekday,
    time,
  ]);

  // Initialize map, then do first fetch
  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: NCR_CENTER,
      zoom: 12,
      restriction: {
        latLngBounds: NCR_BOUNDS,
        strictBounds: false,
      },
      clickableIcons: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
    });

    const bounds = new window.google.maps.LatLngBounds(
      { lat: NCR_BOUNDS.south, lng: NCR_BOUNDS.west },
      { lat: NCR_BOUNDS.north, lng: NCR_BOUNDS.east }
    );
    map.fitBounds(bounds);

    googleMapRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();

    // initial search
    fetchPlaces();
  }, [isLoaded, fetchPlaces]);

  // UI handlers
  const handleSearch = () => fetchPlaces();
  const handleKeyDown = (e) => {
    if (e.key === "Enter") fetchPlaces();
  };

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your food map...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-locator">
      {/* Hero Header */}
      <div className="hero-header">
        <div className="hero-blob-1"></div>
        <div className="hero-blob-2"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Restaurant Locator
          </h1>
          <p className="hero-subtitle">
            Discover amazing restaurants near you with smart filters and real-time results
          </p>
        </div>
      </div>

      <div className="container">
        {/* Search Bar */}
        <div className="search-card">
          <div className="search-row">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search for ramen, vegan, pizza..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <button
              className={`btn btn-filter ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filters
            </button>

            <button className="btn btn-primary" onClick={handleSearch}>
              Search Now
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="filters-grid">
              <div className="filter-group">
                <label>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "0.25rem" }}
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Search Radius
                </label>
                <select className="filter-select" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                  <option value={5000}>5 km radius</option>
                  <option value={10000}>10 km radius</option>
                  <option value={15000}>15 km radius</option>
                  <option value={25000}>25 km (All NCR)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Min Price</label>
                <select className="filter-select" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}>
                  <option value="">Any minimum</option>
                  <option value="0">₱ Budget</option>
                  <option value="1">₱₱ Affordable</option>
                  <option value="2">₱₱₱ Moderate</option>
                  <option value="3">₱₱₱₱ Upscale</option>
                  <option value="4">₱₱₱₱₱ Luxury</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Max Price</label>
                <select className="filter-select" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
                  <option value="">Any maximum</option>
                  <option value="0">₱ Budget</option>
                  <option value="1">₱₱ Affordable</option>
                  <option value="2">₱₱₱ Moderate</option>
                  <option value="3">₱₱₱₱ Upscale</option>
                  <option value="4">₱₱₱₱₱ Luxury</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Min Rating</label>
                <select className="filter-select" value={ratingMin} onChange={(e) => setRatingMin(e.target.value)}>
                  <option value="">Any rating</option>
                  <option value="3.5">⭐ 3.5+</option>
                  <option value="4.0">⭐ 4.0+</option>
                  <option value="4.5">⭐ 4.5+</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Day of Week</label>
                <select className="filter-select" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
                  <option value="">Any day</option>
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Specific Time</label>
                <input type="time" className="filter-input" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>

              <div className="filter-group checkbox-group">
                <label className={`filter-checkbox-wrapper ${openNow ? "active" : ""}`}>
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={openNow}
                    onChange={(e) => setOpenNow(e.target.checked)}
                  />
                  Open Now Only
                </label>
              </div>

              <div className="filter-group">
                <label>Place Types</label>
                <input
                  type="text"
                  className="filter-input"
                  value={types}
                  onChange={(e) => setTypes(e.target.value)}
                  placeholder="restaurant,cafe,bar"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results meta */}
        <div className="results-card">
          <div>
            <span className="results-count">Found </span>
            <span className="results-number">{results.length}</span>
            <span className="results-count"> places</span>
          </div>
          {results.length > 0 && <div className="results-count">Click markers or list items to see details</div>}
        </div>

        {/* Scrollable results list */}
        <div
          className="results-list"
          style={{
            maxHeight: 320,
            overflowY: "auto",
            marginBottom: "12px",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 8,
            background: "white",
          }}
        >
          {results.map((p) => {
            const price = priceSymbols(p.priceLevel);
            return (
              <div
                key={p.id || `${p.location?.latitude},${p.location?.longitude}`}
                className="result-item"
                onClick={() => focusPlace(p)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 8,
                  padding: "8px 10px",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: "pointer",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.displayName?.text || "Unknown"}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.formattedAddress || ""}
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 13, alignItems: "center", marginTop: 4 }}>
                    {typeof p.rating === "number" && (
                      <span title="Google rating">⭐ {p.rating} ({p.userRatingCount || 0})</span>
                    )}
                    <span style={{ color: "#059669", fontWeight: 600 }}>{price || ""}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <a
                    href={p.googleMapsUri || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-mini"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      textDecoration: "none",
                      fontSize: 12,
                      padding: "6px 10px",
                      background: "#f59e0b",
                      color: "white",
                      borderRadius: 8,
                    }}
                  >
                    Maps
                  </a>
                </div>
              </div>
            );
          })}
          {results.length === 0 && (
            <div style={{ padding: 12, color: "#6b7280" }}>No results yet. Try “Jollibee”, “fast food”, or widen coverage.</div>
          )}
        </div>

        {/* Map */}
        <div className="map-container">
          <div ref={mapRef} className="map"></div>
        </div>
      </div>

      {isSearching && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="loading-spinner" />
            <div className="loading-title">Searching Metro Manila…</div>
            <div className="loading-subtitle">
              Verifying each result is inside NCR. This can take a moment.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

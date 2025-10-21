// src/pages/RestaurantLocator.js
import React, { useEffect, useRef, useState } from "react";
import "./RestaurantLocator.css";

const NCR_CENTER = { lat: 14.5995, lng: 120.9842 };
const NCR_BOUNDS = { north: 14.90, south: 14.28, east: 121.18, west: 120.92 };

export default function RestaurantLocator() {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [results, setResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter states
  const [keyword, setKeyword] = useState("");
  const [types, setTypes] = useState("restaurant");
  const [radius, setRadius] = useState(25000);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [weekday, setWeekday] = useState("");
  const [time, setTime] = useState("");

  // Load Google Maps Script
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

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize Map
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

    fetchPlaces();
  }, [isLoaded]);

  // Fetch Places
  const fetchPlaces = async () => {
    if (!googleMapRef.current) return;

    const center = googleMapRef.current.getCenter();
    const params = new URLSearchParams({
      lat: center.lat(),
      lng: center.lng(),
      radius: radius.toString(),
      types,
    });

    if (keyword) params.append("keyword", keyword);
    if (minPrice !== "") params.append("minPrice", minPrice);
    if (maxPrice !== "") params.append("maxPrice", maxPrice);
    if (ratingMin !== "") params.append("ratingMin", ratingMin);
    if (openNow) params.append("openNow", "true");
    if (weekday !== "") params.append("weekday", weekday);
    if (time) params.append("time", time);

    try {
      const response = await fetch(`/api/places/search?${params}`);
      const data = await response.json();
      setResults(data.places || []);
      displayResults(data.places || []);
    } catch (error) {
      console.error("Error fetching places:", error);
      setResults([]);
      displayResults([]);
    }
  };

  // Display Results on Map
  const displayResults = (places) => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    places.forEach((place) => {
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

      marker.addListener("click", () => {
        showInfoWindow(marker, place);
      });

      markersRef.current.push(marker);
    });
  };

  // Show Info Window
  const showInfoWindow = (marker, place) => {
    const priceLevel =
      typeof place.priceLevel === "number"
        ? `<span style="font-weight: 600; color: #059669;">${"₱".repeat(
            place.priceLevel + 1
          )}</span>`
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
          ${priceLevel}
          ${rating}
        </div>
        <a href="${place.googleMapsUri}" target="_blank" rel="noopener noreferrer"
           style="display: inline-block; padding: 0.5rem 1rem; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                  color: white; text-decoration: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;">
          Open in Google Maps →
        </a>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(googleMapRef.current, marker);
  };

  const handleSearch = () => {
    fetchPlaces();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchPlaces();
    }
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
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Restaurant Locator
          </h1>
          <p className="hero-subtitle">
            Discover amazing restaurants near you with smart filters and
            real-time results
          </p>
        </div>
      </div>

      <div className="container">
        {/* Search Bar */}
        <div className="search-card">
          <div className="search-row">
            <div className="search-input-wrapper">
              <svg
                className="search-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search for ramen, vegan, pizza..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>

            <button
              className={`btn btn-filter ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
                    style={{
                      display: "inline",
                      verticalAlign: "text-bottom",
                      marginRight: "0.25rem",
                    }}
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Search Radius
                </label>
                <select
                  className="filter-select"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                >
                  <option value={5000}>5 km radius</option>
                  <option value={10000}>10 km radius</option>
                  <option value={15000}>15 km radius</option>
                  <option value={25000}>25 km (All NCR)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Min Price</label>
                <select
                  className="filter-select"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                >
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
                <select
                  className="filter-select"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                >
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
                <select
                  className="filter-select"
                  value={ratingMin}
                  onChange={(e) => setRatingMin(e.target.value)}
                >
                  <option value="">Any rating</option>
                  <option value="3.5">⭐ 3.5+</option>
                  <option value="4.0">⭐ 4.0+</option>
                  <option value="4.5">⭐ 4.5+</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Day of Week</label>
                <select
                  className="filter-select"
                  value={weekday}
                  onChange={(e) => setWeekday(e.target.value)}
                >
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
                <input
                  type="time"
                  className="filter-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="filter-group checkbox-group">
                <label
                  className={`filter-checkbox-wrapper ${
                    openNow ? "active" : ""
                  }`}
                >
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

        {/* Results Count */}
        <div className="results-card">
          <div>
            <span className="results-count">Found </span>
            <span className="results-number">{results.length}</span>
            <span className="results-count"> restaurants</span>
          </div>
          {results.length > 0 && (
            <div className="results-count">Click on markers to see details</div>
          )}
        </div>

        {/* Map Container */}
        <div className="map-container">
          <div ref={mapRef} className="map"></div>
        </div>
      </div>
    </div>
  );
}
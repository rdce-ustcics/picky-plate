import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./RestaurantLocator.css";

export default function RestaurantLocator() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriceLevel, setSelectedPriceLevel] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Convert price level string to number
  const getPriceLevelNum = (priceLevel) => {
    if (!priceLevel) return null;
    const mapping = {
      'PRICE_LEVEL_INEXPENSIVE': 1,
      'PRICE_LEVEL_MODERATE': 2,
      'PRICE_LEVEL_EXPENSIVE': 3,
      'PRICE_LEVEL_VERY_EXPENSIVE': 4
    };
    return mapping[priceLevel] || null;
  };

  // Custom marker icon
  const createCustomIcon = (priceLevel) => {
    const priceLevelNum = typeof priceLevel === 'string' ? getPriceLevelNum(priceLevel) : priceLevel;
    const colors = {
      1: '#10b981', // Green for inexpensive
      2: '#3b82f6', // Blue for moderate
      3: '#f59e0b', // Orange for expensive
      4: '#ef4444', // Red for very expensive
      null: '#6b7280' // Gray for unknown
    };
    
    const color = colors[priceLevelNum] || colors[null];
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 5px; margin-left: 7px;">🍽️</div></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const map = L.map(mapRef.current).setView([14.5995, 120.9842], 11);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Load restaurant data
  useEffect(() => {
    fetch("/data/ncr_food_places2.json")   // ← Fetch from public root
      .then((response) => response.json())
      .then((data) => {
        // Convert priceLevel strings to numbers for easier filtering
        const processedData = data.items.map(item => ({
          ...item,
          priceLevelNum: getPriceLevelNum(item.priceLevel)
        }));
        setRestaurants(processedData);
        setFilteredRestaurants(processedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading restaurant data:", error);
        setLoading(false);
      });
  }, []);

  // Update markers when filtered restaurants change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredRestaurants.forEach((place) => {
      const { lat, lng, name, address, rating, priceLevel, priceLevelNum, userRatingCount, googleMapsUri } = place;
      if (lat && lng) {
        const marker = L.marker([lat, lng], {
          icon: createCustomIcon(priceLevel)
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="popup-content">
              <h3>${name}</h3>
              <p class="popup-address">${address}</p>
              <div class="popup-info">
                <span class="popup-rating">⭐ ${rating || "N/A"}</span>
                <span class="popup-reviews">(${userRatingCount || 0} reviews)</span>
              </div>
              ${priceLevelNum ? `<p class="popup-price">${getPriceLevelSymbol(priceLevelNum)}</p>` : ''}
              ${googleMapsUri ? `<a href="${googleMapsUri}" target="_blank" class="popup-link">View on Google Maps →</a>` : ''}
            </div>
          `);

        marker.on('click', () => {
          setSelectedRestaurant(place);
        });

        markersRef.current.push(marker);
      }
    });

    // Fit map bounds if there are restaurants
    if (filteredRestaurants.length > 0) {
      const validRestaurants = filteredRestaurants.filter(r => r.lat && r.lng);
      if (validRestaurants.length > 0) {
        const bounds = L.latLngBounds(validRestaurants.map(r => [r.lat, r.lng]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [filteredRestaurants]);

  // Filter restaurants
  useEffect(() => {
    let filtered = restaurants;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price level filter
    if (selectedPriceLevel !== "all") {
      filtered = filtered.filter(restaurant => 
        restaurant.priceLevelNum === parseInt(selectedPriceLevel)
      );
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(restaurant => 
        restaurant.rating && restaurant.rating >= minRating
      );
    }

    setFilteredRestaurants(filtered);
  }, [searchQuery, selectedPriceLevel, minRating, restaurants]);

  const getPriceLevelSymbol = (level) => {
    if (!level) return '';
    return '₱'.repeat(level);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star">☆</span>);
      }
    }
    return stars;
  };

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    if (mapInstanceRef.current && restaurant.lat && restaurant.lng) {
      mapInstanceRef.current.setView([restaurant.lat, restaurant.lng], 16, {
        animate: true,
        duration: 0.5
      });
      
      // Find and open the marker's popup
      const marker = markersRef.current.find(m => {
        const pos = m.getLatLng();
        return pos.lat === restaurant.lat && pos.lng === restaurant.lng;
      });
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="restaurant-locator">
      <div className="header">
        <h1>🍴 Metro Manila Food Places</h1>
        <p className="subtitle">Discover {restaurants.length} amazing restaurants</p>
      </div>

      <div className="main-content">
        {/* Sidebar */}
        <div className="sidebar">
          {/* Search and Filters */}
          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-group">
              <label>Price Level</label>
              <select
                value={selectedPriceLevel}
                onChange={(e) => setSelectedPriceLevel(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Prices</option>
                <option value="1">₱ - Inexpensive</option>
                <option value="2">₱₱ - Moderate</option>
                <option value="3">₱₱₱ - Expensive</option>
                <option value="4">₱₱₱₱ - Very Expensive</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Minimum Rating</label>
              <div className="rating-filter">
                {[0, 3, 3.5, 4, 4.5].map(rating => (
                  <button
                    key={rating}
                    className={`rating-btn ${minRating === rating ? 'active' : ''}`}
                    onClick={() => setMinRating(rating)}
                  >
                    {rating === 0 ? 'All' : `${rating}+ ⭐`}
                  </button>
                ))}
              </div>
            </div>

            <div className="results-count">
              Showing {filteredRestaurants.length} of {restaurants.length} places
            </div>
          </div>

          {/* Restaurant List */}
          <div className="restaurant-list">
            {loading ? (
              <div className="loading">Loading restaurants...</div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="no-results">
                <p>No restaurants found</p>
                <p className="no-results-hint">Try adjusting your filters</p>
              </div>
            ) : (
              filteredRestaurants.map((restaurant, index) => (
                <div
                  key={restaurant.id || index}
                  className={`restaurant-card ${selectedRestaurant?.id === restaurant.id ? 'selected' : ''}`}
                  onClick={() => handleRestaurantClick(restaurant)}
                >
                  <div className="card-header">
                    <h3>{restaurant.name}</h3>
                    {restaurant.priceLevelNum && (
                      <span className={`price-badge price-${restaurant.priceLevelNum}`}>
                        {getPriceLevelSymbol(restaurant.priceLevelNum)}
                      </span>
                    )}
                  </div>
                  
                  <p className="card-address">{restaurant.address}</p>
                  
                  <div className="card-info">
                    {restaurant.rating && (
                      <div className="rating">
                        <div className="stars">{renderStars(restaurant.rating)}</div>
                        <span className="rating-value">{restaurant.rating}</span>
                        <span className="rating-count">({restaurant.userRatingCount || 0})</span>
                      </div>
                    )}
                  </div>

                  {restaurant.types && (
                    <div className="card-types">
                      {restaurant.types.slice(0, 3).map((type, i) => (
                        <span key={i} className="type-tag">
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {restaurant.googleMapsUri && (
                    <a 
                      href={restaurant.googleMapsUri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on Maps →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className="map-container">
          <div ref={mapRef} className="map"></div>
          <div className="map-legend">
            <h4>Legend</h4>
            <div className="legend-item">
              <span className="legend-marker" style={{backgroundColor: '#10b981'}}>🍽️</span>
              <span>Inexpensive</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker" style={{backgroundColor: '#3b82f6'}}>🍽️</span>
              <span>Moderate</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker" style={{backgroundColor: '#f59e0b'}}>🍽️</span>
              <span>Expensive</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker" style={{backgroundColor: '#ef4444'}}>🍽️</span>
              <span>Very Expensive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
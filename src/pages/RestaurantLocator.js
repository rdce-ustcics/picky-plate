import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import "./RestaurantLocator.css";

export default function RestaurantLocator() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerClusterRef = useRef(null);

  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriceLevel, setSelectedPriceLevel] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5); // 5km default radius
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [availableCuisines, setAvailableCuisines] = useState([]);
  const [activeView, setActiveView] = useState("map"); // map or list

  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  // Metro Manila cities (NCR) - strict filter
  const METRO_MANILA_CITIES = [
    "Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Makati City",
    "Malabon", "Mandaluyong", "Mandaluyong City", "Marikina", "Marikina City",
    "Muntinlupa", "Muntinlupa City", "Navotas", "Parañaque", "Pasay", "Pasay City",
    "Pasig", "Pasig City", "Pateros", "San Juan", "San Juan City", "Taguig",
    "Taguig City", "Valenzuela", "Valenzuela City"
  ];

  // Quick filter presets
  const quickFilters = [
    { id: 'popular', label: "What's Popular", icon: '🔥', action: () => setMinRating(4) },
    { id: 'healthy', label: 'Healthy Options', icon: '🥗', action: () => setSelectedCuisine('vegan') },
    { id: 'nearme', label: 'Near Me', icon: '📍', action: () => { getUserLocation(); setShowNearbyOnly(true); } },
    { id: 'cheap', label: 'Budget Friendly', icon: '💰', action: () => setSelectedPriceLevel("1") },
    { id: 'delivery', label: 'Delivery', icon: '🚚', action: () => setDeliveryFilter('delivery') },
    { id: 'open', label: 'Open Now', icon: '🟢', action: () => setOpenNowFilter(true) },
  ];

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

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check if restaurant is open now
  const isOpenNow = (openingHours) => {
    if (!openingHours || openingHours === "") return null;
    if (openingHours === "24/7") return true;

    const now = new Date();
    const dayMap = {
      0: 'Su', 1: 'Mo', 2: 'Tu', 3: 'We', 4: 'Th', 5: 'Fr', 6: 'Sa'
    };
    const currentDay = dayMap[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    try {
      const schedules = openingHours.split(';').map(s => s.trim());
      for (const schedule of schedules) {
        const [days, hours] = schedule.split(' ');
        if (!days || !hours) continue;
        if (days.includes(currentDay)) {
          const [open, close] = hours.split('-').map(t => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
          });
          if (currentTime >= open && currentTime <= close) {
            return true;
          }
        }
      }
      return false;
    } catch (e) {
      return null;
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedPriceLevel("all");
    setMinRating(0);
    setSelectedCuisine("all");
    setDeliveryFilter("all");
    setOpenNowFilter(false);
    setShowNearbyOnly(false);
    setSearchRadius(5);
  };

  // Get user's current location
  const getUserLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const location = { lat: latitude, lng: longitude, accuracy: accuracy };
        
        setUserLocation(location);
        setLocationLoading(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 13, {
            animate: true,
            duration: 1
          });
          updateUserLocationMarker(location);
          setShowNearbyOnly(true);
        }
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Update user location marker on map
  const updateUserLocationMarker = (location) => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }
    if (accuracyCircleRef.current) {
      mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
    }

    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="user-marker-pulse"></div>
        <div class="user-marker-dot"></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    userMarkerRef.current = L.marker([location.lat, location.lng], {
      icon: userIcon,
      zIndexOffset: 1000
    })
      .bindPopup('<b>Your Location</b><br/>You are here!')
      .addTo(mapInstanceRef.current);

    accuracyCircleRef.current = L.circle([location.lat, location.lng], {
      radius: location.accuracy,
      color: '#e2a044',
      fillColor: '#e2a044',
      fillOpacity: 0.1,
      weight: 2
    }).addTo(mapInstanceRef.current);

    L.circle([location.lat, location.lng], {
      radius: searchRadius * 1000,
      color: '#d4a025',
      fillColor: '#d4a025',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '5, 10'
    }).addTo(mapInstanceRef.current);
  };

  // Custom marker icon
  const createCustomIcon = (priceLevel) => {
    const priceLevelNum = typeof priceLevel === 'string' ? getPriceLevelNum(priceLevel) : priceLevel;
    const colors = {
      1: '#65a30d', // Green for inexpensive
      2: '#e2a044', // Orange for moderate
      3: '#dc7928', // Dark orange for expensive
      4: '#dc2626', // Red for very expensive
      null: '#9ca3af' // Gray for unknown
    };
    
    const color = colors[priceLevelNum] || colors[null];
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 6px; margin-left: 9px;">🍽️</div></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
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

      setTimeout(() => {
        getUserLocation();
      }, 500);
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
    fetch("/data/ncr_food_places2.json")
      .then((response) => response.json())
      .then((data) => {
        const metroManilaOnly = data.items.filter(item => {
          const city = item.city || "";
          return METRO_MANILA_CITIES.some(mmCity =>
            city.toLowerCase().includes(mmCity.toLowerCase())
          );
        });

        const validData = metroManilaOnly.filter(item => {
          return item && item.name && typeof item.lat === 'number' && 
                 typeof item.lng === 'number' && item.lat !== 0 && item.lng !== 0;
        });

        const processedData = validData.map(item => ({
          ...item,
          name: String(item.name || 'Unknown'),
          address: String(item.address || ''),
          types: Array.isArray(item.types) ? item.types : [],
          priceLevelNum: getPriceLevelNum(item.priceLevel),
          cuisine: item.cuisine || '',
          openingHours: item.openingHours || '',
          hasOnlineDelivery: item.hasOnlineDelivery || false,
          hasTableBooking: item.hasTableBooking || false,
          isDeliveringNow: item.isDeliveringNow || false,
          takeaway: item.takeaway || false
        }));

        const cuisineSet = new Set();
        processedData.forEach(item => {
          if (item.cuisine) {
            const cuisines = item.cuisine.split(',').map(c => c.trim());
            cuisines.forEach(c => {
              if (c && c.length > 0) {
                const formatted = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
                cuisineSet.add(formatted);
              }
            });
          }
          if (item.types && item.types.length > 0) {
            item.types.forEach(type => {
              if (type && type !== 'restaurant' && type.length > 0) {
                const formatted = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ');
                cuisineSet.add(formatted);
              }
            });
          }
        });

        const sortedCuisines = Array.from(cuisineSet).sort();
        setAvailableCuisines(sortedCuisines);
        
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

    if (markerClusterRef.current) {
      mapInstanceRef.current.removeLayer(markerClusterRef.current);
    }

    const markerCluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 100) size = 'large';
        else if (count > 30) size = 'medium';

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(40, 40)
        });
      }
    });

    filteredRestaurants.forEach((place) => {
      const { lat, lng, name, address, rating, priceLevel, priceLevelNum, userRatingCount, googleMapsUri } = place;
      if (lat && lng && name) {
        const marker = L.marker([lat, lng], {
          icon: createCustomIcon(priceLevel)
        })
          .bindPopup(`
            <div class="popup-content">
              <h3>${String(name || 'Unknown')}</h3>
              <p class="popup-address">${String(address || 'No address')}</p>
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

        markerCluster.addLayer(marker);
      }
    });

    mapInstanceRef.current.addLayer(markerCluster);
    markerClusterRef.current = markerCluster;

    if (filteredRestaurants.length > 0) {
      const validRestaurants = filteredRestaurants.filter(r => r.lat && r.lng);
      if (validRestaurants.length > 0) {
        const bounds = L.latLngBounds(validRestaurants.map(r => [r.lat, r.lng]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [filteredRestaurants]);

  // Filter restaurants
  useEffect(() => {
    let filtered = restaurants;

    if (userLocation && showNearbyOnly) {
      filtered = filtered.map(restaurant => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          restaurant.lat,
          restaurant.lng
        );
        return { ...restaurant, distance };
      }).filter(restaurant => restaurant.distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance);
    } else if (userLocation) {
      filtered = filtered.map(restaurant => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          restaurant.lat,
          restaurant.lng
        );
        return { ...restaurant, distance };
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(restaurant => {
        const name = String(restaurant.name || '').toLowerCase();
        const address = String(restaurant.address || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || address.includes(query);
      });
    }

    if (selectedCuisine !== "all") {
      filtered = filtered.filter(restaurant => {
        const cuisineLower = selectedCuisine.toLowerCase();
        const restaurantCuisine = (restaurant.cuisine || '').toLowerCase();
        const hasInCuisineField = restaurantCuisine.includes(cuisineLower);
        const hasInTypes = restaurant.types && restaurant.types.some(type =>
          type.toLowerCase().replace(/_/g, ' ').includes(cuisineLower)
        );
        return hasInCuisineField || hasInTypes;
      });
    }

    if (selectedPriceLevel !== "all") {
      filtered = filtered.filter(restaurant =>
        restaurant.priceLevelNum === parseInt(selectedPriceLevel)
      );
    }

    if (minRating > 0) {
      filtered = filtered.filter(restaurant =>
        restaurant.rating && restaurant.rating >= minRating
      );
    }

    if (deliveryFilter !== "all") {
      filtered = filtered.filter(restaurant => {
        switch(deliveryFilter) {
          case "delivery":
            return restaurant.hasOnlineDelivery || restaurant.isDeliveringNow;
          case "pickup":
            return restaurant.takeaway;
          case "dine-in":
            return restaurant.hasTableBooking || (!restaurant.hasOnlineDelivery && !restaurant.takeaway);
          default:
            return true;
        }
      });
    }

    if (openNowFilter) {
      filtered = filtered.filter(restaurant => {
        const openStatus = isOpenNow(restaurant.openingHours);
        return openStatus === true || openStatus === null;
      });
    }

    setFilteredRestaurants(filtered);
  }, [searchQuery, selectedPriceLevel, minRating, restaurants, userLocation, showNearbyOnly, searchRadius,
      selectedCuisine, deliveryFilter, openNowFilter]);

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
    if (mapInstanceRef.current && markerClusterRef.current && restaurant.lat && restaurant.lng) {
      mapInstanceRef.current.setView([restaurant.lat, restaurant.lng], 16, {
        animate: true,
        duration: 0.5
      });

      const markers = markerClusterRef.current.getLayers();
      const marker = markers.find(m => {
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
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand">
            <div className="logo-icon">🍴</div>
            <div className="brand-text">
              <h1>Pick-A-Plate</h1>
              <p>Your personal food companion</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-value">{filteredRestaurants.length}</span>
              <span className="stat-label">Places Found</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-wrapper">
        <div className="content-container">
          
          {/* Filters Section */}
          <div className="filters-container">
            {/* Search Bar */}
            <div className="search-section">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search restaurants, cuisines, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button className="search-button">
                  <span>🔍</span>
                </button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="quick-filters">
              {quickFilters.map(filter => (
                <button
                  key={filter.id}
                  className="quick-filter-btn"
                  onClick={filter.action}
                >
                  <span className="filter-icon">{filter.icon}</span>
                  <span className="filter-text">{filter.label}</span>
                </button>
              ))}
            </div>

            {/* Advanced Filters */}
            <div className="advanced-filters">
              <div className="filter-row">
                <div className="filter-card">
                  <label className="filter-label">
                    <span className="label-icon">🍜</span> Cuisine Type
                  </label>
                  <select
                    value={selectedCuisine}
                    onChange={(e) => setSelectedCuisine(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Cuisines</option>
                    <optgroup label="Popular">
                      <option value="filipino">Filipino</option>
                      <option value="korean">Korean</option>
                      <option value="japanese">Japanese</option>
                      <option value="chinese">Chinese</option>
                      <option value="american">American</option>
                      <option value="italian">Italian</option>
                    </optgroup>
                    <optgroup label="All Available">
                      {availableCuisines.map(cuisine => (
                        <option key={cuisine} value={cuisine.toLowerCase()}>
                          {cuisine}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="filter-card">
                  <label className="filter-label">
                    <span className="label-icon">💰</span> Price Range
                  </label>
                  <select
                    value={selectedPriceLevel}
                    onChange={(e) => setSelectedPriceLevel(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Prices</option>
                    <option value="1">₱ - Budget Friendly</option>
                    <option value="2">₱₱ - Moderate</option>
                    <option value="3">₱₱₱ - Premium</option>
                    <option value="4">₱₱₱₱ - Luxury</option>
                  </select>
                </div>

                <div className="filter-card">
                  <label className="filter-label">
                    <span className="label-icon">⭐</span> Minimum Rating
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="filter-select"
                  >
                    <option value="0">All Ratings</option>
                    <option value="3">3+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                <div className="filter-card">
                  <label className="filter-label">
                    <span className="label-icon">🚚</span> Service Type
                  </label>
                  <select
                    value={deliveryFilter}
                    onChange={(e) => setDeliveryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Services</option>
                    <option value="delivery">Delivery Available</option>
                    <option value="pickup">Pickup Available</option>
                    <option value="dine-in">Dine-in Only</option>
                  </select>
                </div>

                {userLocation && (
                  <div className="filter-card">
                    <label className="filter-label">
                      <span className="label-icon">📍</span> Distance
                    </label>
                    <div className="distance-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={showNearbyOnly}
                          onChange={(e) => setShowNearbyOnly(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">Nearby Only</span>
                      </label>
                      {showNearbyOnly && (
                        <div className="radius-wrapper">
                          <span className="radius-label">{searchRadius} km</span>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
                            className="radius-slider"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="filter-actions">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={openNowFilter}
                    onChange={(e) => setOpenNowFilter(e.target.checked)}
                  />
                  <span className="checkbox-label">
                    <span className="check-icon">✓</span>
                    Open Now
                  </span>
                </label>

                <button className="reset-btn" onClick={resetFilters}>
                  <span>🔄</span> Reset Filters
                </button>
              </div>
            </div>

            {locationError && (
              <div className="alert alert-warning">
                <span className="alert-icon">⚠️</span>
                <span>{locationError}</span>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="main-content">
            {/* View Toggle */}
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${activeView === 'map' ? 'active' : ''}`}
                onClick={() => setActiveView('map')}
              >
                <span>🗺️</span> Map View
              </button>
              <button 
                className={`toggle-btn ${activeView === 'list' ? 'active' : ''}`}
                onClick={() => setActiveView('list')}
              >
                <span>📋</span> List View
              </button>
            </div>

            {/* Map and List Container */}
            <div className={`view-container ${activeView}`}>
              {/* Map Section */}
              <div className={`map-section ${activeView === 'map' ? 'active' : ''}`}>
                <div ref={mapRef} className="map"></div>
                
                {userLocation && (
                  <button
                    className="locate-me-btn"
                    onClick={() => {
                      if (mapInstanceRef.current && userLocation) {
                        mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14, {
                          animate: true,
                          duration: 0.5
                        });
                      }
                    }}
                    title="Center on my location"
                  >
                    <span>📍</span>
                  </button>
                )}
              </div>

              {/* Restaurant List Section */}
              <div className={`list-section ${activeView === 'list' ? 'active' : ''}`}>
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading delicious places...</p>
                  </div>
                ) : filteredRestaurants.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🍽️</div>
                    <h3>No restaurants found</h3>
                    <p>Try adjusting your filters or search in a different area</p>
                    <button className="primary-btn" onClick={resetFilters}>
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="restaurant-grid">
                    {filteredRestaurants.map((restaurant, index) => (
                      <div
                        key={restaurant.id || index}
                        className={`restaurant-card ${selectedRestaurant?.id === restaurant.id ? 'selected' : ''}`}
                        onClick={() => handleRestaurantClick(restaurant)}
                      >
                        <div className="card-header">
                          <h3 className="restaurant-name">{restaurant.name}</h3>
                          {restaurant.priceLevelNum && (
                            <span className={`price-indicator price-${restaurant.priceLevelNum}`}>
                              {getPriceLevelSymbol(restaurant.priceLevelNum)}
                            </span>
                          )}
                        </div>

                        <p className="restaurant-address">{restaurant.address}</p>

                        {restaurant.distance !== undefined && userLocation && (
                          <div className="distance-info">
                            <span className="distance-icon">📍</span>
                            <span>{restaurant.distance.toFixed(1)} km away</span>
                          </div>
                        )}

                        {restaurant.rating && (
                          <div className="rating-info">
                            {renderStars(restaurant.rating)}
                            <span className="rating-text">
                              {restaurant.rating} ({restaurant.userRatingCount || 0} reviews)
                            </span>
                          </div>
                        )}

                        <div className="service-badges">
                          {restaurant.hasOnlineDelivery && (
                            <span className="badge delivery">🚚 Delivery</span>
                          )}
                          {restaurant.takeaway && (
                            <span className="badge pickup">🥡 Pickup</span>
                          )}
                          {restaurant.hasTableBooking && (
                            <span className="badge booking">📅 Reservations</span>
                          )}
                          {restaurant.openingHours === "24/7" && (
                            <span className="badge always-open">24/7</span>
                          )}
                        </div>

                        {restaurant.types && Array.isArray(restaurant.types) && restaurant.types.length > 0 && (
                          <div className="cuisine-tags">
                            {restaurant.types.slice(0, 3).map((type, i) => (
                              <span key={i} className="tag">
                                {String(type || '').replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}

                        {restaurant.googleMapsUri && (
                          <a 
                            href={restaurant.googleMapsUri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="view-maps-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View on Google Maps →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
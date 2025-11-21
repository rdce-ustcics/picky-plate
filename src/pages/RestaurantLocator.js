import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow, MarkerClusterer, Circle } from "@react-google-maps/api";
import LoadingModal from "../components/LoadingModal";
import "./RestaurantLocator.css";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Debug: Check if API key is loaded
if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ Google Maps API key is not defined! Check your .env file.');
} else {
  console.log('✅ Google Maps API key loaded:', GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
}

// Google Maps container style
const mapContainerStyle = {
  width: "100%",
  height: "100%"
};

// Default center (Metro Manila)
const defaultCenter = {
  lat: 14.5995,
  lng: 120.9842
};

// Google Maps options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: false,
  fullscreenControl: true
};

export default function RestaurantLocator() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapError, setMapError] = useState(null);
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
  const [showFilterModal, setShowFilterModal] = useState(false); // Filter modal state
  const [selectedMarker, setSelectedMarker] = useState(null); // For InfoWindow
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(11);
  const [visibleRestaurants, setVisibleRestaurants] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);

  // Metro Manila cities (NCR) - comprehensive list
  const METRO_MANILA_CITIES = [
    "Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Makati City",
    "Malabon", "Mandaluyong", "Mandaluyong City", "Marikina", "Marikina City",
    "Muntinlupa", "Muntinlupa City", "Navotas", "Parañaque", "Pasay", "Pasay City",
    "Pasig", "Pasig City", "Pateros", "San Juan", "San Juan City", "Taguig",
    "Taguig City", "Valenzuela", "Valenzuela City", "Metro Manila", "NCR",
    "National Capital Region", "Ermita", "Malate", "Binondo", "Tondo",
    "Sampaloc", "Santa Cruz", "Quiapo", "San Miguel", "Santa Mesa",
    "Pandacan", "Paco", "Intramuros", "Port Area", "Baclaran", "BGC",
    "Bonifacio Global City", "Ortigas", "Cubao", "Diliman", "Katipunan",
    "Alabang", "Fort Bonifacio", "Greenhills", "Eastwood", "Vertis North",
    "UP Diliman", "Ateneo", "La Salle", "UST", "FEU", "Ayala", "Rockwell",
    "Poblacion", "Salcedo Village", "Legazpi Village", "Bel-Air", "Forbes Park",
    "Dasmariñas Village", "San Lorenzo Village", "Urdaneta Village", "Magallanes Village"
  ];

  // NCR Bounding Box (approximate coordinates for Metro Manila)
  const NCR_BOUNDS = {
    north: 14.7642, // Northern edge (Caloocan/Valenzuela)
    south: 14.3990, // Southern edge (Muntinlupa)
    east: 121.1500,  // Eastern edge (Rizal border)
    west: 120.9200   // Western edge (Manila Bay)
  };

  // Check if coordinates are within NCR bounds
  const isWithinNCR = (lat, lng) => {
    return lat >= NCR_BOUNDS.south &&
           lat <= NCR_BOUNDS.north &&
           lng >= NCR_BOUNDS.west &&
           lng <= NCR_BOUNDS.east;
  };

  // Check if address contains Metro Manila city
  const addressContainsMetroManila = (address) => {
    if (!address) return false;
    const addressLower = address.toLowerCase();
    return METRO_MANILA_CITIES.some(city =>
      addressLower.includes(city.toLowerCase())
    );
  };

  // Restaurant chain logos/images mapping (case-sensitive to match data)
  const RESTAURANT_IMAGES = {
    // Fast Food Chains - Exact names from data
    "Jollibee": "https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Jollibee_2011_logo.svg/220px-Jollibee_2011_logo.svg.png",
    "McDonald's": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/220px-McDonald%27s_Golden_Arches.svg.png",
    "KFC": "https://upload.wikimedia.org/wikipedia/sco/thumb/b/bf/KFC_logo.svg/220px-KFC_logo.svg.png",
    "Burger King": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Burger_King_logo_%281999%29.svg/220px-Burger_King_logo_%281999%29.svg.png",
    "Chowking": "https://upload.wikimedia.org/wikipedia/en/thumb/6/65/Chowking_logo.svg/220px-Chowking_logo.svg.png",
    "Greenwich": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Greenwich_Pizza_logo.svg/220px-Greenwich_Pizza_logo.svg.png",
    "Mang Inasal": "https://upload.wikimedia.org/wikipedia/en/thumb/c/c1/Mang_Inasal_logo.svg/220px-Mang_Inasal_logo.svg.png",
    "Pizza Hut": "https://upload.wikimedia.org/wikipedia/sco/thumb/d/d2/Pizza_Hut_logo.svg/220px-Pizza_Hut_logo.svg.png",
    "Shakey's": "https://upload.wikimedia.org/wikipedia/en/thumb/5/57/Shakey%27s_Pizza_logo.svg/220px-Shakey%27s_Pizza_logo.svg.png",
    "Shakey's Pizza": "https://upload.wikimedia.org/wikipedia/en/thumb/5/57/Shakey%27s_Pizza_logo.svg/220px-Shakey%27s_Pizza_logo.svg.png",
    "Kenny Rogers": "https://1000logos.net/wp-content/uploads/2022/09/Kenny-Rogers-Roasters-Logo.png",
    "Kenny Rogers Roasters": "https://1000logos.net/wp-content/uploads/2022/09/Kenny-Rogers-Roasters-Logo.png",
    "Tokyo Tokyo": "https://tokyotokyo.com.ph/wp-content/uploads/2019/09/tokyo-tokyo-logo.png",
    "Max's": "https://upload.wikimedia.org/wikipedia/en/thumb/f/fe/Max%27s_Restaurant_logo.svg/220px-Max%27s_Restaurant_logo.svg.png",
    "Max's Restaurant": "https://upload.wikimedia.org/wikipedia/en/thumb/f/fe/Max%27s_Restaurant_logo.svg/220px-Max%27s_Restaurant_logo.svg.png",
    "Goldilocks": "https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Goldilocks_Bakeshop_logo.svg/220px-Goldilocks_Bakeshop_logo.svg.png",
    "Red Ribbon": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Red_Ribbon_logo.svg/220px-Red_Ribbon_logo.svg.png",
    "Starbucks": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/200px-Starbucks_Corporation_Logo_2011.svg.png",
    "Coffee Bean": "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/The_Coffee_Bean_%26_Tea_Leaf_logo.svg/220px-The_Coffee_Bean_%26_Tea_Leaf_logo.svg.png",
    "The Coffee Bean & Tea Leaf": "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/The_Coffee_Bean_%26_Tea_Leaf_logo.svg/220px-The_Coffee_Bean_%26_Tea_Leaf_logo.svg.png",
    "Tim Hortons": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Tim_Hortons_Logo.svg/220px-Tim_Hortons_Logo.svg.png",
    "Dunkin'": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/Dunkin%27_logo.svg/220px-Dunkin%27_logo.svg.png",
    "Dunkin' Donuts": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/Dunkin%27_logo.svg/220px-Dunkin%27_logo.svg.png",
    "Krispy Kreme": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Krispy_Kreme_Logo.svg/220px-Krispy_Kreme_Logo.svg.png",
    "J.Co": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/J.CO_logo.svg/220px-J.CO_logo.svg.png",
    "J.CO": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/J.CO_logo.svg/220px-J.CO_logo.svg.png",
    "Pancake House": "https://www.pancakehouse.com.ph/wp-content/uploads/2020/04/Pancake-House-Logo.png",
    "Denny's": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Denny%27s_logo.svg/220px-Denny%27s_logo.svg.png",
    "IHOP": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/IHOP_logo.svg/220px-IHOP_logo.svg.png",
    "Wendy's": "https://upload.wikimedia.org/wikipedia/en/thumb/3/32/Wendy%27s_full_logo_2012.svg/200px-Wendy%27s_full_logo_2012.svg.png",
    "Subway": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Subway_2016_logo.svg/220px-Subway_2016_logo.svg.png",
    "Taco Bell": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/Taco_Bell_2016.svg/220px-Taco_Bell_2016.svg.png",
    "Popeyes": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Popeyes_logo.svg/220px-Popeyes_logo.svg.png",
    "BonChon": "https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/BonChon_Chicken_logo.svg/220px-BonChon_Chicken_logo.svg.png",
    "Frankie's": "https://frankiesgroup.ph/wp-content/uploads/2019/06/frankies-logo.png",
    "Army Navy": "https://armynavyburger.com/wp-content/uploads/2019/06/army-navy-logo.png",
    "Yellow Cab": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Yellow_Cab_Pizza_logo.svg/220px-Yellow_Cab_Pizza_logo.svg.png",
    "Angel's Pizza": "https://www.angelspizza.com.ph/wp-content/uploads/2020/04/Angels-Pizza-Logo.png",
    "Angels Pizza": "https://www.angelspizza.com.ph/wp-content/uploads/2020/04/Angels-Pizza-Logo.png",
    "Domino's": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Domino%27s_pizza_logo.svg/220px-Domino%27s_pizza_logo.svg.png",
    "Domino's Pizza": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Domino%27s_pizza_logo.svg/220px-Domino%27s_pizza_logo.svg.png",
    "Papa John's": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Papa_John%27s_Logo_2019.svg/220px-Papa_John%27s_Logo_2019.svg.png",
    "S&R": "https://www.snrpizza.ph/wp-content/uploads/2020/04/SNR-Pizza-Logo.png",
    "Sbarro": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Sbarro_logo.svg/220px-Sbarro_logo.svg.png",
    "Potato Corner": "https://www.potatocorner.com/wp-content/uploads/2019/06/potato-corner-logo.png",
    "Turks": "https://turks.ph/wp-content/uploads/2019/06/turks-logo.png",
    "Andok's": "https://andoks.com/wp-content/uploads/2020/04/Andoks-Logo.png",
    "Andoks": "https://andoks.com/wp-content/uploads/2020/04/Andoks-Logo.png",
    "Baliwag": "https://www.baliwaglechon.com/wp-content/uploads/2020/04/Baliwag-Lechon-Logo.png",
    // Additional common restaurants
    "Gerry's Grill": "https://www.gerrysgrill.com/wp-content/uploads/2019/06/gerrys-logo.png",
    "Kuya J": "https://kuyaj.com.ph/wp-content/uploads/2019/06/kuyaj-logo.png",
    "Cabalen": "https://cabalen.ph/wp-content/uploads/2019/06/cabalen-logo.png",
    "Conti's": "https://contis.ph/wp-content/uploads/2019/06/contis-logo.png",
    "Vikings": "https://vikings.ph/wp-content/uploads/2019/06/vikings-logo.png",
    "Spiral": "https://www.shangri-la.com/images/default-source/logos/spiral-logo.png",
    "Sambokojin": "https://sambokojin.com/wp-content/uploads/2019/06/sambokojin-logo.png",
    "Yakimix": "https://yakimix.com.ph/wp-content/uploads/2019/06/yakimix-logo.png"
  };

  // Function to get restaurant image
  const getRestaurantImage = (name) => {
    if (!name) return "https://img.icons8.com/color/200/restaurant.png";

    // Convert to string if it's not already
    const nameStr = String(name);

    // First check for exact match (case-sensitive)
    if (RESTAURANT_IMAGES[nameStr]) {
      return RESTAURANT_IMAGES[nameStr];
    }

    // Then check for case-insensitive partial matches
    const lowerName = nameStr.toLowerCase();
    for (const [key, value] of Object.entries(RESTAURANT_IMAGES)) {
      if (lowerName.includes(key.toLowerCase())) {
        return value;
      }
    }

    // Generic food image as fallback
    return "https://img.icons8.com/color/200/restaurant.png";
  };

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

  // Get user's current location with high accuracy
  const getUserLocation = (forceRefresh = false) => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    console.log('🔍 Starting location acquisition...');
    console.log('Device info:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hasGeolocation: !!navigator.geolocation
    });

    // Use watchPosition for continuous updates to get better accuracy
    let bestAccuracy = Infinity;
    let bestPosition = null;
    let watchId = null;
    let updateCount = 0;
    const maxUpdates = 5; // Try to get 5 position updates
    const maxWaitTime = 20000; // Wait up to 20 seconds

    const finishLocationAcquisition = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      if (bestPosition) {
        const { latitude, longitude } = bestPosition.coords;
        const location = {
          lat: latitude,
          lng: longitude,
          accuracy: bestPosition.coords.accuracy
        };

        console.log('✅ Final location:', {
          latitude,
          longitude,
          accuracy: `${bestPosition.coords.accuracy.toFixed(1)}m`,
          updates: updateCount
        });

        setUserLocation(location);
        setMapCenter({ lat: latitude, lng: longitude });
        setMapZoom(15);
        setShowNearbyOnly(true);
      }

      setLocationLoading(false);
    };

    // Set a timeout to finish after maxWaitTime
    const timeoutId = setTimeout(() => {
      console.log('⏱️ Location timeout reached');
      finishLocationAcquisition();
    }, maxWaitTime);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        updateCount++;
        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;

        console.log(`📍 Location update #${updateCount}:`, {
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          accuracy: `${accuracy.toFixed(1)}m`,
          altitude: altitude ? `${altitude.toFixed(1)}m` : 'N/A',
          speed: speed ? `${speed.toFixed(1)}m/s` : 'N/A',
          timestamp: new Date(position.timestamp).toLocaleTimeString()
        });

        // Keep track of the most accurate position
        if (accuracy < bestAccuracy) {
          bestAccuracy = accuracy;
          bestPosition = position;
          console.log(`🎯 New best accuracy: ${accuracy.toFixed(1)}m`);

          // Update the UI immediately with better position
          const location = { lat: latitude, lng: longitude, accuracy: accuracy };
          setUserLocation(location);
          setMapCenter({ lat: latitude, lng: longitude });
          setMapZoom(15);

          // If we got very good accuracy, we can stop early
          if (accuracy <= 20) {
            console.log('✅ Excellent accuracy achieved!');
            clearTimeout(timeoutId);
            finishLocationAcquisition();
            return;
          }
        }

        // After collecting enough samples, stop
        if (updateCount >= maxUpdates) {
          console.log('✅ Maximum updates reached');
          clearTimeout(timeoutId);
          finishLocationAcquisition();
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }

        let errorMessage = "Unable to get your location";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings and reload the page.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Make sure GPS/Location Services are enabled on your device.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Try moving near a window or outside for better GPS signal.";
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
        }

        console.error('❌ Geolocation error:', {
          code: error.code,
          message: error.message
        });

        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true, // Critical: Force GPS usage
        timeout: 30000, // 30 seconds per reading
        maximumAge: 0 // Never use cached position
      }
    );
  };

  // Update user location marker on map
  // Get marker icon color based on price level
  const getMarkerColor = (priceLevel) => {
    const priceLevelNum = typeof priceLevel === 'string' ? getPriceLevelNum(priceLevel) : priceLevel;
    const colors = {
      1: '#65a30d', // Green for inexpensive
      2: '#e2a044', // Orange for moderate
      3: '#dc7928', // Dark orange for expensive
      4: '#dc2626', // Red for very expensive
      null: '#9ca3af' // Gray for unknown
    };
    return colors[priceLevelNum] || colors[null];
  };

  // Handle map load
  const onMapLoad = (map) => {
    mapInstanceRef.current = map;
    // Don't auto-fetch location on load - let user click "Near Me" button instead
    // This makes the page load much faster
  };

  // Handle map bounds change to only show visible markers (debounced)
  const boundsChangeTimeoutRef = useRef(null);

  const onBoundsChanged = () => {
    // Debounce: Only update bounds after user stops moving the map for 300ms
    if (boundsChangeTimeoutRef.current) {
      clearTimeout(boundsChangeTimeoutRef.current);
    }

    boundsChangeTimeoutRef.current = setTimeout(() => {
      if (mapInstanceRef.current) {
        const bounds = mapInstanceRef.current.getBounds();
        if (bounds) {
          setMapBounds(bounds);
        }
      }
    }, 300);
  };

  // Filter restaurants within map bounds
  useEffect(() => {
    // Determine max markers based on filter status
    const hasActiveFilters =
      searchQuery !== "" ||
      selectedPriceLevel !== "all" ||
      minRating > 0 ||
      selectedCuisine !== "all" ||
      deliveryFilter !== "all" ||
      openNowFilter ||
      showNearbyOnly;

    // If filters are active, show ALL filtered results (not just viewport)
    // If no filters, only show what's in viewport for performance
    if (hasActiveFilters) {
      // Show all filtered results (up to 1000 for performance)
      const maxMarkers = Math.min(filteredRestaurants.length, 1000);
      setVisibleRestaurants(filteredRestaurants.slice(0, maxMarkers));
      return;
    }

    // No filters: only show restaurants in viewport
    if (!mapBounds) {
      // Initially show first 50 restaurants until map loads
      setVisibleRestaurants(filteredRestaurants.slice(0, 50));
      return;
    }

    const visible = filteredRestaurants.filter(restaurant => {
      if (!restaurant.lat || !restaurant.lng) return false;

      const position = new window.google.maps.LatLng(restaurant.lat, restaurant.lng);
      return mapBounds.contains(position);
    });

    // Limit to 200 markers in viewport when no filters
    setVisibleRestaurants(visible.slice(0, 200));
  }, [mapBounds, filteredRestaurants, searchQuery, selectedPriceLevel, minRating,
      selectedCuisine, deliveryFilter, openNowFilter, showNearbyOnly]);

  // Load restaurant data from multiple sources
  useEffect(() => {
    const loadAllRestaurants = async () => {
      const startTime = performance.now();

      try {
        // Load both data sources in parallel
        const [ncrResponse, osmResponse] = await Promise.all([
          fetch("/data/ncr_food_places2.json"),
          fetch("/data/osm_restaurants.json")
        ]);

        const [ncrData, osmData] = await Promise.all([
          ncrResponse.json(),
          osmResponse.json()
        ]);

        console.log("NCR restaurants:", ncrData.items.length);
        console.log("OSM restaurants:", osmData.items.length);

        // Combine both data sources
        const allItems = [...ncrData.items, ...osmData.items];
        console.log("Total restaurants before filtering:", allItems.length);

        // Filter and process in one pass for better performance
        const processedData = [];
        const cuisineSet = new Set();
        let filteredOutCount = 0;

        for (const item of allItems) {
          // Check basic validity
          if (!item || !item.name || typeof item.lat !== 'number' ||
              typeof item.lng !== 'number' || item.lat === 0 || item.lng === 0) {
            continue;
          }

          // Filter: Only include restaurants within NCR
          const withinNCRBounds = isWithinNCR(item.lat, item.lng);
          const hasNCRAddress = addressContainsMetroManila(item.address);

          // Restaurant must either be within NCR bounds OR have NCR in address
          if (!withinNCRBounds && !hasNCRAddress) {
            filteredOutCount++;
            continue;
          }

          // Process the item
          const processed = {
            ...item,
            id: item.id || `${item.name}_${item.lat}_${item.lng}`,
            name: String(item.name || 'Unknown'),
            address: String(item.address || ''),
            types: Array.isArray(item.types) ? item.types : [],
            priceLevelNum: getPriceLevelNum(item.priceLevel),
            cuisine: item.cuisine || '',
            openingHours: item.openingHours || '',
            hasOnlineDelivery: item.hasOnlineDelivery || false,
            hasTableBooking: item.hasTableBooking || false,
            isDeliveringNow: item.isDeliveringNow || false,
            takeaway: item.takeaway || false,
            source: item.source || 'unknown'
            // Note: Removed getRestaurantImage() call here - we'll lazy load images
          };

          processedData.push(processed);

          // Extract cuisines
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
        }

        const sortedCuisines = Array.from(cuisineSet).sort();
        setAvailableCuisines(sortedCuisines);

        setRestaurants(processedData);
        setFilteredRestaurants(processedData);
        setLoading(false);

        const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Loaded ${processedData.length} restaurants in ${loadTime}s`);
        console.log(`🚫 Filtered out ${filteredOutCount} restaurants outside NCR`);
        console.log(`📍 NCR restaurants only: ${processedData.length} places`);
      } catch (error) {
        console.error("Error loading restaurant data:", error);
        // Try to load at least one source if the other fails
        try {
          const response = await fetch("/data/ncr_food_places2.json");
          const data = await response.json();

          const processedData = [];
          for (const item of data.items) {
            if (!item || !item.name || typeof item.lat !== 'number' ||
                typeof item.lng !== 'number' || item.lat === 0 || item.lng === 0) {
              continue;
            }

            // Filter: Only include restaurants within NCR
            const withinNCRBounds = isWithinNCR(item.lat, item.lng);
            const hasNCRAddress = addressContainsMetroManila(item.address);

            if (!withinNCRBounds && !hasNCRAddress) {
              continue;
            }

            processedData.push({
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
            });
          }

          setRestaurants(processedData);
          setFilteredRestaurants(processedData);
          console.log(`⚠️ Loaded ${processedData.length} restaurants from NCR data only`);
        } catch (fallbackError) {
          console.error("Failed to load any restaurant data:", fallbackError);
        }
        setLoading(false);
      }
    };

    loadAllRestaurants();
  }, []);


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
    setSelectedMarker(restaurant);
    if (restaurant.lat && restaurant.lng) {
      setMapCenter({ lat: restaurant.lat, lng: restaurant.lng });
      setMapZoom(16);
    }
  };

  return (
    <>
      {loading && <LoadingModal message="Loading restaurant data..." />}

      <div className="restaurant-locator">
        {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <div className="logo-icon">🍴</div>
            <div className="brand-text">
              <h1>Pick-A-Plate</h1>
              <p>Your personal food companion</p>
            </div>
          </div>
          <div className="header-stats">
            <span className="stat-value">{filteredRestaurants.length}</span>
            <span className="stat-label">Places Found</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar Filters */}
        <div className="sidebar-filters">
          {/* Search Section */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Quick Filters */}
          <div className="quick-filters">
            {quickFilters.map(filter => (
              <button
                key={filter.id}
                className={`quick-filter ${filter.id === 'nearme' && showNearbyOnly ? 'active' : ''} ${filter.id === 'open' && openNowFilter ? 'active' : ''}`}
                onClick={filter.action}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Filter Actions */}
          <div className="filter-actions">
            <button
              className="advanced-filters-btn"
              onClick={() => setShowFilterModal(true)}
            >
              ⚙️ Filters
              {(selectedPriceLevel !== "all" || minRating > 0 || selectedCuisine !== "all" ||
                deliveryFilter !== "all" || openNowFilter) && (
                <span className="filter-count">
                  {[selectedPriceLevel !== "all", minRating > 0, selectedCuisine !== "all",
                    deliveryFilter !== "all", openNowFilter].filter(Boolean).length}
                </span>
              )}
            </button>
            <button className="reset-btn" onClick={resetFilters}>
              🔄 Reset
            </button>
          </div>

          {locationError && (
            <div className="alert alert-warning">
              ⚠️ {locationError}
            </div>
          )}

          {userLocation && userLocation.accuracy && (
            <div className={`alert ${userLocation.accuracy > 100 ? 'alert-warning' : 'alert-info'}`}
                 style={{ fontSize: '12px', padding: '8px 12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  📍 Location accuracy: ±{userLocation.accuracy.toFixed(0)}m
                  {userLocation.accuracy > 100 && (
                    <div style={{ marginTop: '4px', fontSize: '11px' }}>
                      GPS signal weak. Move near a window or outside for better accuracy.
                    </div>
                  )}
                </div>
                <button
                  onClick={() => getUserLocation(true)}
                  disabled={locationLoading}
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    background: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: locationLoading ? 'wait' : 'pointer',
                    opacity: locationLoading ? 0.6 : 1
                  }}
                >
                  {locationLoading ? 'Updating...' : 'Refresh'}
                </button>
              </div>
            </div>
          )}

          {locationLoading && (
            <div className="alert alert-info" style={{ fontSize: '12px', padding: '8px 12px', marginTop: '10px' }}>
              🔄 Getting precise location... This may take up to 20 seconds for best accuracy.
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {/* View Toggle Bar */}
          <div className="view-toggle-bar">
            <div className="view-buttons">
              <button
                className={`view-btn ${activeView === 'map' ? 'active' : ''}`}
                onClick={() => setActiveView('map')}
              >
                Map View
              </button>
              <button
                className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
                onClick={() => setActiveView('list')}
              >
                List View
              </button>
            </div>
          </div>

          {/* Map Container - Show when map view is active */}
          {activeView === 'map' && (
            <div className="map-container">
              {mapError && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  maxWidth: '400px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>Map Loading Error</h3>
                  <p style={{ marginBottom: '10px' }}>{mapError}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>Please check the browser console for more details.</p>
                </div>
              )}

              <LoadScript
                googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                onLoad={() => {
                  console.log('Google Maps Script loaded successfully!');
                  setMapError(null);
                }}
                onError={(error) => {
                  console.error('Google Maps Script loading error:', error);
                  setMapError('Failed to load Google Maps. Please check your API key and billing settings.');
                }}
              >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={mapZoom}
                  options={mapOptions}
                  onLoad={onMapLoad}
                  onBoundsChanged={onBoundsChanged}
                  onError={(error) => {
                    console.error('Google Maps error:', error);
                    setMapError('Google Maps failed to initialize.');
                  }}
                >
                  {/* User Location Marker with Accuracy Circle */}
                  {userLocation && (
                    <>
                      {/* Accuracy radius circle */}
                      <Circle
                        center={userLocation}
                        radius={userLocation.accuracy || 50}
                        options={{
                          fillColor: '#4285F4',
                          fillOpacity: 0.15,
                          strokeColor: '#4285F4',
                          strokeOpacity: 0.4,
                          strokeWeight: 1
                        }}
                      />
                      {/* Your location marker */}
                      <Marker
                        position={userLocation}
                        icon={{
                          path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                          scale: 12,
                          fillColor: '#4285F4',
                          fillOpacity: 1,
                          strokeColor: '#ffffff',
                          strokeWeight: 3
                        }}
                        title={`Your Location (±${userLocation.accuracy ? userLocation.accuracy.toFixed(0) : '50'}m)`}
                      />
                    </>
                  )}

                  {/* Restaurant Markers with Clustering - Only visible ones */}
                  <MarkerClusterer>
                    {(clusterer) =>
                      visibleRestaurants.map((restaurant, index) => {
                        if (!restaurant.lat || !restaurant.lng) return null;
                        return (
                          <Marker
                            key={`${restaurant.lat}-${restaurant.lng}-${index}`}
                            position={{ lat: restaurant.lat, lng: restaurant.lng }}
                            clusterer={clusterer}
                            onClick={() => {
                              setSelectedMarker(restaurant);
                              setSelectedRestaurant(restaurant);
                            }}
                            icon={{
                              path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                              scale: 8,
                              fillColor: getMarkerColor(restaurant.priceLevel),
                              fillOpacity: 1,
                              strokeColor: '#ffffff',
                              strokeWeight: 2
                            }}
                          />
                        );
                      })
                    }
                  </MarkerClusterer>

                  {/* InfoWindow for selected marker */}
                  {selectedMarker && (
                    <InfoWindow
                      position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="info-window-content" style={{ minWidth: '200px' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                          {selectedMarker.name}
                        </h3>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                          {selectedMarker.address}
                        </p>
                        <div style={{ margin: '8px 0' }}>
                          <span style={{ marginRight: '8px' }}>⭐ {selectedMarker.rating || 'N/A'}</span>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            ({selectedMarker.userRatingCount || 0} reviews)
                          </span>
                        </div>
                        {selectedMarker.priceLevelNum && (
                          <p style={{ margin: '4px 0', fontWeight: 'bold' }}>
                            {getPriceLevelSymbol(selectedMarker.priceLevelNum)}
                          </p>
                        )}
                        {selectedMarker.googleMapsUri && (
                          <a
                            href={selectedMarker.googleMapsUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              marginTop: '8px',
                              color: '#1a73e8',
                              textDecoration: 'none',
                              fontSize: '13px'
                            }}
                          >
                            View on Google Maps →
                          </a>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>

              {userLocation && (
                <button
                  className="locate-me-btn"
                  onClick={() => {
                    setMapCenter(userLocation);
                    setMapZoom(14);
                  }}
                  title="Center on my location"
                >
                  📍
                </button>
              )}
            </div>
          )}

          {/* List Container - Show when list view is active */}
          {activeView === 'list' && (
            <div className="list-container">
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
                      className="restaurant-card"
                      onClick={() => handleRestaurantClick(restaurant)}
                    >
                      {/* Card Image */}
                      <div className="card-image">
                        <img
                          src={restaurant.image || getRestaurantImage(restaurant.name)}
                          alt={restaurant.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://img.icons8.com/color/200/restaurant.png";
                          }}
                        />
                        {restaurant.rating && restaurant.rating >= 4.5 && (
                          <span className="promo-badge">
                            <span className="promo-title">TOP RATED</span>
                            <span className="promo-subtitle">⭐ {restaurant.rating}</span>
                          </span>
                        )}
                      </div>

                      <div className="card-content">
                        <h3 className="restaurant-name">{restaurant.name}</h3>

                        <div className="restaurant-meta">
                          <span className="cuisine-type">
                            {restaurant.cuisine || restaurant.types?.[0] || 'Restaurant'}
                          </span>
                          {restaurant.priceLevelNum && (
                            <span className="price-level">
                              {getPriceLevelSymbol(restaurant.priceLevelNum)}
                            </span>
                          )}
                        </div>

                        <p className="restaurant-address">{restaurant.address}</p>

                        {restaurant.rating && (
                          <div className="rating-info">
                            {renderStars(restaurant.rating)}
                            <span className="rating-text">
                              {restaurant.rating} ({restaurant.userRatingCount || 0})
                            </span>
                          </div>
                        )}

                        {restaurant.distance !== undefined && userLocation && (
                          <div className="distance-info">
                            📍 {restaurant.distance.toFixed(1)} km away
                          </div>
                        )}

                        <div className="service-badges">
                          {restaurant.hasOnlineDelivery && (
                            <span className="badge delivery">Delivery</span>
                          )}
                          {restaurant.takeaway && (
                            <span className="badge pickup">Pickup</span>
                          )}
                          {restaurant.hasTableBooking && (
                            <span className="badge reservation">Reserve</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Advanced Filters</h2>
              <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Cuisine Type Filter */}
              <div className="filter-section">
                <h3>🍜 Cuisine Type</h3>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="modal-select"
                >
                  <option value="all">All Cuisines</option>
                  <optgroup label="Popular">
                    <option value="filipino">Filipino</option>
                    <option value="korean">Korean</option>
                    <option value="japanese">Japanese</option>
                    <option value="chinese">Chinese</option>
                    <option value="american">American</option>
                    <option value="italian">Italian</option>
                    <option value="mexican">Mexican</option>
                    <option value="indian">Indian</option>
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

              {/* Price Range Filter */}
              <div className="filter-section">
                <h3>💰 Price Range</h3>
                <select
                  value={selectedPriceLevel}
                  onChange={(e) => setSelectedPriceLevel(e.target.value)}
                  className="modal-select"
                >
                  <option value="all">All Prices</option>
                  <option value="1">₱ - Budget Friendly</option>
                  <option value="2">₱₱ - Moderate</option>
                  <option value="3">₱₱₱ - Premium</option>
                  <option value="4">₱₱₱₱ - Luxury</option>
                </select>
              </div>

              {/* Minimum Rating Filter */}
              <div className="filter-section">
                <h3>⭐ Minimum Rating</h3>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="modal-select"
                >
                  <option value="0">All Ratings</option>
                  <option value="3">3+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              {/* Service Type Filter */}
              <div className="filter-section">
                <h3>🚚 Service Type</h3>
                <select
                  value={deliveryFilter}
                  onChange={(e) => setDeliveryFilter(e.target.value)}
                  className="modal-select"
                >
                  <option value="all">All Services</option>
                  <option value="delivery">Delivery Available</option>
                  <option value="pickup">Pickup/Takeout Available</option>
                  <option value="dine-in">Dine-in Only</option>
                </select>
              </div>

              {/* Distance Filter */}
              {userLocation && (
                <div className="filter-section">
                  <h3>📍 Distance</h3>
                  <label className="modal-checkbox">
                    <input
                      type="checkbox"
                      checked={showNearbyOnly}
                      onChange={(e) => setShowNearbyOnly(e.target.checked)}
                    />
                    <span>Show Nearby Only</span>
                  </label>
                  {showNearbyOnly && (
                    <div className="modal-slider-container">
                      <label className="slider-label">
                        Maximum Distance: {searchRadius} km
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
                        className="modal-slider"
                      />
                      <div className="slider-markers">
                        <span>1 km</span>
                        <span>10 km</span>
                        <span>20 km</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Open Now Filter */}
              <div className="filter-section">
                <h3>🕒 Operating Hours</h3>
                <label className="modal-checkbox">
                  <input
                    type="checkbox"
                    checked={openNowFilter}
                    onChange={(e) => setOpenNowFilter(e.target.checked)}
                  />
                  <span>Open Now</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn secondary"
                onClick={() => {
                  resetFilters();
                  setShowFilterModal(false);
                }}
              >
                Reset All
              </button>
              <button className="modal-btn primary" onClick={() => setShowFilterModal(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import useSupercluster from "use-supercluster";
import LoadingModal from "../components/LoadingModal";
import "./RestaurantLocator.css";

// SuperCluster-based Markers component - FAST clustering for 18k+ points
function ClusteredMarkers({ restaurants, onMarkerClick, getMarkerColor, bounds, zoom }) {
  // Convert restaurants to GeoJSON points for SuperCluster
  const points = useMemo(() => {
    return restaurants
      .filter(r => r.lat && r.lng && !isNaN(r.lat) && !isNaN(r.lng))
      .map(restaurant => ({
        type: "Feature",
        properties: {
          cluster: false,
          restaurantId: restaurant.id,
          restaurant: restaurant
        },
        geometry: {
          type: "Point",
          coordinates: [restaurant.lng, restaurant.lat]
        }
      }));
  }, [restaurants]);

  // Use SuperCluster for fast clustering
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: bounds || [-180, -85, 180, 85],
    zoom: zoom || 11,
    options: {
      radius: 75,
      maxZoom: 16,
      minZoom: 0
    }
  });

  return (
    <>
      {clusters.map(cluster => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount, restaurant } = cluster.properties;

        if (isCluster) {
          // Render cluster marker
          const size = Math.min(50, 20 + (pointCount / restaurants.length) * 100);
          return (
            <AdvancedMarker
              key={`cluster-${cluster.id}`}
              position={{ lat, lng }}
              onClick={() => {
                // Zoom into cluster
                const expansionZoom = Math.min(
                  supercluster.getClusterExpansionZoom(cluster.id),
                  16
                );
                // The map will auto-zoom when we update zoom state
              }}
            >
              <div
                className="cluster-marker"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `linear-gradient(135deg, #ff6b6b, #ee5a5a)`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: size > 35 ? '14px' : '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  border: '3px solid white',
                  cursor: 'pointer'
                }}
              >
                {pointCount}
              </div>
            </AdvancedMarker>
          );
        }

        // Render individual restaurant marker
        return (
          <AdvancedMarker
            key={`restaurant-${restaurant?.id || cluster.id}`}
            position={{ lat, lng }}
            onClick={() => onMarkerClick(restaurant)}
          >
            <div
              className="restaurant-marker"
              style={{
                width: '24px',
                height: '24px',
                background: getMarkerColor(restaurant?.priceLevelNum),
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

// Map bounds tracker component
function MapBoundsTracker({ onBoundsChange }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleBoundsChanged = () => {
      const bounds = map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onBoundsChange([sw.lng(), sw.lat(), ne.lng(), ne.lat()], map.getZoom());
      }
    };

    // Initial bounds
    handleBoundsChanged();

    // Listen for changes
    const listener = map.addListener('idle', handleBoundsChanged);
    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
    };
  }, [map, onBoundsChange]);

  return null;
}

// Move calculateDistance outside component to avoid recreation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Google Maps container style
const mapContainerStyle = {
  width: "100%",
  height: "100%"
};

// Default center (Metro Manila - centered on NCR bounds)
const defaultCenter = {
  lat: 14.565,   // Center of NCR (14.35 to 14.78)
  lng: 121.025   // Center of NCR (120.90 to 121.15)
};

// Google Maps Map ID (required for AdvancedMarker)
const MAP_ID = process.env.REACT_APP_GOOGLE_MAP_ID || "DEMO_MAP_ID";

export default function RestaurantLocator() {
  const mapInstanceRef = useRef(null);

  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapError, setMapError] = useState(null);
  const [selectedPriceLevel, setSelectedPriceLevel] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [availableCuisines, setAvailableCuisines] = useState([]);
  const [activeView, setActiveView] = useState("map"); // map or list
  const [showFilterModal, setShowFilterModal] = useState(false); // Filter modal state
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(11);
  const [mapBounds, setMapBounds] = useState(null); // For SuperCluster
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [cacheStatus, setCacheStatus] = useState('checking');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [totalFromApi, setTotalFromApi] = useState(0);
  const [useApiMode, setUseApiMode] = useState(true); // Use API by default

  // Progress tracking for loading bar
  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 0,
    phase: 'idle', // 'idle' | 'initial' | 'background' | 'complete'
    message: ''
  });

  // Debounce search query to prevent filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // NCR Bounding Box (Metro Manila bounds - matches API filter)
  const NCR_BOUNDS = {
    north: 14.78,   // Northern edge (Caloocan/Valenzuela)
    south: 14.35,   // Southern edge (Muntinlupa/Las Piñas)
    east: 121.15,   // Eastern edge (Marikina/Rizal border)
    west: 120.90    // Western edge (Manila Bay)
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

  const RESTAURANT_IMAGES = {
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
    "Gerry's Grill": "https://www.gerrysgrill.com/wp-content/uploads/2019/06/gerrys-logo.png",
    "Kuya J": "https://kuyaj.com.ph/wp-content/uploads/2019/06/kuyaj-logo.png",
    "Cabalen": "https://cabalen.ph/wp-content/uploads/2019/06/cabalen-logo.png",
    "Conti's": "https://contis.ph/wp-content/uploads/2019/06/contis-logo.png",
    "Vikings": "https://vikings.ph/wp-content/uploads/2019/06/vikings-logo.png",
    "Spiral": "https://www.shangri-la.com/images/default-source/logos/spiral-logo.png",
    "Sambokojin": "https://sambokojin.com/wp-content/uploads/2019/06/sambokojin-logo.png",
    "Yakimix": "https://yakimix.com.ph/wp-content/uploads/2019/06/yakimix-logo.png"
  };

  const getRestaurantImage = (name) => {
    if (!name) return "https://img.icons8.com/color/200/restaurant.png";
    const nameStr = String(name);
    if (RESTAURANT_IMAGES[nameStr]) {
      return RESTAURANT_IMAGES[nameStr];
    }
    const lowerName = nameStr.toLowerCase();
    for (const [key, value] of Object.entries(RESTAURANT_IMAGES)) {
      if (lowerName.includes(key.toLowerCase())) {
        return value;
      }
    }
    return "https://img.icons8.com/color/200/restaurant.png";
  };

  // Quick filters with proper toggle functionality - checks actual state for toggling
  const handleQuickFilter = (filterId) => {
    // Check actual filter state to determine if we should toggle on or off
    const isCurrentlyActive = (() => {
      switch(filterId) {
        case 'popular': return minRating >= 4;
        case 'healthy': return selectedCuisine === 'vegan';
        case 'nearme': return showNearbyOnly;
        case 'cheap': return selectedPriceLevel === "1";
        case 'delivery': return deliveryFilter === 'delivery';
        case 'open': return openNowFilter;
        default: return false;
      }
    })();

    if (isCurrentlyActive) {
      // Deactivate the filter
      switch(filterId) {
        case 'popular':
          setMinRating(0);
          break;
        case 'healthy':
          setSelectedCuisine('all');
          break;
        case 'nearme':
          setShowNearbyOnly(false);
          break;
        case 'cheap':
          setSelectedPriceLevel("all");
          break;
        case 'delivery':
          setDeliveryFilter('all');
          break;
        case 'open':
          setOpenNowFilter(false);
          break;
        default:
          break;
      }
    } else {
      // Activate the filter
      switch(filterId) {
        case 'popular':
          setMinRating(4);
          break;
        case 'healthy':
          setSelectedCuisine('vegan');
          break;
        case 'nearme':
          getUserLocation();
          setShowNearbyOnly(true);
          break;
        case 'cheap':
          setSelectedPriceLevel("1");
          break;
        case 'delivery':
          setDeliveryFilter('delivery');
          break;
        case 'open':
          setOpenNowFilter(true);
          break;
        default:
          break;
      }
    }
  };

  const quickFilters = [
    { id: 'popular', label: "What's Popular", icon: '🔥' },
    { id: 'healthy', label: 'Healthy Options', icon: '🥗' },
    { id: 'nearme', label: 'Near Me', icon: '📍' },
    { id: 'cheap', label: 'Budget Friendly', icon: '💰' },
    { id: 'delivery', label: 'Delivery', icon: '🚚' },
    { id: 'open', label: 'Open Now', icon: '🟢' },
  ];

  // Check if a quick filter is active based on actual filter state
  const isQuickFilterActive = (filterId) => {
    switch(filterId) {
      case 'popular': return minRating >= 4;
      case 'healthy': return selectedCuisine === 'vegan';
      case 'nearme': return showNearbyOnly;
      case 'cheap': return selectedPriceLevel === "1";
      case 'delivery': return deliveryFilter === 'delivery';
      case 'open': return openNowFilter;
      default: return false;
    }
  };

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

  // Get marker color based on price level (used by ClusteredMarkers)
  const getMarkerColor = useCallback((priceLevelNum) => {
    const colors = {
      1: '#65a30d',  // Green - budget friendly
      2: '#e2a044',  // Yellow - moderate
      3: '#dc7928',  // Orange - expensive
      4: '#dc2626'   // Red - very expensive
    };
    return colors[priceLevelNum] || '#9ca3af';
  }, []);

  // Handle map bounds change for SuperCluster
  const handleBoundsChange = useCallback((bounds, zoom) => {
    setMapBounds(bounds);
    setMapZoom(zoom);
  }, []);

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
        setMapCenter({ lat: latitude, lng: longitude });
        setMapZoom(14);
        // Auto-enable nearby mode to reduce initial load and improve performance
        setShowNearbyOnly(true);
      },
      (error) => {
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

        // console.error('❌ Geolocation error:', {
        //   code: error.code,
        //   message: error.message
        // });

        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };


  // Fetch restaurants from API based on location and filters
  // NOTE: This loads ALL restaurants for client-side pagination - do NOT include currentPage as dependency
  const fetchRestaurantsFromApi = useCallback(async (lat, lng, options = {}) => {
    const {
      radius = searchRadius * 1000, // Convert km to meters
      cuisine = selectedCuisine !== "all" ? selectedCuisine : undefined,
      minRatingFilter = minRating > 0 ? minRating : undefined,
      priceLevel = selectedPriceLevel !== "all" ? selectedPriceLevel : undefined,
      search = debouncedSearchQuery || undefined,
      limit = 100
    } = options;

    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      limit: limit.toString()
    });

    if (cuisine) params.append('cuisine', cuisine.toLowerCase());
    if (minRatingFilter) params.append('minRating', minRatingFilter.toString());
    if (priceLevel) params.append('priceLevel', priceLevel);
    if (search) params.append('search', search);

    try {
      const response = await fetch(`${API_BASE_URL}/api/places/nearby?${params}`);
      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      return {
        restaurants: data.restaurants.map(item => ({
          ...item,
          id: item.id || `${item.name}_${item.lat}_${item.lng}`,
          priceLevelNum: item.priceLevelNum || getPriceLevelNum(item.priceLevel),
          image: getRestaurantImage(item.name)
        })),
        total: data.pagination.total,
        hasMore: data.pagination.hasMore
      };
    } catch (error) {
      throw error;
    }
  }, [searchRadius, selectedCuisine, minRating, selectedPriceLevel, debouncedSearchQuery]);

  // Load cuisines list from API
  useEffect(() => {
    const loadCuisines = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/places/cuisines`);
        if (response.ok) {
          const data = await response.json();
          const formatted = data.cuisines
            .filter(c => c && c.length > 1)
            .map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase().replace(/_/g, ' '))
            .sort();
          setAvailableCuisines([...new Set(formatted)]);
        }
      } catch (error) {
        // Fallback cuisines if API fails
        setAvailableCuisines(['Filipino', 'Japanese', 'Korean', 'Chinese', 'Italian', 'American', 'Thai', 'Indian', 'Mexican', 'Fast Food', 'Cafe', 'Seafood', 'Pizza', 'Burger', 'Ramen']);
      }
    };
    loadCuisines();
  }, []);

  // Main data loading effect - uses API with location (OPTIMIZED for speed)
  useEffect(() => {
    let isCancelled = false; // Prevent stale updates

    const loadRestaurants = async () => {
      setLoading(true);
      setCacheStatus('loading');
      setLoadingProgress({ loaded: 0, total: 0, phase: 'initial', message: 'Connecting to database...' });

      // Determine location to use
      const locationToUse = userLocation || defaultCenter;

      if (useApiMode) {
        try {
          // FAST INITIAL LOAD: Show ALL nearby restaurants, or 3000 for all mode
          // SuperCluster handles clustering efficiently
          const initialLimit = showNearbyOnly ? 5000 : 3000; // 5000 for nearby = show all within radius

          setLoadingProgress({ loaded: 0, total: 0, phase: 'initial', message: 'Fetching restaurants...' });

          const result = await fetchRestaurantsFromApi(
            locationToUse.lat,
            locationToUse.lng,
            { radius: showNearbyOnly ? searchRadius * 1000 : 0, limit: initialLimit }
          );

          if (isCancelled) return; // Don't update if effect was cleaned up

          console.log(`⚡ Fast load: ${result.restaurants.length} restaurants (nearby: ${showNearbyOnly})`);

          setRestaurants(result.restaurants);
          setTotalFromApi(result.total);
          setCacheStatus('api');
          setLoading(false);

          // Update progress - initial load complete
          setLoadingProgress({
            loaded: result.restaurants.length,
            total: result.total,
            phase: result.total > initialLimit && !showNearbyOnly ? 'background' : 'complete',
            message: result.total > initialLimit && !showNearbyOnly
              ? `Loaded ${result.restaurants.length.toLocaleString()} of ${result.total.toLocaleString()} restaurants...`
              : 'All restaurants loaded!'
          });

          // BACKGROUND LOAD: Only when NOT in nearby mode and there are more restaurants
          if (!showNearbyOnly && result.total > initialLimit) {
            // Load remaining data in background (non-blocking)
            setTimeout(async () => {
              if (isCancelled) return; // Check again before background load

              try {
                setLoadingProgress(prev => ({
                  ...prev,
                  phase: 'background',
                  message: `Loading remaining ${(prev.total - prev.loaded).toLocaleString()} restaurants...`
                }));

                const fullResult = await fetchRestaurantsFromApi(
                  locationToUse.lat,
                  locationToUse.lng,
                  { radius: 0, limit: 20000 }
                );

                if (isCancelled) return; // Check again after async call

                console.log(`📊 Background load complete: ${fullResult.restaurants.length} restaurants`);
                setRestaurants(fullResult.restaurants);
                setTotalFromApi(fullResult.total);

                // Mark loading as complete
                setLoadingProgress({
                  loaded: fullResult.restaurants.length,
                  total: fullResult.total,
                  phase: 'complete',
                  message: `All ${fullResult.restaurants.length.toLocaleString()} restaurants loaded!`
                });

                // Hide progress bar after 2 seconds
                setTimeout(() => {
                  if (!isCancelled) {
                    setLoadingProgress(prev => ({ ...prev, phase: 'idle' }));
                  }
                }, 2000);
              } catch (err) {
                console.log('Background load skipped:', err.message);
                setLoadingProgress(prev => ({ ...prev, phase: 'idle' }));
              }
            }, 100);
          } else {
            // No background load needed - hide after 2 seconds
            setTimeout(() => {
              if (!isCancelled) {
                setLoadingProgress(prev => ({ ...prev, phase: 'idle' }));
              }
            }, 2000);
          }
          return;
        } catch (apiError) {
          if (isCancelled) return;
          console.error('❌ API failed, falling back to JSON:', apiError.message);
          setUseApiMode(false);
          setLoadingProgress({ loaded: 0, total: 0, phase: 'initial', message: 'Switching to offline mode...' });
        }
      }

      // Fallback: Load from static JSON files (legacy mode)
      console.log('⚠️ Using fallback JSON mode (API disabled or failed)');
      setLoadingProgress({ loaded: 0, total: 0, phase: 'initial', message: 'Loading from local data...' });
      try {
        const response = await fetch("/data/ncr_food_places2.json");
        const data = await response.json();

        if (isCancelled) return;

        const validData = data.items.filter(item =>
          item && item.name && typeof item.lat === 'number' && typeof item.lng === 'number'
        );
        const processedData = validData.map(item => ({
          ...item,
          id: item.id || `${item.name}_${item.lat}_${item.lng}`,
          priceLevelNum: getPriceLevelNum(item.priceLevel),
          image: getRestaurantImage(item.name)
        }));
        setRestaurants(processedData);
        setCacheStatus('fallback');
        setLoadingProgress({
          loaded: processedData.length,
          total: processedData.length,
          phase: 'complete',
          message: `Loaded ${processedData.length.toLocaleString()} restaurants (offline)`
        });
        setTimeout(() => {
          if (!isCancelled) setLoadingProgress(prev => ({ ...prev, phase: 'idle' }));
        }, 2000);
      } catch (error) {
        if (!isCancelled) {
          setRestaurants([]);
          setLoadingProgress({ loaded: 0, total: 0, phase: 'idle', message: '' });
        }
      }
      if (!isCancelled) setLoading(false);
    };

    loadRestaurants();

    // Cleanup: Cancel pending updates when dependencies change
    return () => {
      isCancelled = true;
    };
  }, [userLocation, useApiMode, fetchRestaurantsFromApi, showNearbyOnly, searchRadius]);

  // Refetch when TEXT filters change (only in API mode) - separate from nearby filter
  // Note: showNearbyOnly changes are handled by the main loading effect above
  useEffect(() => {
    // Skip if not in API mode, still loading, or no filter changes
    if (!useApiMode || loading) return;
    // Skip on initial render (no filters active)
    if (!debouncedSearchQuery && selectedCuisine === "all" &&
        selectedPriceLevel === "all" && minRating === 0) return;

    let isCancelled = false;

    const refetchWithFilters = async () => {
      const locationToUse = userLocation || defaultCenter;

      try {
        setLoading(true);
        const result = await fetchRestaurantsFromApi(
          locationToUse.lat,
          locationToUse.lng,
          {
            radius: showNearbyOnly ? searchRadius * 1000 : 0,
            limit: showNearbyOnly ? 5000 : 5000, // Show ALL nearby restaurants
            cuisine: selectedCuisine !== "all" ? selectedCuisine : undefined,
            minRatingFilter: minRating > 0 ? minRating : undefined,
            priceLevel: selectedPriceLevel !== "all" ? selectedPriceLevel : undefined,
            search: debouncedSearchQuery || undefined
          }
        );

        if (isCancelled) return;

        console.log(`⚡ Refetch: ${result.restaurants.length} restaurants (nearby: ${showNearbyOnly})`);
        setRestaurants(result.restaurants);
        setTotalFromApi(result.total);
        setLoading(false);
      } catch (error) {
        if (!isCancelled) setLoading(false);
      }
    };

    // Debounce the refetch
    const timer = setTimeout(refetchWithFilters, 300);
    return () => {
      clearTimeout(timer);
      isCancelled = true;
    };
  }, [debouncedSearchQuery, selectedCuisine, selectedPriceLevel, minRating,
      showNearbyOnly, searchRadius, userLocation, useApiMode, fetchRestaurantsFromApi]);


  // Simplified filtering - server handles most filters in API mode
  // Only client-side filtering needed for delivery/openNow (not in API) and fallback mode
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    // Add distance if user location is available and not already set by API
    if (userLocation && filtered.length > 0 && !filtered[0].distance) {
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

    // Sort by distance if available
    if (filtered.length > 0 && filtered[0].distance !== undefined) {
      filtered = [...filtered].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    // Client-side filters (not handled by API)
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

    // Fallback mode: apply filters that API would normally handle
    if (!useApiMode) {
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        filtered = filtered.filter(restaurant => {
          const name = String(restaurant.name || '').toLowerCase();
          const address = String(restaurant.address || '').toLowerCase();
          return name.includes(query) || address.includes(query);
        });
      }

      if (selectedCuisine !== "all") {
        const cuisineLower = selectedCuisine.toLowerCase();
        filtered = filtered.filter(restaurant => {
          const restaurantCuisine = (restaurant.cuisine || '').toLowerCase();
          const hasInCuisineField = restaurantCuisine.includes(cuisineLower);
          const hasInTypes = restaurant.types && restaurant.types.some(type =>
            type.toLowerCase().replace(/_/g, ' ').includes(cuisineLower)
          );
          return hasInCuisineField || hasInTypes;
        });
      }

      if (selectedPriceLevel !== "all") {
        const priceLevel = parseInt(selectedPriceLevel);
        filtered = filtered.filter(restaurant =>
          restaurant.priceLevelNum === priceLevel
        );
      }

      if (minRating > 0) {
        filtered = filtered.filter(restaurant =>
          restaurant.rating && restaurant.rating >= minRating
        );
      }

      if (showNearbyOnly && userLocation) {
        filtered = filtered.filter(restaurant => restaurant.distance <= searchRadius);
      }
    }

    return filtered;
  }, [restaurants, userLocation, deliveryFilter, openNowFilter, useApiMode,
      debouncedSearchQuery, selectedCuisine, selectedPriceLevel, minRating, showNearbyOnly, searchRadius]);

  // Limit markers for performance
  const displayedRestaurants = useMemo(() => {
    const hasActiveFilters =
      debouncedSearchQuery !== "" ||
      selectedPriceLevel !== "all" ||
      minRating > 0 ||
      selectedCuisine !== "all" ||
      deliveryFilter !== "all" ||
      openNowFilter ||
      showNearbyOnly;

    const maxMarkers = hasActiveFilters ? 500 : 200;
    return filteredRestaurants.slice(0, maxMarkers);
  }, [filteredRestaurants, debouncedSearchQuery, selectedPriceLevel, minRating,
      selectedCuisine, deliveryFilter, openNowFilter, showNearbyOnly]);

  // Pagination calculations for list view
  const paginatedRestaurants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRestaurants.slice(startIndex, endIndex);
  }, [filteredRestaurants, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPriceLevel, minRating, selectedCuisine, deliveryFilter, openNowFilter, showNearbyOnly, searchRadius]);

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
    if (restaurant.lat && restaurant.lng) {
      setMapCenter({ lat: restaurant.lat, lng: restaurant.lng });
      setMapZoom(16);
      setActiveView('map');
    }
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="restaurant-locator">
        <div className="error-container" style={{ padding: '40px', textAlign: 'center' }}>
          <h2>⚠️ Google Maps API Key Missing</h2>
          <p>Please add your Google Maps API key to the .env file:</p>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', display: 'inline-block' }}>
            REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
          </pre>
        </div>
      </div>
    );
  }

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

      {/* Compact Loading Indicator - Small yellow badge in corner */}
      {loadingProgress.phase !== 'idle' && (
        <div className={`loading-indicator ${loadingProgress.phase}`}>
          <div className="loading-indicator-icon">
            {loadingProgress.phase === 'complete' ? '✓' : ''}
          </div>
          <div className="loading-indicator-content">
            <div className="loading-indicator-progress">
              <div
                className="loading-indicator-fill"
                style={{
                  width: loadingProgress.total > 0
                    ? `${Math.min((loadingProgress.loaded / loadingProgress.total) * 100, 100)}%`
                    : loadingProgress.phase === 'initial' ? '30%' : '100%'
                }}
              />
            </div>
            <span className="loading-indicator-text">
              {loadingProgress.total > 0
                ? `${loadingProgress.loaded.toLocaleString()}/${loadingProgress.total.toLocaleString()}`
                : 'Loading...'}
            </span>
          </div>
        </div>
      )}

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
                className={`quick-filter ${isQuickFilterActive(filter.id) ? 'active' : ''}`}
                onClick={() => handleQuickFilter(filter.id)}
              >
                <span className="filter-icon">{filter.icon}</span>
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
            <div className="map-container" style={{ width: '100%', height: '100%' }}>
              {/* Google Maps - loads immediately with async loading for better performance */}
              <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                  style={mapContainerStyle}
                  defaultCenter={defaultCenter}
                  center={mapCenter}
                  zoom={mapZoom}
                  mapId={MAP_ID}
                  gestureHandling="greedy"
                  onCameraChanged={(ev) => {
                    setMapCenter(ev.detail.center);
                    setMapZoom(ev.detail.zoom);
                  }}
                  onTilesLoaded={() => {
                    setIsMapLoaded(true);
                    if (!userLocation) getUserLocation();
                  }}
                >
                  {/* Map Bounds Tracker for SuperCluster */}
                  <MapBoundsTracker onBoundsChange={handleBoundsChange} />

                  {/* SuperCluster-based Restaurant Markers - handles 18k+ points efficiently */}
                  <ClusteredMarkers
                    restaurants={filteredRestaurants}
                    onMarkerClick={setSelectedRestaurant}
                    getMarkerColor={getMarkerColor}
                    bounds={mapBounds}
                    zoom={mapZoom}
                  />

                  {/* User Location Marker */}
                  {userLocation && (
                    <AdvancedMarker
                      position={{ lat: userLocation.lat, lng: userLocation.lng }}
                      title="Your Location"
                    >
                      <div className="user-location-marker">
                        <div className="pulse-ring"></div>
                        <div className="user-dot"></div>
                      </div>
                    </AdvancedMarker>
                  )}

                  {/* Info Window for Selected Restaurant */}
                  {selectedRestaurant && selectedRestaurant.lat && selectedRestaurant.lng && (
                    <InfoWindow
                      position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
                      onCloseClick={() => setSelectedRestaurant(null)}
                    >
                      <div className="info-window">
                        <h3>{selectedRestaurant.name}</h3>
                        <p>{selectedRestaurant.address}</p>
                        {selectedRestaurant.rating && (
                          <p>⭐ {selectedRestaurant.rating} ({selectedRestaurant.userRatingCount || 0} reviews)</p>
                        )}
                        {selectedRestaurant.priceLevelNum && (
                          <p>{getPriceLevelSymbol(selectedRestaurant.priceLevelNum)}</p>
                        )}
                        {selectedRestaurant.googleMapsUri && (
                          <a href={selectedRestaurant.googleMapsUri} target="_blank" rel="noopener noreferrer">
                            View on Google Maps →
                          </a>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>

              {userLocation && (
                <button
                  className="locate-me-btn"
                  onClick={() => {
                    setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
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
                <>
                <div className="restaurant-grid">
                  {paginatedRestaurants.map((restaurant, index) => (
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      ← Previous
                    </button>

                    <div className="pagination-info">
                      <span>Page {currentPage} of {totalPages}</span>
                      <span className="pagination-count">
                        ({filteredRestaurants.length} restaurants)
                      </span>
                    </div>

                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next →
                    </button>
                  </div>
                )}
                </>
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
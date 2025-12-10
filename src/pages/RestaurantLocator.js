import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import useSupercluster from "use-supercluster";
import LoadingModal from "../components/LoadingModal";
import { getRestaurantImage as getPlaceholderImage } from "../utils/getRestaurantImage";
import "./RestaurantLocator.css";

// Restaurant type colors for markers
const TYPE_COLORS = {
  restaurant: '#E65100',  // Orange
  fast_food: '#C62828',   // Red
  cafe: '#5D4037',        // Brown
  bakery: '#F9A825',      // Golden
  bar: '#7B1FA2',         // Purple
  ice_cream: '#00ACC1',   // Cyan
  food_court: '#388E3C',  // Green
  food_stand: '#FF7043',  // Deep Orange
  default: '#1976D2'      // Blue
};

// Restaurant type emojis
const TYPE_EMOJIS = {
  restaurant: '🍽️',
  fast_food: '🍔',
  cafe: '☕',
  bakery: '🥐',
  bar: '🍺',
  ice_cream: '🍦',
  food_court: '🏬',
  food_stand: '🥡',
  default: '📍'
};

// Get cluster color based on count
function getClusterColor(count) {
  if (count >= 1000) return { bg: '#B71C1C', text: 'white' };      // Dark red
  if (count >= 500) return { bg: '#C62828', text: 'white' };       // Red
  if (count >= 100) return { bg: '#EF6C00', text: 'white' };       // Orange
  if (count >= 50) return { bg: '#F9A825', text: '#5D4037' };      // Golden
  if (count >= 20) return { bg: '#FDD835', text: '#5D4037' };      // Yellow
  return { bg: '#81C784', text: '#1B5E20' };                        // Green
}

// Get cluster size based on count
function getClusterSize(count) {
  if (count >= 1000) return 60;
  if (count >= 500) return 52;
  if (count >= 100) return 44;
  if (count >= 50) return 38;
  if (count >= 20) return 32;
  return 28;
}

// SuperCluster-based Markers component - FAST clustering for 46k+ points
function ClusteredMarkers({ restaurants, onMarkerClick, onClusterClick, bounds, zoom }) {
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
      radius: 80,
      maxZoom: 18,
      minZoom: 0,
      minPoints: 3
    }
  });

  return (
    <>
      {clusters.map(cluster => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount, restaurant } = cluster.properties;

        if (isCluster) {
          // Render cluster marker with color based on count
          const size = getClusterSize(pointCount);
          const colors = getClusterColor(pointCount);

          return (
            <AdvancedMarker
              key={`cluster-${cluster.id}`}
              position={{ lat, lng }}
              onClick={() => {
                // Zoom into the cluster
                const expansionZoom = Math.min(
                  supercluster.getClusterExpansionZoom(cluster.id),
                  18
                );
                onClusterClick({ lat, lng }, expansionZoom);
              }}
            >
              <div
                className="cluster-marker"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  background: colors.bg,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text,
                  fontWeight: '800',
                  fontSize: size > 44 ? '14px' : '12px',
                  boxShadow: `0 4px 12px ${colors.bg}66`,
                  border: '3px solid white',
                  cursor: 'pointer',
                  fontFamily: "'Nunito', 'Poppins', sans-serif",
                  transition: 'transform 0.2s ease'
                }}
                title={`${pointCount} restaurants - Click to zoom`}
              >
                {pointCount >= 1000 ? `${(pointCount / 1000).toFixed(1)}k` : pointCount}
              </div>
            </AdvancedMarker>
          );
        }

        // Render individual restaurant marker - Google Maps Pin Style
        const type = restaurant?.type || 'default';
        const color = TYPE_COLORS[type] || TYPE_COLORS.default;
        const emoji = TYPE_EMOJIS[type] || TYPE_EMOJIS.default;

        return (
          <AdvancedMarker
            key={`restaurant-${restaurant?.id || cluster.id}`}
            position={{ lat, lng }}
            onClick={() => onMarkerClick(restaurant)}
          >
            <div className="gm-pin-marker" title={restaurant?.name || 'Restaurant'}>
              <div className="gm-pin-head" style={{ background: color }}>
                <span className="gm-pin-icon">{emoji}</span>
              </div>
              <div className="gm-pin-tail" style={{ borderTopColor: color }} />
            </div>
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

// Map Legend Component - shows marker type colors
function MapLegend({ isVisible, onToggle }) {
  const legendItems = [
    { type: 'restaurant', label: 'Restaurant', emoji: '🍽️', color: TYPE_COLORS.restaurant },
    { type: 'fast_food', label: 'Fast Food', emoji: '🍔', color: TYPE_COLORS.fast_food },
    { type: 'cafe', label: 'Cafe', emoji: '☕', color: TYPE_COLORS.cafe },
    { type: 'bakery', label: 'Bakery', emoji: '🥐', color: TYPE_COLORS.bakery },
    { type: 'bar', label: 'Bar', emoji: '🍺', color: TYPE_COLORS.bar },
    { type: 'ice_cream', label: 'Ice Cream', emoji: '🍦', color: TYPE_COLORS.ice_cream },
  ];

  const clusterItems = [
    { count: '1000+', color: '#B71C1C', label: 'Very Dense' },
    { count: '100-999', color: '#EF6C00', label: 'Dense' },
    { count: '20-99', color: '#FDD835', label: 'Moderate' },
    { count: '<20', color: '#81C784', label: 'Sparse' },
  ];

  return (
    <div className={`map-legend ${isVisible ? 'expanded' : 'collapsed'}`}>
      <button className="legend-toggle" onClick={onToggle}>
        {isVisible ? '◀' : '▶'} Legend
      </button>

      {isVisible && (
        <div className="legend-content">
          <div className="legend-section">
            <h4>Restaurant Types</h4>
            {legendItems.map(item => (
              <div key={item.type} className="legend-item">
                <span
                  className="legend-marker"
                  style={{ borderColor: item.color }}
                >
                  {item.emoji}
                </span>
                <span className="legend-label">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="legend-section">
            <h4>Cluster Density</h4>
            {clusterItems.map(item => (
              <div key={item.count} className="legend-item">
                <span
                  className="legend-cluster"
                  style={{ background: item.color }}
                />
                <span className="legend-label">{item.count} - {item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  lat: 14.565,
  lng: 121.025
};

// Google Maps Map ID (required for AdvancedMarker)
const MAP_ID = process.env.REACT_APP_GOOGLE_MAP_ID || "DEMO_MAP_ID";

// ========================================
// ICON COMPONENTS - Dashboard Style
// ========================================

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v2"/>
    <path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/>
    <path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/>
    <path d="m19.07 4.93-1.41 1.41"/>
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#F5B83D" : "none"} stroke="#F5B83D" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const MapPinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
    <path d="M15 18H9"/>
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
    <circle cx="17" cy="18" r="2"/>
    <circle cx="7" cy="18" r="2"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const FireIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

const LeafIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const UtensilsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
    <path d="M7 2v20"/>
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
  </svg>
);

export default function RestaurantLocator() {
  const mapInstanceRef = useRef(null);
  const location = useLocation();

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
  const [activeView, setActiveView] = useState("map");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(11);
  const [mapBounds, setMapBounds] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [cacheStatus, setCacheStatus] = useState('checking');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [totalFromApi, setTotalFromApi] = useState(0);
  const [useApiMode, setUseApiMode] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  // Progress tracking for loading bar
  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 0,
    phase: 'idle',
    message: ''
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle URL parameters (from Barkada Vote winner redirect)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const nearmeParam = params.get('nearme');

    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }

    if (nearmeParam === 'true') {
      // Automatically get user location and enable nearby filter
      getUserLocation();
      setShowNearbyOnly(true);
    }
  }, [location.search]);

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

  const NCR_BOUNDS = {
    north: 14.78,
    south: 14.35,
    east: 121.15,
    west: 120.90
  };

  const isWithinNCR = (lat, lng) => {
    return lat >= NCR_BOUNDS.south &&
           lat <= NCR_BOUNDS.north &&
           lng >= NCR_BOUNDS.west &&
           lng <= NCR_BOUNDS.east;
  };

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
    "Starbucks": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/200px-Starbucks_Corporation_Logo_2011.svg.png",
  };

  // Get restaurant image - prioritizes chain logos, falls back to cuisine-based Unsplash photos
  const getRestaurantImage = (restaurant) => {
    // If passed a string (name only), create minimal object
    const r = typeof restaurant === 'string' ? { name: restaurant } : restaurant;
    if (!r || !r.name) return getPlaceholderImage(r);

    const nameStr = String(r.name);

    // Check for exact match on chain logos
    if (RESTAURANT_IMAGES[nameStr]) {
      return RESTAURANT_IMAGES[nameStr];
    }

    // Check for partial match on chain logos
    const lowerName = nameStr.toLowerCase();
    for (const [key, value] of Object.entries(RESTAURANT_IMAGES)) {
      if (lowerName.includes(key.toLowerCase())) {
        return value;
      }
    }

    // Fall back to cuisine/type-based Unsplash placeholder
    return getPlaceholderImage(r);
  };

  // Quick filters with proper toggle functionality
  const handleQuickFilter = (filterId) => {
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
    { id: 'popular', label: "Popular", icon: <FireIcon /> },
    { id: 'healthy', label: 'Healthy', icon: <LeafIcon /> },
    { id: 'nearme', label: 'Near Me', icon: <MapPinIcon /> },
    { id: 'cheap', label: 'Budget', icon: <WalletIcon /> },
    { id: 'delivery', label: 'Delivery', icon: <TruckIcon /> },
    { id: 'open', label: 'Open Now', icon: <ClockIcon /> },
  ];

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

  const handleBoundsChange = useCallback((bounds, zoom) => {
    setMapBounds(bounds);
    setMapZoom(zoom);
  }, []);

  // Handle cluster click - zoom into the cluster
  const handleClusterClick = useCallback((position, zoom) => {
    setMapCenter(position);
    setMapZoom(zoom);
  }, []);

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

  const fetchRestaurantsFromApi = useCallback(async (lat, lng, options = {}) => {
    const {
      radius = searchRadius * 1000,
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
          image: getRestaurantImage(item)
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
        setAvailableCuisines(['Filipino', 'Japanese', 'Korean', 'Chinese', 'Italian', 'American', 'Thai', 'Indian', 'Mexican', 'Fast Food', 'Cafe', 'Seafood', 'Pizza', 'Burger', 'Ramen']);
      }
    };
    loadCuisines();
  }, []);

  // Main data loading effect
  useEffect(() => {
    let isCancelled = false;

    const loadRestaurants = async () => {
      setLoading(true);
      setCacheStatus('loading');
      setLoadingProgress({ loaded: 0, total: 0, phase: 'initial', message: 'Connecting to database...' });

      const locationToUse = userLocation || defaultCenter;

      if (useApiMode) {
        try {
          const initialLimit = showNearbyOnly ? 5000 : 3000;

          setLoadingProgress({ loaded: 0, total: 0, phase: 'initial', message: 'Fetching restaurants...' });

          const result = await fetchRestaurantsFromApi(
            locationToUse.lat,
            locationToUse.lng,
            { radius: showNearbyOnly ? searchRadius * 1000 : 0, limit: initialLimit }
          );

          if (isCancelled) return;

          setRestaurants(result.restaurants);
          setTotalFromApi(result.total);
          setCacheStatus('api');
          setLoading(false);

          setLoadingProgress({
            loaded: result.restaurants.length,
            total: result.total,
            phase: result.total > initialLimit && !showNearbyOnly ? 'background' : 'complete',
            message: result.total > initialLimit && !showNearbyOnly
              ? `Loaded ${result.restaurants.length.toLocaleString()} of ${result.total.toLocaleString()} restaurants...`
              : 'All restaurants loaded!'
          });

          if (!showNearbyOnly && result.total > initialLimit) {
            setTimeout(async () => {
              if (isCancelled) return;

              try {
                setLoadingProgress(prev => ({
                  ...prev,
                  phase: 'background',
                  message: `Loading remaining ${(prev.total - prev.loaded).toLocaleString()} restaurants...`
                }));

                const fullResult = await fetchRestaurantsFromApi(
                  locationToUse.lat,
                  locationToUse.lng,
                  { radius: 0, limit: 50000 }
                );

                if (isCancelled) return;

                setRestaurants(fullResult.restaurants);
                setTotalFromApi(fullResult.total);

                setLoadingProgress({
                  loaded: fullResult.restaurants.length,
                  total: fullResult.total,
                  phase: 'complete',
                  message: `All ${fullResult.restaurants.length.toLocaleString()} restaurants loaded!`
                });

                setTimeout(() => {
                  if (!isCancelled) {
                    setLoadingProgress(prev => ({ ...prev, phase: 'idle' }));
                  }
                }, 2000);
              } catch {
                setLoadingProgress(prev => ({ ...prev, phase: 'idle' }));
              }
            }, 100);
          } else {
            setTimeout(() => {
              if (!isCancelled) {
                setLoadingProgress(prev => ({ ...prev, phase: 'idle' }));
              }
            }, 2000);
          }
          return;
        } catch (apiError) {
          if (isCancelled) return;
          console.error('API failed, falling back to JSON:', apiError.message);
          setUseApiMode(false);
          setLoadingProgress({ loaded: 0, total: 0, phase: 'initial', message: 'Switching to offline mode...' });
        }
      }

      // Fallback: Load from static JSON files
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
          image: getRestaurantImage(item)
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

    return () => {
      isCancelled = true;
    };
  }, [userLocation, useApiMode, fetchRestaurantsFromApi, showNearbyOnly, searchRadius]);

  // Refetch when TEXT filters change
  useEffect(() => {
    if (!useApiMode || loading) return;
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
            limit: showNearbyOnly ? 5000 : 5000,
            cuisine: selectedCuisine !== "all" ? selectedCuisine : undefined,
            minRatingFilter: minRating > 0 ? minRating : undefined,
            priceLevel: selectedPriceLevel !== "all" ? selectedPriceLevel : undefined,
            search: debouncedSearchQuery || undefined
          }
        );

        if (isCancelled) return;

        setRestaurants(result.restaurants);
        setTotalFromApi(result.total);
        setLoading(false);
      } catch (error) {
        if (!isCancelled) setLoading(false);
      }
    };

    const timer = setTimeout(refetchWithFilters, 300);
    return () => {
      clearTimeout(timer);
      isCancelled = true;
    };
  }, [debouncedSearchQuery, selectedCuisine, selectedPriceLevel, minRating,
      showNearbyOnly, searchRadius, userLocation, useApiMode, fetchRestaurantsFromApi]);

  // Simplified filtering
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    // Calculate distance client-side if not provided by API (null/undefined)
    if (userLocation && filtered.length > 0 && (filtered[0].distance === null || filtered[0].distance === undefined)) {
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

    if (filtered.length > 0 && filtered[0].distance !== undefined) {
      filtered = [...filtered].sort((a, b) => (a.distance || 0) - (b.distance || 0));
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

    if (!useApiMode) {
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        filtered = filtered.filter(restaurant => {
          const name = String(restaurant.name || '').toLowerCase();
          const address = (typeof restaurant.address === 'string'
            ? restaurant.address
            : (restaurant.address?.formatted || restaurant.address?.city || '')).toLowerCase();
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

  // Pagination calculations
  const paginatedRestaurants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRestaurants.slice(startIndex, endIndex);
  }, [filteredRestaurants, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);

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
        stars.push(<StarIcon key={i} filled={true} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half"><StarIcon filled={true} /></span>);
      } else {
        stars.push(<StarIcon key={i} filled={false} />);
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

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedPriceLevel !== "all") count++;
    if (minRating > 0) count++;
    if (selectedCuisine !== "all") count++;
    if (deliveryFilter !== "all") count++;
    if (openNowFilter) count++;
    return count;
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="restaurant-locator">
        <div className="error-container">
          <WarningIcon />
          <h2>Google Maps API Key Missing</h2>
          <p>Please add your Google Maps API key to the .env file:</p>
          <pre>REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here</pre>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && <LoadingModal message="Loading restaurant data..." />}
      <div className="restaurant-locator">
        {/* Header - Dashboard Style */}
        <header className="app-header">
          <div className="header-content">
            <div className="brand">
              <div className="logo-icon">
                <MapPinIcon size={28} />
              </div>
              <div className="brand-text">
                <h1>Restaurant Locator</h1>
                <p>Discover the best eats near you</p>
              </div>
            </div>
            <div className="header-stats">
              <span className="stat-value">
                {totalFromApi > 0 ? totalFromApi.toLocaleString() : filteredRestaurants.length.toLocaleString()}
              </span>
              <span className="stat-label">
                {filteredRestaurants.length !== totalFromApi && totalFromApi > 0
                  ? `(${filteredRestaurants.length.toLocaleString()} shown)`
                  : 'Places Found'}
              </span>
            </div>
          </div>
        </header>

        {/* Compact Loading Indicator */}
        {loadingProgress.phase !== 'idle' && (
          <div className={`loading-indicator ${loadingProgress.phase}`}>
            <div className="loading-indicator-icon">
              {loadingProgress.phase === 'complete' ? <CheckCircleIcon /> : null}
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
              <div className="search-input-wrapper">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Ask about food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Quick Filters - Feature Cards Style */}
            <div className="quick-filters">
              {quickFilters.map(filter => (
                <button
                  key={filter.id}
                  className={`quick-filter ${isQuickFilterActive(filter.id) ? 'active' : ''}`}
                  onClick={() => handleQuickFilter(filter.id)}
                >
                  <span className="filter-icon">{filter.icon}</span>
                  <span className="filter-label">{filter.label}</span>
                </button>
              ))}
            </div>

            {/* Filter Actions */}
            <div className="filter-actions">
              <button
                className="advanced-filters-btn"
                onClick={() => setShowFilterModal(true)}
              >
                <FilterIcon />
                <span>Advanced Filters</span>
                {getActiveFilterCount() > 0 && (
                  <span className="filter-count">{getActiveFilterCount()}</span>
                )}
              </button>
              <button className="reset-btn" onClick={resetFilters}>
                <RefreshIcon />
                <span>Reset All</span>
              </button>
            </div>

            {locationError && (
              <div className="alert alert-warning">
                <WarningIcon />
                <span>{locationError}</span>
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

            {/* Map Container */}
            {activeView === 'map' && (
              <div className="map-container">
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
                    <MapBoundsTracker onBoundsChange={handleBoundsChange} />

                    <ClusteredMarkers
                      restaurants={filteredRestaurants}
                      onMarkerClick={setSelectedRestaurant}
                      onClusterClick={handleClusterClick}
                      bounds={mapBounds}
                      zoom={mapZoom}
                    />

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

                    {selectedRestaurant && selectedRestaurant.lat && selectedRestaurant.lng && (
                      <InfoWindow
                        position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
                        onCloseClick={() => setSelectedRestaurant(null)}
                      >
                        <div className="gm-style-infowindow">
                          {/* Restaurant Image */}
                          <div className="iw-image-container">
                            <img
                              src={selectedRestaurant.image || getRestaurantImage(selectedRestaurant)}
                              alt={selectedRestaurant.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop";
                              }}
                            />
                          </div>

                          {/* Content */}
                          <div className="iw-content">
                            {/* Restaurant Name */}
                            <h3 className="iw-title">{selectedRestaurant.name}</h3>

                            {/* Address Block - Google Maps Style */}
                            <div className="iw-address">
                              <div className="iw-address-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#70757a">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                              </div>
                              <div className="iw-address-lines">
                                {selectedRestaurant.address?.street && (
                                  <span>{selectedRestaurant.address.street}</span>
                                )}
                                {(selectedRestaurant.address?.barangay || selectedRestaurant.address?.city) && (
                                  <span>
                                    {[selectedRestaurant.address?.barangay, selectedRestaurant.address?.city]
                                      .filter(Boolean).join(', ')}
                                  </span>
                                )}
                                {!selectedRestaurant.address?.street && !selectedRestaurant.address?.barangay && (
                                  <span>
                                    {typeof selectedRestaurant.address === 'string'
                                      ? selectedRestaurant.address
                                      : (selectedRestaurant.address?.formatted || selectedRestaurant.city || 'Metro Manila')}
                                  </span>
                                )}
                                <span>Metro Manila, Philippines</span>
                              </div>
                            </div>

                            {/* Tags Row */}
                            <div className="iw-tags">
                              {selectedRestaurant.type && (
                                <span className="iw-type-tag">
                                  {TYPE_EMOJIS[selectedRestaurant.type] || '📍'} {selectedRestaurant.type.replace('_', ' ')}
                                </span>
                              )}
                              {selectedRestaurant.cuisine && (
                                <span className="iw-cuisine-tag">{selectedRestaurant.cuisine}</span>
                              )}
                              {selectedRestaurant.rating && (
                                <span className="iw-rating-tag">
                                  ⭐ {selectedRestaurant.rating}
                                </span>
                              )}
                            </div>

                            {/* Contact Details */}
                            <div className="iw-details">
                              {selectedRestaurant.phone && (
                                <div className="iw-detail-row">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#70757a">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                  </svg>
                                  <a href={`tel:${selectedRestaurant.phone}`}>{selectedRestaurant.phone}</a>
                                </div>
                              )}

                              {selectedRestaurant.openingHours && (
                                <div className="iw-detail-row">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#70757a">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                  </svg>
                                  <span>{selectedRestaurant.openingHours}</span>
                                </div>
                              )}

                              {selectedRestaurant.website && (
                                <div className="iw-detail-row">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#70757a">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                                  </svg>
                                  <a href={selectedRestaurant.website} target="_blank" rel="noopener noreferrer">
                                    Visit website
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Google Maps Link */}
                            <a
                              href={selectedRestaurant.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${selectedRestaurant.lat},${selectedRestaurant.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="iw-google-link"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a73e8">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              View on Google Maps
                            </a>
                          </div>
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
                    <LocationIcon />
                  </button>
                )}

                {/* Map Legend */}
                <MapLegend
                  isVisible={showLegend}
                  onToggle={() => setShowLegend(!showLegend)}
                />
              </div>
            )}

            {/* List Container */}
            {activeView === 'list' && (
              <div className="list-container">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading delicious places...</p>
                  </div>
                ) : filteredRestaurants.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <UtensilsIcon />
                    </div>
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
                          <div className="card-image">
                            <img
                              src={restaurant.image || getRestaurantImage(restaurant)}
                              alt={restaurant.name}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop";
                              }}
                            />
                            {restaurant.rating && restaurant.rating >= 4.5 && (
                              <span className="promo-badge">
                                <span className="promo-title">TOP RATED</span>
                                <span className="promo-subtitle">{restaurant.rating} stars</span>
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

                            <p className="restaurant-address">
                              {typeof restaurant.address === 'string'
                                ? restaurant.address
                                : (restaurant.address?.formatted || restaurant.address?.city || 'Metro Manila')}
                            </p>

                            {restaurant.rating && (
                              <div className="rating-info">
                                <div className="stars-container">
                                  {renderStars(restaurant.rating)}
                                </div>
                                <span className="rating-text">
                                  {restaurant.rating} ({restaurant.userRatingCount || 0})
                                </span>
                              </div>
                            )}

                            {restaurant.distance !== undefined && userLocation && (
                              <div className="distance-info">
                                <MapPinIcon />
                                <span>{restaurant.distance.toFixed(1)} km away</span>
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
                          Previous
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
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filter Modal - Dashboard Style */}
        {showFilterModal && (
          <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Advanced Filters</h2>
                <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                  <CloseIcon />
                </button>
              </div>

              <div className="modal-body">
                {/* Cuisine Type Filter */}
                <div className="filter-section">
                  <h3>Cuisine Type</h3>
                  <div className="select-wrapper">
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
                    <ChevronDownIcon />
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="filter-section">
                  <h3>Price Range</h3>
                  <div className="select-wrapper">
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
                    <ChevronDownIcon />
                  </div>
                </div>

                {/* Minimum Rating Filter */}
                <div className="filter-section">
                  <h3>Minimum Rating</h3>
                  <div className="select-wrapper">
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
                    <ChevronDownIcon />
                  </div>
                </div>

                {/* Service Type Filter */}
                <div className="filter-section">
                  <h3>Service Type</h3>
                  <div className="select-wrapper">
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
                    <ChevronDownIcon />
                  </div>
                </div>

                {/* Distance Filter */}
                {userLocation && (
                  <div className="filter-section">
                    <h3>Distance</h3>
                    <label className="modal-checkbox">
                      <input
                        type="checkbox"
                        checked={showNearbyOnly}
                        onChange={(e) => setShowNearbyOnly(e.target.checked)}
                      />
                      <span className="checkbox-custom"></span>
                      <span>Show Nearby Only</span>
                    </label>
                    {showNearbyOnly && (
                      <div className="modal-slider-container">
                        <label className="slider-label">
                          Maximum Distance: <strong>{searchRadius} km</strong>
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
                  <h3>Operating Hours</h3>
                  <label className="modal-checkbox">
                    <input
                      type="checkbox"
                      checked={openNowFilter}
                      onChange={(e) => setOpenNowFilter(e.target.checked)}
                    />
                    <span className="checkbox-custom"></span>
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
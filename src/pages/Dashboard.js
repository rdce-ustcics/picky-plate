import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Heart, Calendar, Users, BookOpen } from "lucide-react";

export default function Dashboard() {
  const location = useLocation();

  // Identify active user (email set in Login.js)
  const activeUserId = (() => {
    try {
      return localStorage.getItem("pap:activeUserId") || "global";
    } catch {
      return "global";
    }
  })();

  // Per-account completion key
  const ONB_KEY = useMemo(() => `pap:onboardingDone:${activeUserId}`, [activeUserId]);

  // Triggers set by Login.js (state, query, session/local flags)
  const routeFlag = Boolean(location.state && location.state.showOnboarding);

  const searchParams = new URLSearchParams(location.search || "");
  const qp = (searchParams.get("newUser") || "").toLowerCase();
  const queryFlag = qp === "1" || qp === "true";

  let sessionTrigger = false;
  let forceFlag = false;
  try {
    sessionTrigger = sessionStorage.getItem("pap:onboardingTrigger") === "1";
    forceFlag = localStorage.getItem("pap:onboardingForce") === "1";
  } catch {}

  const cameFromSignup = routeFlag || queryFlag || sessionTrigger;

  // Decide initial visibility
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    try {
      const alreadyDone = localStorage.getItem(ONB_KEY) === "1";
      // If we came from signup and 'force' is set, show regardless of previous completion
      if (cameFromSignup && forceFlag) return true;
      return cameFromSignup && !alreadyDone;
    } catch {
      return cameFromSignup;
    }
  });

  // Cleanup one-time triggers and URL on mount
  useEffect(() => {
    if (!cameFromSignup) return;

    try {
      sessionStorage.removeItem("pap:onboardingTrigger");
      localStorage.removeItem("pap:onboardingForce");
    } catch {}

    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("newUser")) {
        url.searchParams.delete("newUser");
        const newQuery = url.searchParams.toString();
        const newPath = url.pathname + (newQuery ? `?${newQuery}` : "");
        window.history.replaceState({}, document.title, newPath);
      }
      if (location.state && location.state.showOnboarding) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // If account changes and is already complete, keep hidden
  useEffect(() => {
    try {
      if (localStorage.getItem(ONB_KEY) === "1") setShowWelcomeModal(false);
    } catch {}
  }, [ONB_KEY]);

  // Onboarding state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedDislikes, setSelectedDislikes] = useState([]);
  const [selectedFavorites, setSelectedFavorites] = useState([]);

  function completeOnboarding() {
    try {
      localStorage.setItem(ONB_KEY, "1");
      localStorage.removeItem("pap:onboardingForce");
    } catch {}
    setShowWelcomeModal(false);
  }

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep((s) => s + 1);
    else completeOnboarding();
  };
  const handleSkip = () => completeOnboarding();

  const toggleSelection = (id, type) => {
    if (type === "cuisine") {
      setSelectedCuisines((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else if (type === "dislike") {
      setSelectedDislikes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelectedFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  };

  // Data
  const cuisineOptions = [
    { id: "filipino", name: "Filipino", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop" },
    { id: "japanese", name: "Japanese", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop" },
    { id: "italian", name: "Italian", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop" },
    { id: "korean", name: "Korean", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop" },
    { id: "chinese", name: "Chinese", image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=300&fit=crop" },
    { id: "american", name: "American", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop" },
    { id: "thai", name: "Thai", image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop" },
    { id: "mexican", name: "Mexican", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop" },
  ];

  const dislikeOptions = [
    { id: "seafood", name: "Seafood", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop" },
    { id: "spicy", name: "Spicy Food", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop" },
    { id: "vegetables", name: "Vegetables", image: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop" },
    { id: "meat", name: "Meat", image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=300&fit=crop" },
    { id: "dairy", name: "Dairy", image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=300&fit=crop" },
    { id: "gluten", name: "Gluten", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop" },
    { id: "nuts", name: "Nuts", image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=300&fit=crop" },
    { id: "eggs", name: "Eggs", image: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&h=300&fit=crop" },
  ];

  const favoriteOptions = [
    { id: "steak", name: "Steak", image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop" },
    { id: "sushi", name: "Sushi", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop" },
    { id: "pizza", name: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop" },
    { id: "burger", name: "Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop" },
    { id: "pasta", name: "Pasta", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop" },
    { id: "ramen", name: "Ramen", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop" },
    { id: "tacos", name: "Tacos", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop" },
    { id: "desserts", name: "Desserts", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop" },
  ];

  const [favoritesMap, setFavoritesMap] = useState({});
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const popularDishes = [
    { id: 1, name: "McDonald's Burger", price: 60.0, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", rating: 5, discount: "15% Off" },
    { id: 2, name: "Murakami Ramen", price: 250.0, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop", rating: 4, discount: "15% Off" },
    { id: 3, name: "Landers Pepperoni Pizza", price: 350.0, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop", rating: 4, discount: "15% Off" },
  ];

  const recommendedForYou = [
    { id: 7, name: "Bulgogi Bowl", price: 180.0, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=300&fit=crop", rating: 5, restaurant: "Korean BBQ House" },
    { id: 8, name: "Creamy Carbonara", price: 120.0, image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop", rating: 4, restaurant: "Pasta Express" },
    { id: 9, name: "Chicken Inasal", price: 95.0, image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop", rating: 5, restaurant: "Mang Inasal" },
  ];

  const trendingToday = [
    { id: 10, name: "Milk Tea Combo", price: 150.0, image: "https://images.unsplash.com/photo-1525385444278-fb1c9a81db3e?w=400&h=300&fit=crop", orders: "250+ orders today" },
    { id: 11, name: "Fried Chicken Bucket", price: 299.0, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=300&fit=crop", orders: "180+ orders today" },
    { id: 12, name: "Sushi Platter", price: 450.0, image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop", orders: "120+ orders today" },
  ];

  const cuisines = [
    { name: "Filipino", emoji: "🇵🇭", color: "bg-blue-50" },
    { name: "Japanese", emoji: "🍜", color: "bg-red-50" },
    { name: "Italian", emoji: "🍕", color: "bg-green-50" },
    { name: "Korean", emoji: "🍲", color: "bg-pink-50" },
    { name: "Chinese", emoji: "🥟", color: "bg-yellow-50" },
    { name: "American", emoji: "🍔", color: "bg-orange-50" },
  ];

  const features = [
    { icon: Users, label: "Community Recipes", color: "text-yellow-500" },
    { icon: Users, label: "Barkada Vote", color: "text-yellow-500" },
    { icon: Users, label: "AI Chat Bot", color: "text-yellow-500" },
    { icon: BookOpen, label: "AI Food and Recipe", color: "text-yellow-500" },
    { icon: Calendar, label: "Calendar", color: "text-yellow-500" },
  ];

  const toggleFavorite = (id) => {
    setFavoritesMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* Onboarding Modal */}
      {showWelcomeModal && (
        <div className="min-h-screen bg-black bg-opacity-50 flex items-center justify-center p-4 fixed inset-0 z-50">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-white text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-5xl font-bold text-yellow-500">M</span>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-2">
                {currentStep === 1 && "Welcome To Pick-A-Plate, Username!"}
                {currentStep === 2 && "Any food you dislike or can't eat?"}
                {currentStep === 3 && "Favorite foods"}
              </h2>

              <p className="text-yellow-50">
                {currentStep === 1 && "Personalize your experience by telling us about your food preferences"}
                {currentStep === 2 && "Let us know what to avoid in your recommendations"}
                {currentStep === 3 && "Tell us about your all-time favorite dishes"}
              </p>

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all ${step === currentStep ? "w-8 bg-white" : "w-2 bg-yellow-200"}`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {currentStep === 1 && "What cuisine are you in the mood for?"}
                {currentStep === 2 && "Select any foods you want to avoid"}
                {currentStep === 3 && "Pick your favorite dishes"}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {currentStep === 1 &&
                  cuisineOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => toggleSelection(option.id, "cuisine")}
                      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                        selectedCuisines.includes(option.id) ? "ring-4 ring-yellow-400 scale-95" : "hover:scale-105"
                      }`}
                    >
                      <img src={option.image} alt={option.name} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex items-end p-3">
                        <span className="text-white font-bold text-sm">{option.name}</span>
                      </div>
                      {selectedCuisines.includes(option.id) && (
                        <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}

                {currentStep === 2 &&
                  dislikeOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => toggleSelection(option.id, "dislike")}
                      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                        selectedDislikes.includes(option.id) ? "ring-4 ring-red-400 scale-95" : "hover:scale-105"
                      }`}
                    >
                      <img src={option.image} alt={option.name} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex items-end p-3">
                        <span className="text-white font-bold text-sm">{option.name}</span>
                      </div>
                      {selectedDislikes.includes(option.id) && (
                        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}

                {currentStep === 3 &&
                  favoriteOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => toggleSelection(option.id, "favorite")}
                      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                        selectedFavorites.includes(option.id) ? "ring-4 ring-yellow-400 scale-95" : "hover:scale-105"
                      }`}
                    >
                      <img src={option.image} alt={option.name} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex items-end p-3">
                        <span className="text-white font-bold text-sm">{option.name}</span>
                      </div>
                      {selectedFavorites.includes(option.id) && (
                        <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 flex items-center justify-between border-t">
              <button onClick={handleSkip} className="px-6 py-2 text-gray-600 hover:text-gray-800 font-semibold transition">
                Skip for now
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                {currentStep === 3 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">Hello, Username</h1>
              <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="sm:hidden p-2">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className={`${showMobileSearch ? "flex" : "hidden"} sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto`}>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="What do you want to eat today..."
                  className="pl-9 sm:pl-10 pr-4 py-2 border border-gray-200 rounded-full w-full sm:w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                />
              </div>
              <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 sm:px-8 py-2 rounded-full transition text-sm">
                LOGIN
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl sm:rounded-3xl p-6 sm:p-12 mb-6 sm:mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-yellow-300 rounded-full opacity-30 -mr-16 sm:-mr-32 -mt-16 sm:-mt-32"></div>
            <div className="absolute bottom-0 right-10 sm:right-20 w-32 h-32 sm:w-64 sm:h-64 bg-yellow-300 rounded-full opacity-30"></div>
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">Discover Smarter Food</h2>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Choices here in PickAPlate</h2>
              <p className="text-white text-xs sm:text-sm opacity-90">Sign up and we'll suggest recipes, stores, and more made just for you.</p>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Features</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg transition cursor-pointer">
                  <div className="bg-yellow-50 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <feature.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${feature.color}`} />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-tight">{feature.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Dishes */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Popular Dishes</h3>
              <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                View all <span>→</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {popularDishes.map((dish) => (
                <div key={dish.id} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition">
                  <div className="relative">
                    <img src={dish.image} alt={dish.name} className="w-full h-48 sm:h-56 object-cover" />
                    <span className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-red-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                      {dish.discount}
                    </span>
                    <button
                      onClick={() => toggleFavorite(dish.id)}
                      className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
                    >
                      <Heart
                        fill={favoritesMap[dish.id] ? "currentColor" : "none"}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${favoritesMap[dish.id] ? "text-red-500" : "text-gray-400"}`}
                      />
                    </button>
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-base sm:text-lg ${i < dish.rating ? "text-yellow-400" : "text-gray-300"}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">{dish.name}</h4>
                    <p className="text-yellow-500 font-bold text-lg sm:text-xl">₱{dish.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended for You */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Recommended for You</h3>
              <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                View all <span>→</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recommendedForYou.map((dish) => (
                <div key={dish.id} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition">
                  <div className="relative">
                    <img src={dish.image} alt={dish.name} className="w-full h-48 sm:h-56 object-cover" />
                    <button
                      onClick={() => toggleFavorite(dish.id)}
                      className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
                    >
                      <Heart
                        fill={favoritesMap[dish.id] ? "currentColor" : "none"}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${favoritesMap[dish.id] ? "text-red-500" : "text-gray-400"}`}
                      />
                    </button>
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-base sm:text-lg ${i < dish.rating ? "text-yellow-400" : "text-gray-300"}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">{dish.name}</h4>
                    <p className="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">{dish.restaurant}</p>
                    <p className="text-yellow-500 font-bold text-lg sm:text-xl">₱{dish.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Today */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Trending Today 🔥</h3>
              <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                View all <span>→</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trendingToday.map((item) => (
                <div key={item.id} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition">
                  <div className="relative">
                    <img src={item.image} alt={item.name} className="w-full h-48 sm:h-56 object-cover" />
                    <span className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                      🔥 Trending
                    </span>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
                    >
                      <Heart
                        fill={favoritesMap[item.id] ? "currentColor" : "none"}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${favoritesMap[item.id] ? "text-red-500" : "text-gray-400"}`}
                      />
                    </button>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h4 className="font-bold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">{item.name}</h4>
                    <p className="text-yellow-500 font-bold text-lg sm:text-xl mb-1 sm:mb-2">₱{item.price.toFixed(2)}</p>
                    <p className="text-orange-500 text-xs sm:text-sm font-medium">{item.orders}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explore Cuisines */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Explore Cuisines</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {cuisines.map((cuisine, index) => (
                <div
                  key={index}
                  className={`${cuisine.color} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg transition cursor-pointer`}
                >
                  <div className="text-3xl sm:text-4xl mb-2">{cuisine.emoji}</div>
                  <p className="text-sm sm:text-base text-gray-700 font-semibold">{cuisine.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

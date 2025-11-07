import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, RefreshCw, Users, MessageSquare, Bot, ChefHat, Calendar, MapPin, Utensils, Sparkles, X, Star, Send } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // API base configuration
  const API = process.env.REACT_APP_API_BASE || "";

  // Active user identification
  const activeUserId = (() => {
    try {
      return localStorage.getItem("pap:activeUserId") || "global";
    } catch {
      return "global";
    }
  })();

  // Per-account completion key
  const ONB_KEY = useMemo(() => `pap:onboardingDone:${activeUserId}`, [activeUserId]);

  // Triggers set by Login.js
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

  // Onboarding modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    try {
      const alreadyDone = localStorage.getItem(ONB_KEY) === "1";
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
  }, []);

  // If account changes and is already complete, keep hidden
  useEffect(() => {
    try {
      if (localStorage.getItem(ONB_KEY) === "1") setShowWelcomeModal(false);
    } catch {}
  }, [ONB_KEY]);

  // Onboarding state (4 steps)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedDislikes, setSelectedDislikes] = useState([]);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  // Persist to backend
  async function persistOnboarding() {
    setSavingOnboarding(true);
    setOnboardingError("");
    try {
      const payload = {
        userId: activeUserId,
        likes: selectedCuisines,
        dislikes: selectedDislikes,
        diets: selectedDiets,
        allergens: selectedAllergens,
        onboardingDone: true
      };

      const res = await fetch(`${API}/api/preferences/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": activeUserId
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to save onboarding preferences");
      }

      try {
        localStorage.setItem(ONB_KEY, "1");
      } catch {}
      setShowWelcomeModal(false);
    } catch (e) {
      setOnboardingError(e.message || "Could not save your preferences. You can update them in Profile anytime.");
      try {
        localStorage.setItem(ONB_KEY, "1");
      } catch {}
      setShowWelcomeModal(false);
    } finally {
      setSavingOnboarding(false);
    }
  }

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep((s) => s + 1);
    } else {
      await persistOnboarding();
    }
  };

  const handleSkip = async () => {
    await persistOnboarding();
  };

  const toggleSelection = (id, type) => {
    const toggle = (setter) =>
      setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    if (type === "cuisine") toggle(setSelectedCuisines);
    else if (type === "dislike") toggle(setSelectedDislikes);
    else if (type === "diet") toggle(setSelectedDiets);
    else if (type === "allergen") toggle(setSelectedAllergens);
  };

  // Onboarding options data
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
    { id: "nuts", name: "Tree Nuts/Peanuts", image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=300&fit=crop" },
    { id: "eggs", name: "Eggs", image: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&h=300&fit=crop" },
  ];

  const dietOptions = [
    { id: "omnivore", name: "Omnivore", image: "https://images.unsplash.com/photo-1543339494-b4cd7c3e0911?w=400&h=300&fit=crop" },
    { id: "vegetarian", name: "Vegetarian", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop" },
    { id: "vegan", name: "Vegan", image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&h=300&fit=crop" },
    { id: "pescetarian", name: "Pescetarian", image: "https://images.unsplash.com/photo-1546549039-49f2d4b63a36?w=400&h=300&fit=crop" },
    { id: "keto", name: "Keto", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop" },
    { id: "low-carb", name: "Low Carb", image: "https://images.unsplash.com/photo-1568600891621-2b1a1b1c7c3d?w=400&h=300&fit=crop" },
    { id: "halal", name: "Halal", image: "https://images.unsplash.com/photo-1612927601669-9fffb0f7f7b6?w=400&h=300&fit=crop" },
    { id: "kosher", name: "Kosher", image: "https://images.unsplash.com/photo-1551022370-0b9d3f8883ba?w=400&h=300&fit=crop" },
  ];

  const allergenOptions = [
    { id: "peanuts", name: "Peanuts", image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&h=300&fit=crop" },
    { id: "tree-nuts", name: "Tree Nuts", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop" },
    { id: "eggs", name: "Eggs", image: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&h=300&fit=crop" },
    { id: "dairy", name: "Dairy", image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=300&fit=crop" },
    { id: "gluten", name: "Gluten/Wheat", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop" },
    { id: "soy", name: "Soy", image: "https://images.unsplash.com/photo-1546456073-6712f79251bb?w=400&h=300&fit=crop" },
    { id: "fish", name: "Fish", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop" },
    { id: "shellfish", name: "Shellfish", image: "https://images.unsplash.com/photo-1604908554036-6c5bba61915f?w=400&h=300&fit=crop" },
  ];

  // Dashboard states
  const [showSurprise, setShowSurprise] = useState(false);
  const [currentFood, setCurrentFood] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [chatInput, setChatInput] = useState('');

  const foodItems = [
    { id: 1, name: "Spaghetti Carbonara", restaurant: "Pasta House", price: "₱280.00", image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80" },
    { id: 2, name: "Beef Bulgogi Bowl", restaurant: "Korean Kitchen", price: "₱350.00", image: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&q=80" },
    { id: 3, name: "Margherita Pizza", restaurant: "Italian Corner", price: "₱420.00", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80" },
    { id: 4, name: "Chicken Teriyaki", restaurant: "Tokyo Express", price: "₱295.00", image: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80" },
    { id: 5, name: "Caesar Salad", restaurant: "Green Bistro", price: "₱245.00", image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80" },
    { id: 6, name: "Pad Thai", restaurant: "Thai Delights", price: "₱315.00", image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80" },
    { id: 7, name: "Beef Burger", restaurant: "Burger Junction", price: "₱380.00", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80" },
    { id: 8, name: "Chicken Adobo", restaurant: "Filipino Eats", price: "₱260.00", image: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&q=80" },
    { id: 9, name: "Salmon Sushi Platter", restaurant: "Sushi Bar", price: "₱520.00", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80" },
    { id: 10, name: "Grilled Lamb Chops", restaurant: "Steakhouse Prime", price: "₱680.00", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80" }
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Hello');
    
    return () => clearInterval(timer);
  }, []);

  const surpriseMe = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * foodItems.length);
      setCurrentFood(foodItems[randomIndex]);
      setIsLiked(false);
      setIsAnimating(false);
    }, 300);
  };

  const handleSurpriseClick = () => {
    if (!showSurprise) {
      const randomIndex = Math.floor(Math.random() * foodItems.length);
      setCurrentFood(foodItems[randomIndex]);
    }
    setShowSurprise(!showSurprise);
  };

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      alert(`Redirecting to AI Chat Bot with message: "${chatInput}"`);
      setChatInput('');
    }
  };

  const navigationCards = [
    { title: "Explorer", description: "Discover and share recipes", icon: Users },
    { title: "Barkada Vote", description: "Vote on meals together", icon: MessageSquare },
    { title: "ChatBot", description: "Get instant food advice", icon: Bot },
    { title: "Recipes", description: "Smart recipe suggestions", icon: ChefHat },
    { title: "Calendar", description: "Plan your weekly meals", icon: Calendar },
    { title: "Restaurant Locator", description: "Find places nearby", icon: MapPin }
  ];

  return (
    <>
      {/* Onboarding Modal */}
      {showWelcomeModal && (
        <div className="min-h-screen bg-black bg-opacity-50 flex items-center justify-center p-4 fixed inset-0 z-50">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-white text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-5xl font-bold text-yellow-500">P</span>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-2">
                {currentStep === 1 && "Welcome To Pick-A-Plate!"}
                {currentStep === 2 && "Any food you dislike or can't eat?"}
                {currentStep === 3 && "Choose your diet"}
                {currentStep === 4 && "Any allergens we should avoid?"}
              </h2>

              <p className="text-yellow-50">
                {currentStep === 1 && "Tell us what cuisines you like to get better suggestions."}
                {currentStep === 2 && "Let us know what to avoid in your recommendations."}
                {currentStep === 3 && "Pick the diet that best fits you."}
                {currentStep === 4 && "Select allergens to always exclude."}
              </p>

              <div className="flex items-center justify-center gap-2 mt-6">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all ${step === currentStep ? "w-8 bg-white" : "w-2 bg-yellow-200"}`}
                  />
                ))}
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {currentStep === 1 && "What cuisine are you in the mood for?"}
                {currentStep === 2 && "Select any foods you want to avoid"}
                {currentStep === 3 && "Pick your diet"}
                {currentStep === 4 && "Select your allergens"}
              </h3>

              {onboardingError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {onboardingError}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {currentStep === 1 && cuisineOptions.map((option) => (
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
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}

                {currentStep === 2 && dislikeOptions.map((option) => (
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
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}

                {currentStep === 3 && dietOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => toggleSelection(option.id, "diet")}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                      selectedDiets.includes(option.id) ? "ring-4 ring-yellow-400 scale-95" : "hover:scale-105"
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex items-end p-3">
                      <span className="text-white font-bold text-sm">{option.name}</span>
                    </div>
                    {selectedDiets.includes(option.id) && (
                      <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}

                {currentStep === 4 && allergenOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => toggleSelection(option.id, "allergen")}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                      selectedAllergens.includes(option.id) ? "ring-4 ring-red-400 scale-95" : "hover:scale-105"
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex items-end p-3">
                      <span className="text-white font-bold text-sm">{option.name}</span>
                    </div>
                    {selectedAllergens.includes(option.id) && (
                      <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex items-center justify-between border-t">
              <button
                onClick={handleSkip}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-semibold transition"
                disabled={savingOnboarding}
              >
                {savingOnboarding ? "Saving…" : "Skip for now"}
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg disabled:opacity-70"
                disabled={savingOnboarding}
              >
                {currentStep === 4 ? (savingOnboarding ? "Saving…" : "Get Started") : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        {/* Enhanced Header */}
        <header className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 backdrop-blur-md shadow-lg border-b-2 border-yellow-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo and Brand Section */}
              <div className="flex items-center gap-4">
                {/* Large Logo */}
                <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-4 rounded-2xl shadow-xl transform hover:scale-105 transition-transform">
                  <Utensils className="w-10 h-10 text-white" />
                </div>
                
                {/* Brand Name and Tagline */}
                <div>
                  <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent leading-tight">
                    Pick-A-Plate
                  </h1>
                  <p className="text-sm text-amber-700 font-medium mt-1">
                    Your personal food companion
                  </p>
                </div>
              </div>
              
              {/* Right Side Info */}
              <div className="flex items-center gap-6">
                {/* Greeting */}
                <div className="hidden md:block text-right">
                  <p className="text-sm text-amber-600 font-medium">{greeting}!</p>
                  <p className="text-xs text-amber-500">Ready to discover something delicious?</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-3xl shadow-lg p-8 border border-yellow-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 opacity-20 rounded-full -mr-32 -mt-32"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-amber-900">
                      AI Chat Assistant
                    </h2>
                    <p className="text-sm text-amber-700">{greeting}! How can I help?</p>
                  </div>
                </div>
                
                <p className="text-amber-800 mb-6">
                  Ask me anything about food, recipes, restaurants, or meal planning. I'm here to help you discover your next delicious meal!
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-amber-800">
                    <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <span>Personalized food recommendations</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-amber-800">
                    <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                      <ChefHat className="w-4 h-4 text-amber-600" />
                    </div>
                    <span>Recipe suggestions & cooking tips</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-amber-800">
                    <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                    </div>
                    <span>24/7 instant answers</span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleChatSubmit();
                      }
                    }}
                    placeholder="Ask me anything about food..."
                    className="w-full px-4 py-4 pr-14 rounded-2xl border-2 border-yellow-300 focus:border-yellow-400 focus:outline-none bg-white/80 shadow-sm text-amber-900 placeholder-amber-500 transition-all"
                  />
                  <button
                    onClick={handleChatSubmit}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setChatInput("What's popular today?");
                      handleChatSubmit();
                    }}
                    className="px-4 py-2 bg-yellow-200 hover:bg-yellow-300 text-amber-800 rounded-xl text-sm font-medium transition-colors"
                  >
                    What's popular?
                  </button>
                  <button
                    onClick={() => {
                      setChatInput("Suggest a healthy meal");
                      handleChatSubmit();
                    }}
                    className="px-4 py-2 bg-yellow-200 hover:bg-yellow-300 text-amber-800 rounded-xl text-sm font-medium transition-colors"
                  >
                    Healthy options
                  </button>
                  <button
                    onClick={() => {
                      setChatInput("Find restaurants near me");
                      handleChatSubmit();
                    }}
                    className="px-4 py-2 bg-yellow-200 hover:bg-yellow-300 text-amber-800 rounded-xl text-sm font-medium transition-colors"
                  >
                    Near me
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-3xl shadow-lg p-8 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full -mr-24 -mb-24"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-center">
                <Sparkles className="w-12 h-12 text-white mb-4 opacity-90" />
                <h2 className="text-3xl font-bold text-white mb-3">
                  Can't Decide What to Eat?
                </h2>
                <p className="text-white/90 mb-8 text-lg">
                  Let us surprise you with something delicious
                </p>
                
                <button
                  onClick={handleSurpriseClick}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-bold text-lg px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-3 w-full"
                >
                  <Sparkles className="w-6 h-6" />
                  Surprise Me!
                </button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-600" />
              Explore Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {navigationCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <button 
                    key={index}
                    onClick={() => navigate(`/${card.title.toLowerCase().replace(/\s+/g, '-')}`)} 
                    className="group bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-yellow-200 relative"
                  >
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-2 right-2 w-20 h-20 bg-yellow-400 rounded-full blur-2xl"></div>
                      <div className="absolute bottom-2 left-2 w-16 h-16 bg-amber-400 rounded-full blur-xl"></div>
                    </div>
                    
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-300/20 to-transparent rounded-bl-3xl"></div>
                    
                    <div className="p-6 relative z-10 flex flex-col items-center text-center">
                      <div className="bg-gradient-to-br from-yellow-400 to-amber-500 w-20 h-20 rounded-xl flex items-center justify-center mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md relative">
                        <Icon className="w-10 h-10 text-white" />
                        {/* Icon glow effect */}
                        <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-amber-900 mb-2 group-hover:text-amber-800 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-amber-700 text-sm leading-relaxed">
                        {card.description}
                      </p>
                      
                      {/* Hover arrow indicator */}
                      <div className="mt-4 flex items-center gap-2 text-amber-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                        <span className="text-xs font-semibold">Explore</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </main>
      </div>

      {/* Surprise Me Modal */}
      {showSurprise && currentFood && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-amber-50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-amber-500 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-white" />
                <h3 className="text-2xl font-bold text-white">Your Surprise Meal!</h3>
              </div>
              <button
                onClick={() => setShowSurprise(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className={`transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
              <div className="flex flex-col md:flex-row">
                <div className="relative md:w-1/2">
                  <img
                    src={currentFood.image}
                    alt={currentFood.name}
                    className="w-full h-80 md:h-96 object-cover"
                  />
                  
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
                  >
                    <Heart
                      className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                    />
                  </button>
                </div>

                <div className="md:w-1/2 p-8 flex flex-col justify-center bg-gradient-to-br from-amber-50 to-yellow-100">
                  <div className="inline-flex items-center gap-2 bg-yellow-200 text-amber-800 px-3 py-1 rounded-full text-xs font-bold mb-4 w-fit">
                    <Sparkles className="w-3 h-3" />
                    RECOMMENDATION
                  </div>
                  <h2 className="text-4xl font-bold text-amber-900 mb-2">
                    {currentFood.name}
                  </h2>
                  <p className="text-xl text-amber-700 mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    {currentFood.restaurant}
                  </p>
                  <div className="pt-6 border-t-2 border-yellow-300 mb-6">
                    <p className="text-sm text-amber-700 mb-1">Price</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                      {currentFood.price}
                    </p>
                  </div>

                  <button
                    onClick={surpriseMe}
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 font-bold text-lg px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2 text-white w-full"
                  >
                    <RefreshCw className={`w-5 h-5 ${isAnimating ? 'animate-spin' : ''}`} />
                    Try Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
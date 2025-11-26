import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, RefreshCw, Users, MessageSquare, Bot, ChefHat, Calendar, MapPin, Utensils, Sparkles, X, Star, Send, Menu } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import LoadingModal from '../components/LoadingModal';
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authHeaders } = useAuth();

  const API = process.env.REACT_APP_API_URL || "http://localhost:4000";

  const activeUserId = (() => {
    try {
      return localStorage.getItem("pap:activeUserId") || "global";
    } catch {
      return "global";
    }
  })();

  const ONB_KEY = useMemo(() => `pap:onboardingDone:${activeUserId}`, [activeUserId]);

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

  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    try {
      const alreadyDone = localStorage.getItem(ONB_KEY) === "1";
      if (cameFromSignup && forceFlag) return true;
      return cameFromSignup && !alreadyDone;
    } catch {
      return cameFromSignup;
    }
  });

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

  useEffect(() => {
    try {
      if (localStorage.getItem(ONB_KEY) === "1") setShowWelcomeModal(false);
    } catch {}
  }, [ONB_KEY]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedDislikes, setSelectedDislikes] = useState([]);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  async function persistOnboarding() {
    setSavingOnboarding(true);
    setOnboardingError("");
    try {
      const payload = {
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
          ...authHeaders(),
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

  const [showSurprise, setShowSurprise] = useState(false);
  const [currentFood, setCurrentFood] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [loadingSurprise, setLoadingSurprise] = useState(false);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);

  const fetchSurpriseRecipes = async () => {
    try {
      const res = await fetch(`${API}/api/surprise?limit=20`);
      const data = await res.json();

      if (res.ok && data.success && data.recipes.length > 0) {
        setFoodItems(data.recipes);
      } else {
        setFoodItems([]);
      }
    } catch (error) {
      console.error("Error fetching surprise recipes:", error);
      setFoodItems([]);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Hello');

    fetchSurpriseRecipes();

    return () => clearInterval(timer);
  }, []);

  const surpriseMe = async () => {
    setIsAnimating(true);
    setLoadingSurprise(true);

    try {
      const res = await fetch(`${API}/api/surprise/random`);
      const data = await res.json();

      if (res.ok && data.success && data.recipe) {
        setTimeout(() => {
          setCurrentFood(data.recipe);
          setIsLiked(false);
          setIsAnimating(false);
          setLoadingSurprise(false);
        }, 300);
      } else {
        if (foodItems.length > 0) {
          setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * foodItems.length);
            setCurrentFood(foodItems[randomIndex]);
            setIsLiked(false);
            setIsAnimating(false);
            setLoadingSurprise(false);
          }, 300);
        } else {
          setIsAnimating(false);
          setLoadingSurprise(false);
        }
      }
    } catch (error) {
      console.error("Error fetching random recipe:", error);
      if (foodItems.length > 0) {
        setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * foodItems.length);
          setCurrentFood(foodItems[randomIndex]);
          setIsLiked(false);
          setIsAnimating(false);
          setLoadingSurprise(false);
        }, 300);
      } else {
        setIsAnimating(false);
        setLoadingSurprise(false);
      }
    }
  };

  const handleSurpriseClick = async () => {
    if (!showSurprise) {
      setLoadingSurprise(true);
      try {
        const res = await fetch(`${API}/api/surprise/random`);
        const data = await res.json();

        if (res.ok && data.success && data.recipe) {
          setCurrentFood(data.recipe);
        } else {
          if (foodItems.length > 0) {
            const randomIndex = Math.floor(Math.random() * foodItems.length);
            setCurrentFood(foodItems[randomIndex]);
          }
        }
      } catch (error) {
        console.error("Error fetching random recipe:", error);
        if (foodItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * foodItems.length);
          setCurrentFood(foodItems[randomIndex]);
        }
      } finally {
        setLoadingSurprise(false);
      }
    }
    setShowSurprise(!showSurprise);
  };

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      navigate('/chatbot', { state: { message: chatInput.trim() } });
      setChatInput('');
    }
  };

  const navigationCards = [
    { title: "Explorer", description: "Discover recipes", icon: Users },
    { title: "Barkada Vote", description: "Vote together", icon: MessageSquare },
    { title: "ChatBot", description: "Food advice", icon: Bot },
    { title: "Recipes", description: "Smart suggestions", icon: ChefHat },
    { title: "Calendar", description: "Meal planning", icon: Calendar },
    { title: "Restaurant Locator", description: "Find nearby", icon: MapPin }
  ];

  return (
    <>
      {loadingSurprise && <LoadingModal message="Fetching delicious surprises..." />}

      {/* Onboarding Modal - Mobile Optimized */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-2xl sm:mx-4 sm:rounded-3xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-5 sm:p-6 text-white text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-white rounded-full w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg">
                  <span className="text-3xl sm:text-5xl font-bold text-yellow-500">P</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold mb-1">
                {currentStep === 1 && "Welcome To Pick-A-Plate!"}
                {currentStep === 2 && "Foods you dislike?"}
                {currentStep === 3 && "Choose your diet"}
                {currentStep === 4 && "Any allergens?"}
              </h2>

              <p className="text-yellow-50 text-sm sm:text-base">
                {currentStep === 1 && "Select cuisines you love"}
                {currentStep === 2 && "We'll avoid these for you"}
                {currentStep === 3 && "Pick what fits you best"}
                {currentStep === 4 && "Select allergens to exclude"}
              </p>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 sm:h-2 rounded-full transition-all ${
                      step === currentStep ? "w-6 sm:w-8 bg-white" : "w-1.5 sm:w-2 bg-yellow-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] sm:max-h-[calc(90vh-280px)]">
              {onboardingError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                  {onboardingError}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {currentStep === 1 && cuisineOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => toggleSelection(option.id, "cuisine")}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 ${
                      selectedCuisines.includes(option.id) ? "ring-3 ring-yellow-400" : ""
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-20 sm:h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                      <span className="text-white font-semibold text-xs sm:text-sm">{option.name}</span>
                    </div>
                    {selectedCuisines.includes(option.id) && (
                      <div className="absolute top-1.5 right-1.5 bg-yellow-400 rounded-full p-0.5 sm:p-1">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 ${
                      selectedDislikes.includes(option.id) ? "ring-3 ring-red-400" : ""
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-20 sm:h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                      <span className="text-white font-semibold text-xs sm:text-sm">{option.name}</span>
                    </div>
                    {selectedDislikes.includes(option.id) && (
                      <div className="absolute top-1.5 right-1.5 bg-red-500 rounded-full p-0.5 sm:p-1">
                        <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {currentStep === 3 && dietOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => toggleSelection(option.id, "diet")}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 ${
                      selectedDiets.includes(option.id) ? "ring-3 ring-yellow-400" : ""
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-20 sm:h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                      <span className="text-white font-semibold text-xs sm:text-sm">{option.name}</span>
                    </div>
                    {selectedDiets.includes(option.id) && (
                      <div className="absolute top-1.5 right-1.5 bg-yellow-400 rounded-full p-0.5 sm:p-1">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 ${
                      selectedAllergens.includes(option.id) ? "ring-3 ring-red-400" : ""
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-20 sm:h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                      <span className="text-white font-semibold text-xs sm:text-sm">{option.name}</span>
                    </div>
                    {selectedAllergens.includes(option.id) && (
                      <div className="absolute top-1.5 right-1.5 bg-red-500 rounded-full p-0.5 sm:p-1">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-4 sm:p-6 flex items-center justify-between border-t safe-area-bottom">
              <button
                onClick={handleSkip}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 font-medium text-sm transition"
                disabled={savingOnboarding}
              >
                {savingOnboarding ? "Saving…" : "Skip"}
              </button>
              <button
                onClick={handleNext}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95 disabled:opacity-70"
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
        {/* Header - Mobile Optimized */}
        <header className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 shadow-md border-b border-yellow-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-2 sm:p-3 rounded-xl shadow-md">
                  <Utensils className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Pick-A-Plate
                  </h1>
                  <p className="text-[10px] sm:text-xs text-amber-600 hidden sm:block">
                    Your food companion
                  </p>
                </div>
              </div>
              
              {/* Right - Greeting (hidden on mobile) */}
              <div className="hidden md:block text-right">
                <p className="text-sm text-amber-700 font-medium">{greeting}!</p>
                <p className="text-xs text-amber-500">Ready to eat?</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-8">
          {/* Hero Section - Cards Stack on Mobile */}
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 lg:gap-6 mb-6">
            {/* AI Chat Card */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-yellow-100 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full opacity-50"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">AI Assistant</h2>
                    <p className="text-xs text-amber-600">{greeting}!</p>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 hidden sm:block">
                  Ask me anything about food, recipes, or restaurants!
                </p>

                {/* Quick Features - Hidden on very small screens */}
                <div className="hidden sm:flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Personalized recommendations</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                    <span>Recipe suggestions</span>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                    placeholder="Ask about food..."
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none bg-amber-50/50 text-gray-800 placeholder-gray-400 text-sm"
                  />
                  <button
                    onClick={handleChatSubmit}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-2 rounded-lg shadow active:scale-95 transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  <button
                    onClick={() => navigate('/chatbot', { state: { message: "What's popular today?" } })}
                    className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap transition active:scale-95"
                  >
                    🔥 Popular
                  </button>
                  <button
                    onClick={() => navigate('/chatbot', { state: { message: "Suggest a healthy meal" } })}
                    className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap transition active:scale-95"
                  >
                    🥗 Healthy
                  </button>
                  <button
                    onClick={() => navigate('/chatbot', { state: { message: "Find restaurants near me" } })}
                    className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap transition active:scale-95"
                  >
                    📍 Near me
                  </button>
                </div>
              </div>
            </div>

            {/* Surprise Me Card */}
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl shadow-lg p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/5 rounded-full"></div>
              
              <div className="relative z-10 flex flex-col justify-center h-full min-h-[140px] sm:min-h-[200px]">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white/90 mb-2 sm:mb-3" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  Can't Decide?
                </h2>
                <p className="text-white/80 mb-4 text-sm sm:text-base">
                  Let us surprise you!
                </p>
                
                <button
                  onClick={handleSurpriseClick}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-bold text-base sm:text-lg px-6 py-3 sm:py-4 rounded-xl shadow-lg transition active:scale-95 inline-flex items-center justify-center gap-2 w-full"
                >
                  <Sparkles className="w-5 h-5" />
                  Surprise Me!
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Cards Grid */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              Explore
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {navigationCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <button 
                    key={index}
                    onClick={() => navigate(`/${card.title.toLowerCase().replace(/\s+/g, '-')}`)} 
                    className="group bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-3 sm:p-4 transition-all active:scale-[0.98] text-left"
                  >
                    <div className="bg-gradient-to-br from-yellow-400 to-amber-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-sm group-hover:scale-105 transition">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-0.5">
                      {card.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">
                      {card.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Surprise Me Modal - Mobile Optimized */}
      {showSurprise && currentFood && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 sm:py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">Your Surprise!</h3>
              </div>
              <button
                onClick={() => setShowSurprise(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className={`transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
              {/* Image */}
              <div className="relative">
                <img
                  src={currentFood.image}
                  alt={currentFood.name}
                  className="w-full h-48 sm:h-56 object-cover"
                />
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2.5 shadow-lg active:scale-95 transition"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                <span className="inline-flex items-center gap-1 bg-yellow-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2">
                  <Sparkles className="w-2.5 h-2.5" />
                  RECOMMENDED
                </span>
                
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{currentFood.name}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  {currentFood.restaurant}
                </p>

                {currentFood.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{currentFood.description}</p>
                )}

                {/* Recipe Info Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {currentFood.prepTime && (
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[9px] text-gray-500 font-medium">Prep</p>
                      <p className="text-xs font-semibold text-gray-700">{currentFood.prepTime}</p>
                    </div>
                  )}
                  {currentFood.cookTime && (
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[9px] text-gray-500 font-medium">Cook</p>
                      <p className="text-xs font-semibold text-gray-700">{currentFood.cookTime}</p>
                    </div>
                  )}
                  {currentFood.difficulty && (
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[9px] text-gray-500 font-medium">Level</p>
                      <p className="text-xs font-semibold text-gray-700">{currentFood.difficulty}</p>
                    </div>
                  )}
                  {currentFood.servings && (
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[9px] text-gray-500 font-medium">Serves</p>
                      <p className="text-xs font-semibold text-gray-700">{currentFood.servings}</p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="space-y-2 pb-2">
                  <button
                    onClick={() => setShowRecipeDetails(true)}
                    className="w-full bg-white border-2 border-amber-400 text-amber-600 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition"
                  >
                    <ChefHat className="w-4 h-4" />
                    View Full Recipe
                  </button>
                  <button
                    onClick={surpriseMe}
                    className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
                    Try Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Details Modal - Mobile Optimized */}
      {showRecipeDetails && currentFood && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-2xl sm:mx-4 sm:rounded-2xl rounded-t-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 flex items-center justify-between z-10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">Full Recipe</h3>
              </div>
              <button
                onClick={() => setShowRecipeDetails(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              <div className="p-4 sm:p-6">
                {/* Header Info */}
                <span className="inline-flex items-center gap-1 bg-yellow-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2">
                  <Star className="w-2.5 h-2.5" />
                  {currentFood.type === "community" ? "COMMUNITY" : "CULTURAL"} RECIPE
                </span>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{currentFood.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{currentFood.restaurant}</p>

                {/* Image */}
                {currentFood.image && (
                  <img
                    src={currentFood.image}
                    alt={currentFood.name}
                    className="w-full h-40 sm:h-52 object-cover rounded-xl mb-4 shadow"
                  />
                )}

                {/* Description */}
                {currentFood.description && (
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{currentFood.description}</p>
                )}

                {/* Recipe Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  {currentFood.prepTime && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-amber-600 font-semibold">Prep Time</p>
                      <p className="text-sm text-gray-800 font-bold">{currentFood.prepTime}</p>
                    </div>
                  )}
                  {currentFood.cookTime && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-amber-600 font-semibold">Cook Time</p>
                      <p className="text-sm text-gray-800 font-bold">{currentFood.cookTime}</p>
                    </div>
                  )}
                  {currentFood.difficulty && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-amber-600 font-semibold">Difficulty</p>
                      <p className="text-sm text-gray-800 font-bold">{currentFood.difficulty}</p>
                    </div>
                  )}
                  {currentFood.servings && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-amber-600 font-semibold">Servings</p>
                      <p className="text-sm text-gray-800 font-bold">{currentFood.servings}</p>
                    </div>
                  )}
                </div>

                {/* Ingredients */}
                {currentFood.ingredients && currentFood.ingredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-amber-500" />
                      Ingredients
                    </h3>
                    <ul className="space-y-2">
                      {currentFood.ingredients.map((ingredient, i) => (
                        <li key={i} className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span className="text-sm text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructions */}
                {currentFood.instructions && currentFood.instructions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-amber-500" />
                      Instructions
                    </h3>
                    <ol className="space-y-3">
                      {currentFood.instructions.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-lg border-l-3 border-amber-400">
                          <span className="bg-amber-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Fallback Recipe */}
                {(!currentFood.ingredients || currentFood.ingredients.length === 0) &&
                 (!currentFood.instructions || currentFood.instructions.length === 0) &&
                 currentFood.recipe && currentFood.recipe.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-amber-500" />
                      Recipe
                    </h3>
                    <ul className="space-y-2">
                      {currentFood.recipe.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg">
                          <span className="text-amber-500 font-bold">•</span>
                          <span className="text-sm text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags & Allergens */}
                {currentFood.type === "community" && (
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {currentFood.tags && currentFood.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {currentFood.tags.map((tag, i) => (
                            <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentFood.allergens && currentFood.allergens.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-2">Allergens</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {currentFood.allergens.map((allergen, i) => (
                            <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                              ⚠️ {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {currentFood.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded-lg italic">
                      {currentFood.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Footer Button */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex-shrink-0 safe-area-bottom">
              <button
                onClick={() => setShowRecipeDetails(false)}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition"
              >
                Close Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Hide Style */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
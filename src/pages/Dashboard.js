import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, RefreshCw, Users, MessageSquare, Bot, ChefHat, Calendar, MapPin, Utensils, Sparkles, X, Star, Send, Settings } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import LoadingModal from '../components/LoadingModal';
import { useAuth } from "../auth/AuthContext";


export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authHeaders, user } = useAuth();
  const isAdmin = user?.role === 'admin';

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

  // Admin function to preview/edit onboarding modal
  const openOnboardingPreview = () => {
    setCurrentStep(1);
    setSelectedCuisines([]);
    setSelectedDislikes([]);
    setSelectedDiets([]);
    setSelectedAllergens([]);
    setOnboardingError("");
    setShowWelcomeModal(true);
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
    { title: "Restaurants", description: "Find nearby", icon: MapPin }
  ];

  return (
    <>
      {loadingSurprise && <LoadingModal message="Fetching delicious surprises..." />}

      {/* Onboarding Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-2xl md:max-w-4xl sm:mx-4 sm:rounded-3xl rounded-t-3xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 sm:p-6 text-white text-center flex-shrink-0">
              <div className="flex items-center justify-center mb-2">
                <div className="bg-white rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg">
                  <span className="text-xl sm:text-4xl font-bold text-yellow-500">P</span>
                </div>
              </div>

              <h2 className="text-base sm:text-2xl font-bold mb-1">
                {currentStep === 1 && "Welcome To Pick-A-Plate!"}
                {currentStep === 2 && "Foods you dislike?"}
                {currentStep === 3 && "Choose your diet"}
                {currentStep === 4 && "Any allergens?"}
              </h2>

              <p className="text-yellow-50 text-xs">
                {currentStep === 1 && "Select cuisines you love"}
                {currentStep === 2 && "We'll avoid these for you"}
                {currentStep === 3 && "Pick what fits you best"}
                {currentStep === 4 && "Select to always exclude"}
              </p>

              <div className="flex items-center justify-center gap-2 mt-2 sm:mt-4">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all ${step === currentStep ? "w-5 sm:w-8 bg-white" : "w-1.5 sm:w-2 bg-yellow-200"}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-h-0">
              {onboardingError && (
                <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                  {onboardingError}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {currentStep === 1 && cuisineOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => toggleSelection(option.id, "cuisine")}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 ${
                      selectedCuisines.includes(option.id) ? "ring-2 ring-yellow-400" : ""
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-16 sm:h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-1.5 sm:p-2">
                      <span className="text-white font-semibold text-xs">{option.name}</span>
                    </div>
                    {selectedCuisines.includes(option.id) && (
                      <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-0.5">
                        <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                      selectedDislikes.includes(option.id) ? "ring-2 ring-red-400" : ""
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-16 sm:h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-1.5 sm:p-2">
                      <span className="text-white font-semibold text-xs">{option.name}</span>
                    </div>
                    {selectedDislikes.includes(option.id) && (
                      <div className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5">
                        <X className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {currentStep === 3 && dietOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => toggleSelection(option.id, "diet")}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 ${
                      selectedDiets.includes(option.id) ? "ring-2 ring-yellow-400" : ""
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-16 sm:h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-1.5 sm:p-2">
                      <span className="text-white font-semibold text-xs">{option.name}</span>
                    </div>
                    {selectedDiets.includes(option.id) && (
                      <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-0.5">
                        <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                      selectedAllergens.includes(option.id) ? "ring-2 ring-red-400" : ""
                    }`}
                  >
                    <img src={option.image} alt={option.name} className="w-full h-16 sm:h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-1.5 sm:p-2">
                      <span className="text-white font-semibold text-xs">{option.name}</span>
                    </div>
                    {selectedAllergens.includes(option.id) && (
                      <div className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5">
                        <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-2 sm:p-4 flex items-center justify-between border-t flex-shrink-0" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
              <button
                onClick={handleSkip}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition"
                disabled={savingOnboarding}
              >
                {savingOnboarding ? "Saving…" : "Skip"}
              </button>
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg transition active:scale-95 disabled:opacity-70"
                disabled={savingOnboarding}
              >
                {currentStep === 4 ? (savingOnboarding ? "Saving…" : "Get Started") : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
        


        {/* Compact Header */}
        <header className="relative z-10 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 backdrop-blur-md shadow-md border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-2 sm:p-3 rounded-xl shadow-lg">
                  <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-extrabold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Pick-A-Plate
                  </h1>
                  <p className="text-xs text-amber-600 hidden sm:block">
                    Your personal food companion
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Admin Preview Button - Only visible for admins */}
                {isAdmin && (
                  <button
                    onClick={openOnboardingPreview}
                    className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs sm:text-sm font-medium rounded-lg shadow hover:shadow-md transition-all hover:scale-105 active:scale-95"
                    title="Preview Onboarding Modal"
                  >
                    <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Preview Onboarding</span>
                  </button>
                )}
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-amber-600 font-medium">{greeting}!</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Main Cards - Stacked on mobile */}
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-4 sm:mb-6">
            
            {/* AI Chat Card - Compact on mobile */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl shadow-md p-4 sm:p-6 border border-yellow-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 opacity-10 rounded-full -mr-16 -mt-16"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center shadow">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-amber-900">AI Assistant</h2>
                    <p className="text-xs text-amber-600">{greeting}! How can I help?</p>
                  </div>
                </div>

                {/* Features - Hidden on mobile, shown on larger screens */}
                <div className="hidden sm:flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-yellow-100 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" /> Recommendations
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-yellow-100 px-2 py-1 rounded-full">
                    <ChefHat className="w-3 h-3" /> Recipes
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-yellow-100 px-2 py-1 rounded-full">
                    <MessageSquare className="w-3 h-3" /> 24/7
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleChatSubmit();
                    }}
                    placeholder="Ask about food..."
                    className="w-full px-3 py-2.5 sm:py-3 pr-12 rounded-xl border border-yellow-300 focus:border-yellow-400 focus:outline-none bg-white/80 shadow-sm text-sm text-amber-900 placeholder-amber-400"
                  />
                  <button
                    onClick={handleChatSubmit}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-2 rounded-lg shadow hover:shadow-md transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    onClick={() => navigate('/chatbot', { state: { message: "What's popular today?" } })}
                    className="px-2.5 py-1.5 bg-yellow-200 hover:bg-yellow-300 text-amber-800 rounded-lg text-xs font-medium transition-colors"
                  >
                    Popular
                  </button>
                  <button
                    onClick={() => navigate('/chatbot', { state: { message: "Suggest a healthy meal" } })}
                    className="px-2.5 py-1.5 bg-yellow-200 hover:bg-yellow-300 text-amber-800 rounded-lg text-xs font-medium transition-colors"
                  >
                    Healthy
                  </button>
                  <button
                    onClick={() => navigate('/chatbot', { state: { message: "Find restaurants near me" } })}
                    className="px-2.5 py-1.5 bg-yellow-200 hover:bg-yellow-300 text-amber-800 rounded-lg text-xs font-medium transition-colors"
                  >
                    Near me
                  </button>
                </div>
              </div>
            </div>

            {/* Surprise Card - Compact on mobile */}
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl shadow-md p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mb-12"></div>
              
              <div className="relative z-10 flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
                <div className="flex-shrink-0">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white opacity-90" />
                </div>
                <div className="flex-1 sm:mt-3">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">
                    Can't Decide?
                  </h2>
                  <p className="text-white/80 text-xs sm:text-sm mb-0 sm:mb-4">
                    Let us surprise you!
                  </p>
                </div>
                <button
                  onClick={handleSurpriseClick}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-bold text-sm px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-md transition-all flex items-center gap-2 sm:w-full sm:justify-center"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Surprise Me!</span>
                </button>
              </div>
            </div>
          </div>

          {/* Feature Cards - Compact grid */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600" />
              Explore Features
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {navigationCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <button 
                    key={index}
                    onClick={() => navigate(`/${card.title.toLowerCase().replace(/\s+/g, '-')}`)} 
                    className="group bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl sm:rounded-2xl shadow hover:shadow-md transition-all duration-200 overflow-hidden border border-yellow-200 active:scale-95"
                  >
                    <div className="p-3 sm:p-4 flex flex-col items-center text-center">
                      <div className="bg-gradient-to-br from-yellow-400 to-amber-500 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 shadow group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-amber-900 leading-tight">
                        {card.title}
                      </h3>
                      <p className="text-amber-600 text-[10px] sm:text-xs mt-0.5 leading-tight hidden sm:block">
                        {card.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Banner */}
          <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-2xl p-4 sm:p-6 text-center relative overflow-hidden mt-8">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 left-10 text-4xl">🍕</div>
              <div className="absolute bottom-2 right-10 text-4xl">🍔</div>
              <div className="absolute top-4 right-1/4 text-3xl">🌶️</div>
              <div className="absolute bottom-4 left-1/4 text-3xl">🥗</div>
            </div>
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Ready to cook something amazing?
              </h3>
              <p className="text-white/90 text-sm mb-4">
                Join our community of food lovers and discover new flavors every day!
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => navigate('/explorer')}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-bold text-sm px-4 sm:px-6 py-2 rounded-xl shadow-md transition-all hover:scale-105"
                >
                  Browse Recipes
                </button>
                <button
                  onClick={() => navigate('/chatbot', { state: { message: "Suggest me something new to try" } })}
                  className="bg-amber-600 text-white hover:bg-amber-700 font-bold text-sm px-4 sm:px-6 py-2 rounded-xl shadow-md transition-all hover:scale-105"
                >
                  Get Suggestions
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Surprise Me Modal */}
      {showSurprise && currentFood && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-amber-50 w-full sm:rounded-3xl rounded-t-3xl shadow-2xl sm:max-w-4xl max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 sm:p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                <h3 className="text-lg sm:text-2xl font-bold text-white">Your Surprise!</h3>
              </div>
              <button
                onClick={() => setShowSurprise(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className={`transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
              <div className="flex flex-col sm:flex-row">
                <div className="relative sm:w-1/2">
                  <img
                    src={currentFood.image}
                    alt={currentFood.name}
                    className="w-full h-48 sm:h-80 object-cover"
                  />
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>

                <div className="sm:w-1/2 p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-yellow-100">
                  <div className="inline-flex items-center gap-1 bg-yellow-200 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold mb-2">
                    <Sparkles className="w-2.5 h-2.5" />
                    RECOMMENDATION
                  </div>
                  <h2 className="text-xl sm:text-3xl font-bold text-amber-900 mb-1">
                    {currentFood.name}
                  </h2>
                  <p className="text-sm text-amber-700 mb-3 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    {currentFood.restaurant}
                  </p>

                  {currentFood.description && (
                    <p className="text-amber-800 text-sm mb-3 line-clamp-2">
                      {currentFood.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {currentFood.prepTime && (
                      <div className="bg-white/60 rounded-lg p-2">
                        <p className="text-[10px] text-amber-600 font-semibold">Prep</p>
                        <p className="text-xs text-amber-900">{currentFood.prepTime}</p>
                      </div>
                    )}
                    {currentFood.cookTime && (
                      <div className="bg-white/60 rounded-lg p-2">
                        <p className="text-[10px] text-amber-600 font-semibold">Cook</p>
                        <p className="text-xs text-amber-900">{currentFood.cookTime}</p>
                      </div>
                    )}
                    {currentFood.difficulty && (
                      <div className="bg-white/60 rounded-lg p-2">
                        <p className="text-[10px] text-amber-600 font-semibold">Difficulty</p>
                        <p className="text-xs text-amber-900">{currentFood.difficulty}</p>
                      </div>
                    )}
                    {currentFood.servings && (
                      <div className="bg-white/60 rounded-lg p-2">
                        <p className="text-[10px] text-amber-600 font-semibold">Servings</p>
                        <p className="text-xs text-amber-900">{currentFood.servings}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowRecipeDetails(true)}
                    className="w-full bg-white border border-amber-400 hover:bg-amber-50 text-amber-800 font-bold py-2 px-4 rounded-xl mb-2 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <ChefHat className="w-4 h-4" />
                    View Full Recipe
                  </button>

                  <button
                    onClick={surpriseMe}
                    className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 font-bold text-sm py-2.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-white"
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

      {/* Recipe Details Modal */}
      {showRecipeDetails && currentFood && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:rounded-3xl rounded-t-3xl shadow-2xl sm:max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 sm:p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                <h3 className="text-lg sm:text-2xl font-bold text-white">Full Recipe</h3>
              </div>
              <button
                onClick={() => setShowRecipeDetails(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-4 sm:p-8">
              <div className="mb-4">
                <div className="inline-flex items-center gap-1 bg-yellow-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold mb-2">
                  <Star className="w-2.5 h-2.5" />
                  {currentFood.type === "community" ? "COMMUNITY RECIPE" : "CULTURAL RECIPE"}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                  {currentFood.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {currentFood.restaurant}
                </p>
              </div>

              {currentFood.image && (
                <img
                  src={currentFood.image}
                  alt={currentFood.name}
                  className="w-full h-40 sm:h-56 object-cover rounded-xl mb-4 shadow"
                />
              )}

              {currentFood.description && (
                <p className="text-gray-700 text-sm mb-4">
                  {currentFood.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                {currentFood.prepTime && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-amber-600 font-semibold">Prep Time</p>
                    <p className="text-xs text-amber-900 font-bold">{currentFood.prepTime}</p>
                  </div>
                )}
                {currentFood.cookTime && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-amber-600 font-semibold">Cook Time</p>
                    <p className="text-xs text-amber-900 font-bold">{currentFood.cookTime}</p>
                  </div>
                )}
                {currentFood.difficulty && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-amber-600 font-semibold">Difficulty</p>
                    <p className="text-xs text-amber-900 font-bold">{currentFood.difficulty}</p>
                  </div>
                )}
                {currentFood.servings && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-amber-600 font-semibold">Servings</p>
                    <p className="text-xs text-amber-900 font-bold">{currentFood.servings}</p>
                  </div>
                )}
              </div>

              {currentFood.ingredients && currentFood.ingredients.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-amber-500" />
                    Ingredients
                  </h3>
                  <ul className="space-y-1.5">
                    {currentFood.ingredients.map((ingredient, i) => (
                      <li key={i} className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg text-sm">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentFood.instructions && currentFood.instructions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-amber-500" />
                    Instructions
                  </h3>
                  <ol className="space-y-2">
                    {currentFood.instructions.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-lg border-l-3 border-amber-400">
                        <span className="bg-amber-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                          {i + 1}
                        </span>
                        <span className="text-gray-700 text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {(!currentFood.ingredients || currentFood.ingredients.length === 0) &&
               (!currentFood.instructions || currentFood.instructions.length === 0) &&
               currentFood.recipe && currentFood.recipe.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-amber-500" />
                    Recipe
                  </h3>
                  <ul className="space-y-1.5">
                    {currentFood.recipe.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg text-sm">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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

              {currentFood.notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-2">Notes</h4>
                  <p className="text-gray-700 text-sm bg-yellow-50 border border-yellow-200 p-3 rounded-lg italic">
                    {currentFood.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t">
                <button
                  onClick={() => setShowRecipeDetails(false)}
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-bold px-6 py-2 rounded-xl shadow transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
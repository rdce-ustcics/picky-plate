import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, RefreshCw, Users, MessageSquare, Bot, ChefHat, Calendar, MapPin, Utensils, Sparkles, X, Star, Send, Settings, Flame, Salad, Coffee, Cake, Globe, Zap } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import LoadingModal from '../components/LoadingModal';
import { useAuth } from "../auth/AuthContext";
import { getCached, setCache, CACHE_KEYS, CACHE_TTL } from '../utils/cache';
import './Dashboard.css';


// Scattered Elements Component - Memoized to prevent re-renders
// Element configurations moved inline to reduce CSS bundle size
const scatteredConfig = [
  { w: 80, h: 80, top: '5%', left: '3%', delay: 0, rot: 15 },
  { w: 60, h: 60, top: '12%', right: '8%', delay: -3, rot: -20 },
  { w: 100, h: 100, top: '25%', left: '85%', delay: -6, rot: 45 },
  { w: 50, h: 50, top: '35%', left: '2%', delay: -9, rot: -35 },
  { w: 70, h: 70, top: '45%', right: '3%', delay: -12, rot: 25 },
  { w: 90, h: 90, top: '55%', left: '5%', delay: -15, rot: -10 },
  { w: 55, h: 55, top: '65%', right: '6%', delay: -18, rot: 50 },
  { w: 75, h: 75, top: '75%', left: '88%', delay: -2, rot: -45 },
  { w: 65, h: 65, top: '82%', left: '4%', delay: -5, rot: 30 },
  { w: 85, h: 85, top: '90%', right: '12%', delay: -8, rot: -25 },
  { w: 45, h: 45, top: '8%', left: '45%', delay: -11, rot: 60, hideMobile: true },
  { w: 70, h: 70, top: '38%', left: '52%', delay: -14, rot: -55, hideMobile: true },
  { w: 55, h: 55, top: '36%', left: '62%', delay: -17, rot: 40, hideMobile: true },
  { w: 65, h: 65, top: '35%', left: '82%', delay: -1, rot: -15, hideMobile: true },
  { w: 60, h: 60, top: '72%', left: '55%', delay: -4, rot: 35, hideMobile: true },
  { w: 50, h: 50, top: '15%', left: '65%', delay: -7, rot: -40, hideMobile: true },
  { w: 95, h: 95, top: '68%', left: '15%', delay: -10, rot: 20, hideMobile: true },
  { w: 50, h: 50, top: '37%', left: '72%', delay: -13, rot: -30, hideMobile: true },
  { w: 72, h: 72, top: '85%', left: '40%', delay: -16, rot: 55, hideMobile: true },
  { w: 58, h: 58, top: '95%', left: '75%', delay: -19, rot: -50, hideMobile: true },
  { w: 65, h: 65, top: '3%', left: '30%', delay: -2.5, rot: 25 },
  { w: 55, h: 55, top: '18%', left: '50%', delay: -5.5, rot: -35 },
  { w: 70, h: 70, top: '28%', left: '40%', delay: -8.5, rot: 15 },
  { w: 48, h: 48, top: '42%', left: '30%', delay: -11.5, rot: -45 },
  { w: 75, h: 75, top: '52%', left: '50%', delay: -14.5, rot: 30 },
  { w: 60, h: 60, top: '62%', left: '70%', delay: -17.5, rot: -20, hideMobile: true },
  { w: 52, h: 52, top: '78%', left: '25%', delay: -3.5, rot: 50, hideMobile: true },
  { w: 68, h: 68, top: '88%', left: '50%', delay: -6.5, rot: -10, hideMobile: true },
  { w: 45, h: 45, top: '10%', left: '75%', delay: -9.5, rot: 40, hideMobile: true },
  { w: 80, h: 80, top: '22%', left: '10%', delay: -12.5, rot: -25, hideMobile: true },
  { w: 55, h: 55, top: '48%', left: '85%', delay: -15.5, rot: 35, hideMobile: true },
  { w: 62, h: 62, top: '58%', left: '25%', delay: -18.5, rot: -40, hideMobile: true },
  { w: 50, h: 50, top: '70%', left: '60%', delay: -1.5, rot: 20, hideMobile: true },
  { w: 72, h: 72, top: '80%', left: '80%', delay: -4.5, rot: -55, hideMobile: true },
  { w: 58, h: 58, top: '92%', left: '30%', delay: -7.5, rot: 45, hideMobile: true },
];

const ScatteredElements = React.memo(() => {
  return (
    <div className="scattered-elements">
      {scatteredConfig.map((el, i) => (
        <div
          key={i}
          className={`scattered-element${el.hideMobile ? ' scattered-element-hide-mobile' : ''}`}
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/images/element.png)`,
            width: el.w,
            height: el.h,
            top: el.top,
            left: el.left,
            right: el.right,
            animationDelay: `${el.delay}s`,
            transform: `rotate(${el.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
});


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
  }, [cameFromSignup, location.state]);

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
    { id: "filipino", name: "Filipino", image: `${process.env.PUBLIC_URL}/images/filipino.jpg` },
    { id: "japanese", name: "Japanese", image: `${process.env.PUBLIC_URL}/images/japan.jpg` },
    { id: "italian", name: "Italian", image: `${process.env.PUBLIC_URL}/images/italian.jpeg` },
    { id: "korean", name: "Korean", image: `${process.env.PUBLIC_URL}/images/korean.jpg` },
    { id: "chinese", name: "Chinese", image: `${process.env.PUBLIC_URL}/images/chinese.jpg` },
    { id: "american", name: "American", image: `${process.env.PUBLIC_URL}/images/burger.jpg` },
    { id: "thai", name: "Thai", image: `${process.env.PUBLIC_URL}/images/thai.jpg` },
    { id: "mexican", name: "Mexican", image: `${process.env.PUBLIC_URL}/images/mexican.jpg` },
  ];

  const dislikeOptions = [
    { id: "seafood", name: "Seafood", image: `${process.env.PUBLIC_URL}/images/seafood.jpg` },
    { id: "spicy", name: "Spicy Food", image: `${process.env.PUBLIC_URL}/images/spicy.jpg` },
    { id: "vegetables", name: "Vegetables", image: `${process.env.PUBLIC_URL}/images/vegetables.jpg` },
    { id: "meat", name: "Meat", image: `${process.env.PUBLIC_URL}/images/meat.jpg` },
    { id: "dairy", name: "Dairy", image: `${process.env.PUBLIC_URL}/images/dairy.jpg` },
    { id: "gluten", name: "Gluten", image: `${process.env.PUBLIC_URL}/images/gluten.jpeg` },
    { id: "nuts", name: "Tree Nuts/Peanuts", image: `${process.env.PUBLIC_URL}/images/nuts.jpg` },
    { id: "eggs", name: "Eggs", image: `${process.env.PUBLIC_URL}/images/eggs.jpg` },
  ];

  const dietOptions = [
    { id: "omnivore", name: "Omnivore", image: `${process.env.PUBLIC_URL}/images/omnivore.jpg` },
    { id: "vegetarian", name: "Vegetarian", image: `${process.env.PUBLIC_URL}/images/salad.jpg` },
    { id: "vegan", name: "Vegan", image: `${process.env.PUBLIC_URL}/images/vegetables.jpg` },
    { id: "pescetarian", name: "Pescetarian", image: `${process.env.PUBLIC_URL}/images/fish.jpg` },
    { id: "keto", name: "Keto", image: `${process.env.PUBLIC_URL}/images/keto.jpg` },
    { id: "low-carb", name: "Low Carb", image: `${process.env.PUBLIC_URL}/images/lowcarb.jpg` },
    { id: "halal", name: "Halal", image: `${process.env.PUBLIC_URL}/images/halal.jpg` },
    { id: "kosher", name: "Kosher", image: `${process.env.PUBLIC_URL}/images/kosher.jpg` },
  ];

  const allergenOptions = [
    { id: "peanuts", name: "Peanuts", image: `${process.env.PUBLIC_URL}/images/peanuts.jpg` },
    { id: "tree-nuts", name: "Tree Nuts", image: `${process.env.PUBLIC_URL}/images/nuts.jpg` },
    { id: "eggs", name: "Eggs", image: `${process.env.PUBLIC_URL}/images/eggs.jpg` },
    { id: "dairy", name: "Dairy", image: `${process.env.PUBLIC_URL}/images/dairy.jpg` },
    { id: "gluten", name: "Gluten/Wheat", image: `${process.env.PUBLIC_URL}/images/gluten.jpeg` },
    { id: "soy", name: "Soy", image: `${process.env.PUBLIC_URL}/images/soy.jpg` },
    { id: "fish", name: "Fish", image: `${process.env.PUBLIC_URL}/images/fish.jpg` },
    { id: "shellfish", name: "Shellfish", image: `${process.env.PUBLIC_URL}/images/seafood.jpg` },
  ];

  const [showSurprise, setShowSurprise] = useState(false);
  const [currentFood, setCurrentFood] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [loadingSurprise, setLoadingSurprise] = useState(false);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);

  // Food Mood & Facts States
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const foodMoods = [
    { id: 'hungry', icon: Flame, label: 'Starving', query: 'Quick filling meals' },
    { id: 'healthy', icon: Salad, label: 'Healthy', query: 'Healthy nutritious recipes' },
    { id: 'comfort', icon: Coffee, label: 'Comfort', query: 'Comfort food recipes' },
    { id: 'sweet', icon: Cake, label: 'Sweet Tooth', query: 'Dessert recipes' },
    { id: 'adventure', icon: Globe, label: 'Adventurous', query: 'Exotic international recipes' },
    { id: 'quick', icon: Zap, label: 'Quick Bite', query: '15 minute easy recipes' },
  ];

  const foodFacts = useMemo(() => [
    { emoji: '🍯', fact: 'Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible!' },
    { emoji: '🍫', fact: 'White chocolate isn\'t technically chocolate — it contains no cocoa solids, only cocoa butter.' },
    { emoji: '🥕', fact: 'Carrots were originally purple! Orange carrots were developed in the 17th century Netherlands.' },
    { emoji: '🍕', fact: 'The Hawaiian pizza was invented in Canada by a Greek immigrant. Talk about fusion!' },
    { emoji: '🥜', fact: 'Peanuts aren\'t nuts — they\'re legumes that grow underground like beans.' },
    { emoji: '🍌', fact: 'Bananas are berries, but strawberries aren\'t. Botanically speaking, that is!' },
    { emoji: '🌶️', fact: 'The heat in chili peppers comes from capsaicin, which tricks your brain into feeling burning pain.' },
    { emoji: '🧀', fact: 'There are over 1,800 different types of cheese in the world. Time to start tasting!' },
  ], []);

  const handleMoodSelect = (mood) => {
    navigate('/chatbot', { state: { message: mood.query } });
  };

  const nextFact = () => {
    setCurrentFactIndex((prev) => (prev + 1) % foodFacts.length);
  };

  const prevFact = () => {
    setCurrentFactIndex((prev) => (prev - 1 + foodFacts.length) % foodFacts.length);
  };

  const fetchSurpriseRecipes = useCallback(async () => {
    // Check cache first for faster initial load
    const cached = getCached(CACHE_KEYS.SURPRISE_RECIPES);
    if (cached && cached.length > 0) {
      setFoodItems(cached);
      return;
    }

    try {
      const res = await fetch(`${API}/api/surprise?limit=20`);
      const data = await res.json();
      if (res.ok && data.success && data.recipes.length > 0) {
        setFoodItems(data.recipes);
        // Cache for quick subsequent loads (short TTL for freshness)
        setCache(CACHE_KEYS.SURPRISE_RECIPES, data.recipes, CACHE_TTL.SURPRISE_RECIPES);
      } else {
        setFoodItems([]);
      }
    } catch (error) {
      // console.error("Error fetching surprise recipes:", error);
      setFoodItems([]);
    }
  }, [API]);

  useEffect(() => {
    // Set greeting once on mount based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Hello');

    fetchSurpriseRecipes();

    // Rotate food facts every 15 seconds (increased from 8s to reduce re-renders)
    const factTimer = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % foodFacts.length);
    }, 15000);

    return () => {
      clearInterval(factTimer);
    };
  }, [fetchSurpriseRecipes, foodFacts.length]);

  const surpriseMe = async () => {
    setIsAnimating(true);
    setLoadingSurprise(true);
    try {
      const res = await fetch(`${API}/api/surprise/random`);
      const data = await res.json();
      if (res.ok && data.success && data.recipe) {
        setCurrentFood(data.recipe);
        setIsLiked(false);
      } else if (foodItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * foodItems.length);
        setCurrentFood(foodItems[randomIndex]);
        setIsLiked(false);
      }
    } catch (error) {
      // Fallback to cached items
      if (foodItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * foodItems.length);
        setCurrentFood(foodItems[randomIndex]);
        setIsLiked(false);
      }
    } finally {
      setIsAnimating(false);
      setLoadingSurprise(false);
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
        // console.error("Error fetching random recipe:", error);
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
        <div className="onboarding-overlay">
          <div className="onboarding-modal">
            <div className="onboarding-header">
              <div className="onboarding-logo-container">
                <div className="onboarding-logo">
                  <span className="onboarding-logo-text">P</span>
                </div>
              </div>
              <h2 className="onboarding-title">
                {currentStep === 1 && "Welcome To Pick-A-Plate!"}
                {currentStep === 2 && "Foods you dislike?"}
                {currentStep === 3 && "Choose your diet"}
                {currentStep === 4 && "Any allergens?"}
              </h2>
              <p className="onboarding-subtitle">
                {currentStep === 1 && "Select cuisines you love"}
                {currentStep === 2 && "We'll avoid these for you"}
                {currentStep === 3 && "Pick what fits you best"}
                {currentStep === 4 && "Select to always exclude"}
              </p>
              <div className="onboarding-steps">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`onboarding-step ${step === currentStep ? "onboarding-step-active" : "onboarding-step-inactive"}`}
                  />
                ))}
              </div>
            </div>
            <div className="onboarding-content">
              {onboardingError && <div className="onboarding-error">{onboardingError}</div>}
              <div className="onboarding-grid">
                {currentStep === 1 && cuisineOptions.map((option) => (
                  <div key={option.id} onClick={() => toggleSelection(option.id, "cuisine")} className={`onboarding-option ${selectedCuisines.includes(option.id) ? "onboarding-option-selected-yellow" : ""}`}>
                    <img src={option.image} alt={option.name} className="onboarding-option-image" width="150" height="112" loading="lazy" />
                    <div className="onboarding-option-overlay"><span className="onboarding-option-name">{option.name}</span></div>
                    {selectedCuisines.includes(option.id) && (<div className="onboarding-option-check onboarding-option-check-yellow"><svg className="onboarding-option-check-icon" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>)}
                  </div>
                ))}
                {currentStep === 2 && dislikeOptions.map((option) => (
                  <div key={option.id} onClick={() => toggleSelection(option.id, "dislike")} className={`onboarding-option ${selectedDislikes.includes(option.id) ? "onboarding-option-selected-red" : ""}`}>
                    <img src={option.image} alt={option.name} className="onboarding-option-image" width="150" height="112" loading="lazy" />
                    <div className="onboarding-option-overlay"><span className="onboarding-option-name">{option.name}</span></div>
                    {selectedDislikes.includes(option.id) && (<div className="onboarding-option-check onboarding-option-check-red"><X className="onboarding-option-check-icon" /></div>)}
                  </div>
                ))}
                {currentStep === 3 && dietOptions.map((option) => (
                  <div key={option.id} onClick={() => toggleSelection(option.id, "diet")} className={`onboarding-option ${selectedDiets.includes(option.id) ? "onboarding-option-selected-yellow" : ""}`}>
                    <img src={option.image} alt={option.name} className="onboarding-option-image" width="150" height="112" loading="lazy" />
                    <div className="onboarding-option-overlay"><span className="onboarding-option-name">{option.name}</span></div>
                    {selectedDiets.includes(option.id) && (<div className="onboarding-option-check onboarding-option-check-yellow"><svg className="onboarding-option-check-icon" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>)}
                  </div>
                ))}
                {currentStep === 4 && allergenOptions.map((option) => (
                  <div key={option.id} onClick={() => toggleSelection(option.id, "allergen")} className={`onboarding-option ${selectedAllergens.includes(option.id) ? "onboarding-option-selected-red" : ""}`}>
                    <img src={option.image} alt={option.name} className="onboarding-option-image" width="150" height="112" loading="lazy" />
                    <div className="onboarding-option-overlay"><span className="onboarding-option-name">{option.name}</span></div>
                    {selectedAllergens.includes(option.id) && (<div className="onboarding-option-check onboarding-option-check-red"><svg className="onboarding-option-check-icon" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>)}
                  </div>
                ))}
              </div>
            </div>
            <div className="onboarding-footer">
              <button onClick={handleSkip} className="onboarding-skip-btn" disabled={savingOnboarding}>{savingOnboarding ? "Saving…" : "Skip"}</button>
              <button onClick={handleNext} className="onboarding-next-btn" disabled={savingOnboarding}>{currentStep === 4 ? (savingOnboarding ? "Saving…" : "Get Started") : "Next"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="dashboard-container">
        {/* Scattered Elements Background */}
        <ScatteredElements />

        <header className="dashboard-header">
          <div className="header-container">
            <div className="header-content">
              <div className="header-left">
                <div className="header-logo-container"><Utensils className="header-logo-icon" /></div>
                <div>
                  <h1 className="header-title">Pick-A-Plate</h1>
                  <p className="header-subtitle">Your personal food companion</p>
                </div>
              </div>
              <div className="header-right">
                {isAdmin && (<button onClick={openOnboardingPreview} className="admin-preview-btn" title="Preview Onboarding Modal"><Settings className="admin-preview-icon" /><span className="admin-preview-text">Preview Onboarding</span></button>)}
                <div><p className="greeting-text">{greeting}!</p></div>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="main-cards-section">
            <div className="ai-chat-card">
              <div className="ai-chat-decoration"></div>
              <div className="ai-chat-content">
                <div className="ai-chat-header">
                  <div className="ai-chat-icon-container"><Bot className="ai-chat-icon" /></div>
                  <div>
                    <h2 className="ai-chat-title">AI Assistant</h2>
                    <p className="ai-chat-subtitle">{greeting}! How can I help?</p>
                  </div>
                </div>
                <div className="ai-chat-features">
                  <span className="ai-chat-feature-tag"><Sparkles className="ai-chat-feature-icon" /> Recommendations</span>
                  <span className="ai-chat-feature-tag"><ChefHat className="ai-chat-feature-icon" /> Recipes</span>
                  <span className="ai-chat-feature-tag"><MessageSquare className="ai-chat-feature-icon" /> 24/7</span>
                </div>
                <div className="ai-chat-input-container">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleChatSubmit(); }} placeholder="Ask about food..." className="ai-chat-input" />
                  <button onClick={handleChatSubmit} className="ai-chat-submit-btn"><Send className="ai-chat-submit-icon" /></button>
                </div>
                <div className="ai-chat-quick-actions">
                  <button onClick={() => navigate('/chatbot', { state: { message: "What's popular today?" } })} className="ai-chat-quick-btn">Popular</button>
                  <button onClick={() => navigate('/chatbot', { state: { message: "Suggest a healthy meal" } })} className="ai-chat-quick-btn">Healthy</button>
                  <button onClick={() => navigate('/chatbot', { state: { message: "Find restaurants near me" } })} className="ai-chat-quick-btn">Near me</button>
                </div>
              </div>
            </div>

            <div className="surprise-card">
              <div className="surprise-decoration"></div>
              {/* Circle spots */}
              <div className="surprise-spot surprise-spot-1"></div>
              <div className="surprise-spot surprise-spot-2"></div>
              <div className="surprise-spot surprise-spot-3"></div>
              <div className="surprise-spot surprise-spot-4"></div>
              <div className="surprise-spot surprise-spot-5"></div>
              <div className="surprise-spot surprise-spot-6"></div>
              <div className="surprise-content">
                <Sparkles className="surprise-icon" />
                <div className="surprise-text-container">
                  <h2 className="surprise-title">Can't Decide?</h2>
                  <p className="surprise-subtitle">Let us surprise you!</p>
                </div>
                <button onClick={handleSurpriseClick} className="surprise-btn"><Sparkles className="surprise-btn-icon" /><span>Surprise Me!</span></button>
              </div>
            </div>
          </div>

          <div className="feature-section">
            <h3 className="feature-section-title"><Utensils className="feature-section-icon" />Explore Features</h3>
            <div className="feature-grid">
              {navigationCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <button key={index} onClick={() => navigate(`/${card.title.toLowerCase().replace(/\s+/g, '-')}`)} className="feature-card">
                    <div className="feature-card-content">
                      <div className="feature-card-icon-container"><Icon className="feature-card-icon" /></div>
                      <h3 className="feature-card-title">{card.title}</h3>
                      <p className="feature-card-description">{card.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="footer-banner">
            <div className="footer-banner-decoration">
              <div className="footer-emoji footer-emoji-pizza">🍕</div>
              <div className="footer-emoji footer-emoji-burger">🍔</div>
              <div className="footer-emoji footer-emoji-pepper">🌶️</div>
              <div className="footer-emoji footer-emoji-salad">🥗</div>
            </div>
            <div className="footer-banner-content">
              <h3 className="footer-banner-title">Ready to cook something amazing?</h3>
              <p className="footer-banner-text">Join our community of food lovers and discover new flavors every day!</p>
              <div className="footer-banner-buttons">
                <button onClick={() => navigate('/explorer')} className="footer-btn-primary">Browse Recipes</button>
                <button onClick={() => navigate('/chatbot', { state: { message: "Suggest me something new to try" } })} className="footer-btn-secondary">Get Suggestions</button>
              </div>
            </div>
          </div>

          {/* Food Mood & Fun Facts Section */}
          <div className="mood-facts-section">
            <div className="mood-picker-card">
              <div className="mood-picker-header">
                <div className="mood-picker-icon-wrapper"><Flame className="mood-picker-icon" /></div>
                <div>
                  <h3 className="mood-picker-title">What's Your Food Mood?</h3>
                  <p className="mood-picker-subtitle">Tap how you're feeling, we'll find the perfect dish!</p>
                </div>
              </div>
              <div className="mood-grid">
                {foodMoods.map((mood) => {
                  const Icon = mood.icon;
                  return (
                    <button key={mood.id} onClick={() => handleMoodSelect(mood)} className="mood-btn">
                      <div className="mood-icon-wrapper">
                        <Icon className="mood-icon" />
                      </div>
                      <span className="mood-label">{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="food-facts-card">
              <div className="food-facts-header">
                <span className="food-facts-badge"><Star className="food-facts-badge-icon" />Did You Know?</span>
              </div>
              <div className="food-facts-content">
                <div className="food-facts-emoji-wrapper"><span className="food-facts-emoji">{foodFacts[currentFactIndex].emoji}</span></div>
                <p className="food-facts-text">{foodFacts[currentFactIndex].fact}</p>
              </div>
              <div className="food-facts-nav">
                <button onClick={prevFact} className="food-facts-nav-btn">←</button>
                <div className="food-facts-dots">
                  {foodFacts.map((_, index) => (<span key={index} className={`food-facts-dot ${index === currentFactIndex ? 'food-facts-dot-active' : ''}`} onClick={() => setCurrentFactIndex(index)} />))}
                </div>
                <button onClick={nextFact} className="food-facts-nav-btn">→</button>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Surprise Me Modal */}
      {showSurprise && currentFood && (
        <div className="surprise-modal-overlay">
          <div className="surprise-modal">
            <div className="surprise-modal-header">
              <div className="surprise-modal-title-container"><Sparkles className="surprise-modal-icon" /><h2 className="surprise-modal-title">Your Surprise!</h2></div>
              <button onClick={() => setShowSurprise(false)} className="surprise-modal-close-btn"><X className="surprise-modal-close-icon" /></button>
            </div>
            <div className={`surprise-modal-content ${isAnimating ? 'surprise-modal-content-animating' : 'surprise-modal-content-visible'}`}>
              <div className="surprise-modal-layout">
                <div className="surprise-modal-image-container">
                  <img src={currentFood.image} alt={currentFood.name} className="surprise-modal-image" width="400" height="320" loading="lazy" />
                  <button onClick={() => setIsLiked(!isLiked)} className="surprise-modal-like-btn"><Heart className={`surprise-modal-like-icon ${isLiked ? 'surprise-modal-like-icon-active' : 'surprise-modal-like-icon-inactive'}`} /></button>
                </div>
                <div className="surprise-modal-details">
                  <div className="surprise-modal-badge"><Sparkles className="surprise-modal-badge-icon" />RECOMMENDATION</div>
                  <h3 className="surprise-modal-food-name">{currentFood.name}</h3>
                  <p className="surprise-modal-restaurant"><MapPin className="surprise-modal-restaurant-icon" />{currentFood.restaurant}</p>
                  {currentFood.description && (<p className="surprise-modal-description">{currentFood.description}</p>)}
                  <div className="surprise-modal-info-grid">
                    {currentFood.prepTime && (<div className="surprise-modal-info-item"><p className="surprise-modal-info-label">Prep</p><p className="surprise-modal-info-value">{currentFood.prepTime}</p></div>)}
                    {currentFood.cookTime && (<div className="surprise-modal-info-item"><p className="surprise-modal-info-label">Cook</p><p className="surprise-modal-info-value">{currentFood.cookTime}</p></div>)}
                    {currentFood.difficulty && (<div className="surprise-modal-info-item"><p className="surprise-modal-info-label">Difficulty</p><p className="surprise-modal-info-value">{currentFood.difficulty}</p></div>)}
                    {currentFood.servings && (<div className="surprise-modal-info-item"><p className="surprise-modal-info-label">Servings</p><p className="surprise-modal-info-value">{currentFood.servings}</p></div>)}
                  </div>
                  <button onClick={() => setShowRecipeDetails(true)} className="surprise-modal-recipe-btn"><ChefHat className="surprise-modal-recipe-btn-icon" />View Full Recipe</button>
                  <button onClick={surpriseMe} className="surprise-modal-try-another-btn"><RefreshCw className={`surprise-modal-try-another-icon ${isAnimating ? 'surprise-modal-try-another-icon-spinning' : ''}`} />Try Another</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Details Modal */}
      {showRecipeDetails && currentFood && (
        <div className="recipe-modal-overlay">
          <div className="recipe-modal">
            <div className="recipe-modal-header">
              <div className="recipe-modal-title-container"><ChefHat className="recipe-modal-icon" /><h2 className="recipe-modal-title">Full Recipe</h2></div>
              <button onClick={() => setShowRecipeDetails(false)} className="recipe-modal-close-btn"><X className="recipe-modal-close-icon" /></button>
            </div>
            <div className="recipe-modal-content">
              <div className="recipe-modal-header-section">
                <div className="recipe-modal-badge"><Star className="recipe-modal-badge-icon" />{currentFood.type === "community" ? "COMMUNITY RECIPE" : "CULTURAL RECIPE"}</div>
                <h3 className="recipe-modal-food-name">{currentFood.name}</h3>
                <p className="recipe-modal-restaurant">{currentFood.restaurant}</p>
              </div>
              {currentFood.image && (<img src={currentFood.image} alt={currentFood.name} className="recipe-modal-image" width="400" height="224" loading="lazy" />)}
              {currentFood.description && (<p className="recipe-modal-description">{currentFood.description}</p>)}
              <div className="recipe-modal-info-grid">
                {currentFood.prepTime && (<div className="recipe-modal-info-item"><p className="recipe-modal-info-label">Prep Time</p><p className="recipe-modal-info-value">{currentFood.prepTime}</p></div>)}
                {currentFood.cookTime && (<div className="recipe-modal-info-item"><p className="recipe-modal-info-label">Cook Time</p><p className="recipe-modal-info-value">{currentFood.cookTime}</p></div>)}
                {currentFood.difficulty && (<div className="recipe-modal-info-item"><p className="recipe-modal-info-label">Difficulty</p><p className="recipe-modal-info-value">{currentFood.difficulty}</p></div>)}
                {currentFood.servings && (<div className="recipe-modal-info-item"><p className="recipe-modal-info-label">Servings</p><p className="recipe-modal-info-value">{currentFood.servings}</p></div>)}
              </div>
              {currentFood.ingredients && currentFood.ingredients.length > 0 && (
                <div className="recipe-modal-section">
                  <h3 className="recipe-modal-section-title"><Utensils className="recipe-modal-section-icon" />Ingredients</h3>
                  <ul className="recipe-modal-ingredients-list">{currentFood.ingredients.map((ingredient, i) => (<li key={i} className="recipe-modal-ingredient-item"><span className="recipe-modal-ingredient-bullet">•</span><span className="recipe-modal-ingredient-text">{ingredient}</span></li>))}</ul>
                </div>
              )}
              {currentFood.instructions && currentFood.instructions.length > 0 && (
                <div className="recipe-modal-section">
                  <h3 className="recipe-modal-section-title"><ChefHat className="recipe-modal-section-icon" />Instructions</h3>
                  <ol className="recipe-modal-instructions-list">{currentFood.instructions.map((step, i) => (<li key={i} className="recipe-modal-instruction-item"><span className="recipe-modal-instruction-number">{i + 1}</span><span className="recipe-modal-instruction-text">{step}</span></li>))}</ol>
                </div>
              )}
              {(!currentFood.ingredients || currentFood.ingredients.length === 0) && (!currentFood.instructions || currentFood.instructions.length === 0) && currentFood.recipe && currentFood.recipe.length > 0 && (
                <div className="recipe-modal-section">
                  <h3 className="recipe-modal-section-title"><ChefHat className="recipe-modal-section-icon" />Recipe</h3>
                  <ul className="recipe-modal-recipe-list">{currentFood.recipe.map((step, i) => (<li key={i} className="recipe-modal-recipe-item"><span className="recipe-modal-recipe-bullet">•</span><span className="recipe-modal-recipe-text">{step}</span></li>))}</ul>
                </div>
              )}
              {currentFood.type === "community" && (
                <div className="recipe-modal-tags-allergens">
                  {currentFood.tags && currentFood.tags.length > 0 && (<div><h4 className="recipe-modal-tags-title">Tags</h4><div className="recipe-modal-tags-container">{currentFood.tags.map((tag, i) => (<span key={i} className="recipe-modal-tag">#{tag}</span>))}</div></div>)}
                  {currentFood.allergens && currentFood.allergens.length > 0 && (<div><h4 className="recipe-modal-allergens-title">Allergens</h4><div className="recipe-modal-allergens-container">{currentFood.allergens.map((allergen, i) => (<span key={i} className="recipe-modal-allergen">⚠️ {allergen}</span>))}</div></div>)}
                </div>
              )}
              {currentFood.notes && (<div className="recipe-modal-notes-section"><h4 className="recipe-modal-notes-title">Notes</h4><p className="recipe-modal-notes-text">{currentFood.notes}</p></div>)}
              <div className="recipe-modal-footer"><button onClick={() => setShowRecipeDetails(false)} className="recipe-modal-close-action-btn">Close</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
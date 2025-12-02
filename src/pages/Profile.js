import React, { useEffect, useMemo, useState } from 'react';
import LoadingModal from '../components/LoadingModal';
import { useAuth } from '../auth/AuthContext';
import { getCached, setCache, CACHE_KEYS, CACHE_TTL } from '../utils/cache';
import './Profile.css';

export default function Profile() {
  // API base configuration (matching Dashboard)
  const API = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const { authHeaders } = useAuth();

  // ---- Identify active user ----
  const activeUserId = useMemo(() => {
    try {
      return localStorage.getItem('pap:activeUserId') || 'global';
    } catch {
      return 'global';
    }
  }, []);

  // Helper: derive name from email (e.g., john.doe -> John Doe)
  const nameFromEmail = (email) => {
    if (!email || email === 'global') return 'Friend';
    const local = email.split('@')[0] || '';
    return local
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ') || 'Friend';
  };

  // ---- Profile fields (local) ----
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('pap:activeUserName') || nameFromEmail(localStorage.getItem('pap:activeUserId'));
    } catch {
      return 'Friend';
    }
  });
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem('pap:profile:phone') || '+63';
    } catch {
      return '+63';
    }
  });

  // ---- Option sets (with new additions) ----
  const cuisineOptions   = ['filipino','japanese','italian','korean','chinese','american','thai','mexican','middle-eastern'];
  const dislikeOptions   = ['seafood','spicy','vegetables','meat','dairy','gluten','nuts','eggs'];
  const allergenOptions  = ['peanuts','eggs','dairy','gluten','soy','fish','seafood','sesame','corn','sulfites','mustard'];
  const dietOptions      = ['omnivore','vegetarian','pescetarian','keto','low-carb','halal','kosher','gluten-free'];
  const favoriteOptions  = ['steak','sushi','pizza','burger','pasta','ramen','tacos','desserts','milk tea', 'coffee', 'fries', 'chicken', 'salad', 'soup', 'donut', 'brunch'];

  // ---- Label maps WITHOUT emojis for formal look ----
  const pretty = {
    // Cuisines
    filipino:'Filipino', japanese:'Japanese', italian:'Italian', korean:'Korean',
    chinese:'Chinese', american:'American', thai:'Thai', mexican:'Mexican',
    'middle-eastern':'Middle Eastern',
    // Dislikes
    seafood:'Seafood', spicy:'Spicy Food', vegetables:'Vegetables', meat:'Meat',
    dairy:'Dairy', gluten:'Gluten', nuts:'Tree Nuts/Peanuts', eggs:'Eggs',
    // Allergens
    peanuts:'Peanuts', 'tree-nuts':'Tree Nuts', soy:'Soy', fish:'Fish',
    shellfish:'Shellfish', sesame:'Sesame', corn:'Corn', sulfites:'Sulfites', mustard:'Mustard',
    // Diet types
    omnivore:'Omnivore', vegetarian:'Vegetarian', vegan:'Vegan', pescetarian:'Pescetarian',
    keto:'Keto', 'low-carb':'Low Carb', halal:'Halal', kosher:'Kosher', 'gluten-free':'Gluten Free',
    // Favorites
    steak:'Steak', sushi:'Sushi', pizza:'Pizza', burger:'Burger',
    pasta:'Pasta', ramen:'Ramen', tacos:'Tacos', desserts:'Desserts',
    'milk tea':'Milk Tea', coffee:'Coffee', fries:'Fries', chicken:'Chicken',
    salad:'Salad', soup:'Soup', donut:'Donut', brunch:'Brunch'
  };
  const display = (id) => pretty[id] || id;

  // ---- IMAGE MAP: option id -> /public/images/* ----
  const imageBasePath = `${process.env.PUBLIC_URL}/images`;

  const prefImageMap = {
    // Cuisines
    filipino:       `${imageBasePath}/adobo.png`,
    japanese:       `${imageBasePath}/sushi.jpg`,
    italian:        `${imageBasePath}/pasta.jpg`,
    korean:         `${imageBasePath}/korean.jpg`,
    chinese:        `${imageBasePath}/chinese.jpg`,
    american:       `${imageBasePath}/burger.jpg`,
    thai:           `${imageBasePath}/thai.jpg`,
    mexican:        `${imageBasePath}/mexican.jpg`,
    'middle-eastern': `${imageBasePath}/middleeastern.jpg`,

    // Dislikes
    seafood:        `${imageBasePath}/seafood.jpg`,
    spicy:          `${imageBasePath}/spicy.jpg`,
    vegetables:     `${imageBasePath}/vegetables.jpg`,
    meat:           `${imageBasePath}/meat.jpg`,
    dairy:          `${imageBasePath}/dairy.jpg`,
    gluten:         `${imageBasePath}/gluten.jpg`,
    nuts:           `${imageBasePath}/nuts.jpg`,
    eggs:           `${imageBasePath}/eggs.jpg`,

    // Allergens
    peanuts:        `${imageBasePath}/peanuts.jpg`,
    soy:            `${imageBasePath}/soy.jpg`,
    fish:           `${imageBasePath}/fish.jpg`,
    sesame:         `${imageBasePath}/sesame.jpg`,
    corn:           `${imageBasePath}/corn.jpg`,
    sulfites:       `${imageBasePath}/sulfities.jpg`,
    mustard:        `${imageBasePath}/mustard.jpg`,

    // Diets
    omnivore:       `${imageBasePath}/omnivore.jpg`,
    vegetarian:     `${imageBasePath}/salad.jpg`,
    pescetarian:    `${imageBasePath}/fish.jpg`,
    keto:           `${imageBasePath}/keto.jpg`,
    'low-carb':     `${imageBasePath}/lowcarb.jpg`,
    halal:          `${imageBasePath}/halal.jpg`,
    kosher:         `${imageBasePath}/kosher.jpg`,
    'gluten-free':  `${imageBasePath}/gluten.jpg`,

    // Favorites
    steak:          `${imageBasePath}/meat.jpg`,
    sushi:          `${imageBasePath}/sushi.jpg`,
    pizza:          `${imageBasePath}/pizza.jpg`,
    burger:         `${imageBasePath}/burger.jpg`,
    pasta:          `${imageBasePath}/pasta.jpg`,
    ramen:          `${imageBasePath}/ramen.jpg`,
    tacos:          `${imageBasePath}/tacos.jpg`,
    desserts:       `${imageBasePath}/desserts.jpg`,
    'milk tea':     `${imageBasePath}/milktea.jpeg`,
    coffee:         `${imageBasePath}/coffee.jpg`,
    fries:          `${imageBasePath}/fries.jpg`,
    chicken:        `${imageBasePath}/chicken.jpg`,
    salad:          `${imageBasePath}/salad.jpg`,
    soup:           `${imageBasePath}/soup.jpg`,
    donut:          `${imageBasePath}/donut.jpg`,
    brunch:         `${imageBasePath}/brunch.jpg`,
  };

  const getImageForPref = (id) =>
    prefImageMap[id] || `${imageBasePath}/PickAPlate.png`;

  // ---- Server data ----
  const [likes, setLikes] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [diets, setDiets] = useState([]);
  const [kiddieMeal, setKiddieMeal] = useState(false);

  // Kids preferences
  const [kids, setKids] = useState([]);
  const [loadingKids, setLoadingKids] = useState(false);

  // Kid wizard state
  const [showKidWizard, setShowKidWizard] = useState(false);
  const [kidStep, setKidStep] = useState(0);

  const [editingKidId, setEditingKidId] = useState(null);
  const [kidName, setKidName] = useState('');
  const [kidAge, setKidAge] = useState('');
  const [kidEatingStyle, setKidEatingStyle] = useState('');
  const [kidFavoriteFoods, setKidFavoriteFoods] = useState('');
  const [kidWontEat, setKidWontEat] = useState('');
  const [kidAllergens, setKidAllergens] = useState([]);
  const [kidNotes, setKidNotes] = useState('');

  const [savingKid, setSavingKid] = useState(false);

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // ---- Custom Alert Modal State ----
  const [alertModal, setAlertModal] = useState({
    show: false,
    type: 'info', // 'info', 'success', 'error', 'confirm'
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  // Custom alert function to replace browser alert
  const showAlert = (title, message, type = 'info') => {
    setAlertModal({
      show: true,
      type,
      title,
      message,
      onConfirm: () => setAlertModal(prev => ({ ...prev, show: false })),
      onCancel: null,
    });
  };

  // Custom confirm function to replace browser confirm
  const showConfirm = (title, message, onConfirm, type = 'confirm') => {
    setAlertModal({
      show: true,
      type,
      title,
      message,
      onConfirm: () => {
        setAlertModal(prev => ({ ...prev, show: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => setAlertModal(prev => ({ ...prev, show: false })),
    });
  };

  // Preferences wizard
  const [showPrefsWizard, setShowPrefsWizard] = useState(false);
  const [prefsStep, setPrefsStep] = useState(1);

  const openPrefsWizard = (startStep = 1) => {
    setPrefsStep(startStep);
    setShowPrefsWizard(true);
  };

  // Combine all preferences for display
  const allSelectedPreferences = [...likes, ...dislikes, ...favorites, ...allergens, ...diets];

  // ---- Load preferences on mount (with caching) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');

      // Check cache first
      const cached = getCached(CACHE_KEYS.USER_PREFERENCES);
      if (cached) {
        setLikes(Array.isArray(cached.likes) ? cached.likes : []);
        setDislikes(Array.isArray(cached.dislikes) ? cached.dislikes : []);
        setFavorites(Array.isArray(cached.favorites) ? cached.favorites : []);
        setAllergens(Array.isArray(cached.allergens) ? cached.allergens : []);
        setDiets(Array.isArray(cached.diets) ? cached.diets : []);
        setKiddieMeal(cached.kiddieMeal === true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API}/api/preferences/me`, {
          headers: {
            ...authHeaders(),
          }
        });
        if (!res.ok) throw new Error('Failed to load preferences');
        const data = await res.json();

        if (cancelled) return;
        setLikes(Array.isArray(data.likes) ? data.likes : []);
        setDislikes(Array.isArray(data.dislikes) ? data.dislikes : []);
        setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
        setAllergens(Array.isArray(data.allergens) ? data.allergens : []);
        setDiets(Array.isArray(data.diets) ? data.diets : []);
        setKiddieMeal(data.kiddieMeal === true);

        // Cache the preferences
        setCache(CACHE_KEYS.USER_PREFERENCES, data, CACHE_TTL.USER_PREFERENCES);

      } catch (e) {
        if (!cancelled) setError(e.message || 'Load error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeUserId, API, authHeaders]);

  // ---- Load kids preferences (with caching) ----
  useEffect(() => {
    let cancelled = false;

    const loadKids = async () => {
      setLoadingKids(true);

      // Check cache first
      const cached = getCached(CACHE_KEYS.KIDS_PREFERENCES);
      if (cached) {
        setKids(Array.isArray(cached) ? cached : []);
        setLoadingKids(false);
        return;
      }

      try {
        const res = await fetch(`${API}/api/preferences/kids`, {
          headers: {
            ...authHeaders(),
          },
        });

        if (!res.ok) throw new Error('Failed to load kids');
        const data = await res.json();

        if (!cancelled && data.success) {
          const kidsData = Array.isArray(data.kids) ? data.kids : [];
          setKids(kidsData);
          setCache(CACHE_KEYS.KIDS_PREFERENCES, kidsData, CACHE_TTL.KIDS_PREFERENCES);
        }
      } catch (err) {
        // console.error('Error loading kids', err);
      } finally {
        if (!cancelled) setLoadingKids(false);
      }
    };

    loadKids();
    return () => {
      cancelled = true;
    };
  }, [API, authHeaders]);

  // ---- Toggle preference ----
  const togglePreference = (id) => {
    setLikes(prev => prev.filter(v => v !== id));
    setDislikes(prev => prev.filter(v => v !== id));
    setFavorites(prev => prev.filter(v => v !== id));
    setAllergens(prev => prev.filter(v => v !== id));
    setDiets(prev => prev.filter(v => v !== id));

    if (!allSelectedPreferences.includes(id)) {
      if (cuisineOptions.includes(id)) setLikes(prev => [...prev, id]);
      else if (dislikeOptions.includes(id)) setDislikes(prev => [...prev, id]);
      else if (favoriteOptions.includes(id)) setFavorites(prev => [...prev, id]);
      else if (allergenOptions.includes(id)) setAllergens(prev => [...prev, id]);
      else if (dietOptions.includes(id)) setDiets(prev => [...prev, id]);
    }
  };

  // ---- Save to server + persist local profile fields ----
  const saveChanges = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        likes,
        dislikes,
        diets,
        allergens,
        favorites,
        kiddieMeal,
        onboardingDone: true
      };

      const res = await fetch(`${API}/api/preferences/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Save failed');
      }

      try {
        localStorage.setItem('pap:activeUserName', name || nameFromEmail(activeUserId));
        localStorage.setItem('pap:profile:phone', phone || '+63');
      } catch {}

      setCache(CACHE_KEYS.USER_PREFERENCES, {
        likes, dislikes, diets, allergens, favorites, kiddieMeal
      }, CACHE_TTL.USER_PREFERENCES);

      showAlert('Success!', 'Profile saved successfully!', 'success');
    } catch (e) {
      setError(e.message || 'Save error');
      showAlert('Error', e.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---- Kid wizard functions ----
  const openKidWizard = (kid = null) => {
    if (kid) {
      setEditingKidId(kid.kidId);
      setKidName(kid.name || '');
      setKidAge(kid.age != null ? String(kid.age) : '');
      setKidEatingStyle(kid.eatingStyle || '');
      setKidFavoriteFoods(kid.favoriteFoods || '');
      setKidWontEat(kid.wontEat || '');
      setKidAllergens(kid.allergens || []);
      setKidNotes(kid.notes || '');
    } else {
      setEditingKidId(null);
      setKidName('');
      setKidAge('');
      setKidEatingStyle('');
      setKidFavoriteFoods('');
      setKidWontEat('');
      setKidAllergens([]);
      setKidNotes('');
    }
    setKidStep(0);
    setShowKidWizard(true);
  };

  const toggleKidAllergen = (id) => {
    setKidAllergens((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveKid = async () => {
    setSavingKid(true);
    try {
      const payload = {
        kidId: editingKidId,
        name: kidName.trim(),
        age: Number(kidAge),
        eatingStyle: kidEatingStyle,
        favoriteFoods: kidFavoriteFoods.trim(),
        wontEat: kidWontEat.trim(),
        allergens: kidAllergens,
        notes: kidNotes.trim(),
        kiddieMeal: true,
      };

      const res = await fetch(`${API}/api/preferences/kids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save kid');
      }

      setKids((prev) => {
        const without = prev.filter((k) => k.kidId !== data.kid.kidId);
        const updatedKids = [...without, data.kid];
        setCache(CACHE_KEYS.KIDS_PREFERENCES, updatedKids, CACHE_TTL.KIDS_PREFERENCES);
        return updatedKids;
      });

      setShowKidWizard(false);
      showAlert('Success!', `${kidName}'s preferences saved!`, 'success');
    } catch (err) {
      showAlert('Error', err.message || 'Failed to save kid', 'error');
    } finally {
      setSavingKid(false);
    }
  };

  // ---- Delete Kid Function ----
  const deleteKid = async (kid) => {
    showConfirm(
      'Delete Kid Profile',
      `Are you sure you want to delete ${kid.name}'s profile? This action cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`${API}/api/preferences/kids/${kid.kidId}`, {
            method: 'DELETE',
            headers: {
              ...authHeaders(),
            },
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to delete kid');
          }

          setKids((prev) => {
            const updatedKids = prev.filter((k) => k.kidId !== kid.kidId);
            setCache(CACHE_KEYS.KIDS_PREFERENCES, updatedKids, CACHE_TTL.KIDS_PREFERENCES);
            return updatedKids;
          });

          showAlert('Deleted!', `${kid.name}'s profile has been removed.`, 'success');
        } catch (err) {
          showAlert('Error', err.message || 'Failed to delete kid', 'error');
        }
      },
      'confirm'
    );
  };

  // ---- Helper to render an image card in the prefs wizard ----
  const renderOptionCard = (id, selected) => (
    <button
      key={id}
      type="button"
      onClick={() => togglePreference(id)}
      className={`modal-option-btn modal-option-btn--with-image ${selected ? "selected" : ""}`}
    >
      <div className="modal-option-image-wrapper">
        <img
          src={getImageForPref(id)}
          alt={display(id)}
          className="modal-option-image"
        />
      </div>
      <span className="modal-option-label">{display(id)}</span>
    </button>
  );

  // ---- Custom Alert Modal Component ----
  const AlertModal = () => {
    if (!alertModal.show) return null;

    const getIcon = () => {
      switch (alertModal.type) {
        case 'success':
          return (
            <div className="alert-icon alert-icon-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          );
        case 'error':
          return (
            <div className="alert-icon alert-icon-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          );
        case 'confirm':
          return (
            <div className="alert-icon alert-icon-confirm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          );
        default:
          return (
            <div className="alert-icon alert-icon-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
          );
      }
    };

    return (
      <div className="custom-alert-overlay" onClick={(e) => {
        if (e.target === e.currentTarget && alertModal.onCancel) {
          alertModal.onCancel();
        }
      }}>
        <div className={`custom-alert-container custom-alert-${alertModal.type}`}>
          {getIcon()}
          <h3 className="custom-alert-title">{alertModal.title}</h3>
          <p className="custom-alert-message">{alertModal.message}</p>
          <div className="custom-alert-buttons">
            {alertModal.onCancel && (
              <button
                className="custom-alert-btn custom-alert-btn-cancel"
                onClick={alertModal.onCancel}
              >
                Cancel
              </button>
            )}
            <button
              className={`custom-alert-btn custom-alert-btn-confirm ${alertModal.type === 'confirm' ? 'custom-alert-btn-danger' : ''}`}
              onClick={alertModal.onConfirm}
            >
              {alertModal.type === 'confirm' ? 'Delete' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {loading && <LoadingModal message="Loading your preferences..." />}
      
      {/* Custom Alert Modal */}
      <AlertModal />

      <div className="profile-page">
        {/* Header Banner */}
        <div className="header-banner">
          <div className="banner-decoration"></div>
          <h1>Hello, {name || nameFromEmail(activeUserId)}!</h1>
          <p>Manage your account and personalize your experience</p>
        </div>

        {/* Main Content */}
        <div className="profile-container">
          {/* Left Side - Profile Editor */}
          <div className="profile-editor-card">
            <div className="profile-avatar-section">
              <div className="avatar-wrapper">
                <div className="avatar-circle">
                  <svg className="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <button className="edit-avatar-btn" title="Change avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="profile-form">
              <div className="form-field">
                <svg className="field-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <label>Username</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="form-field">
                <svg className="field-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <label>Email</label>
                <input type="email" value={activeUserId} readOnly />
              </div>

              <div className="form-field">
                <svg className="field-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+63"
                />
              </div>
            </div>

            <button className="save-button" onClick={saveChanges} disabled={saving}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button className="logout-button" onClick={() => showAlert('Logout', 'Hook your logout logic here', 'info')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Logout
            </button>
          </div>

          {/* Right Side - Profile Info & Special Features */}
          <div className="profile-info-section">
            {/* User Info Display */}
            <div className="info-display-card">
              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="info-text">{name || nameFromEmail(activeUserId)}</span>
              </div>

              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="info-text">{activeUserId}</span>
              </div>

              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                <span className="info-text">{phone || '+63'}</span>
              </div>

              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <span className="info-text">••••••••</span>
                <button className="change-password-btn" onClick={() => showAlert('Change Password', 'Hook your change password flow here', 'info')}>
                  Change Password
                </button>
              </div>
            </div>

            {/* Kids Preferences Section */}
            <div className="kids-preferences-card">
              <h3 className="kids-title">Kids' Meal Preferences</h3>

              {loadingKids ? (
                <p className="kids-text">Loading kids…</p>
              ) : kids.length === 0 ? (
                <>
                  <p className="kids-text">
                    Have kids? Add their basic info and food preferences so we can suggest kid-friendly meals that they'll actually eat!
                  </p>
                  <button
                    className="kids-add-button"
                    onClick={() => openKidWizard()}
                  >
                    + Add Kid
                  </button>
                </>
              ) : (
                <>
                  <ul className="kids-list">
                    {kids.map((kid) => (
                      <li key={kid.kidId} className="kids-item">
                        <div className="kids-main">
                          <span className="kids-name">{kid.name}</span>
                          <span className="kids-age">{kid.age} yrs</span>
                          {kid.eatingStyle && (
                            <span className="kids-age" style={{marginLeft: '0.5rem'}}>
                              {kid.eatingStyle === 'picky' ? '🥺 Picky' : kid.eatingStyle === 'adventurous' ? '🌟 Adventurous' : '👍 Normal'}
                            </span>
                          )}
                        </div>
                        <div className="kids-actions">
                          <button
                            className="kids-edit-btn"
                            onClick={() => openKidWizard(kid)}
                          >
                            Edit
                          </button>
                          <button
                            className="kids-delete-btn"
                            onClick={() => deleteKid(kid)}
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="kids-add-button"
                    onClick={() => openKidWizard()}
                  >
                    + Add Another Kid
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Food Preferences - Full Width */}
          <div className="preferences-card">
            <h2>Food Preferences</h2>

            {/* Cuisines Section */}
            <div className="preference-section">
              <h3 className="section-title">Favorite Cuisines</h3>
              <div className="preference-pills">
                {likes.map((pref) => (
                  <div key={pref} className="preference-pill cuisine-pill">
                    <span>{display(pref)}</span>
                    <button
                      className="remove-pref-btn"
                      onClick={() => togglePreference(pref)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {cuisineOptions.filter(opt => !likes.includes(opt)).length > 0 && (
                  <button
                    className="add-pill-btn"
                    onClick={() => openPrefsWizard(1)}
                    title="Add Cuisine"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Dietary Restrictions Section */}
            <div className="preference-section">
              <h3 className="section-title">Dietary Preferences</h3>
              <div className="preference-pills">
                {diets.map((pref) => (
                  <div key={pref} className="preference-pill diet-pill">
                    <span>{display(pref)}</span>
                    <button
                      className="remove-pref-btn"
                      onClick={() => togglePreference(pref)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {dietOptions.filter(opt => !diets.includes(opt)).length > 0 && (
                  <button
                    className="add-pill-btn"
                    onClick={() => openPrefsWizard(3)}
                    title="Add Diet"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Allergens Section */}
            <div className="preference-section">
              <h3 className="section-title">Allergens</h3>
              <div className="preference-pills">
                {allergens.map((pref) => (
                  <div key={pref} className="preference-pill allergen-pill">
                    <span>{display(pref)}</span>
                    <button
                      className="remove-pref-btn"
                      onClick={() => togglePreference(pref)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {allergenOptions.filter(opt => !allergens.includes(opt)).length > 0 && (
                  <button
                    className="add-pill-btn"
                    onClick={() => openPrefsWizard(4)}
                    title="Add Allergen"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Dislikes Section */}
            <div className="preference-section">
              <h3 className="section-title">Dislikes</h3>
              <div className="preference-pills">
                {dislikes.map((pref) => (
                  <div key={pref} className="preference-pill dislike-pill">
                    <span>{display(pref)}</span>
                    <button
                      className="remove-pref-btn"
                      onClick={() => togglePreference(pref)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {dislikeOptions.filter(opt => !dislikes.includes(opt)).length > 0 && (
                  <button
                    className="add-pill-btn"
                    onClick={() => openPrefsWizard(2)}
                    title="Add Dislike"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Favorites Section */}
            <div className="preference-section">
              <h3 className="section-title">Favorites</h3>
              <div className="preference-pills">
                {favorites.map((pref) => (
                  <div key={pref} className="preference-pill favorite-pill">
                    <span>{display(pref)}</span>
                    <button
                      className="remove-pref-btn"
                      onClick={() => togglePreference(pref)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {favoriteOptions.filter(opt => !favorites.includes(opt)).length > 0 && (
                  <button
                    className="add-pill-btn"
                    onClick={() => openPrefsWizard(5)}
                    title="Add Favorite"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Edit Preferences Wizard */}
            {showPrefsWizard && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-shifted">
                <div className="modal-container">
                  <div className="modal-header">
                    <h2 className="modal-title">
                      {prefsStep === 1 && "Edit Favorite Cuisines"}
                      {prefsStep === 2 && "Edit Dislikes"}
                      {prefsStep === 3 && "Edit Dietary Preferences"}
                      {prefsStep === 4 && "Edit Allergens"}
                      {prefsStep === 5 && "Edit Favorites"}
                    </h2>
                    <p className="modal-subtitle">
                      {prefsStep === 1 && "Choose the cuisines you love."}
                      {prefsStep === 2 && "Tell us what to avoid in your meals."}
                      {prefsStep === 3 && "Select diets that fit your lifestyle."}
                      {prefsStep === 4 && "Mark anything that might cause a reaction."}
                      {prefsStep === 5 && "Pick your go-to food categories."}
                    </p>
                  </div>

                  <div className="modal-body">
                    <div className="modal-options-grid">
                      {prefsStep === 1 &&
                        cuisineOptions.map((id) =>
                          renderOptionCard(id, likes.includes(id))
                        )}

                      {prefsStep === 2 &&
                        dislikeOptions.map((id) =>
                          renderOptionCard(id, dislikes.includes(id))
                        )}

                      {prefsStep === 3 &&
                        dietOptions.map((id) =>
                          renderOptionCard(id, diets.includes(id))
                        )}

                      {prefsStep === 4 &&
                        allergenOptions.map((id) =>
                          renderOptionCard(id, allergens.includes(id))
                        )}

                      {prefsStep === 5 &&
                        favoriteOptions.map((id) =>
                          renderOptionCard(id, favorites.includes(id))
                        )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setShowPrefsWizard(false)}
                      className="modal-btn-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await saveChanges();
                        setShowPrefsWizard(false);
                      }}
                      className="modal-btn-save"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Kid Preferences Wizard */}
            {showKidWizard && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-shifted">
                <div className="modal-container modal-kid">
                  <div className="modal-header">
                    <h2 className="modal-title">
                      {editingKidId ? `Edit ${kidName}'s Preferences` : "Add Kid's Meal Preferences"}
                    </h2>
                    <p className="modal-subtitle">
                      {kidStep === 0 && "Tell us about your kid"}
                      {kidStep === 1 && "What are their eating habits?"}
                      {kidStep === 2 && "Any allergies we should know about?"}
                    </p>

                    <div className="modal-steps">
                      {[0, 1, 2].map((step) => (
                        <div
                          key={step}
                          className={`modal-step ${step === kidStep ? "active" : ""}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="modal-body">
                    {/* Step 0: Basic Info */}
                    {kidStep === 0 && (
                      <div className="modal-form-section">
                        <h3 className="modal-section-title">Basic Information</h3>
                        
                        <div className="modal-input-group">
                          <label className="modal-label">
                            Kid's Name <span className="text-red-500">*</span>
                          </label>
                          <div className="modal-input-wrapper">
                            <svg className="modal-input-icon" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            <input
                              type="text"
                              value={kidName}
                              onChange={(e) => setKidName(e.target.value)}
                              className="modal-input"
                              placeholder="e.g. Emma, Lucas, Sophie"
                            />
                          </div>
                        </div>

                        <div className="modal-input-group">
                          <label className="modal-label">
                            Age <span className="text-red-500">*</span>
                          </label>
                          <div className="modal-input-wrapper">
                            <svg className="modal-input-icon" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                            </svg>
                            <input
                              type="number"
                              min="1"
                              max="18"
                              value={kidAge}
                              onChange={(e) => setKidAge(e.target.value)}
                              className="modal-input"
                              placeholder="e.g. 7"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 1: Eating Style & Preferences */}
                    {kidStep === 1 && (
                      <div className="modal-form-section">
                        <div>
                          <h3 className="modal-section-title">
                            How would you describe {kidName || "your kid"}'s eating style?
                          </h3>
                          <div className="eating-style-options">
                            <button
                              type="button"
                              onClick={() => setKidEatingStyle('picky')}
                              className={`eating-style-btn ${kidEatingStyle === 'picky' ? 'selected' : ''}`}
                            >
                              <div className="eating-style-title">🥺 Picky Eater</div>
                              <div className="eating-style-desc">Prefers familiar foods, limited variety</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setKidEatingStyle('normal')}
                              className={`eating-style-btn ${kidEatingStyle === 'normal' ? 'selected' : ''}`}
                            >
                              <div className="eating-style-title">👍 Normal Eater</div>
                              <div className="eating-style-desc">Eats most things, some preferences</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setKidEatingStyle('adventurous')}
                              className={`eating-style-btn ${kidEatingStyle === 'adventurous' ? 'selected' : ''}`}
                            >
                              <div className="eating-style-title">🌟 Adventurous Eater</div>
                              <div className="eating-style-desc">Loves trying new foods and flavors</div>
                            </button>
                          </div>
                        </div>

                        <div className="modal-input-group">
                          <label className="modal-label">
                            Favorite Foods <span className="text-gray-400">(Optional)</span>
                          </label>
                          <textarea
                            value={kidFavoriteFoods}
                            onChange={(e) => setKidFavoriteFoods(e.target.value)}
                            className="modal-textarea"
                            placeholder="e.g. chicken nuggets, pasta, pizza, strawberries"
                            rows="2"
                          />
                        </div>

                        <div className="modal-input-group">
                          <label className="modal-label">
                            Won't Eat / Dislikes <span className="text-gray-400">(Optional)</span>
                          </label>
                          <textarea
                            value={kidWontEat}
                            onChange={(e) => setKidWontEat(e.target.value)}
                            className="modal-textarea"
                            placeholder="e.g. broccoli, fish, spicy foods"
                            rows="2"
                          />
                        </div>

                        <div className="modal-input-group">
                          <label className="modal-label">
                            Additional Notes <span className="text-gray-400">(Optional)</span>
                          </label>
                          <textarea
                            value={kidNotes}
                            onChange={(e) => setKidNotes(e.target.value)}
                            className="modal-textarea"
                            placeholder="e.g. prefers cut-up fruit, doesn't like mixed textures"
                            rows="2"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Allergens */}
                    {kidStep === 2 && (
                      <div className="modal-form-section">
                        <div>
                          <h3 className="modal-section-title">
                            ⚠️ Does {kidName || "your kid"} have any food allergies?
                          </h3>
                          <p className="modal-section-subtitle">
                            This is important for meal safety. Select all that apply.
                          </p>
                          <div className="modal-options-grid allergen-grid">
                            {allergenOptions.map((id) => (
                              <button
                                key={id}
                                type="button"
                                onClick={() => toggleKidAllergen(id)}
                                className={`modal-option-btn modal-option-btn--with-image allergen ${
                                  kidAllergens.includes(id) ? "selected" : ""
                                }`}
                              >
                                <div className="modal-option-image-wrapper">
                                  <img
                                    src={getImageForPref(id)}
                                    alt={display(id)}
                                    className="modal-option-image"
                                  />
                                </div>
                                <span className="modal-option-label">{display(id)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setShowKidWizard(false)}
                      className="modal-btn-cancel"
                      disabled={savingKid}
                    >
                      Cancel
                    </button>

                    <div className="flex gap-2">
                      {kidStep > 0 && (
                        <button
                          type="button"
                          onClick={() => setKidStep((prev) => Math.max(0, prev - 1))}
                          disabled={savingKid}
                          className="modal-btn-back"
                        >
                          Back
                        </button>
                      )}

                      {kidStep < 2 ? (
                        <button
                          type="button"
                          onClick={() => setKidStep((prev) => Math.min(2, prev + 1))}
                          disabled={
                            savingKid ||
                            (kidStep === 0 && (!kidName.trim() || !kidAge.trim()))
                          }
                          className="modal-btn-save"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={saveKid}
                          disabled={savingKid}
                          className="modal-btn-save"
                        >
                          {savingKid ? "Saving…" : "Save Kid"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
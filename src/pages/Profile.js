import React, { useEffect, useMemo, useState } from 'react';
import LoadingModal from '../components/LoadingModal';
import { useAuth } from '../auth/AuthContext';
import './Profile.css';

export default function Profile() {
  // API base configuration (matching Dashboard)
  const API = process.env.REACT_APP_API_BASE || "";
  const { authHeaders } = useAuth();  // ✅ get JWT headers

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

  // ---- Option sets (matching Dashboard.js exactly) ----
  const cuisineOptions   = ['filipino','japanese','italian','korean','chinese','american','thai','mexican','middle-eastern'];
  const dislikeOptions   = ['seafood','spicy','vegetables','meat','dairy','gluten','nuts','eggs'];
  const allergenOptions  = ['peanuts','tree-nuts','eggs','dairy','gluten','soy','fish','shellfish','sesame','corn','sulfites','mustard'];
  const dietOptions      = ['omnivore','vegetarian','vegan','pescetarian','keto','low-carb','halal','kosher','gluten-free'];
  // Note: favorites are not in Dashboard modal, keeping for extra feature
  const favoriteOptions  = ['steak','sushi','pizza','burger','pasta','ramen','tacos','desserts','milk tea', 'coffee', 'fries' , 'chicken', 'salad', 'soup', 'donut', 'brunch'];

  // ---- Label + emoji maps (matching Dashboard labels) ----
  const pretty = {
    // Cuisines
    filipino:'Filipino 🇵🇭', japanese:'Japanese 🍜', italian:'Italian 🍝', korean:'Korean 🍲',
    chinese:'Chinese 🥟', american:'American 🍔', thai:'Thai 🥘', mexican:'Mexican 🌮',
    // Dislikes
    seafood:'Seafood 🦞', spicy:'Spicy Food 🌶️', vegetables:'Vegetables 🥦', meat:'Meat 🥩',
    dairy:'Dairy 🧀', gluten:'Gluten 🌾', nuts:'Tree Nuts/Peanuts 🥜', eggs:'Eggs 🥚',
    // Allergens
    peanuts:'Peanuts 🥜', 'tree-nuts':'Tree Nuts 🌰', soy:'Soy 🫘', fish:'Fish 🐟',
    shellfish:'Shellfish 🦐',
    // Diet types
    omnivore:'Omnivore 🍽️', vegetarian:'Vegetarian 🥗', vegan:'Vegan 🌱', pescetarian:'Pescetarian 🐟',
    keto:'Keto 🥓', 'low-carb':'Low Carb 📉', halal:'Halal ☪️', kosher:'Kosher ✡️',
    // Favorites (extra feature)
    steak:'Steak 🥩', sushi:'Sushi 🍣', pizza:'Pizza 🍕', burger:'Burger 🍔',
    pasta:'Pasta 🍝', ramen:'Ramen 🍜', tacos:'Tacos 🌮', desserts:'Desserts 🍰'
  };
  const display = (id) => pretty[id] || id;

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
  const [kidStep, setKidStep] = useState(0); // 0 = name & age, 1..4 = prefs

  const [editingKidId, setEditingKidId] = useState(null);
  const [kidName, setKidName] = useState('');
  const [kidAge, setKidAge] = useState('');

  const [kidLikes, setKidLikes] = useState([]);
  const [kidDislikes, setKidDislikes] = useState([]);
  const [kidDiets, setKidDiets] = useState([]);
  const [kidAllergens, setKidAllergens] = useState([]);
  const [kidFavorites, setKidFavorites] = useState([]);

  const [savingKid, setSavingKid] = useState(false);

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Old small modal is replaced by big wizard
  const [showPrefsWizard, setShowPrefsWizard] = useState(false);
  const [prefsStep, setPrefsStep] = useState(1); // 1..4 like onboarding

    const openPrefsWizard = (startStep = 1) => {
    setPrefsStep(startStep);
    setShowPrefsWizard(true);
  };


  // Combine all preferences for display
  const allSelectedPreferences = [...likes, ...dislikes, ...favorites, ...allergens, ...diets];

  // All available options for adding
  const allAvailableOptions = [
    ...cuisineOptions, ...dislikeOptions, ...favoriteOptions, ...allergenOptions, ...dietOptions
  ];

  // ---- Load preferences on mount ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API}/api/preferences/me`, {
          headers: {
            ...authHeaders(),   // ✅ adds Authorization: Bearer <token>
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

        // If server ever stores name, you could hydrate it here (optional):
        // if (data.profile?.name) setName(data.profile.name);

      } catch (e) {
        if (!cancelled) setError(e.message || 'Load error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeUserId]);

  // ---- Load kids preferences ----
useEffect(() => {
  let cancelled = false;

  const loadKids = async () => {
    setLoadingKids(true);
    try {
      const res = await fetch(`${API}/api/preferences/kids`, {
        headers: {
          ...authHeaders(),
        },
      });

      if (!res.ok) throw new Error('Failed to load kids');
      const data = await res.json();

      if (!cancelled && data.success) {
        setKids(Array.isArray(data.kids) ? data.kids : []);
      }
    } catch (err) {
      console.error('Error loading kids', err);
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
    // Remove from all arrays first
    setLikes(prev => prev.filter(v => v !== id));
    setDislikes(prev => prev.filter(v => v !== id));
    setFavorites(prev => prev.filter(v => v !== id));
    setAllergens(prev => prev.filter(v => v !== id));
    setDiets(prev => prev.filter(v => v !== id));

    // If not currently selected anywhere, add to appropriate list
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
      // 1) Save preferences to backend
      const payload = {
        likes,        // cuisines
        dislikes,     // foods to avoid
        diets,        // dietary restrictions
        allergens,    // allergen restrictions
        favorites,    // favorite dishes
        kiddieMeal,   // kiddie meal mode
        onboardingDone: true
      };

      const res = await fetch(`${API}/api/preferences/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),   // ✅ adds Authorization: Bearer <token>
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Save failed');
      }

      // 2) Save profile fields locally (name/phone)
      try {
        localStorage.setItem('pap:activeUserName', name || nameFromEmail(activeUserId));
        localStorage.setItem('pap:profile:phone', phone || '+63');
      } catch {}

      alert('Profile saved successfully!');
    } catch (e) {
      setError(e.message || 'Save error');
    } finally {
      setSaving(false);
    }
  };

      // Open wizard for new or existing kid
    const openKidWizard = (kid = null) => {
      if (kid) {
        setEditingKidId(kid.kidId);
        setKidName(kid.name || '');
        setKidAge(kid.age != null ? String(kid.age) : '');
        setKidLikes(kid.likes || []);
        setKidDislikes(kid.dislikes || []);
        setKidDiets(kid.diets || []);
        setKidAllergens(kid.allergens || []);
        setKidFavorites(kid.favorites || []);
      } else {
        setEditingKidId(null);
        setKidName('');
        setKidAge('');
        setKidLikes([]);
        setKidDislikes([]);
        setKidDiets([]);
        setKidAllergens([]);
        setKidFavorites([]);
      }
      setKidStep(0);
      setShowKidWizard(true);
    };

    const toggleKidPref = (id, type) => {
      const toggle = (setter) =>
        setter((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

      if (type === 'cuisine') toggle(setKidLikes);
      else if (type === 'dislike') toggle(setKidDislikes);
      else if (type === 'diet') toggle(setKidDiets);
      else if (type === 'allergen') toggle(setKidAllergens);
      else if (type === 'favorite') toggle(setKidFavorites);
    };

    const saveKid = async () => {
      setSavingKid(true);
      try {
        const payload = {
          kidId: editingKidId,
          name: kidName.trim(),
          age: Number(kidAge),
          likes: kidLikes,
          dislikes: kidDislikes,
          diets: kidDiets,
          allergens: kidAllergens,
          favorites: kidFavorites,
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

        // Update kids list locally
        setKids((prev) => {
          const without = prev.filter((k) => k.kidId !== data.kid.kidId);
          return [...without, data.kid];
        });

        setShowKidWizard(false);
      } catch (err) {
        alert(err.message || 'Failed to save kid');
      } finally {
        setSavingKid(false);
      }
    };


  return (
    <>
      {loading && <LoadingModal message="Loading your preferences..." />}

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
              {/* Email is your unique userId; keep read-only to avoid breaking the key used in DB */}
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

          <button className="logout-button" onClick={() => alert('Hook your logout logic here')}>
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
              <button className="change-password-btn" onClick={() => alert('Hook your change password flow here')}>
                Change Password
              </button>
            </div>
          </div>

          {/* Special Features */}
          <div className="special-features-card">
            <h2>Special Features</h2>
            <div className="kiddie-meal-toggle">
              <label className="toggle-container">
                <input
                  type="checkbox"
                  checked={kiddieMeal}
                  onChange={(e) => setKiddieMeal(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Kiddie Meal Mode
                </span>
              </label>
              <p className="feature-description">Enable kid-friendly meal suggestions and portions</p>
            </div>
          </div>

                  {/* 🧒 Kids Preferences Section (3.4 goes here) */}
          <div className="kids-preferences-card">
            <h3 className="kids-title">Kids’ Preferences</h3>

            {loadingKids ? (
              <p className="kids-text">Loading kids…</p>
            ) : kids.length === 0 ? (
              <>
                <p className="kids-text">
                  You currently have no preferences for your kids. Want to add your kids?
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
                      </div>
                      <button
                        className="kids-edit-btn"
                        onClick={() => openKidWizard(kid)}
                      >
                        Edit
                      </button>
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
        </div>

        {/* Food Preferences - Full Width */}
        <div className="preferences-card">
          <h2>Food Preferences</h2>

          {/* Cuisines Section */}
          <div className="preference-section">
            <h3 className="section-title">🍽️ Favorite Cuisines</h3>
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
                  onClick={() => openPrefsWizard(1)} // Step 1 = cuisines
                  title="Add Cuisine"
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          {/* Dietary Restrictions Section */}
          <div className="preference-section">
            <h3 className="section-title">🥗 Dietary Preferences</h3>
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
                  onClick={() => openPrefsWizard(3)} // Step 3 = diet
                  title="Add Diet"
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          {/* Allergens Section */}
          <div className="preference-section">
            <h3 className="section-title">⚠️ Allergens</h3>
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
                  onClick={() => openPrefsWizard(4)} // Step 4 = allergens
                  title="Add Allergen"
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          {/* Dislikes Section */}
          <div className="preference-section">
            <h3 className="section-title">👎 Dislikes</h3>
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
                  onClick={() => openPrefsWizard(2)} // Step 2 = dislikes
                  title="Add Dislike"
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          {/* Favorites Section */}
          <div className="preference-section">
            <h3 className="section-title">⭐ Favorites</h3>
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

{/* Edit Preferences Wizard (single-page per section) */}
{showPrefsWizard && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-1">
          {prefsStep === 1 && "Edit Favorite Cuisines"}
          {prefsStep === 2 && "Edit Dislikes"}
          {prefsStep === 3 && "Edit Dietary Preferences"}
          {prefsStep === 4 && "Edit Allergens"}
          {prefsStep === 5 && "Edit Favorites"}
        </h2>
        <p className="text-yellow-50 text-sm">
          {prefsStep === 1 && "Choose the cuisines you love."}
          {prefsStep === 2 && "Tell us what to avoid in your meals."}
          {prefsStep === 3 && "Select diets that fit your lifestyle."}
          {prefsStep === 4 && "Mark anything that might cause a reaction."}
          {prefsStep === 5 && "Pick your go-to food categories."}
        </p>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Cuisines */}
          {prefsStep === 1 &&
            cuisineOptions.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => togglePreference(id)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium text-left transition-all ${
                  likes.includes(id)
                    ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {display(id)}
              </button>
            ))}

          {/* Dislikes */}
          {prefsStep === 2 &&
            dislikeOptions.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => togglePreference(id)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium text-left transition-all ${
                  dislikes.includes(id)
                    ? "bg-red-100 border-red-400 text-red-800"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {display(id)}
              </button>
            ))}

          {/* Diets */}
          {prefsStep === 3 &&
            dietOptions.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => togglePreference(id)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium text-left transition-all ${
                  diets.includes(id)
                    ? "bg-green-100 border-green-500 text-green-800"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {display(id)}
              </button>
            ))}

          {/* Allergens */}
          {prefsStep === 4 &&
            allergenOptions.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => togglePreference(id)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium text-left transition-all ${
                  allergens.includes(id)
                    ? "bg-red-100 border-red-500 text-red-800"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {display(id)}
              </button>
            ))}

          {/* Favorites (new page) */}
          {prefsStep === 5 &&
            favoriteOptions.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => togglePreference(id)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium text-left transition-all ${
                  favorites.includes(id)
                    ? "bg-purple-100 border-purple-400 text-purple-800"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {display(id)}
              </button>
            ))}
        </div>
      </div>

      {/* Footer buttons: only Cancel + Save */}
      <div className="bg-gray-50 p-4 flex items-center justify-end border-t">
        <button
          type="button"
          onClick={() => setShowPrefsWizard(false)}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 mr-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={async () => {
            await saveChanges();    // PUT /api/preferences/me
            setShowPrefsWizard(false);
          }}
          className="px-6 py-2 text-sm font-semibold rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white shadow-md"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

{/* Kid Preferences Wizard */}
{showKidWizard && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-1">
          {editingKidId ? "Edit Kid's Preferences" : "Add Kid Preferences"}
        </h2>
        <p className="text-yellow-50 text-sm">
          We’ll use this to suggest kid-friendly meals.
        </p>

        {/* Steps 0–4 indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[0, 1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                step === kidStep ? "w-8 bg-white" : "w-2 bg-yellow-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto flex-1">
        {/* Step 0: name + age */}
        {kidStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Let’s meet your kid!
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kid’s name
              </label>
              <input
                type="text"
                value={kidName}
                onChange={(e) => setKidName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="e.g. Lucas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                min="1"
                max="18"
                value={kidAge}
                onChange={(e) => setKidAge(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="e.g. 7"
              />
            </div>
          </div>
        )}

        {/* Step 1: cuisines */}
        {kidStep === 1 && (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              What cuisines does {kidName || 'your kid'} like?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {cuisineOptions.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleKidPref(id, 'cuisine')}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium text-left transition-all ${
                    kidLikes.includes(id)
                      ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {display(id)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: dislikes */}
        {kidStep === 2 && (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Anything {kidName || 'your kid'} dislikes or refuses to eat?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dislikeOptions.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleKidPref(id, 'dislike')}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium text-left transition-all ${
                    kidDislikes.includes(id)
                      ? "bg-red-100 border-red-400 text-red-800"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {display(id)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 3: diet */}
        {kidStep === 3 && (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Any diet we should follow for {kidName || 'your kid'}?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dietOptions.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleKidPref(id, 'diet')}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium text-left transition-all ${
                    kidDiets.includes(id)
                      ? "bg-green-100 border-green-500 text-green-800"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {display(id)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 4: allergens */}
        {kidStep === 4 && (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Any allergens we must avoid?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allergenOptions.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleKidPref(id, 'allergen')}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium text-left transition-all ${
                    kidAllergens.includes(id)
                      ? "bg-red-100 border-red-500 text-red-800"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {display(id)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-4 flex items-center justify-between border-t">
        <button
          type="button"
          onClick={() => setShowKidWizard(false)}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          disabled={savingKid}
        >
          Cancel
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setKidStep((prev) => Math.max(0, prev - 1))}
            disabled={kidStep === 0 || savingKid}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 text-gray-700 disabled:opacity-40"
          >
            Back
          </button>

          {kidStep < 4 ? (
            <button
              type="button"
              onClick={() => setKidStep((prev) => Math.min(4, prev + 1))}
              disabled={
                savingKid ||
                (kidStep === 0 && (!kidName.trim() || !kidAge.trim()))
              }
              className="px-6 py-2 text-sm font-semibold rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white shadow-md disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={saveKid}
              disabled={savingKid}
              className="px-6 py-2 text-sm font-semibold rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white shadow-md disabled:opacity-50"
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
    </>
  );
}
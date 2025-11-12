import React, { useEffect, useMemo, useState } from 'react';
import './Profile.css';

export default function Profile() {
  // API base configuration (matching Dashboard)
  const API = process.env.REACT_APP_API_BASE || "";

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
  const cuisineOptions   = ['filipino','japanese','italian','korean','chinese','american','thai','mexican'];
  const dislikeOptions   = ['seafood','spicy','vegetables','meat','dairy','gluten','nuts','eggs'];
  const allergenOptions  = ['peanuts','tree-nuts','eggs','dairy','gluten','soy','fish','shellfish'];
  const dietOptions      = ['omnivore','vegetarian','vegan','pescetarian','keto','low-carb','halal','kosher'];
  // Note: favorites are not in Dashboard modal, keeping for extra feature
  const favoriteOptions  = ['steak','sushi','pizza','burger','pasta','ramen','tacos','desserts'];

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

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddPreferences, setShowAddPreferences] = useState(false);

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
          headers: { 'x-user-id': activeUserId }
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
        userId: activeUserId,
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
          'x-user-id': activeUserId
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

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">Loading your profile...</div>
      </div>
    );
  }

  return (
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

        {/* Right Side - Profile Info & Preferences */}
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

          {/* Food Preferences */}
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
                    onClick={() => setShowAddPreferences('cuisine')}
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
                    onClick={() => setShowAddPreferences('diet')}
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
                    onClick={() => setShowAddPreferences('allergen')}
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
                    onClick={() => setShowAddPreferences('dislike')}
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
                    onClick={() => setShowAddPreferences('favorite')}
                    title="Add Favorite"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Add Preferences Modal */}
            {showAddPreferences && (
              <div className="add-preferences-modal">
                <div className="modal-backdrop" onClick={() => setShowAddPreferences(false)}></div>
                <div className="modal-content">
                  <div className="modal-header">
                    <h3>
                      {showAddPreferences === 'cuisine' && '🍽️ Add Cuisine'}
                      {showAddPreferences === 'diet' && '🥗 Add Dietary Preference'}
                      {showAddPreferences === 'allergen' && '⚠️ Add Allergen'}
                      {showAddPreferences === 'dislike' && '👎 Add Dislike'}
                      {showAddPreferences === 'favorite' && '⭐ Add Favorite'}
                    </h3>
                    <button
                      className="close-modal-btn"
                      onClick={() => setShowAddPreferences(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="modal-options">
                    {showAddPreferences === 'cuisine' && cuisineOptions
                      .filter(opt => !likes.includes(opt))
                      .map((opt) => (
                        <button
                          key={opt}
                          className="option-btn"
                          onClick={() => {
                            togglePreference(opt);
                            setShowAddPreferences(false);
                          }}
                        >
                          {display(opt)}
                        </button>
                      ))}
                    {showAddPreferences === 'diet' && dietOptions
                      .filter(opt => !diets.includes(opt))
                      .map((opt) => (
                        <button
                          key={opt}
                          className="option-btn"
                          onClick={() => {
                            togglePreference(opt);
                            setShowAddPreferences(false);
                          }}
                        >
                          {display(opt)}
                        </button>
                      ))}
                    {showAddPreferences === 'allergen' && allergenOptions
                      .filter(opt => !allergens.includes(opt))
                      .map((opt) => (
                        <button
                          key={opt}
                          className="option-btn"
                          onClick={() => {
                            togglePreference(opt);
                            setShowAddPreferences(false);
                          }}
                        >
                          {display(opt)}
                        </button>
                      ))}
                    {showAddPreferences === 'dislike' && dislikeOptions
                      .filter(opt => !dislikes.includes(opt))
                      .map((opt) => (
                        <button
                          key={opt}
                          className="option-btn"
                          onClick={() => {
                            togglePreference(opt);
                            setShowAddPreferences(false);
                          }}
                        >
                          {display(opt)}
                        </button>
                      ))}
                    {showAddPreferences === 'favorite' && favoriteOptions
                      .filter(opt => !favorites.includes(opt))
                      .map((opt) => (
                        <button
                          key={opt}
                          className="option-btn"
                          onClick={() => {
                            togglePreference(opt);
                            setShowAddPreferences(false);
                          }}
                        >
                          {display(opt)}
                        </button>
                      ))}
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
    </div>
  );
}

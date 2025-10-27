import React, { useEffect, useMemo, useState } from 'react';
import './Profile.css';

export default function Profile() {
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

  // ---- Option sets ----
  const cuisineOptions   = ['filipino','japanese','italian','korean','chinese','american','thai','mexican'];
  const dislikeOptions   = ['seafood','spicy','vegetables','meat','dairy','gluten','nuts','eggs'];
  const favoriteOptions  = ['steak','sushi','pizza','burger','pasta','ramen','tacos','desserts'];
  const allergenOptions  = ['peanuts','tree-nuts','eggs','dairy','gluten','soy','fish','shellfish'];
  const dietOptions      = ['omnivore','vegetarian','vegan','pescetarian','keto','low-carb','halal','kosher'];

  // ---- Label + emoji maps ----
  const pretty = {
    filipino:'Filipino 🇵🇭', japanese:'Japanese 🍜', italian:'Italian 🍝', korean:'Korean 🍲',
    chinese:'Chinese 🥟', american:'American 🍔', thai:'Thai 🥘', mexican:'Mexican 🌮',
    seafood:'Seafood 🦞', spicy:'Spicy 🌶️', vegetables:'Vegetables 🥦', meat:'Meat 🥩',
    dairy:'Dairy 🧀', gluten:'Gluten/Wheat 🌾', nuts:'Tree Nuts/Peanuts 🥜', 'tree-nuts':'Tree Nuts 🥜',
    eggs:'Eggs 🥚', soy:'Soy 🫘', fish:'Fish 🐟', shellfish:'Shellfish 🦐',
    steak:'Steak 🥩', sushi:'Sushi 🍣', pizza:'Pizza 🍕', burger:'Burger 🍔',
    pasta:'Pasta 🍝', ramen:'Ramen 🍜', tacos:'Tacos 🌮', desserts:'Desserts 🍰',
    omnivore:'Omnivore 🍽️', vegetarian:'Vegetarian 🥗', vegan:'Vegan 🌱', pescetarian:'Pescetarian 🐟',
    keto:'Keto 🥓', 'low-carb':'Low Carb 📉', halal:'Halal ☪️', kosher:'Kosher ✡️'
  };
  const display = (id) => pretty[id] || id;

  // ---- Server data ----
  const [likes, setLikes] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [diets, setDiets] = useState([]);

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
        const res = await fetch('/api/preferences/me', {
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
        likes, dislikes, favorites, allergens, diets,
        onboardingDone: true
      };
      const res = await fetch('/api/preferences/me', {
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

          {/* Food Preferences */}
          <div className="preferences-card">
            <h2>Food Preferences</h2>

            <div className="preferences-list">
              {allSelectedPreferences.length === 0 ? (
                <p className="no-preferences">No preferences selected yet</p>
              ) : (
                allSelectedPreferences.map((pref) => (
                  <div key={pref} className="preference-pill">
                    <span>{display(pref)}</span>
                    <button
                      className="remove-pref-btn"
                      onClick={() => togglePreference(pref)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              className="add-preferences-btn"
              onClick={() => setShowAddPreferences(!showAddPreferences)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Preferences
            </button>

            {/* Add Preferences Dropdown */}
            {showAddPreferences && (
              <div className="add-preferences-dropdown">
                <div className="dropdown-header">
                  <h3>Select Preferences</h3>
                  <button
                    className="close-dropdown-btn"
                    onClick={() => setShowAddPreferences(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="dropdown-options">
                  {allAvailableOptions
                    .filter(opt => !allSelectedPreferences.includes(opt))
                    .map((opt) => (
                      <button
                        key={opt}
                        className="add-option-btn"
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

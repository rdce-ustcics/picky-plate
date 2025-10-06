import React, { useState } from 'react';
import './Profile.css';

function Profile() {
  const [preferences, setPreferences] = useState(['Vegetarian', 'Meat', 'Fastfood']);

  return (
    <div className="profile-page">
      {/* Header Banner */}
      <div className="header-banner">
        <div className="circle-decoration circle-1"></div>
        <div className="circle-decoration circle-2"></div>
        <h1>Hello, Username!</h1>
        <p>Manage your account and personalize your experience</p>
      </div>

      <div className="profile-content">
        {/* Left Section - Profile Info */}
        <div className="profile-card">
          <div className="profile-center">
            {/* Profile Picture */}
            <div className="profile-picture-wrapper">
              <div className="profile-picture">
                <div className="profile-icon"></div>
              </div>
              <div className="edit-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="profile-fields-list">
              <div className="profile-field-item">
                <svg className="field-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>Username</span>
              </div>

              <div className="profile-field-item">
                <svg className="field-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>Email</span>
              </div>

              <div className="profile-field-item">
                <svg className="field-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span>Phone Number</span>
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          <button className="save-button">Save Changes</button>

          {/* Logout Link */}
          <div className="logout-wrapper">
            <button className="logout-link">Logout</button>
          </div>
        </div>

        {/* Right Section - Account Details & Food Preferences */}
        <div className="right-section">
          {/* Account Details Card */}
          <div className="account-details-card">
            <div className="account-field">
              <svg className="field-icon-large" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>Username</span>
            </div>

            <div className="account-field">
              <svg className="field-icon-large" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span>Username@gmail.com</span>
            </div>

            <div className="account-field">
              <svg className="field-icon-large" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span>+63</span>
            </div>

            <div className="account-field password-field">
              <div className="password-content">
                <svg className="field-icon-large" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>••••••••</span>
              </div>
              <button className="change-password-link">Change Password</button>
            </div>
          </div>

          {/* Food Preferences Card */}
          <div className="food-preferences-card">
            <h2>Food Preferences</h2>
            <div className="preferences-list">
              {preferences.map((pref, index) => (
                <input
                  key={index}
                  type="text"
                  value={pref}
                  onChange={(e) => {
                    const newPrefs = [...preferences];
                    newPrefs[index] = e.target.value;
                    setPreferences(newPrefs);
                  }}
                  className="preference-input"
                />
              ))}
              <button className="add-preferences-button">
                <span className="plus-icon">+</span>
                <span>Add Preferences</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
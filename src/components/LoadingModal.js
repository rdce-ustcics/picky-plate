// src/components/LoadingModal.js
import React from 'react';
import './LoadingModal.css';

const LoadingModal = ({ message = "Loading restaurant data...", isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <div className="loading-modal-overlay">
      <div className="loading-spinner">
        {/* Animated concentric rings */}
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>

        {/* Logo in the center of the spinner */}
        <img
          src="/images/picklogo.png"
          alt="Pick-A-Plate Logo"
          className="spinner-logo"
        />
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingModal;
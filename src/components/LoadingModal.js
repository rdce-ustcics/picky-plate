// src/components/LoadingModal.js
import React from 'react';
import './LoadingModal.css';

const LoadingModal = ({ message = "Loading..." }) => {
  return (
    <div className="loading-modal-overlay">
      <div className="loading-modal-content">
        <div className="loading-spinner">
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
    </div>
  );
};

export default LoadingModal;
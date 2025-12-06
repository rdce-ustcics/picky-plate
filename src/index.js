import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide splash screen after React mounts
if (typeof window.hideSplash === 'function') {
  // Small delay to ensure content is painted
  requestAnimationFrame(() => {
    setTimeout(window.hideSplash, 100);
  });
}
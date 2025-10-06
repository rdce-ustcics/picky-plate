import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './auth/AuthContext';  // Import AuthContext

// Create the root element and render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AuthProvider>  {/* Wrap the entire app with AuthProvider */}
        <App />
    </AuthProvider>
);

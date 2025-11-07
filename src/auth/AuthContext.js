import React, { createContext, useState, useContext, useEffect } from 'react';
import { clearChatCache, clearSessionId } from '../utils/session';

const AuthContext = createContext();
const API_URL = 'http://localhost:4000/api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check local storage for token and user data on load
  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      const u = localStorage.getItem('user');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u)); // Parse the user data from localStorage
      }
    } catch {}
    setLoading(false);
  }, []);

  // Login function now respects 'UNVERIFIED' status from the API
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.code === 'UNVERIFIED') {
          // tell caller to redirect to OTP screen
          return { success: false, needsVerification: true, email: data.email, message: data.message };
        }
        return { success: false, message: data?.message || 'Login failed' };
      }

      // Save token and user in localStorage on successful login
      try {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Save user data to localStorage
      } catch {}
      setToken(data.token);
      setUser(data.user);

      // Clear any anonymous chat session
      clearSessionId();
      clearChatCache();

      return { success: true, message: data.message, user: data.user, token: data.token };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  // Signup function (no token/user storage, OTP verification is required first)
  const signup = async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        return { success: false, message: data?.message || 'Signup failed' };
      }
      // No token or user set here; requires OTP verification first
      return { success: true, message: data.message, email };
    } catch (e) {
      console.error('Signup error:', e);
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  // Logout function, clearing session and user data
  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    setToken(null);
    setUser(null);
    clearChatCache();
    clearSessionId();
  };

  // Check if the user is authenticated based on token and user data
  const isAuthenticated = !!token && !!user;

  // Return headers with the token for API requests if authenticated
  const authHeaders = () => (isAuthenticated ? { Authorization: `Bearer ${token}` } : {});

  // Check if the user is an admin (based on their role)
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated, isAdmin, loading, authHeaders }}>
      {loading ? <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

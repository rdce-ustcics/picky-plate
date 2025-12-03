import React, { createContext, useState, useContext, useEffect } from 'react';
import { clearChatCache, clearSessionId } from '../utils/session';

const AuthContext = createContext();
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const API_URL = `${API_BASE}/api/auth`;

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

      // Save token, user, and active user id (for preferences) on successful login
      try {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Save user data to localStorage

        // 🔑 This is the ID we'll use for UserPreferences.userId
        const userIdForPrefs =
          data?.user?._id || data?.user?.id || data?.user?.email || '';

        if (userIdForPrefs) {
          localStorage.setItem('pap:activeUserId', userIdForPrefs);
        }
      } catch {}

      setToken(data.token);
      setUser(data.user);

      // Clear any anonymous chat session
      clearSessionId();
      clearChatCache();

      return { success: true, message: data.message, user: data.user, token: data.token };
    } catch (e) {
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

  // Password Reset Functions
  const requestResetOtp = async (email) => {
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data?.message || 'Failed to send OTP' };
      }

      return {
        success: true,
        message: data.message,
        length: data.length,
        ttlMin: data.ttlMin,
        cooldownSec: data.cooldownSec
      };
    } catch (e) {
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  const verifyResetOtp = async (email, otp) => {
    try {
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, purpose: 'password-reset' }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data?.message || 'Invalid OTP' };
      }

      return {
        success: true,
        message: data.message,
        resetToken: otp, // Use OTP as token for password reset
        allowPasswordReset: data.allowPasswordReset
      };
    } catch (e) {
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  const changePasswordWithToken = async (token, newPassword) => {
    try {
      // Extract email from localStorage (should be set during forgot password flow)
      const email = localStorage.getItem('pap:resetEmail') || '';

      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword, otp: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data?.message || 'Failed to reset password' };
      }

      // Clear reset email from localStorage
      try {
        localStorage.removeItem('pap:resetEmail');
      } catch {}

      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      signup,
      logout,
      isAuthenticated,
      isAdmin,
      loading,
      authHeaders,
      requestResetOtp,
      verifyResetOtp,
      changePasswordWithToken
    }}>
      {loading ? <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

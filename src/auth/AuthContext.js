import React, { createContext, useState, useContext, useEffect } from 'react';
import { clearChatCache, clearSessionId } from '../utils/session';

const AuthContext = createContext();
const API_URL = 'http://localhost:4000/api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      const u = localStorage.getItem('user');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
    } catch {}
    setLoading(false);
  }, []);

  // ⬇️ LOGIN now respects UNVERIFIED from API
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

      // success
      try {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch {}
      setToken(data.token);
      setUser(data.user);

      // clear any anon chat session
      clearSessionId();
      clearChatCache();

      return { success: true, message: data.message, user: data.user, token: data.token };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  // ⬇️ SIGNUP no longer stores token/user; OTP is required first
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
      // Do NOT set token/user here
      return { success: true, message: data.message, email };
    } catch (e) {
      console.error('Signup error:', e);
      return { success: false, message: 'Unable to connect to server' };
    }
  };

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

  const isAuthenticated = !!token && !!user;
  const authHeaders = () => (isAuthenticated ? { Authorization: `Bearer ${token}` } : {});

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated, loading, authHeaders }}>
      {loading ? <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

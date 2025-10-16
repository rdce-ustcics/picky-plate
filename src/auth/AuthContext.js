import React, { createContext, useState, useContext, useEffect } from 'react';
import { clearChatCache, clearSessionId } from '../utils/session';

const AuthContext = createContext();

const API_URL = 'http://localhost:4000/api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        clearSessionId();
        clearChatCache();
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    clearChatCache();  // remove pp_chats / pp_active
    clearSessionId();  // remove pp_session (a new anon id will be created next time ChatBot needs one)
  };

  const isAuthenticated = !!token && !!user;
  const authHeaders = () => 
     isAuthenticated ? { Authorization: `Bearer ${token}` } : {};

  console.log('Auth State:', { isAuthenticated, user, token: !!token }); // DEBUG

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      login, 
      signup, 
      logout, 
      isAuthenticated, 
      loading,
      authHeaders,
    }}>
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          Loading...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
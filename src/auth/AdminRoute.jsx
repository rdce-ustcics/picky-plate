import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  
  if (loading) return null; // You can add a loading spinner here
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />; // Redirect if not an admin

  return children;
}

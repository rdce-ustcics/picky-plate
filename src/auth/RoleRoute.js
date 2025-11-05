// src/auth/RoleRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RoleRoute({ allow = ["user", "admin"], children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allow.length && !allow.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export function GuestOnlyRoute({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (token && user) return <Navigate to="/" replace />;
  return children;
}

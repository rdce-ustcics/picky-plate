import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RoleRoute({ allow = ["user", "admin"], children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const loc = useLocation();

  // Wait for auth bootstrap so we don't flash redirects
  if (loading) return null; // or a spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  
  // Get role from user object
  const role = user?.role;
  
  if (!allow.includes(role)) {
    return <Navigate to="/profile" replace />;
  }
  
  return children;
}

export function GuestOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Wait for auth to initialize
  if (loading) return null;
  
  // If authenticated, redirect to dashboard
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}
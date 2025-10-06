import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RoleRoute({ allow = ["user","admin"], children }) {
  const { isAuthenticated, role, bootstrapped } = useAuth();
  const loc = useLocation();

  // Wait for auth bootstrap so we don't flash redirects
  if (!bootstrapped) return null; // or a spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  if (!allow.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }
  return children;
}

export function GuestOnlyRoute({ children }) {
  const { isAuthenticated, bootstrapped } = useAuth();
  if (!bootstrapped) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

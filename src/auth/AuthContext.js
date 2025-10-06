import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    (async () => {
      try { const { user } = await api('/api/auth/me'); setUser(user); } catch {}
      setBootstrapped(true);
    })();
  }, []);

  const login = async (email, password) => {
    const { user } = await api('/api/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
    setUser(user);
  };
  const register = async (name, email, password) => {
    const { user } = await api('/api/auth/register', { method:'POST', body: JSON.stringify({ name, email, password }) });
    setUser(user);
  };
  const logout = async () => { await api('/api/auth/logout', { method: 'POST' }); setUser(null); };

  const value = useMemo(() => ({
    user, isAuthenticated: !!user, role: user?.role || 'guest', bootstrapped, login, register, logout
  }), [user, bootstrapped]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/cyberShieldApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("cybershield.user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("cybershield.access");
    if (!token || user) return;
    setLoading(true);
    authService
      .me()
      .then((profile) => {
        setUser(profile);
        localStorage.setItem("cybershield.user", JSON.stringify(profile));
      })
      .catch(() => {
        // The api client's 401 handler already cleared storage and fired
        // cybershield:session-expired if the token was invalid/unrefreshable.
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    // Fired by the api client when a 401 can't be recovered by refreshing
    // (expired/blacklisted refresh token, or no refresh token at all). Without
    // this, isAuthenticated stays true off the stale cached user and the app
    // keeps rendering the authenticated shell against a dead session.
    function handleSessionExpired() {
      setUser(null);
    }
    window.addEventListener("cybershield:session-expired", handleSessionExpired);
    return () => window.removeEventListener("cybershield:session-expired", handleSessionExpired);
  }, []);

  async function login(credentials) {
    setLoading(true);
    try {
      const payload = await authService.login(credentials);
      localStorage.setItem("cybershield.access", payload.access);
      localStorage.setItem("cybershield.refresh", payload.refresh);
      localStorage.setItem("cybershield.user", JSON.stringify(payload.user));
      setUser(payload.user);
      return payload.user;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      return await authService.register(payload);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const refresh = localStorage.getItem("cybershield.refresh");
    await authService.logout(refresh);
    localStorage.removeItem("cybershield.access");
    localStorage.removeItem("cybershield.refresh");
    localStorage.removeItem("cybershield.user");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      role: user?.role?.code,
      isAuthenticated: Boolean(user),
      login,
      logout,
      register,
      setUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

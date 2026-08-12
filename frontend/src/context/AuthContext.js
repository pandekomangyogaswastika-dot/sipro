import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setAuthToken, TOKEN_KEY } from "@/services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthToken(token);
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setAuthToken(res.data.access_token);
    setUser(res.data.data);
    return res.data.data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    setAuthToken(null);
    setUser(null);
  }, []);

  // EPIC M4 — super_admin org switch: swap the access token for one carrying the
  // target org context, then hard-reload so every page refetches under that tenant.
  const switchOrg = useCallback(async (orgId) => {
    const res = await api.post(`/admin/orgs/${orgId}/switch`);
    setAuthToken(res.data.access_token);
    window.location.assign("/");
    return res.data.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchOrg, refresh: bootstrap }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthHeaders } from "../api/client";
import { AUTH_STORAGE_KEY } from "../constants/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [tenant, setTenant] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setToken(parsed.token || "");
      setTenant(parsed.tenant || null);
      setUser(parsed.user || null);
      setAuthHeaders({ token: parsed.token || "", tenantSlug: parsed.tenant?.slug || "" });
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    setAuthHeaders({ token, tenantSlug: tenant?.slug });
  }, [token, tenant]);

  const saveSession = ({ token: newToken, tenant: newTenant, user: newUser }) => {
    setToken(newToken);
    setTenant(newTenant);
    setUser(newUser);
    setAuthHeaders({ token: newToken, tenantSlug: newTenant?.slug || "" });
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: newToken, tenant: newTenant, user: newUser })
    );
  };

  const logout = () => {
    setToken("");
    setTenant(null);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthHeaders({ token: "", tenantSlug: "" });
  };

  const value = useMemo(
    () => ({ token, tenant, user, saveSession, logout, api }),
    [token, tenant, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
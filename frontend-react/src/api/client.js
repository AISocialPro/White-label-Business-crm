import axios from "axios";
import { AUTH_STORAGE_KEY } from "../constants/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000"
});

api.interceptors.request.use((config) => {
  const nextConfig = { ...config, headers: { ...config.headers } };

  try {
    const persistedSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (persistedSession) {
      const parsed = JSON.parse(persistedSession);
      const token = parsed?.token;
      const tenantSlug = parsed?.tenant?.slug;

      if (token && !nextConfig.headers.Authorization) {
        nextConfig.headers.Authorization = `Bearer ${token}`;
      }

      if (tenantSlug && !nextConfig.headers["x-tenant-slug"]) {
        nextConfig.headers["x-tenant-slug"] = tenantSlug;
      }
    }
  } catch {
    // Ignore malformed storage and continue with explicit headers if present.
  }

  return nextConfig;
});

export const setAuthHeaders = ({ token, tenantSlug }) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }

  if (tenantSlug) {
    api.defaults.headers.common["x-tenant-slug"] = tenantSlug;
  } else {
    delete api.defaults.headers.common["x-tenant-slug"];
  }
};

export { api };
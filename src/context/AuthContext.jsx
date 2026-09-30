import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = import.meta.env.VITE_API_URL || "";

function readStoredUser() {
  try {
    const stored = localStorage.getItem("eduamigo_user");
    const token = localStorage.getItem("token");
    if (stored && token) return { ...JSON.parse(stored), token };
  } catch {
    localStorage.removeItem("eduamigo_user");
    localStorage.removeItem("token");
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const loading = false;

  const login = useCallback((userData, token) => {
    localStorage.setItem("eduamigo_user", JSON.stringify({ ...userData, token }));
    localStorage.setItem("token", token);
    setUser({ ...userData, token });
  }, []);

  const updateUser = useCallback((patch, token) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch, ...(token ? { token } : {}) };
      localStorage.setItem("eduamigo_user", JSON.stringify(next));
      if (token) localStorage.setItem("token", token);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    const role = (JSON.parse(localStorage.getItem("eduamigo_user") || "{}"))?.role;
    if (role) localStorage.setItem("lastRole", role);
    localStorage.removeItem("eduamigo_user");
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  // When the server says the session is no longer valid (expired token, deactivated account,
  // password changed elsewhere), sign out and return to the login screen instead of showing broken pages.
  useEffect(() => {
    const expire = () => {
      if (!localStorage.getItem("token")) return;
      logout();
      if (!window.location.pathname.startsWith("/login")) window.location.assign("/login?expired=1");
    };
    const isApi = (url) => API && String(url || "").startsWith(API) && !String(url).includes("/users/login");

    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401 && isApi(err.config?.url)) expire();
        return Promise.reject(err);
      },
    );

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
      if (res.status === 401 && isApi(url)) expire();
      return res;
    };

    return () => {
      axios.interceptors.response.eject(interceptor);
      window.fetch = originalFetch;
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

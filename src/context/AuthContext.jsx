import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext();

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


  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

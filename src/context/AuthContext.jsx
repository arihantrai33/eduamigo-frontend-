import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eduamigo_user");
      const token = localStorage.getItem("token");
      if (stored && token) {
        const parsedUser = JSON.parse(stored);
        setUser({ ...parsedUser, token });
      }
    } catch {
      localStorage.removeItem("eduamigo_user");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("eduamigo_user", JSON.stringify({...userData, token}));
    localStorage.setItem("token", token);
    setUser({ ...userData, token });
  };

  const logout = () => {
    localStorage.removeItem("eduamigo_user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
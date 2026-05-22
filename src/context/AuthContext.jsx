import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('eduamigo_user');
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
    }, 1600); // ✅ splash (1500ms) ke 100ms baad

    return () => clearTimeout(timer);
  }, []);

  const login = (userData) => {
    localStorage.setItem('eduamigo_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('eduamigo_user');
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
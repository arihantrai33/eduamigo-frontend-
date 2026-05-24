import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("eduamigo_user");
      const token = localStorage.getItem("token");
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser({ ...parsedUser, token });
      }
      setLoading(false);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  const login = (userData) => {
    const token = localStorage.getItem("token");
    localStorage.setItem("eduamigo_user", JSON.stringify(userData));
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
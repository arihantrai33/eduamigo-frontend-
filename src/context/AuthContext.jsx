import { createContext, useContext, useState, useCallback, useEffect } from "react";

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

  // Plan, features, permissions, billing state and branding can change after sign-in (the school
  // buys an add-on, renews, changes its logo), so they are refreshed from the server on every app start.
  const hasSession = !!user?.token;
  useEffect(() => {
    if (!hasSession) return;
    const API = import.meta.env.VITE_API_URL;
    fetch(`${API}/users/profile`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const p = data?.data;
        if (!p) return;
        updateUser({
          permissions: p.permissions, features: p.features, plan: p.plan, subscription: p.subscription,
          branding: p.branding, schoolCode: p.schoolCode, school: p.school, mustChangePassword: p.mustChangePassword,
          supportSession: !!p.supportSession,
        });
      })
      .catch(() => {});
  }, [hasSession, updateUser]);

  const logout = useCallback(() => {
    const role = (JSON.parse(localStorage.getItem("eduamigo_user") || "{}"))?.role;
    if (role) localStorage.setItem("lastRole", role);
    // Mobile app: this phone stops receiving this person's notifications (best effort, before the session is gone).
    const pushToken = localStorage.getItem("eduamigo_push_token");
    const sessionToken = localStorage.getItem("token");
    if (pushToken && sessionToken) {
      fetch(`${import.meta.env.VITE_API_URL}/users/fcm-token`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ fcmToken: pushToken }),
        keepalive: true,
      }).catch(() => {});
      localStorage.removeItem("eduamigo_push_token");
    }
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { saveSchool, findSchoolByCode } from "../utils/school";
import { homeFor } from "../utils/home";
import { LifeBuoy } from "lucide-react";

// /support#token=... — opened from the EduAmigo owner console. Signs in as the school's admin for the
// support session (one hour). The token sits in the URL fragment, which is never sent to any server,
// and is removed from the address bar straight away.
export default function SupportLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token"));
  const [error, setError] = useState(token ? "" : "This support link is missing its token. Start a new support session from the console.");

  useEffect(() => {
    window.history.replaceState(null, "", "/support");
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.data) throw new Error(data.message || "This support link has expired.");
        const user = data.data;
        if (user.schoolCode) {
          try { saveSchool(await findSchoolByCode(user.schoolCode)); } catch { /* branding is optional here */ }
        }
        login(user, token);
        navigate(homeFor(user.role), { replace: true });
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [token, login, navigate]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "'Inter','Segoe UI',sans-serif", background: "#F4F5F8", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 380, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><LifeBuoy aria-hidden size={34} color="#2F5BD3" /></div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>EduAmigo support</h2>
        {error
          ? <p style={{ color: "#B42318", fontSize: 14 }}>{error}</p>
          : <p style={{ color: "#667085", fontSize: 14 }}>Opening the school…</p>}
      </div>
    </div>
  );
}

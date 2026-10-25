import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { saveSchool, findSchoolByCode } from "../utils/school";
import { homeFor } from "../utils/home";
import { AlertCircle } from "lucide-react";
import AuthShell from "./auth/AuthShell";
import { errorMessage } from "../utils/toast";

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
        setError(errorMessage(err, "Could not start the support session"));
      }
    })();
  }, [token, login, navigate]);

  return (
    <AuthShell>
      <h1 className="au-h1">EduAmigo support</h1>
      {error
        ? <div className="au-alert au-alert--bad" role="alert" style={{ marginTop: 16 }}><AlertCircle size={18} aria-hidden />{error}</div>
        : <p className="au-sub" role="status">Opening the school…</p>}
    </AuthShell>
  );
}

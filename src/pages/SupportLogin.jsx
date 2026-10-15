import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { saveSchool, findSchoolByCode } from "../utils/school";
import { homeFor } from "../utils/home";
import { LifeBuoy, AlertCircle } from "lucide-react";
import PlatformHero from "../components/PlatformHero";
import EmptyState from "../components/ui/EmptyState";
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
    <div className="ea-auth ea-platform" style={{ minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", background: "var(--card)", fontFamily: "inherit", overflowY: "auto" }}>
      <PlatformHero icon={LifeBuoy} subtitle="Support session" />
      <div style={{ flex: 1, background: "var(--card)", padding: "8px 22px 40px" }}>
        {error ? (
          <EmptyState role="alert" tone="danger" icon={AlertCircle} title="EduAmigo support" text={error} plain />
        ) : (
          <EmptyState role="status" icon={LifeBuoy} title="EduAmigo support" text="Opening the school…" plain />
        )}
      </div>
    </div>
  );
}

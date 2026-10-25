import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSavedSchool } from "../utils/school";
import { homeFor } from "../utils/home";
import PlatformHero from "../components/PlatformHero";
import { isTenantHost } from "../utils/tenantHost";

export default function Splash() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const school = getSavedSchool();

  // The brand screen is shown briefly; a person who is already signed in should not wait long for their portal.
  const signedIn = (() => { try { return !!(localStorage.getItem("token") && localStorage.getItem("eduamigo_user")); } catch { return false; } })();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDone(true);
    }, signedIn ? 1200 : 2500);
    return () => clearTimeout(timer);
  }, [signedIn]);

  useEffect(() => {
    if (!done) return;
    const stored = localStorage.getItem("eduamigo_user");
    const token = localStorage.getItem("token");
    // Signed in -> home. School chosen on this device -> its sign-in page. Otherwise -> find your school.
    const user = (() => {
      try { return stored && token ? JSON.parse(stored) : null; } catch { return null; }
    })();
    if (user?.role) navigate(homeFor(user.role), { replace: true });
    else navigate(isTenantHost() || getSavedSchool() ? "/login" : "/select-school", { replace: true });
  }, [done, navigate]);

  // EduAmigo brand over the whole window (no centred frame on a desktop), with the same logo as "Find your school".
  return (
    <div className="ea-platform ea-splash" style={{ height: "100vh", position: "relative", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      <PlatformHero full subtitle={school ? (school.appName || school.name) : "Your school companion"}>
        <div role="status" aria-label="Loading" style={{ display: "flex", gap: 8, marginTop: 28 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.85)", animation: `splashPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </PlatformHero>
      <p style={{ position: "absolute", left: 0, right: 0, bottom: 28, margin: 0, textAlign: "center", color: "rgba(255,255,255,0.78)", fontSize: 12, letterSpacing: 0.4 }}>
        Powered by EduAmigo
      </p>
      <style>{`@keyframes splashPulse { 0%, 100% { opacity: 0.35; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }`}</style>
    </div>
  );
}
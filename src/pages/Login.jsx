import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getSavedSchool, clearSavedSchool, saveSchool, findSchoolByCode } from "../utils/school";
import { schoolTheme, alpha } from "../utils/theme";
import { homeFor } from "../utils/home";
import SchoolHero from "../components/SchoolHero";

// What each kind of user types as their login ID.
const ROLES = [
  { id: "student", label: "Student", icon: "🎒", idLabel: "Admission number or email", idIcon: "🪪", placeholder: "e.g. 1024", type: "text", mode: "text" },
  { id: "parent", label: "Parent", icon: "👨‍👩‍👧", idLabel: "Mobile number", idIcon: "📱", placeholder: "10-digit mobile number", type: "tel", mode: "tel" },
  { id: "teacher", label: "Teacher", icon: "📚", idLabel: "Email address", idIcon: "✉️", placeholder: "yourname@school.edu", type: "email", mode: "email" },
  // Admins and accountants both sign in here.
  { id: "admin", label: "Admin", icon: "🛡️", idLabel: "Email address", idIcon: "✉️", placeholder: "yourname@school.edu", type: "email", mode: "email" },
];

export default function Login() {
  const [school, setSchool] = useState(getSavedSchool);
  const [role, setRole] = useState(() => {
    const last = localStorage.getItem("lastRole");
    return ROLES.some((r) => r.id === last) ? last : last === "accountant" ? "admin" : "student";
  });
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("suspended")) return "Your school's EduAmigo account is paused. Please contact the school office.";
    return params.get("expired") ? "Your session has expired. Please log in again." : "";
  });
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();
  const { login } = useAuth();
  const current = ROLES.find((r) => r.id === role);
  const theme = schoolTheme(school);

  // No school chosen on this device yet: choose it first.
  useEffect(() => {
    if (!school) navigate("/select-school", { replace: true });
  }, [school, navigate]);

  // Keep the saved branding fresh (a new logo or colours show up without choosing the school again).
  const savedCode = school?.code;
  useEffect(() => {
    if (!savedCode) return;
    findSchoolByCode(savedCode)
      .then((fresh) => { saveSchool(fresh); setSchool(fresh); })
      .catch(() => {});
  }, [savedCode]);

  const changeSchool = () => {
    clearSavedSchool();
    navigate("/select-school", { replace: true });
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode: school.code, identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("lastRole", role);
        login(data.user, data.token);
        navigate(data.user.mustChangePassword ? "/change-password" : homeFor(data.user.role), { replace: true });
      } else {
        setError(data.message || "Invalid login details. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!school) return null;

  // Input with a leading icon and a focus ring in the school's colour (a render helper, not a
  // component, so the input keeps focus while typing).
  const inputBox = (name, icon, input, trailing) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "0 12px", height: 50, borderRadius: 14,
      background: "var(--input)", border: `1.5px solid ${focused === name ? theme.primary : "var(--border)"}`,
      boxShadow: focused === name ? `0 0 0 4px ${theme.ring}` : "none", transition: "border-color .15s, box-shadow .15s",
    }}>
      <span aria-hidden style={{ fontSize: 17, opacity: 0.8 }}>{icon}</span>
      {input}
      {trailing}
    </div>
  );

  return (
    <div style={s.page}>
      <SchoolHero school={school} theme={theme}>
        <button onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} title={darkMode ? "Light mode" : "Dark mode"}
          style={{
            ...s.themeBtn,
            // A solid, outlined chip so it reads as a button on both light and bold headers.
            ...(theme.isLight
              ? { background: "#fff", border: `1.5px solid ${alpha(theme.primary, 0.35)}`, boxShadow: `0 4px 12px ${alpha(theme.primary, 0.2)}` }
              : { background: alpha("#000000", 0.25), border: "1.5px solid rgba(255,255,255,0.45)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }),
          }}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </SchoolHero>

      <div style={s.card}>
        <h2 style={s.heading}>Welcome back 👋</h2>
        <p style={s.sub}>Sign in to continue to your school</p>

        <div role="tablist" aria-label="I am a" style={s.roles}>
          {ROLES.map((r) => {
            const active = role === r.id;
            return (
              <button key={r.id} role="tab" aria-selected={active}
                onClick={() => { setRole(r.id); setError(""); setIdentifier(""); }}
                style={{
                  ...s.roleBtn,
                  ...(active ? { background: theme.primary, color: "#fff", boxShadow: `0 6px 16px ${theme.glow}`, transform: "translateY(-1px)" } : {}),
                }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{r.label}</span>
              </button>
            );
          })}
        </div>

        <label style={s.label}>{current.idLabel}</label>
        {inputBox("id", current.idIcon, (
          <input type={current.type} inputMode={current.mode} value={identifier} onChange={(e) => setIdentifier(e.target.value)}
            onFocus={() => setFocused("id")} onBlur={() => setFocused("")}
            placeholder={current.placeholder} style={s.input} autoComplete="username" />
        ))}

        <label style={{ ...s.label, marginTop: 14 }}>Password</label>
        {inputBox("pw", "🔒", (
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocused("pw")} onBlur={() => setFocused("")}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="Enter your password"
            style={s.input} autoComplete="current-password" />
        ), (
          <button onClick={() => setShowPassword((p) => !p)} tabIndex={-1} style={{ ...s.showBtn, color: theme.primary }}>
            {showPassword ? "Hide" : "Show"}
          </button>
        ))}

        <div style={{ textAlign: "right", margin: "10px 0 16px" }}>
          <span style={{ ...s.forgot, color: theme.primary }} onClick={() => navigate(`/forgot-password?role=${role}`)}>Forgot password?</span>
        </div>

        {error && <div role="alert" style={s.err}>⚠️ {error}</div>}

        <button onClick={handleLogin} disabled={loading}
          style={{
            ...s.btn,
            background: theme.button,
            boxShadow: `0 10px 24px ${theme.glow}`, opacity: loading ? 0.75 : 1,
          }}>
          {loading ? <span style={s.spinner} /> : null}
          {loading ? "Signing in..." : `Log in as ${current.label}`}
        </button>

        <div style={{ ...s.schoolRow, background: alpha(theme.primary, 0.06), border: `1px dashed ${alpha(theme.primary, 0.3)}` }}>
          <span>School code <strong style={{ color: theme.primary, letterSpacing: 1 }}>{school.code}</strong></span>
          <button onClick={changeSchool} style={s.changeBtn}>Change school</button>
        </div>
        <p style={s.footer}>Powered by <strong>EduAmigo</strong></p>
      </div>

      <style>{`
        @keyframes cardIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", background: "var(--card)", fontFamily: "'Inter','Segoe UI',sans-serif", overflowY: "auto" },
  themeBtn: { position: "absolute", top: 14, right: 14, zIndex: 2, borderRadius: "50%", width: 40, height: 40, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 },
  card: { flex: 1, background: "var(--card)", padding: "4px 22px 28px", animation: "cardIn .5s .1s cubic-bezier(.2,.8,.2,1) both" },
  heading: { fontSize: 21, fontWeight: 800, color: "var(--text)", margin: "0 0 2px" },
  sub: { fontSize: 13, color: "var(--subtext)", margin: "0 0 18px" },
  roles: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 },
  roleBtn: { padding: "9px 2px 8px", border: "none", borderRadius: 14, background: "var(--input)", color: "var(--subtext)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all .18s ease" },
  label: { fontSize: 12, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 6, letterSpacing: 0.2 },
  input: { flex: 1, minWidth: 0, height: "100%", border: "none", outline: "none", background: "transparent", fontSize: 15, color: "var(--text)", colorScheme: "dark light" },
  showBtn: { background: "none", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer", padding: 4 },
  forgot: { fontSize: 12.5, cursor: "pointer", fontWeight: 700 },
  err: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 12, padding: "10px 13px", fontSize: 12.5, marginBottom: 14 },
  btn: { width: "100%", height: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "white", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 800, letterSpacing: 0.3, cursor: "pointer", transition: "transform .12s" },
  spinner: { width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin .8s linear infinite" },
  schoolRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, padding: "10px 12px", borderRadius: 12, fontSize: 12, color: "var(--subtext)" },
  changeBtn: { background: "none", border: "none", color: "var(--subtext)", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "underline" },
  footer: { textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--subtext)" },
};

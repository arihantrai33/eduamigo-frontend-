import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getSavedSchool, clearSavedSchool, schoolColor } from "../utils/school";
import { SchoolLogo } from "./SelectSchool";
import { homeFor } from "../utils/home";

// What each kind of user types as their login ID.
const ROLES = [
  { id: "student", label: "Student", icon: "🎒", idLabel: "Admission number", placeholder: "e.g. 1024", type: "text", mode: "text" },
  { id: "parent", label: "Parent", icon: "👨‍👩‍👧", idLabel: "Mobile number", placeholder: "10-digit mobile number", type: "tel", mode: "tel" },
  { id: "teacher", label: "Teacher", icon: "📚", idLabel: "Email address", placeholder: "yourname@school.edu", type: "email", mode: "email" },
  { id: "admin", label: "Staff", icon: "🛡️", idLabel: "Email address", placeholder: "yourname@school.edu", type: "email", mode: "email" },
];

export default function Login() {
  const school = getSavedSchool();
  const [role, setRole] = useState(() => {
    const last = localStorage.getItem("lastRole");
    return ROLES.some((r) => r.id === last) ? last : last === "accountant" ? "admin" : "student";
  });
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  const color = schoolColor(school);

  // No school chosen on this device yet: choose it first.
  useEffect(() => {
    if (!school) navigate("/select-school", { replace: true });
  }, [school, navigate]);

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

  return (
    <div style={s.page}>
      <div style={s.top}>
        <button onClick={() => setDarkMode(!darkMode)} style={s.themeBtn} aria-label="Toggle dark mode">
          {darkMode ? "☀️" : "🌙"}
        </button>
        <SchoolLogo school={school} size={64} />
        <h1 style={s.brand}>{school.appName || school.name}</h1>
        <p style={s.tagline}>{school.tagline || school.city || "School Management Platform"}</p>
      </div>
      <div style={s.card}>
        <h2 style={s.heading}>Welcome Back</h2>
        <p style={s.sub}>Log in to continue</p>
        <div style={s.roles}>
          {ROLES.map((r) => (
            <button key={r.id} onClick={() => { setRole(r.id); setError(""); setIdentifier(""); }}
              style={{ ...s.roleBtn, ...(role === r.id ? { border: `1.5px solid ${color}`, background: `${color}22`, color } : {}) }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{r.label}</span>
            </button>
          ))}
        </div>
        <label style={s.label}>{current.idLabel}</label>
        <input type={current.type} inputMode={current.mode} value={identifier} onChange={(e) => setIdentifier(e.target.value)}
          placeholder={current.placeholder} style={s.input} autoComplete="username" />
        <label style={s.label}>Password</label>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input type={showPassword ? "text" : "password"} value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} autoComplete="current-password"
            style={{ ...s.input, marginBottom: 0, paddingRight: 44 }} />
          <button onClick={() => setShowPassword((p) => !p)} style={s.eye} tabIndex={-1}>{showPassword ? "🙈" : "👁️"}</button>
        </div>
        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <span style={{ ...s.forgot, color }} onClick={() => navigate(`/forgot-password?role=${role}`)}>Forgot password?</span>
        </div>
        {error && <div style={s.err}>⚠️ {error}</div>}
        <button onClick={handleLogin} disabled={loading}
          style={{ ...s.btn, background: color, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Logging in..." : `Log in as ${current.label}`}
        </button>
        <div style={s.schoolRow}>
          <span>School code: <strong>{school.code}</strong></span>
          <button onClick={changeSchool} style={s.changeBtn}>Change school</button>
        </div>
        <p style={s.footer}>Powered by EduAmigo</p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(160deg, #0f1b4c 0%, #1a3a8f 50%, #0f1b4c 100%)", fontFamily: "'Inter','Segoe UI',sans-serif", overflowY: "auto" },
  top: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 24px 16px", position: "relative", gap: 4 },
  themeBtn: { position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 38, height: 38, fontSize: 20, cursor: "pointer" },
  brand: { color: "white", fontSize: 22, fontWeight: 700, margin: "10px 0 2px", textAlign: "center" },
  tagline: { color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", margin: 0, textAlign: "center" },
  card: { flex: 1, background: "var(--card)", borderRadius: 24, padding: "24px 20px 32px", overflowY: "auto" },
  heading: { fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" },
  sub: { fontSize: 13, color: "var(--subtext)", margin: "0 0 20px" },
  roles: { display: "flex", gap: 6, marginBottom: 20 },
  roleBtn: { flex: 1, padding: "8px 2px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--input)", color: "var(--subtext)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 5, letterSpacing: 0.3 },
  input: { width: "100%", padding: "11px 13px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, color: "var(--text)", outline: "none", boxSizing: "border-box", background: "var(--input)", marginBottom: 14, colorScheme: "dark light" },
  eye: { position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15 },
  forgot: { fontSize: 12, cursor: "pointer", fontWeight: 600 },
  err: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "9px 13px", fontSize: 12, marginBottom: 14 },
  btn: { width: "100%", padding: "13px", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  schoolRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, fontSize: 12, color: "var(--subtext)" },
  changeBtn: { background: "none", border: "none", color: "var(--subtext)", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "underline" },
  footer: { textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--subtext)" },
};

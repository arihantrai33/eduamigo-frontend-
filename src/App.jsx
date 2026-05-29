import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const ROLES = [
  { id: "student", label: "Student", icon: "🎒" },
  { id: "parent", label: "Parent", icon: "👨‍👩‍👧" },
  { id: "teacher", label: "Teacher", icon: "📚" },
  { id: "admin", label: "Admin", icon: "🛡️" },
];

export default function Login() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.user, data.token);
        navigate(`/${role}/home`);
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Top Brand Section */}
      <div style={s.topSection}>
        <div style={s.logoWrap}>
          <span style={s.logoIcon}>🎓</span>
        </div>
        <h1 style={s.brandName}>EduAmigo</h1>
        <p style={s.brandTagline}>School Management Platform</p>
      </div>

      {/* Form Card */}
      <div style={s.card}>
        <h2 style={s.heading}>Welcome Back</h2>
        <p style={s.subheading}>Sign in to continue</p>

        {/* Role Selector */}
        <div style={s.roleTabs}>
          {ROLES.map(r => (
            <button
              key={r.id}
              onClick={() => { setRole(r.id); setError(""); }}
              style={{ ...s.roleTab, ...(role === r.id ? s.roleTabActive : {}) }}
            >
              <span style={{ fontSize: 20 }}>{r.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Email */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="yourname@school.edu"
            style={s.input}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ ...s.input, paddingRight: 44 }}
            />
            <button
              onClick={() => setShowPassword(p => !p)}
              style={s.eyeBtn}
              tabIndex={-1}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Forgot */}
        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <span onClick={() => navigate("/forgot-password")} style={s.forgotLink}>
            Forgot password?
          </span>
        </div>

        {/* Error */}
        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }}
        >
          {loading ? "Signing in..." : `Sign in as ${ROLES.find(r => r.id === role)?.label}`}
        </button>

        <p style={s.footer}>
          © {new Date().getFullYear()} EduAmigo · All rights reserved
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    height: "100%",
    background: "linear-gradient(160deg, #0f1b4c 0%, #1a3a8f 45%, #0f1b4c 100%)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflowY: "auto",
  },
  topSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
    paddingBottom: 28,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    background: "rgba(255,255,255,0.12)",
    border: "1.5px solid rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    marginBottom: 14,
    backdropFilter: "blur(10px)",
  },
  brandName: {
    color: "white",
    fontSize: 26,
    fontWeight: 700,
    margin: "0 0 4px",
    letterSpacing: 0.5,
  },
  brandTagline: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    margin: 0,
  },
  card: {
    flex: 1,
    background: "white",
    borderRadius: "28px 28px 0 0",
    padding: "28px 24px 32px",
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f1b4c",
    margin: "0 0 4px",
  },
  subheading: {
    fontSize: 13,
    color: "#64748b",
    margin: "0 0 22px",
  },
  roleTabs: {
    display: "flex",
    gap: 8,
    marginBottom: 22,
  },
  roleTab: {
    flex: 1,
    padding: "10px 4px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 12,
    background: "white",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  roleTabActive: {
    border: "1.5px solid #1a3a8f",
    background: "#eff4ff",
    color: "#1a3a8f",
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    display: "block",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 14,
    color: "#1a1a2e",
    outline: "none",
    boxSizing: "border-box",
    background: "#f8fafc",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
  },
  forgotLink: {
    fontSize: 12,
    color: "#1a3a8f",
    cursor: "pointer",
    fontWeight: 600,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #1a3a8f, #4f8ef7)",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.3,
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 11,
    color: "#94a3b8",
  },
};
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  const s = styles;

  return (
    <div style={s.page}>
      {/* Left Panel - only visible on wide screens via CSS trick */}
      <div style={s.left}>
        <div style={s.logoRow}>
          <div style={s.logoBox}>E</div>
          <span style={s.logoText}>EduAmigo</span>
        </div>
        <h1 style={s.tagline}>
          Manage your school.<br />
          <span style={s.taglineAccent}>Effortlessly.</span>
        </h1>
        <p style={s.taglineSub}>
          A unified platform for students, parents, teachers and administrators.
        </p>
        <div style={s.featureList}>
          {["Real-time attendance tracking", "Instant parent communication", "Marks & result management", "Fee collection & reports"].map(f => (
            <div key={f} style={s.featureItem}>
              <span style={s.featureDot} /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={s.right}>
        <div style={s.card}>
          {/* Mobile logo */}
          <div style={s.mobileLogoRow}>
            <div style={{...s.logoBox, width:32, height:32, fontSize:16}}>E</div>
            <span style={{...s.logoText, color:'#1a1a2e', fontSize:18}}>EduAmigo</span>
          </div>

          <h2 style={s.heading}>Sign in to your account</h2>
          <p style={s.subheading}>Select your role and enter your credentials</p>

          {/* Role Tabs */}
          <div style={s.roleTabs}>
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setError(""); }}
                style={{
                  ...s.roleTab,
                  ...(role === r.id ? s.roleTabActive : {}),
                }}
              >
                <span style={{fontSize:18}}>{r.icon}</span>
                <span style={{fontSize:12, fontWeight:600}}>{r.label}</span>
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
            <div style={s.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{...s.input, marginBottom:0, paddingRight:48}}
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
          <div style={{textAlign:"right", marginBottom:8}}>
            <span
              onClick={() => navigate("/forgot-password")}
              style={s.forgotLink}
            >
              Forgot password?
            </span>
          </div>

          {/* Error */}
          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{...s.submitBtn, opacity: loading ? 0.7 : 1}}
          >
            {loading ? "Signing in..." : `Sign in as ${ROLES.find(r=>r.id===role)?.label}`}
          </button>

          <p style={s.footer}>
            © {new Date().getFullYear()} EduAmigo · School Management Platform
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: "#f5f7fa",
  },
  left: {
    flex: 1,
    background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
    padding: "48px 40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 340,
    // hide on mobile — use @media via inline trick
  },
  logoRow: {
    display: "flex", alignItems: "center", gap: 12, marginBottom: 48,
  },
  logoBox: {
    width: 40, height: 40, borderRadius: 10,
    background: "linear-gradient(135deg, #4f8ef7, #6c63ff)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "white", fontWeight: 800, fontSize: 20,
  },
  logoText: {
    color: "white", fontSize: 22, fontWeight: 700, letterSpacing: 0.5,
  },
  tagline: {
    color: "white", fontSize: 36, fontWeight: 700, lineHeight: 1.3,
    marginBottom: 16,
  },
  taglineAccent: {
    color: "#4f8ef7",
  },
  taglineSub: {
    color: "#94a3b8", fontSize: 15, lineHeight: 1.6, marginBottom: 40,
  },
  featureList: { display: "flex", flexDirection: "column", gap: 14 },
  featureItem: {
    color: "#cbd5e1", fontSize: 14, display: "flex", alignItems: "center", gap: 10,
  },
  featureDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#4f8ef7", display: "inline-block", flexShrink: 0,
  },
  right: {
    flex: 1,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "32px 16px",
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
  },
  mobileLogoRow: {
    display: "flex", alignItems: "center", gap: 8,
    marginBottom: 24,
  },
  heading: {
    fontSize: 24, fontWeight: 700, color: "#1a1a2e",
    margin: "0 0 6px",
  },
  subheading: {
    fontSize: 14, color: "#64748b", margin: "0 0 28px",
  },
  roleTabs: {
    display: "flex", gap: 8, marginBottom: 28,
  },
  roleTab: {
    flex: 1, padding: "10px 4px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 12, background: "white",
    color: "#64748b", cursor: "pointer",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4,
    transition: "all 0.15s",
  },
  roleTabActive: {
    border: "1.5px solid #4f8ef7",
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  fieldGroup: { marginBottom: 18 },
  label: {
    fontSize: 13, fontWeight: 600, color: "#374151",
    display: "block", marginBottom: 6,
  },
  input: {
    width: "100%", padding: "12px 14px",
    border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, color: "#1a1a2e", outline: "none",
    boxSizing: "border-box", background: "#fafafa",
  },
  passwordWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: 16,
  },
  forgotLink: {
    fontSize: 13, color: "#4f8ef7", cursor: "pointer", fontWeight: 500,
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca",
    color: "#dc2626", borderRadius: 10, padding: "10px 14px",
    fontSize: 13, marginBottom: 16,
  },
  submitBtn: {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg, #4f8ef7, #6c63ff)",
    color: "white", border: "none", borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    marginTop: 8, letterSpacing: 0.3,
  },
  footer: {
    textAlign: "center", marginTop: 24,
    fontSize: 12, color: "#94a3b8",
  },
};
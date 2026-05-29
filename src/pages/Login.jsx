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

  return (
    <div style={s.page}>
      <div style={s.top}>
        <div style={s.logoBox}>🎓</div>
        <h1 style={s.brand}>EduAmigo</h1>
        <p style={s.tagline}>School Management Platform</p>
      </div>
      <div style={s.card}>
        <h2 style={s.heading}>Welcome Back</h2>
        <p style={s.sub}>Sign in to continue</p>
        <div style={s.roles}>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => { setRole(r.id); setError(""); }}
              style={{ ...s.roleBtn, ...(role === r.id ? s.roleBtnActive : {}) }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{r.label}</span>
            </button>
          ))}
        </div>
        <label style={s.label}>Email Address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="yourname@school.edu" style={s.input} />
        <label style={s.label}>Password</label>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input type={showPassword ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ ...s.input, marginBottom: 0, paddingRight: 44 }} />
          <button onClick={() => setShowPassword(p => !p)}
            style={s.eye} tabIndex={-1}>{showPassword ? "🙈" : "👁️"}</button>
        </div>
        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <span style={s.forgot} onClick={() => navigate("/forgot-password")}>Forgot password?</span>
        </div>
        {error && <div style={s.err}>⚠️ {error}</div>}
        <button onClick={handleLogin} disabled={loading}
          style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Signing in..." : `Sign in as ${ROLES.find(r => r.id === role)?.label}`}
        </button>
        <p style={s.footer}>© {new Date().getFullYear()} EduAmigo · All rights reserved</p>
      </div>
    </div>
  );
}

const s = {
  page: { height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(160deg, #0f1b4c 0%, #1a3a8f 50%, #0f1b4c 100%)", fontFamily: "'Inter','Segoe UI',sans-serif", overflowY: "auto" },
  top: { display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 24px 24px" },
  logoBox: { width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 12 },
  brand: { color: "white", fontSize: 24, fontWeight: 700, margin: "0 0 4px", letterSpacing: 0.5 },
  tagline: { color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", margin: 0 },
  card: { flex: 1, background: "white", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", overflowY: "auto" },
  heading: { fontSize: 20, fontWeight: 700, color: "#0f1b4c", margin: "0 0 2px" },
  sub: { fontSize: 13, color: "#64748b", margin: "0 0 20px" },
  roles: { display: "flex", gap: 6, marginBottom: 20 },
  roleBtn: { flex: 1, padding: "8px 2px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "white", color: "#64748b", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
  roleBtnActive: { border: "1.5px solid #1a3a8f", background: "#eff4ff", color: "#1a3a8f" },
  label: { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5, letterSpacing: 0.3 },
  input: { width: "100%", padding: "11px 13px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#1a1a2e", outline: "none", boxSizing: "border-box", background: "#f8fafc", marginBottom: 14 },
  eye: { position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15 },
  forgot: { fontSize: 12, color: "#1a3a8f", cursor: "pointer", fontWeight: 600 },
  err: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "9px 13px", fontSize: 12, marginBottom: 14 },
  btn: { width: "100%", padding: "13px", background: "linear-gradient(135deg, #1a3a8f, #4f8ef7)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  footer: { textAlign: "center", marginTop: 18, fontSize: 11, color: "#94a3b8" },
};
EOF
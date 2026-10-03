import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSavedSchool } from "../utils/school";
import { schoolTheme } from "../utils/theme";
import SchoolHero from "../components/SchoolHero";

const API = import.meta.env.VITE_API_URL;

async function post(path, body) {
  const res = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

// Reset by a 6-digit code sent to the account's email.
// Students (no email) are told to ask their parent or class teacher, who can reset it from their app.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const school = getSavedSchool();
  const role = new URLSearchParams(window.location.search).get("role") || "parent";
  const theme = schoolTheme(school);
  const color = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.dark} 100%)`;
  const [step, setStep] = useState("request"); // request | code | done
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!school) navigate("/select-school", { replace: true });
  }, [school, navigate]);
  if (!school) return null;

  const idLabel = role === "parent" ? "Mobile number or email" : "Email address";
  const credentials = { schoolCode: school.code, identifier: identifier.trim() };

  const requestCode = async () => {
    if (!identifier.trim()) return setError(`Enter your ${idLabel.toLowerCase()}.`);
    setBusy(true); setError("");
    try {
      const data = await post("/users/forgot-password", credentials);
      setInfo(data.message);
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!/^\d{6}$/.test(code.trim())) return setError("Enter the 6-digit code from the email.");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return setError("Password must be at least 8 characters with letters and numbers.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true); setError("");
    try {
      await post("/users/reset-password", { ...credentials, code: code.trim(), newPassword: password });
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.page}>
      <SchoolHero school={school} theme={theme} compact />
      <div style={s.card}>
        {role === "student" ? (
          <>
            <h2 style={s.heading}>Forgot your password?</h2>
            <p style={s.sub}>
              Ask your <strong>parent</strong> or <strong>class teacher</strong> to reset it. They can give you a new
              password from their EduAmigo app in a few seconds. You can also ask the school office.
            </p>
            <p style={s.sub}>After signing in with the new password, you will be asked to set your own.</p>
          </>
        ) : step === "request" ? (
          <>
            <h2 style={s.heading}>Forgot your password?</h2>
            <p style={s.sub}>We will email a 6-digit code to the email address on your account.</p>
            <label style={s.label}>{idLabel}</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} onKeyDown={(e) => e.key === "Enter" && requestCode()}
              placeholder={role === "parent" ? "98765 43210 or name@mail.com" : "yourname@school.edu"} style={s.input} autoFocus />
            {error && <div style={s.err}>⚠️ {error}</div>}
            <button onClick={requestCode} disabled={busy} style={{ ...s.btn, background: color, opacity: busy ? 0.7 : 1 }}>
              {busy ? "Sending..." : "Send code"}
            </button>
            {role === "parent" && <p style={s.note}>No email on your account? Please ask the school office to reset your password.</p>}
          </>
        ) : step === "code" ? (
          <>
            <h2 style={s.heading}>Enter the code</h2>
            <p style={s.sub}>{info}</p>
            <label style={s.label}>6-digit code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric"
              placeholder="123456" style={{ ...s.input, letterSpacing: 6, fontSize: 18, textAlign: "center" }} autoFocus />
            <label style={s.label}>New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters, letters and numbers" style={s.input} autoComplete="new-password" />
            <label style={s.label}>Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && resetPassword()} style={s.input} autoComplete="new-password" />
            {error && <div style={s.err}>⚠️ {error}</div>}
            <button onClick={resetPassword} disabled={busy} style={{ ...s.btn, background: color, opacity: busy ? 0.7 : 1 }}>
              {busy ? "Saving..." : "Set new password"}
            </button>
            <button onClick={() => { setStep("request"); setCode(""); setError(""); }} style={s.linkBtn}>Didn't get it? Send again</button>
          </>
        ) : (
          <>
            <h2 style={s.heading}>Password changed ✅</h2>
            <p style={s.sub}>You have been signed out on all devices. Please log in with your new password.</p>
            <button onClick={() => navigate("/login", { replace: true })} style={{ ...s.btn, background: color }}>Go to login</button>
          </>
        )}
        {step !== "done" && <button onClick={() => navigate("/login")} style={s.linkBtn}>← Back to login</button>}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", background: "var(--card)", fontFamily: "'Inter','Segoe UI',sans-serif", overflowY: "auto" },
  card: { flex: 1, background: "var(--card)", padding: "4px 22px 32px" },
  heading: { fontSize: 19, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" },
  sub: { fontSize: 13, color: "var(--subtext)", margin: "0 0 16px", lineHeight: 1.55 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 5 },
  input: { width: "100%", padding: "11px 13px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, color: "var(--text)", outline: "none", boxSizing: "border-box", background: "var(--input)", marginBottom: 14 },
  err: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "9px 13px", fontSize: 12, marginBottom: 14 },
  btn: { width: "100%", padding: 13, color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  linkBtn: { width: "100%", padding: 12, marginTop: 6, background: "none", border: "none", color: "var(--subtext)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  note: { fontSize: 12, color: "var(--subtext)", marginTop: 14, lineHeight: 1.5, textAlign: "center" },
};

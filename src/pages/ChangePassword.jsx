import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast, errorMessage } from "../utils/toast";

const API = import.meta.env.VITE_API_URL;

export default function ChangePassword() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const forced = !!user?.mustChangePassword;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      return setError("Use at least 8 characters with both letters and numbers.");
    }
    if (form.newPassword !== form.confirm) return setError("The new passwords do not match.");
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not update password");
      updateUser({ mustChangePassword: false }, data.token);
      toast.success("Password updated");
      navigate(["admin", "accountant"].includes(user.role) ? "/admin/home" : user.role === "driver" ? "/driver" : `/${user.role}/home`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const input = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };
  const label = { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", margin: "14px 0 6px" };

  return (
    <div style={{ minHeight: "100vh", background: "#F4F5FA", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Inter, system-ui, sans-serif" }}>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }}>
        <h1 style={{ fontSize: 20, margin: "0 0 6px", color: "#0F172A" }}>{forced ? "Set a new password" : "Change password"}</h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
          {forced ? "Your account uses a temporary password. Please choose your own password to continue." : "Choose a strong password you do not use elsewhere."}
        </p>

        <label style={label} htmlFor="cp-current">{forced ? "Temporary password" : "Current password"}</label>
        <input id="cp-current" type="password" autoComplete="current-password" style={input} value={form.currentPassword} onChange={set("currentPassword")} required />

        <label style={label} htmlFor="cp-new">New password</label>
        <input id="cp-new" type="password" autoComplete="new-password" style={input} value={form.newPassword} onChange={set("newPassword")} required />

        <label style={label} htmlFor="cp-confirm">Confirm new password</label>
        <input id="cp-confirm" type="password" autoComplete="new-password" style={input} value={form.confirm} onChange={set("confirm")} required />

        {error && <div role="alert" style={{ marginTop: 12, fontSize: 13, color: "#B91C1C" }}>{error}</div>}

        <button type="submit" disabled={saving} style={{ marginTop: 18, width: "100%", padding: 13, borderRadius: 10, border: "none", background: "var(--brand-gradient)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Update password"}
        </button>
        <button type="button" onClick={() => { logout(); navigate("/login", { replace: true }); }} style={{ marginTop: 10, width: "100%", padding: 10, border: "none", background: "none", color: "#64748B", fontSize: 13, cursor: "pointer" }}>
          Sign out
        </button>
      </form>
    </div>
  );
}

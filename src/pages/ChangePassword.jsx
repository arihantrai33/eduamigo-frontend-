import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast, errorMessage } from "../utils/toast";
import FieldError from "../components/ui/FieldError";
import { useFieldErrors } from "../utils/fieldErrors";
import SchoolHero from "../components/SchoolHero";
import { getSavedSchool } from "../utils/school";
import { userTheme } from "../utils/theme";

const API = import.meta.env.VITE_API_URL;
const FIELDS = { currentPassword: "cp-current", newPassword: "cp-new", confirm: "cp-confirm" };

export default function ChangePassword() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const v = useFieldErrors(FIELDS);

  const forced = !!user?.mustChangePassword;
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); v.clear(k); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const weak = form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword);
    if (!v.check({
      currentPassword: !form.currentPassword && (forced ? "Enter the temporary password" : "Enter your current password"),
      newPassword: weak && "Use at least 8 characters with both letters and numbers.",
      confirm: !weak && form.newPassword !== form.confirm && "The new passwords do not match.",
    })) return;
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

  // Shared field style (.ea-input / .ea-label).
  const input = { width: "100%" };
  const label = { display: "block", margin: "14px 0 6px" };

  // The sign-in split in the school's colours, like "Forgot password".
  return (
    <div className="ea-auth" style={{ minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", background: "var(--card)", fontFamily: "inherit", overflowY: "auto" }}>
      <SchoolHero school={getSavedSchool()} theme={userTheme(user)} compact />
      <div style={{ flex: 1, background: "var(--card)", padding: "4px 22px 32px" }}>
      <form onSubmit={submit} noValidate>
        <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 6px", color: "var(--text)" }}>{forced ? "Set a new password" : "Change password"}</h2>
        <p style={{ fontSize: 13, color: "var(--subtext)", margin: 0, lineHeight: 1.55 }}>
          {forced ? "Your account uses a temporary password. Please choose your own password to continue." : "Choose a strong password you do not use elsewhere."}
        </p>

        <label className="ea-label" style={label} htmlFor="cp-current">{forced ? "Temporary password" : "Current password"}</label>
        <input id="cp-current" type="password" autoComplete="current-password" className="ea-input" style={input} value={form.currentPassword} onChange={set("currentPassword")} required {...v.invalid("currentPassword")} />
        <FieldError id={v.errorId("currentPassword")}>{v.errors.currentPassword}</FieldError>

        <label className="ea-label" style={label} htmlFor="cp-new">New password</label>
        <input id="cp-new" type="password" autoComplete="new-password" className="ea-input" style={input} value={form.newPassword} onChange={set("newPassword")} required {...v.invalid("newPassword")} />
        <FieldError id={v.errorId("newPassword")}>{v.errors.newPassword}</FieldError>

        <label className="ea-label" style={label} htmlFor="cp-confirm">Confirm new password</label>
        <input id="cp-confirm" type="password" autoComplete="new-password" className="ea-input" style={input} value={form.confirm} onChange={set("confirm")} required {...v.invalid("confirm")} />
        <FieldError id={v.errorId("confirm")}>{v.errors.confirm}</FieldError>

        {error && <div role="alert" style={{ marginTop: 12, fontSize: 13, color: "#B91C1C" }}>{error}</div>}

        <button type="submit" disabled={saving} className="ea-btn ea-btn--primary" style={{ marginTop: 18, width: "100%", minHeight: 48, fontSize: 15 }}>
          {saving ? "Saving..." : "Update password"}
        </button>
        <button type="button" onClick={() => { logout(); navigate("/login", { replace: true }); }} style={{ marginTop: 10, width: "100%", padding: 10, border: "none", background: "none", color: "var(--subtext)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Sign out
        </button>
      </form>
      </div>
    </div>
  );
}

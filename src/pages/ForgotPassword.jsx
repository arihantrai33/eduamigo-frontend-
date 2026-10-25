import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Info, KeyRound, UserRound } from "lucide-react";
import AuthShell from "./auth/AuthShell";
import { getSavedSchool } from "../utils/school";
import { errorMessage } from "../utils/toast";
import { useFieldErrors } from "../utils/fieldErrors";

const API = import.meta.env.VITE_API_URL;
const FIELDS = { identifier: "fp-id", code: "fp-code", password: "fp-password", confirm: "fp-confirm" };

async function post(path, body) {
  const res = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

// Reset by a 6-digit code sent to the email on the account. The answer is the same whether or not the account exists.
// An email needs no school; a mobile number or admission number is looked up inside the school chosen on this device.
// Students without an email are told to ask a parent, a class teacher or the school office, who can reset it from their app.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const school = getSavedSchool();
  const [step, setStep] = useState("request"); // request | code | done
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const v = useFieldErrors(FIELDS);

  const id = identifier.trim();
  const credentials = id.includes("@") ? { email: id } : { schoolCode: school?.code, identifier: id };

  const requestCode = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setError("");
    if (!v.check({ identifier: !id && "Enter your email, mobile number or admission number." })) return;
    if (!id.includes("@") && !school) return setError("To use a mobile number or admission number we need your school. Choose your school first, or enter your email address.");
    setBusy(true);
    try {
      const data = await post("/users/forgot-password", credentials);
      setInfo(data.message);
      setStep("code");
    } catch (err) {
      setError(errorMessage(err, "Could not send the reset code"));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setError("");
    const weak = password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password);
    if (!v.check({
      code: !/^\d{6}$/.test(code.trim()) && "Enter the 6-digit code we sent you.",
      password: weak && "Password must be at least 8 characters with letters and numbers.",
      confirm: !weak && password !== confirm && "Passwords do not match.",
    })) return;
    setBusy(true);
    try {
      await post("/users/reset-password", { ...credentials, code: code.trim(), newPassword: password });
      setStep("done");
    } catch (err) {
      setError(errorMessage(err, "Could not reset the password"));
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, props, Icon) => (
    <div className="au-field">
      <label className="au-label" htmlFor={FIELDS[name]}>{label}</label>
      <div className="au-box">
        {Icon && <Icon size={18} aria-hidden />}
        <input id={FIELDS[name]} className={`au-input${Icon ? "" : " au-input--plain"}`} {...props} {...v.invalid(name)} />
      </div>
      {v.errors[name] && <p id={v.errorId(name)} className="au-err">{v.errors[name]}</p>}
    </div>
  );
  const alert = error && <div className="au-alert au-alert--bad" role="alert"><AlertCircle size={18} aria-hidden />{error}</div>;

  return (
    <AuthShell school={school}>
      {step === "request" && (
        <>
          <h1 className="au-h1">Forgot your password?</h1>
          <p className="au-sub">We will send a 6-digit code to the mobile number or email address on your account.</p>
          <form className="au-form" onSubmit={requestCode} noValidate>
            {field("identifier", "Email, mobile number or admission number", {
              value: identifier, autoFocus: true, autoComplete: "username", autoCapitalize: "none", autoCorrect: "off", spellCheck: false,
              onChange: (e) => { setIdentifier(e.target.value); v.clear("identifier"); },
            }, UserRound)}
            {alert}
            <button type="submit" className="au-btn" disabled={busy} aria-busy={busy}>{busy ? <><span className="au-spin" aria-hidden />Sending…</> : "Send code"}</button>
          </form>
          <div className="au-alert au-alert--info" style={{ marginTop: 18 }}>
            <Info size={18} aria-hidden />
            <span><strong>Students and parents without an email:</strong> ask your parent, your class teacher or the school office to reset it. They can give you a new password in a few seconds, and you will set your own when you sign in.</span>
          </div>
        </>
      )}

      {step === "code" && (
        <>
          <h1 className="au-h1">Enter the code</h1>
          <p className="au-sub" role="status">{info}</p>
          <form className="au-form" onSubmit={resetPassword} noValidate>
            {field("code", "6-digit code", {
              value: code, autoFocus: true, inputMode: "numeric", autoComplete: "one-time-code", placeholder: "123456",
              onChange: (e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); v.clear("code"); },
              className: "au-input au-input--plain au-code",
            })}
            {field("password", "New password", {
              type: "password", value: password, autoComplete: "new-password", placeholder: "At least 8 characters, letters and numbers",
              onChange: (e) => { setPassword(e.target.value); v.clear("password"); },
            })}
            {field("confirm", "Confirm new password", {
              type: "password", value: confirm, autoComplete: "new-password",
              onChange: (e) => { setConfirm(e.target.value); v.clear("confirm"); },
            })}
            {alert}
            <button type="submit" className="au-btn" disabled={busy} aria-busy={busy}>{busy ? <><span className="au-spin" aria-hidden />Saving…</> : "Set new password"}</button>
            <button type="button" className="au-link" style={{ justifySelf: "center" }} onClick={() => { setStep("request"); setCode(""); setError(""); v.setErrors({}); }}>Didn't get it? Send again</button>
          </form>
        </>
      )}

      {step === "done" && (
        <>
          <h1 className="au-h1" style={{ display: "flex", alignItems: "center", gap: 10 }}><CheckCircle2 size={26} color="#047857" aria-hidden />Password changed</h1>
          <p className="au-sub">You have been signed out on all devices. Please sign in with your new password.</p>
          <div className="au-stack"><button type="button" className="au-btn" onClick={() => navigate("/login", { replace: true })} autoFocus><KeyRound size={18} aria-hidden />Go to sign in</button></div>
        </>
      )}

      {step !== "done" && <p className="au-foot" style={{ marginTop: 22 }}><Link to="/login">← Back to sign in</Link></p>}
    </AuthShell>
  );
}

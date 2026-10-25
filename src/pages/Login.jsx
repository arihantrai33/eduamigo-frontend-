import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ChevronRight, Info, KeyRound, Lock, UserRound } from "lucide-react";
import AuthShell, { SchoolMark } from "./auth/AuthShell";
import { useAuth } from "../context/AuthContext";
import {
  getSavedSchool, saveSchool, findSchoolByCode, signInRequest, chooseSchoolRequest, requestCodeRequest, codeSignInRequest, rememberSchoolOf, safeNext,
} from "../utils/school";
import { isTenantHost, resolveHostSchool } from "../utils/tenantHost";
import { homeFor } from "../utils/home";
import { useFieldErrors } from "../utils/fieldErrors";

const FIELDS = { identifier: "login-id", password: "login-password" };
const ID_MISSING = "Enter your email, mobile number or admission number";

// What the person sees for each way a sign-in can fail. The server's own words are used for a wrong ID or password.
function failureMessage(status, data) {
  if (data?.code === "SCHOOL_SUSPENDED") return "Your school's EduAmigo account is paused. Please contact the school office.";
  if (status === 401) return data.message || "That ID or password is not correct. Please check and try again.";
  if (status === 429) return data.message || "Too many attempts. Please wait a few minutes and try again.";
  return data?.message || "Could not sign in. Please try again.";
}

// One sign-in for everyone: an email, a mobile number or an admission number, and a password. The role (student, parent,
// teacher, school admin) and the school come back from the server with the session; nothing about either is chosen here.
export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, user } = useAuth();
  const tenant = isTenantHost();
  const [school, setSchool] = useState(getSavedSchool);
  const [hostState, setHostState] = useState(tenant ? "resolving" : "ready"); // resolving | ready | unknown
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needSchool, setNeedSchool] = useState(false);
  const [choice, setChoice] = useState(null); // { ticket, schools } after a sign-in that matched several schools
  const [picking, setPicking] = useState("");
  const [mode, setMode] = useState("password"); // password | code (a one-time code by SMS or email)
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [wait, setWait] = useState(0);
  const v = useFieldErrors(FIELDS);
  const busy = useRef(false);
  const [notice] = useState(() => {
    if (params.get("suspended")) return { kind: "bad", text: "Your school's EduAmigo account is paused. Please contact the school office." };
    if (params.get("expired")) return { kind: "info", text: "Your session has expired. Please sign in again." };
    return null;
  });
  const [error, setError] = useState("");

  // Someone who is already signed in has nothing to do here: their own portal (or the password change they owe) comes first.
  useEffect(() => {
    if (user?.role) navigate(user.mustChangePassword ? "/change-password" : safeNext(params.get("next"), user.role) || homeFor(user.role), { replace: true });
  }, [user, navigate, params]);

  // On a school's own address the address decides the school (the server checks it is a registered one).
  useEffect(() => {
    if (!tenant) return undefined;
    let live = true;
    resolveHostSchool().then((found) => {
      if (!live) return;
      if (found) { setSchool(found); setHostState("ready"); } else setHostState("unknown");
    });
    return () => { live = false; };
  }, [tenant]);

  // Keep the saved branding fresh (a new logo or colours show up without choosing the school again).
  const savedCode = school?.code;
  useEffect(() => {
    if (!savedCode || tenant) return;
    findSchoolByCode(savedCode).then((fresh) => { saveSchool(fresh); setSchool(fresh); }).catch(() => {});
  }, [savedCode, tenant]);

  const finish = (data) => {
    login(data.user, data.token);
    rememberSchoolOf(data.user);
    const to = data.user.mustChangePassword ? "/change-password" : safeNext(params.get("next"), data.user.role) || homeFor(data.user.role);
    navigate(to, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    setError(""); setNeedSchool(false);
    if (!v.check({ identifier: !identifier.trim() && ID_MISSING, password: !password && "Enter your password" })) return;
    busy.current = true;
    setLoading(true);
    try {
      const { ok, status, data } = await signInRequest({ identifier: identifier.trim(), password, ...(school ? { schoolCode: school.code } : {}) });
      if (ok && data.requiresSchoolChoice) { setChoice({ ticket: data.ticket, schools: data.schools || [] }); return; }
      if (ok) return finish(data);
      if (status === 400 && /choose your school/i.test(data.message || "")) { setNeedSchool(true); return; }
      setError(failureMessage(status, data));
    } catch (err) {
      setError(err.message);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const sendCode = async (e) => {
    e?.preventDefault();
    if (busy.current) return;
    setError(""); setNeedSchool(false);
    if (!v.check({ identifier: !identifier.trim() && ID_MISSING })) return;
    busy.current = true; setLoading(true);
    try {
      const { ok, status, data } = await requestCodeRequest({ identifier: identifier.trim(), ...(school ? { schoolCode: school.code } : {}) });
      if (ok) { setCodeSent(true); setWait(60); return; }
      if (status === 400 && /choose your school/i.test(data.message || "")) { setNeedSchool(true); return; }
      setError(data?.message || "Could not send the code. Please try again.");
    } catch (err) { setError(err.message); } finally { busy.current = false; setLoading(false); }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    setError("");
    if (!/^\d{6}$/.test(code.trim())) return setError("Enter the 6-digit code.");
    busy.current = true; setLoading(true);
    try {
      const { ok, status, data } = await codeSignInRequest({ identifier: identifier.trim(), code: code.trim(), ...(school ? { schoolCode: school.code } : {}) });
      if (ok) return finish(data);
      setError(failureMessage(status, data));
    } catch (err) { setError(err.message); } finally { busy.current = false; setLoading(false); }
  };

  const chooseMode = (on) => { setMode(on ? "code" : "password"); setCodeSent(false); setCode(""); setError(""); setNeedSchool(false); };

  const pick = async (code) => {
    if (busy.current) return;
    busy.current = true;
    setPicking(code); setError("");
    try {
      const { ok, status, data } = await chooseSchoolRequest(choice.ticket, code);
      if (ok) return finish(data);
      setError(failureMessage(status, data));
      if (status === 401) setChoice(null); // the ticket ran out: sign in again
    } catch (err) {
      setError(err.message);
    } finally {
      busy.current = false;
      setPicking("");
    }
  };

  if (hostState === "resolving") {
    return <AuthShell school={null}><div role="status" aria-live="polite"><h1 className="au-h1">Opening your school…</h1></div></AuthShell>;
  }
  if (hostState === "unknown") {
    return (
      <AuthShell school={null}>
        <h1 className="au-h1">We can't find this school</h1>
        <p className="au-sub">This web address is not set up for a school on EduAmigo. Please check the address with your school.</p>
        <div className="au-stack"><Link className="au-btn" to="/select-school">Find my school</Link></div>
      </AuthShell>
    );
  }

  if (choice) {
    return (
      <AuthShell school={null}>
        <h1 className="au-h1">Choose your school</h1>
        <p className="au-sub">This mobile number is linked to more than one school. Which one do you want to open?</p>
        {error && <div className="au-alert au-alert--bad" role="alert" style={{ marginTop: 16 }}><AlertCircle size={18} aria-hidden />{error}</div>}
        <div className="au-schools">
          {choice.schools.map((s) => (
            <button key={s.code} type="button" className="au-school-btn" disabled={!!picking} onClick={() => pick(s.code)}>
              <SchoolMark school={s} size={44} />
              <span className="au-school-btn__text"><strong>{s.appName || s.name}</strong><span>{[s.city, s.code].filter(Boolean).join(" · ")}</span></span>
              {picking === s.code ? <span className="au-spin" style={{ borderColor: "#cbd5e1", borderTopColor: "var(--au-brand)" }} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
            </button>
          ))}
        </div>
        <div className="au-stack"><button type="button" className="au-link" onClick={() => { setChoice(null); setError(""); setPassword(""); }}>Use a different ID</button></div>
      </AuthShell>
    );
  }

  const name = school?.appName || school?.name;
  return (
    <AuthShell school={school}>
      <h1 className="au-h1">Welcome back</h1>
      <p className="au-sub">{name ? `Sign in to continue to ${name}.` : "Sign in to your EduAmigo account."}</p>

      {school && (
        <div className="au-chip">
          <SchoolMark school={school} size={40} />
          <div className="au-chip__text"><strong>{name}</strong><span>School code {school.code}</span></div>
          {!tenant && <Link className="au-link" to="/select-school" aria-label={`Change school, now ${name}`}>Change</Link>}
        </div>
      )}

      {notice && <div className={`au-alert au-alert--${notice.kind}`} role="status" style={{ marginTop: 18 }}><Info size={18} aria-hidden />{notice.text}</div>}

      {mode === "code" ? (
        <form className="au-form" onSubmit={codeSent ? verifyCode : sendCode} noValidate aria-label="Sign in with a one-time code">
          <div className="au-field">
            <label className="au-label" htmlFor={FIELDS.identifier}>Email, mobile number or admission number</label>
            <div className="au-box">
              <UserRound size={18} aria-hidden />
              <input id={FIELDS.identifier} className="au-input" value={identifier} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} readOnly={codeSent}
                onChange={(e) => { setIdentifier(e.target.value); v.clear("identifier"); setNeedSchool(false); }} {...v.invalid("identifier")} />
            </div>
            {v.errors.identifier && <p id={v.errorId("identifier")} className="au-err">{v.errors.identifier}</p>}
          </div>
          {codeSent && (
            <div className="au-field">
              <p className="au-alert au-alert--info" role="status"><Info size={18} aria-hidden />If this account exists, we have sent a 6-digit code to its mobile number or email.</p>
              <label className="au-label" htmlFor="login-code">6-digit code</label>
              <div className="au-box">
                <KeyRound size={18} aria-hidden />
                <input id="login-code" className="au-input au-code" value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
          )}
          {needSchool && (
            <div className="au-alert au-alert--info" role="alert"><Info size={18} aria-hidden />
              <span>We need to know your school first. <Link className="au-link" to="/select-school" style={{ minHeight: 0, display: "inline", padding: 0 }}>Choose your school</Link>.</span></div>
          )}
          {error && <div className="au-alert au-alert--bad" role="alert"><AlertCircle size={18} aria-hidden />{error}</div>}
          <button type="submit" className="au-btn" disabled={loading} aria-busy={loading}>
            {loading ? <><span className="au-spin" aria-hidden />Please wait…</> : codeSent ? "Verify and sign in" : "Send me a code"}
          </button>
          {codeSent && <button type="button" className="au-btn au-btn--ghost" onClick={sendCode} disabled={loading || wait > 0}>{wait > 0 ? `Send again in ${wait}s` : "Send the code again"}</button>}
          <div className="au-row" style={{ justifyContent: "center" }}><button type="button" className="au-link" onClick={() => chooseMode(false)}>Use my password instead</button></div>
        </form>
      ) : (
      <form className="au-form" onSubmit={submit} noValidate aria-label="Sign in">
        <div className="au-field">
          <label className="au-label" htmlFor={FIELDS.identifier}>Email, mobile number or admission number</label>
          <div className="au-box">
            <UserRound size={18} aria-hidden />
            <input id={FIELDS.identifier} className="au-input" value={identifier} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              inputMode="text" onChange={(e) => { setIdentifier(e.target.value); v.clear("identifier"); setNeedSchool(false); }} {...v.invalid("identifier")} />
          </div>
          {v.errors.identifier && <p id={v.errorId("identifier")} className="au-err">{v.errors.identifier}</p>}
        </div>

        <div className="au-field">
          <label className="au-label" htmlFor={FIELDS.password}>Password</label>
          <div className="au-box">
            <Lock size={18} aria-hidden />
            <input id={FIELDS.password} className="au-input au-input--end" type={showPassword ? "text" : "password"} value={password} autoComplete="current-password"
              onChange={(e) => { setPassword(e.target.value); v.clear("password"); }} {...v.invalid("password")} />
            <button type="button" className="au-toggle" aria-pressed={showPassword} aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {v.errors.password && <p id={v.errorId("password")} className="au-err">{v.errors.password}</p>}
        </div>

        <div className="au-row"><Link className="au-link" to="/forgot-password">Forgot password?</Link></div>

        {needSchool && (
          <div className="au-alert au-alert--info" role="alert">
            <Info size={18} aria-hidden />
            <span>An admission number belongs to one school, so we need to know which. <Link className="au-link" to="/select-school" style={{ minHeight: 0, display: "inline", padding: 0 }}>Find your school</Link></span>
          </div>
        )}
        {error && <div className="au-alert au-alert--bad" role="alert"><AlertCircle size={18} aria-hidden />{error}</div>}

        <button type="submit" className="au-btn" disabled={loading} aria-busy={loading}>
          {loading ? <><span className="au-spin" aria-hidden />Signing in…</> : "Sign in"}
        </button>
        <div className="au-row" style={{ justifyContent: "center", marginTop: 0 }}><button type="button" className="au-link" onClick={() => chooseMode(true)}>Sign in with a one-time code instead</button></div>
      </form>
      )}

      {!school && !tenant && <p className="au-foot" style={{ marginTop: 18 }}>Signing in with an admission number? <Link to="/select-school">Choose your school first</Link></p>}
      {!tenant && <p className="au-foot">New to EduAmigo? <Link to="/welcome#demo">Request a demo</Link></p>}
    </AuthShell>
  );
}

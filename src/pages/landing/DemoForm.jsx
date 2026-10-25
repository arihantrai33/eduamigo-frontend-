import { useId, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, LoaderCircle, Send } from "lucide-react";
import { useFieldErrors } from "../../utils/fieldErrors";

const API = import.meta.env.VITE_API_URL || "";
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+]?[0-9][0-9\s-]{6,17}$/;

const SIZES = [
  ["", "Select (optional)"], ["under-300", "Under 300"], ["300-1000", "300 to 1,000"],
  ["1000-3000", "1,000 to 3,000"], ["over-3000", "More than 3,000"],
];
const EMPTY = { name: "", schoolName: "", role: "", email: "", phone: "", city: "", students: "", message: "", website: "" };

// "Request a demo". The details are saved on the server for the EduAmigo team; nothing is emailed or sent from here.
export default function DemoForm() {
  const uid = useId();
  const ids = useMemo(() => Object.fromEntries(["name", "schoolName", "email", "phone", "role", "city", "students", "message"].map((k) => [k, `${uid}-${k}`])), [uid]);
  const v = useFieldErrors(ids);
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState("idle"); // idle | sending | done
  const [failure, setFailure] = useState("");
  const busy = useRef(false); // a second click or Enter before the first answer arrives is ignored

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); v.clear(key); };

  const submit = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    setFailure("");
    const ok = v.check({
      name: form.name.trim().length < 2 && "Enter your name.",
      schoolName: form.schoolName.trim().length < 2 && "Enter your school's name.",
      email: !EMAIL.test(form.email.trim()) && "Enter a valid email address, for example name@school.in.",
      phone: form.phone.trim() && !PHONE.test(form.phone.trim()) && "Enter a valid phone number, or leave it empty.",
      message: form.message.length > 1000 && "Keep the message under 1000 characters.",
    });
    if (!ok) return;

    busy.current = true;
    setState("sending");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(`${API}/public/demo-requests`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form), signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setState("done"); return; }
      if (res.status === 400 && data.fieldErrors) {
        v.setErrors(data.fieldErrors);
        const first = Object.keys(data.fieldErrors).find((k) => ids[k]);
        if (first) document.getElementById(ids[first])?.focus();
        setFailure("Please check the highlighted fields.");
      } else if (res.status === 429) {
        setFailure("Too many requests from this network. Please try again in a while.");
      } else if (res.status >= 500) {
        setFailure("Our server is not responding right now. Your details were not sent. Please try again in a minute.");
      } else {
        setFailure(data.message || "Something went wrong. Please try again.");
      }
      setState("idle");
    } catch (err) {
      setFailure(err?.name === "AbortError"
        ? "This is taking too long. Your details may not have been sent. Please try again."
        : "Can't reach EduAmigo. Please check your internet connection and try again.");
      setState("idle");
    } finally {
      clearTimeout(timer);
      busy.current = false;
    }
  };

  if (state === "done") {
    return (
      <div className="lp-form" role="status">
        <div className="lp-done">
          <span className="lp-icon"><Check size={26} aria-hidden /></span>
          <h3>Thank you. We have your request.</h3>
          <p>We will get back to you at <strong style={{ overflowWrap: "anywhere" }}>{form.email.trim()}</strong>.</p>
          <button type="button" className="lp-btn lp-btn--ghost lp-btn--sm" onClick={() => { setForm(EMPTY); setState("idle"); }}>Send another request</button>
        </div>
      </div>
    );
  }

  const field = (key, label, { optional, type = "text", autoComplete, wide, area, options } = {}) => {
    const id = ids[key] || `${uid}-${key}`;
    const props = { id, name: key, value: form[key], onChange: set(key), className: "lp-input", autoComplete, ...v.invalid(key) };
    return (
      <div className={`lp-field${wide ? " lp-field--wide" : ""}`}>
        <label htmlFor={id}>{label}{optional && <span> (optional)</span>}</label>
        {options ? <select {...props}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>
          : area ? <textarea {...props} rows={4} maxLength={1200} />
            : <input {...props} type={type} maxLength={160} />}
        {v.errors[key] && <span id={v.errorId(key)} className="lp-err">{v.errors[key]}</span>}
      </div>
    );
  };

  return (
    <form className="lp-form" onSubmit={submit} noValidate aria-label="Request a demo">
      <div className="lp-form__grid">
        {field("name", "Your name", { autoComplete: "name" })}
        {field("schoolName", "School name", { autoComplete: "organization" })}
        {field("email", "Email", { type: "email", autoComplete: "email" })}
        {field("phone", "Phone", { type: "tel", autoComplete: "tel", optional: true })}
        {field("role", "Your role", { optional: true, autoComplete: "organization-title" })}
        {field("city", "City", { optional: true, autoComplete: "address-level2" })}
        {field("students", "Number of students", { optional: true, options: SIZES })}
        {field("message", "What would you like to see?", { optional: true, area: true, wide: true })}
      </div>
      {/* Hidden from people; automatic form fillers tend to fill it, and the server then ignores the request. */}
      <div className="lp-trap" aria-hidden="true">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label>
      </div>
      {failure && <div className="lp-alert lp-alert--bad" role="alert"><CircleAlert size={18} aria-hidden />{failure}</div>}
      <button type="submit" className="lp-btn lp-btn--primary" disabled={state === "sending"}>
        {state === "sending" ? <><LoaderCircle size={18} className="lp-spin" aria-hidden /> Sending…</> : <><Send size={18} aria-hidden /> Request a demo</>}
      </button>
      <p className="lp-form__note">We use these details only to reply to your request.</p>
    </form>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, GraduationCap, Lock, MessageCircle, ShieldCheck } from "lucide-react";
import "./auth.css";
import { schoolTheme } from "../../utils/theme";
import { schoolColor } from "../../utils/school";

// The school's logo, or its initials on its colour when it has none (or the picture does not load).
export function SchoolMark({ school, size = 48, light = false }) {
  const [failed, setFailed] = useState(false);
  const name = school?.appName || school?.name || "";
  const initials = name.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "E";
  const box = { width: size, height: size, borderRadius: Math.round(size / 4), flexShrink: 0 };
  if (school?.logoUrl && !failed) {
    return <img src={school.logoUrl} alt="" onError={() => setFailed(true)} style={{ ...box, objectFit: "contain", background: "#fff", padding: Math.round(size / 12) }} />;
  }
  return (
    <span aria-hidden="true" style={{ ...box, display: "grid", placeItems: "center", fontWeight: 800, fontSize: size * 0.38, background: light ? "#fff" : schoolColor(school), color: light ? schoolColor(school) : "#fff" }}>
      {initials}
    </span>
  );
}

// CSS variables for the school's colours (EduAmigo indigo when no school is known yet).
function varsFor(school) {
  if (!school) return {};
  const t = schoolTheme(school);
  return {
    "--au-brand": t.primary, "--au-dark": t.dark, "--au-deep": t.deep, "--au-soft": t.soft, "--au-ring": t.ring,
    "--au-text-brand": t.text, "--au-button": t.button, "--au-button-shadow": t.buttonTextShadow, "--au-glow": t.glow,
  };
}

// Short lines that take turns under the headline. Only things the product really does.
const LINES = [
  "Attendance marked in seconds, parents told at once.",
  "Fees, receipts and dues, always in order.",
  "Results and report cards, ready when you are.",
  "The school bus on a live map, with arrival times.",
  "A study companion that explains, step by step.",
];

// Short sample cards that float beside the form on wide screens (decorative, hidden from screen readers; the figures are made up).
function ProductCards() {
  return (
    <div className="au-art" aria-hidden="true">
      <div className="au-gw au-gl1"><div className="au-gc">
        <small><i />Attendance today</small>
        <div className="au-ringw">
          <svg width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="au-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#2563eb" /></linearGradient></defs><circle className="bg" cx="32" cy="32" r="25" /><circle className="fg" cx="32" cy="32" r="25" /></svg>
          <div className="au-pc" />
        </div>
        <div className="au-days">{["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, k) => <span key={d} style={{ "--k": k }}><i />{d}</span>)}</div>
      </div></div>
      <div className="au-gw au-gl2"><div className="au-gc">
        <small><MessageCircle size={14} />Parent · Teacher chat</small>
        <div className="au-chat"><div className="au-bub au-b1">Is the bus on time today?</div><div className="au-bub au-tp"><i /><i /><i /></div><div className="au-bub au-b2">Yes, arriving in 6 min</div></div>
      </div></div>
      <div className="au-gw au-gr1"><div className="au-gc">
        <small><i />Live bus · Route 4</small>
        <div className="au-map">
          <svg viewBox="0 0 272 100"><path pathLength="100" d="M16 76 C64 76 74 22 128 44 S200 66 256 26" fill="none" stroke="#b9cff0" strokeWidth="3" strokeDasharray="1.2 3.4" strokeLinecap="round" /><path className="trail" pathLength="100" d="M16 76 C64 76 74 22 128 44 S200 66 256 26" fill="none" strokeWidth="3.5" strokeLinecap="round" /><circle cx="16" cy="76" r="5" fill="#fff" stroke="#8fb0e0" strokeWidth="2" /><circle cx="128" cy="44" r="5" fill="#fff" stroke="#8fb0e0" strokeWidth="2" /><circle cx="256" cy="26" r="5" fill="#fff" stroke="#8fb0e0" strokeWidth="2" /></svg>
          <i className="au-dot" />
        </div>
        <div className="au-eta"><span>Next stop · Maple Road</span><b /></div>
      </div></div>
      <div className="au-gw au-gr2"><div className="au-gc au-nt">
        <div className="au-toast"><i>✓</i><span>Attendance marked<em>Class 7B · just now</em></span></div>
        <div className="au-toast"><i>★</i><span>Results published<em>Term 1 · report cards ready</em></span></div>
      </div></div>
    </div>
  );
}

function Rotator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % LINES.length), 3600);
    return () => clearInterval(t);
  }, []);
  return <p className="au-rotor" key={i}>{LINES[i]}</p>;
}

// One full-screen stage for sign-in, school selection and password screens: an animated background, the school's name (or
// EduAmigo's headline) above a single card, and the benefits below it. The school's own colours apply once a school is known.
export default function AuthShell({ school, wide = false, children, footer }) {
  const style = useMemo(() => varsFor(school), [school]);
  const name = school?.appName || school?.name;
  return (
    <div className="au" style={style}>
      <div className="au-bg" aria-hidden="true"><i className="au-bl au-bl1" /><i className="au-bl au-bl2" /><i className="au-bl au-bl3" /><i className="au-grid" /></div>
      <ProductCards />
      <a className="au-skip" href="#au-main">Skip to the form</a>
      <header className="au-top">
        <Link className="au-logo" to="/welcome" aria-label="EduAmigo website">
          <span className="au-logo__mark"><GraduationCap size={20} aria-hidden /></span>EduAmigo
        </Link>
        <Link className="au-back" to="/welcome"><ArrowLeft size={16} aria-hidden />Website</Link>
      </header>
      <main className="au-main" id="au-main">
        <div className="au-hero">
          {school ? (
            <>
              <div className="au-crest"><i className="au-ring" /><i className="au-ring" /><i className="au-ring" /><SchoolMark school={school} size={56} light /></div>
              <p className="au-school__name">{name}</p>
              {(school.tagline || school.city) && <p className="au-school__tag">{school.tagline || school.city}</p>}
            </>
          ) : (
            <>
              <p className="au-kicker">School ERP and AI learning</p>
              <p className="au-headline">One login. Your whole school.</p>
            </>
          )}
          <Rotator />
        </div>
        <div className={`au-card${wide ? " au-card--wide" : ""}`}>{children}</div>
        <p className="au-trust"><span><Lock size={15} aria-hidden />Secure sign-in</span><span><ShieldCheck size={15} aria-hidden />Your school's data is private</span></p>
        {footer ?? <p className="au-foot">Powered by <strong>EduAmigo</strong></p>}
      </main>
    </div>
  );
}

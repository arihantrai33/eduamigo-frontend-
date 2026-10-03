import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { findSchoolByCode, searchSchools, saveSchool, schoolColor } from "../utils/school";

// "Find your school": shown once per device, before the first sign-in.
// The user types the school code given by the school, or searches by name, then confirms.
export default function SelectSchool() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const latest = useRef(0);

  // Search as the user types (3+ characters), ignoring answers to older queries.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return undefined;
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchSchools(q);
        if (ticket === latest.current) setResults(found);
      } catch (err) {
        if (ticket === latest.current) setError(err.message);
      } finally {
        if (ticket === latest.current) setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const lookupCode = async () => {
    const q = query.trim();
    if (!q) return setError("Enter your school code or name.");
    if (shown.length === 1) return setSelected(shown[0]);
    try {
      setSelected(await findSchoolByCode(q));
    } catch (err) {
      setError(err.status === 404 ? "No school found with this code. Please check it with your school." : err.message);
    }
  };

  // Results only apply to a query of 3+ characters.
  const shown = query.trim().length >= 3 ? results : [];

  const confirm = () => {
    saveSchool(selected);
    navigate("/login", { replace: true });
  };

  if (selected) {
    const color = schoolColor(selected);
    return (
      <div style={s.page}>
        <div style={s.top}>
          <p style={s.step}>Confirm your school</p>
        </div>
        <div style={s.card}>
          <div style={{ ...s.confirmCard, borderColor: color }}>
            <SchoolLogo school={selected} size={72} />
            <h2 style={{ ...s.heading, textAlign: "center", margin: "14px 0 4px" }}>{selected.appName || selected.name}</h2>
            {selected.appName && selected.appName !== selected.name && <p style={s.muted}>{selected.name}</p>}
            {selected.city && <p style={s.muted}>📍 {selected.city}</p>}
            <p style={{ ...s.muted, marginTop: 8 }}>School code: <strong style={{ color: "var(--text)" }}>{selected.code}</strong></p>
          </div>
          <button onClick={confirm} style={{ ...s.btn, background: color }}>Yes, this is my school</button>
          <button onClick={() => setSelected(null)} style={s.linkBtn}>No, search again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.top}>
        <div style={s.logoBox}>🎓</div>
        <h1 style={s.brand}>EduAmigo</h1>
        <p style={s.tagline}>Find your school</p>
      </div>
      <div style={s.card}>
        <h2 style={s.heading}>Which school are you from?</h2>
        <p style={s.sub}>Enter the school code given by your school, or search by the school's name.</p>
        <label style={s.label}>School code or name</label>
        <input
          autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && lookupCode()}
          placeholder="e.g. GVPS or Green Valley" style={s.input}
          autoCapitalize="characters" autoComplete="off"
        />
        {error && <div style={s.err}>⚠️ {error}</div>}

        {searching && <p style={s.muted}>Searching…</p>}
        {!searching && query.trim().length >= 3 && shown.length === 0 && !error && (
          <p style={s.muted}>No school matches "{query.trim()}". Check the spelling, or ask your school for its code.</p>
        )}
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {shown.map((school) => (
            <button key={school.code} onClick={() => setSelected(school)} style={s.result}>
              <SchoolLogo school={school} size={40} />
              <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{school.name}</div>
                <div style={{ fontSize: 11, color: "var(--subtext)" }}>{[school.city, school.code].filter(Boolean).join(" · ")}</div>
              </div>
              <span style={{ color: "var(--subtext)" }}>›</span>
            </button>
          ))}
        </div>

        <button onClick={lookupCode} style={s.btn}>Continue</button>
        <p style={{ ...s.muted, marginTop: 18, textAlign: "center" }}>
          Got a link or QR code from your school? Open it on this phone and your school is selected automatically.
        </p>
      </div>
    </div>
  );
}

// /s/:code — school link or QR code: selects the school and goes straight to sign-in.
export function SchoolLink() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    findSchoolByCode(code)
      .then((school) => { saveSchool(school); navigate("/login", { replace: true }); })
      .catch(() => setError("This school link is not valid. Please search for your school instead."));
  }, [code, navigate]);
  return (
    <div style={s.page}>
      <div style={{ ...s.card, marginTop: 120, textAlign: "center" }}>
        {error ? (
          <>
            <div style={s.err}>⚠️ {error}</div>
            <button onClick={() => navigate("/select-school", { replace: true })} style={s.btn}>Find my school</button>
          </>
        ) : <p style={s.muted}>Opening your school…</p>}
      </div>
    </div>
  );
}

export function SchoolLogo({ school, size = 48 }) {
  const color = schoolColor(school);
  if (school?.logoUrl) {
    return <img src={school.logoUrl} alt="" style={{ width: size, height: size, borderRadius: size / 4, objectFit: "contain", background: "white", flexShrink: 0 }} />;
  }
  const initials = String(school?.name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: size / 4, background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.38, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(160deg, #0f1b4c 0%, #1a3a8f 50%, #0f1b4c 100%)", fontFamily: "'Inter','Segoe UI',sans-serif", overflowY: "auto" },
  top: { display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 24px 18px" },
  logoBox: { width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 12 },
  brand: { color: "white", fontSize: 24, fontWeight: 700, margin: "0 0 4px", letterSpacing: 0.5 },
  tagline: { color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", margin: 0 },
  step: { color: "rgba(255,255,255,0.8)", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "20px 0 0" },
  card: { flex: 1, background: "var(--card)", borderRadius: 24, padding: "24px 20px 40px", overflowY: "auto" },
  heading: { fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" },
  sub: { fontSize: 13, color: "var(--subtext)", margin: "0 0 20px", lineHeight: 1.5 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 5 },
  input: { width: "100%", padding: "12px 13px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 15, color: "var(--text)", outline: "none", boxSizing: "border-box", background: "var(--input)", marginBottom: 12 },
  muted: { fontSize: 12, color: "var(--subtext)", margin: "0 0 6px", lineHeight: 1.5, textAlign: "center" },
  err: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "9px 13px", fontSize: 12, marginBottom: 12 },
  result: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 12, background: "var(--input)", cursor: "pointer" },
  confirmCard: { display: "flex", flexDirection: "column", alignItems: "center", border: "2px solid", borderRadius: 18, padding: "24px 16px", marginBottom: 20 },
  btn: { width: "100%", padding: 13, background: "linear-gradient(135deg, #1a3a8f, #4f8ef7)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  linkBtn: { width: "100%", padding: 12, marginTop: 8, background: "none", border: "none", color: "var(--subtext)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};

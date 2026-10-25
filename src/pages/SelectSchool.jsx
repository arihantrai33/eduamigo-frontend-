import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ChevronRight, MapPin, Search } from "lucide-react";
import AuthShell, { SchoolMark } from "./auth/AuthShell";
import { findSchoolByCode, getSavedSchool, saveSchool, searchSchools } from "../utils/school";
import { isTenantHost } from "../utils/tenantHost";
import { errorMessage } from "../utils/toast";

// "Find your school": by the code the school gave, or by name. Only registered schools are listed, with what a sign-in screen
// needs (name, city, logo); the choice only decides whose sign-in page opens, what a person may see is decided at sign-in.
export default function SelectSchool() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const latest = useRef(0);
  const saved = getSavedSchool();

  // A school's own address has its school already.
  useEffect(() => { if (isTenantHost()) navigate("/login", { replace: true }); }, [navigate]);

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
        if (ticket === latest.current) setError(errorMessage(err, "Could not search for schools"));
      } finally {
        if (ticket === latest.current) setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const shown = query.trim().length >= 3 ? results : [];

  const lookupCode = async () => {
    const q = query.trim();
    if (!q) return setError("Enter your school code or name.");
    if (shown.length === 1) return setSelected(shown[0]);
    try {
      setSelected(await findSchoolByCode(q));
    } catch (err) {
      setError(err.status === 404 ? "No school found with this code. Please check it with your school." : errorMessage(err, "Could not look up the school code"));
    }
  };

  const confirm = () => {
    saveSchool(selected);
    navigate("/login", { replace: true });
  };

  if (selected) {
    return (
      <AuthShell school={selected}>
        <h1 className="au-h1">Is this your school?</h1>
        <div className="au-confirm">
          <SchoolMark school={selected} size={72} />
          <h2>{selected.appName || selected.name}</h2>
          {selected.appName && selected.appName !== selected.name && <p>{selected.name}</p>}
          {selected.city && <p style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={14} aria-hidden />{selected.city}</p>}
          <p>School code: <strong style={{ color: "var(--au-ink)" }}>{selected.code}</strong></p>
        </div>
        <div className="au-stack">
          <button type="button" className="au-btn" onClick={confirm} autoFocus>Yes, this is my school</button>
          <button type="button" className="au-btn au-btn--ghost" onClick={() => setSelected(null)}>No, search again</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell school={null}>
      <h1 className="au-h1">Find your school</h1>
      <p className="au-sub">Enter the school code your school gave you, or search by the school's name.</p>

      <form className="au-form" onSubmit={(e) => { e.preventDefault(); lookupCode(); }} noValidate>
        <div className="au-field">
          <label className="au-label" htmlFor="school-query">School code or name</label>
          <div className="au-box">
            <Search size={18} aria-hidden />
            <input id="school-query" className="au-input" autoFocus value={query} autoCapitalize="characters" autoComplete="off" spellCheck={false}
              onChange={(e) => { setQuery(e.target.value); setError(""); }}
              aria-invalid={error ? true : undefined} aria-describedby={error ? "school-query-error" : undefined} />
          </div>
        </div>
        {error && <div id="school-query-error" className="au-alert au-alert--bad" role="alert"><AlertCircle size={18} aria-hidden />{error}</div>}
        <div role="status" aria-live="polite">
          {searching && <p className="au-sub" style={{ marginTop: 0 }}>Searching…</p>}
          {!searching && query.trim().length >= 3 && shown.length === 0 && !error && (
            <p className="au-sub" style={{ marginTop: 0 }}>No school matches "{query.trim()}". Check the spelling, or ask your school for its code.</p>
          )}
        </div>
        {shown.length > 0 && (
          <ul className="au-schools" style={{ marginTop: 0 }} aria-label="Matching schools">
            {shown.map((school) => (
              <li key={school.code}>
                <button type="button" className="au-school-btn" onClick={() => setSelected(school)}>
                  <SchoolMark school={school} size={44} />
                  <span className="au-school-btn__text"><strong>{school.name}</strong><span>{[school.city, school.code].filter(Boolean).join(" · ")}</span></span>
                  <ChevronRight size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="submit" className="au-btn">Continue</button>
      </form>

      {saved && (
        <div className="au-chip" style={{ marginTop: 22 }}>
          <SchoolMark school={saved} size={40} />
          <div className="au-chip__text"><strong>{saved.appName || saved.name}</strong><span>Selected on this device</span></div>
          <Link className="au-link" to="/login">Continue</Link>
        </div>
      )}

      <div className="au-help">
        <strong>Can't find your school?</strong> Ask the school office for its code, sign-in link or QR code.
        {" "}New to EduAmigo? <Link className="au-link" to="/welcome#demo" style={{ minHeight: 0, display: "inline", padding: 0 }}>Request a demo</Link>.
      </div>
      <p className="au-foot">Have an email or mobile number? <Link to="/login">Sign in without choosing a school</Link></p>
    </AuthShell>
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
    <AuthShell school={null}>
      {error ? (
        <>
          <h1 className="au-h1">This link did not work</h1>
          <div className="au-alert au-alert--bad" role="alert" style={{ marginTop: 16 }}><AlertCircle size={18} aria-hidden />{error}</div>
          <div className="au-stack"><button type="button" className="au-btn" onClick={() => navigate("/select-school", { replace: true })}>Find my school</button></div>
        </>
      ) : <div role="status" aria-live="polite"><h1 className="au-h1">Opening your school…</h1></div>}
    </AuthShell>
  );
}

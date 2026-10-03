import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, errorMessage, confirmAction } from "../../utils/toast";

// End of the academic year: promote, detain, leave or pass out (backend: /api/academic/year-end),
// and transfer certificates for students who have left.
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const ACTIONS = [
  { value: "promote", label: "Promote" },
  { value: "detain", label: "Detain (same class)" },
  { value: "leave", label: "Leaving (TC)" },
  { value: "graduate", label: "Pass out" },
];

export default function YearEnd() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("year");
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState("");
  const [toSession, setToSession] = useState("");
  const [classes, setClasses] = useState([]);
  const [preview, setPreview] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [former, setFormer] = useState(null);

  useEffect(() => {
    Promise.all([axios.get(`${API}/academic/sessions`, auth()), axios.get(`${API}/academic/classes`, auth())])
      .then(([s, c]) => {
        setSessions(s.data.data || []);
        setCurrent(s.data.current || "");
        setClasses(c.data.data || []);
        const next = (s.data.data || []).filter((x) => x.name > (s.data.current || "")).sort((a, b) => a.name.localeCompare(b.name))[0];
        if (next) setToSession(next.name);
      })
      .catch((err) => toast.error(errorMessage(err)));
  }, []);

  const loadPreview = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await axios.get(`${API}/academic/year-end?toSession=${encodeURIComponent(toSession)}`, auth());
      setPreview(r.data.data);
      setDecisions({});
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadFormer = () => {
    axios.get(`${API}/students?former=true`, auth()).then((r) => setFormer(r.data.data || [])).catch((err) => toast.error(errorMessage(err)));
  };
  const openTab = (t) => { setTab(t); if (t === "former" && !former) loadFormer(); };

  // The decision shown for a student: what the admin chose, else the suggestion.
  const decisionFor = (row) => decisions[row.student._id] || row.suggestion;
  const setDecision = (row, patch) => {
    const base = decisionFor(row);
    let next = { ...base, ...patch };
    if (patch.action === "promote" && !next.toClass) next = { ...next, ...row.suggestion.action === "promote" ? row.suggestion : {} };
    setDecisions((d) => ({ ...d, [row.student._id]: next }));
  };

  const groups = useMemo(() => {
    const map = new Map();
    for (const row of preview?.students || []) {
      const key = `${row.student.class}-${row.student.section}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return [...map.entries()];
  }, [preview]);

  const counts = useMemo(() => {
    const c = { promote: 0, detain: 0, leave: 0, graduate: 0, done: 0 };
    for (const row of preview?.students || []) c[row.alreadyInSession ? "done" : decisionFor(row).action] += 1;
    return c;
  }, [preview, decisions]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = async () => {
    const leavingWithoutReason = (preview?.students || []).filter((r) => !r.alreadyInSession && decisionFor(r).action === "leave" && !decisionFor(r).reason);
    if (leavingWithoutReason.length) return toast.error(`Add a reason for ${leavingWithoutReason[0].student.name} (and anyone else leaving).`);
    const ok = await confirmAction(
      `Apply the year end into ${toSession}? ${counts.promote} promoted, ${counts.detain} detained, ${counts.graduate} pass out, ${counts.leave} leaving. Students who leave or pass out lose access to the app.`,
      { confirmLabel: "Apply year end" },
    );
    if (!ok) return;
    setBusy(true);
    try {
      const body = {
        toSession, makeCurrent,
        decisions: Object.entries(decisions).map(([studentId, d]) => ({ studentId, action: d.action, toClass: d.toClass, toSection: d.toSection, reason: d.reason })),
      };
      const r = await axios.post(`${API}/academic/year-end`, body, auth());
      setResult(r.data);
      toast.success(r.data.message);
      setPreview(null);
      setFormer(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sectionsOf = (cls) => classes.find((c) => c.name === cls)?.sections.map((s) => s.name) || [];
  const upcoming = sessions.filter((s) => s.name !== current);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1050, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Year End</h1>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Move students to the next session, and issue transfer certificates</p>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["year", "Promote and detain"], ["former", "Former students and TCs"]].map(([k, l]) => (
          <button key={k} onClick={() => openTab(k)} style={{ ...ghost, ...(tab === k ? { background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" } : {}) }}>{l}</button>
        ))}
      </div>

      {tab === "year" && (
        <>
          <div style={{ ...card, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "#475569" }}>Current session: <strong>{current || "—"}</strong></div>
            <label style={lbl}>Move students into
              <select style={input} value={toSession} onChange={(e) => { setToSession(e.target.value); setPreview(null); }}>
                <option value="">Choose a session</option>
                {upcoming.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </label>
            <button style={btn} disabled={!toSession || busy} onClick={loadPreview}>Show students</button>
            {!upcoming.length && <span style={{ fontSize: 12, color: "#B45309" }}>Create next year's session in <a href="/admin/academic" onClick={(e) => { e.preventDefault(); navigate("/admin/academic"); }}>School Setup</a> first.</span>}
          </div>

          {result && <div style={{ ...card, borderColor: "#86EFAC", background: "#F0FDF4", color: "#166534", fontSize: 13 }}>✅ {result.message}{result.data.skipped ? `; ${result.data.skipped} were already in ${toSession}` : ""}. New roll numbers were given in every class.</div>}

          {preview && (
            <>
              <div style={{ ...card, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", fontSize: 13 }}>
                <span><strong>{counts.promote}</strong> promote</span>
                <span><strong>{counts.detain}</strong> detain</span>
                <span><strong>{counts.graduate}</strong> pass out</span>
                <span><strong>{counts.leave}</strong> leaving</span>
                {counts.done > 0 && <span style={{ color: "#64748B" }}>{counts.done} already in {toSession}</span>}
                <span style={{ flex: 1 }} />
                <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={makeCurrent} onChange={(e) => setMakeCurrent(e.target.checked)} />Make {toSession} the current session</label>
                <button style={btn} disabled={busy} onClick={apply}>{busy ? "Applying…" : "Apply year end"}</button>
              </div>
              {groups.map(([key, rows]) => (
                <div key={key} style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", background: "#F8FAFC", borderBottom: "1px solid #EEF0F4", fontWeight: 700, fontSize: 13 }}>Class {key} · {rows.length} students</div>
                  {rows.map((row) => {
                    const d = decisionFor(row);
                    return (
                      <div key={row.student._id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "10px 16px", borderBottom: "1px solid #F1F5F9", opacity: row.alreadyInSession ? 0.5 : 1 }}>
                        <div style={{ width: 210 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{row.student.name}</div>
                          <div style={{ fontSize: 11.5, color: "#64748B" }}>Adm. {row.student.admissionNo || "—"} · Roll {row.student.rollNumber}</div>
                        </div>
                        {row.alreadyInSession ? <span style={{ fontSize: 12, color: "#64748B" }}>Already moved to {toSession}</span> : (
                          <>
                            <select style={input} value={d.action} onChange={(e) => setDecision(row, { action: e.target.value })}>
                              {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                            {d.action === "promote" && (
                              <>
                                <select style={input} value={d.toClass || ""} onChange={(e) => setDecision(row, { toClass: e.target.value, toSection: sectionsOf(e.target.value)[0] || "" })}>
                                  <option value="">Class…</option>
                                  {classes.map((c) => <option key={c.name} value={c.name}>{c.displayName || `Class ${c.name}`}</option>)}
                                </select>
                                <select style={input} value={d.toSection || ""} onChange={(e) => setDecision(row, { toSection: e.target.value })}>
                                  <option value="">Section…</option>
                                  {sectionsOf(d.toClass).map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </>
                            )}
                            {d.action === "leave" && (
                              <input style={{ ...input, flex: 1, minWidth: 200 }} placeholder="Reason for leaving (shown on the TC)" value={d.reason || ""} onChange={(e) => setDecision(row, { reason: e.target.value })} />
                            )}
                            {row.suggestion.note && <span style={{ fontSize: 11.5, color: "#B45309" }}>{row.suggestion.note}</span>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {!groups.length && <div style={card}>No active students.</div>}
            </>
          )}
        </>
      )}

      {tab === "former" && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {!former && <p style={{ padding: 20, color: "#64748B" }}>Loading…</p>}
          {former && former.length === 0 && <p style={{ padding: 20, color: "#64748B" }}>No former students yet.</p>}
          {former && former.map((s) => (
            <div key={s._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>
                  Adm. {s.admissionNo || "—"} · Last class {s.exit?.lastClass || `${s.class}-${s.section}`} · {s.exit?.status === "graduated" ? "Passed out" : "Left"}
                  {s.exit?.date ? ` on ${new Date(s.exit.date).toLocaleDateString("en-IN")}` : ""}{s.exit?.reason ? ` · ${s.exit.reason}` : ""}
                </div>
              </div>
              {s.exit?.tcNumber && <span style={{ fontSize: 12, color: "#64748B" }}>{s.exit.tcNumber}</span>}
              <button style={ghost} onClick={() => navigate(`/admin/tc/${s._id}`)}>{s.exit?.tcNumber ? "View TC" : "Issue TC"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const card = { background: "#fff", border: "1px solid #E8E8E5", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 14 };
const lbl = { fontSize: 11, color: "#64748B", fontWeight: 600, display: "flex", flexDirection: "column", gap: 4 };
const input = { padding: "7px 9px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, color: "#0F172A", background: "#F8FAFC" };
const btn = { padding: "8px 14px", borderRadius: 8, border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const ghost = { padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#334155", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };

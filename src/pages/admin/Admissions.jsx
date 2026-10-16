import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, errorMessage, showCredentials, confirmAction } from "../../utils/toast";
import { Plus } from "lucide-react";
import Modal from "../../components/Dialog";
import Glyph from "../../components/Glyph";
import PageHeader from "../../components/ui/PageHeader";
import Chips from "../../components/ui/Chips";
import Skeleton from "../../components/ui/Skeleton";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const CLASS_SUGGESTIONS = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const STATUS_STYLE = {
  Enquiry:          { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  Applied:          { bg: "var(--brand-soft)", color: "var(--brand-text)", border: "var(--brand-border)" },
  "Test Scheduled": { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" },
  Approved:         { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  Admitted:         { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  Rejected:         { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
  Withdrawn:        { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" },
};
const ACTION_LABEL = {
  Applied: "Mark as applied", "Test Scheduled": "Schedule test", Approved: "Approve",
  Rejected: "Reject", Withdrawn: "Mark withdrawn", Enquiry: "Reopen as enquiry",
};
const EMPTY = {
  studentName: "", classApplied: "", gender: "", dateOfBirth: "", previousSchool: "",
  parentName: "", parentPhone: "", parentEmail: "", address: "", source: "Walk-in", notes: "", followUpDate: "",
};

const dateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const fmtDate = (d, time = false) => (d ? new Date(d).toLocaleString("en-IN", time
  ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
  : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—");

function Badge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Withdrawn;
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>{status}</span>;
}

function Field({ label, required, children, full }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: full ? "1 / -1" : undefined }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{label}{required && <span style={{ color: "#B91C1C" }}> *</span>}</span>
      {children}
    </label>
  );
}

const input = { padding: "9px 11px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: "#0F172A" };
const btn = (variant = "primary") => ({
  padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  border: variant === "ghost" ? "1px solid #E2E8F0" : "none",
  background: variant === "primary" ? "var(--brand)" : variant === "danger" ? "#DC2626" : variant === "success" ? "#059669" : "#fff",
  color: variant === "ghost" ? "#334155" : "#fff",
});

// Enquiry form, used for both new enquiries and edits.
function EnquiryForm({ initial, sources, onCancel, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial, dateOfBirth: dateInput(initial?.dateOfBirth), followUpDate: dateInput(initial?.followUpDate) });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const editing = !!initial?._id;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, form[k]]));
      const res = editing
        ? await axios.put(`${API}/admissions/${initial._id}`, payload, auth())
        : await axios.post(`${API}/admissions`, payload, auth());
      toast.success(editing ? "Details updated" : `Enquiry recorded (${res.data.data.applicationNo})`);
      onSaved(res.data.data);
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the enquiry"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Field label="Student name" required><input style={input} value={form.studentName} onChange={set("studentName")} required /></Field>
        <Field label="Class applied for" required>
          <input style={input} list="adm-classes" value={form.classApplied} onChange={set("classApplied")} placeholder="e.g. 6" required />
          <datalist id="adm-classes">{CLASS_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Gender">
          <select style={input} value={form.gender} onChange={set("gender")}>
            <option value="">Not specified</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </Field>
        <Field label="Date of birth"><input type="date" style={input} value={form.dateOfBirth} onChange={set("dateOfBirth")} /></Field>
        <Field label="Previous school" full><input style={input} value={form.previousSchool} onChange={set("previousSchool")} /></Field>
        <Field label="Parent / guardian name" required><input style={input} value={form.parentName} onChange={set("parentName")} required /></Field>
        <Field label="Parent mobile" required><input style={input} value={form.parentPhone} onChange={set("parentPhone")} inputMode="tel" placeholder="10-digit mobile" required /></Field>
        <Field label="Parent email"><input type="email" style={input} value={form.parentEmail} onChange={set("parentEmail")} /></Field>
        <Field label="Source">
          <select style={input} value={form.source} onChange={set("source")}>{sources.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Address" full><input style={input} value={form.address} onChange={set("address")} /></Field>
        <Field label="Follow-up date"><input type="date" style={input} value={form.followUpDate} onChange={set("followUpDate")} /></Field>
        <Field label="Notes" full><textarea style={{ ...input, minHeight: 70, resize: "vertical" }} value={form.notes} onChange={set("notes")} /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
        <button type="button" style={btn("ghost")} onClick={onCancel}>Cancel</button>
        <button type="submit" style={btn()} disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Record enquiry"}</button>
      </div>
    </form>
  );
}

// Moves an application to its next status (with an optional note and the test date when needed).
function StatusDialog({ record, status, onCancel, onDone }) {
  const [note, setNote] = useState("");
  const [testDate, setTestDate] = useState(dateInput(record.testDate));
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.patch(`${API}/admissions/${record._id}/status`, { status, note, ...(status === "Test Scheduled" ? { testDate } : {}) }, auth());
      toast.success(`${record.studentName}: ${status}`);
      onDone(res.data.data);
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the status"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={`${ACTION_LABEL[status] || status} — ${record.studentName}`} onClose={onCancel} width={440}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {status === "Test Scheduled" && (
          <Field label="Test / interaction date" required><input type="date" style={input} value={testDate} onChange={(e) => setTestDate(e.target.value)} required /></Field>
        )}
        <Field label={status === "Rejected" || status === "Withdrawn" ? "Reason" : "Note (optional)"}>
          <textarea style={{ ...input, minHeight: 70 }} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" style={btn("ghost")} onClick={onCancel}>Cancel</button>
          <button type="submit" style={btn(status === "Rejected" ? "danger" : "primary")} disabled={saving}>{saving ? "Saving..." : ACTION_LABEL[status] || status}</button>
        </div>
      </form>
    </Modal>
  );
}

// Creates the student (and the parent login when needed) from an approved application.
function AdmitDialog({ record, onCancel, onDone }) {
  const [defaults, setDefaults] = useState(null);
  const [form, setForm] = useState({ section: "", rollNumber: "", studentEmail: "", studentPhone: "" });
  const [saving, setSaving] = useState(false);

  const loadDefaults = useCallback((section) => axios
    .get(`${API}/admissions/${record._id}/admit-defaults`, { ...auth(), params: section ? { section } : {} })
    .then((res) => {
      setDefaults(res.data.data);
      setForm((f) => ({ ...f, section: res.data.data.section, rollNumber: res.data.data.rollNumber }));
    })
    .catch((err) => toast.error(errorMessage(err, "Could not load class details"))), [record._id]);
  useEffect(() => { loadDefaults(); }, [loadDefaults]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(`${API}/admissions/${record._id}/admit`, form, auth());
      const { credentials, student, linkedExistingParent } = res.data;
      toast.success(`${student.name} admitted to Class ${student.class}-${student.section}`);
      showCredentials([
        { label: "Student", ...(credentials?.student || {}) },
        { label: "Parent", ...(credentials?.parent || {}) },
      ], linkedExistingParent ? "Student admitted (linked to the existing parent account)" : "Student admitted");
      onDone({ ...res.data.data, student });
    } catch (err) {
      toast.error(errorMessage(err, "Could not admit the student"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Admit ${record.studentName} to Class ${record.classApplied}`} onClose={onCancel} width={480}>
      {!defaults ? <Skeleton rows={3} label="Loading" /> : (
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Section" required>
            <input style={input} list="adm-sections" value={form.section} required
              onChange={(e) => setForm((f) => ({ ...f, section: e.target.value.toUpperCase() }))}
              onBlur={(e) => e.target.value && loadDefaults(e.target.value)} />
            <datalist id="adm-sections">{defaults.sections.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <Field label="Roll number">
            <input style={input} value={form.rollNumber} onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))} />
          </Field>
          <Field label="Student login email" required full>
            <input type="email" style={input} value={form.studentEmail} required onChange={(e) => setForm((f) => ({ ...f, studentEmail: e.target.value }))} />
          </Field>
          <Field label="Student mobile (defaults to the parent's)" full>
            <input style={input} value={form.studentPhone} inputMode="tel" onChange={(e) => setForm((f) => ({ ...f, studentPhone: e.target.value }))} placeholder={record.parentPhone} />
          </Field>
          <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--ea-muted)", background: "#F8FAFC", borderRadius: 8, padding: "10px 12px" }}>
            A student account is created with a temporary password. {record.parentEmail
              ? `A parent account is created for ${record.parentEmail} unless that parent already has one (siblings are linked).`
              : "No parent email is on record, so no parent login is created. You can add the parent later from All Parents."}
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" style={btn("ghost")} onClick={onCancel}>Cancel</button>
            <button type="submit" style={btn("success")} disabled={saving}>{saving ? "Admitting..." : "Admit student"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function Detail({ record, next, onClose, onEdit, onStatus, onAdmit, onOpenStudent }) {
  const row = (label, value) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}>
      <span style={{ color: "var(--ea-muted)" }}>{label}</span><span style={{ color: "#0F172A", fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.35)", zIndex: 900 }} onClick={onClose}>
      <aside aria-label="Application details" onClick={(e) => e.stopPropagation()}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 440, background: "#fff", overflowY: "auto", boxShadow: "-10px 0 30px rgba(0,0,0,.12)", padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--ea-muted)", fontWeight: 600 }}>{record.applicationNo}</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{record.studentName}</div>
            <div style={{ marginTop: 6 }}><Badge status={record.status} /></div>
          </div>
          <button aria-label="Close" onClick={onClose} style={{ border: "none", background: "#F1F5F9", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18 }}><Glyph e="×" /></button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0" }}>
          {record.status === "Approved" && <button style={btn("success")} onClick={onAdmit}>Admit student</button>}
          {(next || []).map((s) => (
            <button key={s} style={btn(s === "Rejected" ? "danger" : s === "Withdrawn" || s === "Enquiry" ? "ghost" : "primary")} onClick={() => onStatus(s)}>{ACTION_LABEL[s] || s}</button>
          ))}
          {record.status !== "Admitted" && <button style={btn("ghost")} onClick={onEdit}>Edit details</button>}
          {record.student && <button style={btn("ghost")} onClick={onOpenStudent}>Open student profile</button>}
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ea-muted)", letterSpacing: .6, marginTop: 6 }}>APPLICANT</div>
        {row("Class applied for", `Class ${record.classApplied}`)}
        {row("Academic year", record.academicYear)}
        {row("Gender", record.gender)}
        {row("Date of birth", record.dateOfBirth && fmtDate(record.dateOfBirth))}
        {row("Previous school", record.previousSchool)}
        {record.testDate && row("Test date", fmtDate(record.testDate))}
        {record.followUpDate && row("Follow-up", fmtDate(record.followUpDate))}
        {record.student && row("Admitted as", `Class ${record.student.class}-${record.student.section}, Roll ${record.student.rollNumber}`)}

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ea-muted)", letterSpacing: .6, marginTop: 18 }}>PARENT</div>
        {row("Name", record.parentName)}
        {row("Mobile", record.parentPhone)}
        {row("Email", record.parentEmail)}
        {row("Address", record.address)}
        {row("Source", record.source)}
        {record.notes && <div style={{ fontSize: 13, color: "#334155", background: "#F8FAFC", borderRadius: 8, padding: 10, marginTop: 10, whiteSpace: "pre-wrap" }}>{record.notes}</div>}

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ea-muted)", letterSpacing: .6, marginTop: 18, marginBottom: 8 }}>HISTORY</div>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {[...(record.history || [])].reverse().map((h, i) => (
            <li key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: (STATUS_STYLE[h.status] || {}).color || "#94A3B8", marginTop: 6, flexShrink: 0 }} />
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: "#0F172A" }}>{h.status}</div>
                {h.note && <div style={{ color: "#475569", marginTop: 2 }}>{h.note}</div>}
                <div style={{ color: "var(--ea-muted)", fontSize: 11, marginTop: 2 }}>{fmtDate(h.at, true)}</div>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

export default function Admissions() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [options, setOptions] = useState({ statuses: [], sources: ["Walk-in"], next: {} });
  const [academicYear, setAcademicYear] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [klass, setKlass] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);        // {} for new, record for edit
  const [statusTo, setStatusTo] = useState(null); // target status
  const [admitting, setAdmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admissions`, { ...auth(), params: { status: status || undefined, search: search.trim() || undefined, class: klass || undefined } });
      setRows(res.data.data || []);
      setCounts(res.data.counts || {});
      setOptions(res.data.options);
      setAcademicYear(res.data.academicYear);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Could not load admissions"));
    } finally {
      setLoading(false);
    }
  }, [status, search, klass]);

  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t); }, [load, search]);

  // Keep the drawer in sync after an action.
  const refreshWith = (doc) => {
    setSelected((cur) => (cur && doc && cur._id === doc._id ? { ...cur, ...doc, student: doc.student && typeof doc.student === "object" ? doc.student : cur.student } : cur));
    load();
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const open = (counts.Enquiry || 0) + (counts.Applied || 0) + (counts["Test Scheduled"] || 0) + (counts.Approved || 0);
  const classes = [...new Set(rows.map((r) => r.classApplied))].sort((a, b) => (Number(a) || 0) - (Number(b) || 0) || a.localeCompare(b));

  return (
    <div style={{ fontFamily: "inherit" }}>
      <div style={{ marginBottom: 18 }}>
        <PageHeader title="Admissions"
          subtitle={`Academic year ${academicYear || "—"} · ${total} total · ${open} in progress · ${counts.Admitted || 0} admitted`}
          actions={<button type="button" className="ea-btn ea-btn--primary" onClick={() => setForm({})}><Plus size={16} aria-hidden="true" /> New enquiry</button>} />
      </div>

      {/* Pipeline */}
      <div style={{ marginBottom: 16 }}>
        <Chips label="Filter by admission status" value={status} onChange={setStatus}
          items={[{ value: "", label: "All", count: total }, ...options.statuses.map((s) => ({ value: s, label: s, count: counts[s] || 0 }))]} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <input style={{ ...input, flex: "1 1 260px" }} aria-label="Search enquiries" placeholder="Search by student, parent, mobile or application no." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={input} value={klass} onChange={(e) => setKlass(e.target.value)} aria-label="Filter by class">
          <option value="">All classes</option>
          {[...new Set([...classes, ...(klass ? [klass] : [])])].map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>

      {error && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{error} <button style={{ ...btn("ghost"), padding: "4px 10px", marginLeft: 8 }} onClick={load}>Retry</button></div>}

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", overflowX: "auto" }}>
        <table data-stack style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
          <thead>
            <tr style={{ background: "#F8FAFC", textAlign: "left", color: "#475569" }}>
              {["Application", "Student", "Class", "Parent", "Mobile", "Status", "Next date", "Updated"].map((h) => (
                <th key={h} style={{ padding: "11px 14px", fontWeight: 700, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && <tr><td colSpan={8} style={{ padding: 20 }}><Skeleton rows={4} label="Loading admissions" /></td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 36, textAlign: "center", color: "var(--ea-muted)" }}>
                {total === 0 ? "No enquiries yet this year. Record the first one with New enquiry." : "No applications match these filters."}
              </td></tr>
            )}
            {rows.map((r) => {
              const nextDate = r.status === "Test Scheduled" ? r.testDate : r.followUpDate;
              return (
                <tr key={r._id} onClick={() => setSelected(r)} style={{ borderTop: "1px solid #F1F5F9", cursor: "pointer" }}>
                  <td style={{ padding: "11px 14px", color: "var(--ea-muted)", fontWeight: 600 }}>{r.applicationNo}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: "#0F172A" }}>{r.studentName}</td>
                  <td style={{ padding: "11px 14px" }}>{r.classApplied}{r.student ? `-${r.student.section}` : ""}</td>
                  <td style={{ padding: "11px 14px" }}>{r.parentName}</td>
                  <td style={{ padding: "11px 14px" }}>{r.parentPhone}</td>
                  <td style={{ padding: "11px 14px" }}><Badge status={r.status} /></td>
                  <td style={{ padding: "11px 14px", color: nextDate && new Date(nextDate) < new Date(new Date().toDateString()) && !["Admitted", "Rejected", "Withdrawn"].includes(r.status) ? "#DC2626" : "#334155" }}>
                    {nextDate ? `${r.status === "Test Scheduled" ? "Test " : "Follow-up "}${fmtDate(nextDate)}` : "—"}
                  </td>
                  <td style={{ padding: "11px 14px", color: "var(--ea-muted)" }}>{fmtDate(r.updatedAt, false)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <Detail record={selected} next={options.next[selected.status]} onClose={() => setSelected(null)}
          onEdit={() => setForm(selected)} onStatus={setStatusTo} onAdmit={() => setAdmitting(true)}
          onOpenStudent={() => navigate(`/admin/students/${selected.student._id || selected.student}`)} />
      )}
      {form && (
        <Modal title={form._id ? `Edit ${form.applicationNo}` : "New enquiry"} onClose={() => setForm(null)} width={680}>
          <EnquiryForm initial={form} sources={options.sources} onCancel={() => setForm(null)}
            onSaved={(doc) => { setForm(null); if (form._id) refreshWith(doc); else { setStatus(""); load(); } }} />
        </Modal>
      )}
      {statusTo && selected && (
        <StatusDialog record={selected} status={statusTo} onCancel={() => setStatusTo(null)}
          onDone={async (doc) => {
            setStatusTo(null);
            refreshWith(doc);
            if (doc.status === "Approved" && await confirmAction(`${doc.studentName} is approved. Admit now and create the student's login?`, { confirmLabel: "Admit now", danger: false })) setAdmitting(true);
          }} />
      )}
      {admitting && selected && (
        <AdmitDialog record={selected} onCancel={() => setAdmitting(false)} onDone={(doc) => { setAdmitting(false); refreshWith(doc); }} />
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { BookOpenText, FileUp, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { getKnowledge, addKnowledge, updateKnowledge, deleteKnowledge, errorText } from "../../api/assistant";
import Skeleton from "../../components/ui/Skeleton";

// The school's own written documents (handbook, policies, FAQs). EduAmigo Ask answers rules and policy questions
// only from these, and cites the document and section it used.

const CATEGORIES = [["handbook", "Handbook"], ["policy", "Policy"], ["faq", "FAQ"], ["circular", "Circular"], ["other", "Other"]];
const AUDIENCES = [["student", "Students"], ["parent", "Parents"], ["teacher", "Teachers"], ["accountant", "Accountants"]];
const label = (list, k) => list.find(([v]) => v === k)?.[1] || k;

export default function AskKnowledge() {
  const [docs, setDocs] = useState(null);
  const [limits, setLimits] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", category: "policy", audience: [], text: "", file: null });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => getKnowledge().then((r) => { setDocs(r.data); setLimits(r.limits); setError(""); }).catch((e) => setError(errorText(e))), []);
  useEffect(() => { load(); }, [load]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleAudience = (a) => set({ audience: form.audience.includes(a) ? form.audience.filter((x) => x !== a) : [...form.audience, a] });
  const canSave = form.title.trim() && (form.file || form.text.trim().length > 20) && !busy;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await addKnowledge(form);
      setForm({ title: "", category: "policy", audience: [], text: "", file: null });
      await load();
    } catch (err) { setError(errorText(err)); }
    setBusy(false);
  };
  const toggle = async (d) => { try { await updateKnowledge(d.id, { isActive: !d.isActive }); load(); } catch (err) { setError(errorText(err)); } };
  const remove = async (d) => { try { await deleteKnowledge(d.id); setConfirmDelete(null); load(); } catch (err) { setError(errorText(err)); } };

  return (
    <div style={s.wrap}>
      {error && <div style={s.error} role="alert">{error}</div>}
      <section style={s.card}>
        <h2 style={s.h2}><BookOpenText size={16} aria-hidden /> Add a document</h2>
        <div style={s.muted}>Paste the text of a handbook, policy or FAQ, or upload a PDF. Answers about school rules come only from documents added here, and show which document and section they used.</div>
        <form onSubmit={save} style={s.form}>
          <div style={s.row}>
            <label style={s.field}><span style={s.lab}>Title</span>
              <input value={form.title} maxLength={160} onChange={(e) => set({ title: e.target.value })} style={s.input} placeholder="Fee payment and refund policy" />
            </label>
            <label style={s.field}><span style={s.lab}>Type</span>
              <select value={form.category} onChange={(e) => set({ category: e.target.value })} style={s.input}>{CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
          </div>
          <div style={s.field}>
            <span style={s.lab}>Who can be answered from it</span>
            <div style={s.chips}>
              {AUDIENCES.map(([v, l]) => (
                <button key={v} type="button" aria-pressed={form.audience.includes(v)} onClick={() => toggleAudience(v)} style={form.audience.includes(v) ? s.chipOn : s.chipOff}>{l}</button>
              ))}
            </div>
            <span style={s.muted}>{form.audience.length ? "Only the groups selected (admins can always use it)." : "Everyone in the school."}</span>
          </div>
          <label style={s.field}><span style={s.lab}>Text</span>
            <textarea value={form.text} rows={8} disabled={!!form.file} onChange={(e) => set({ text: e.target.value })} style={{ ...s.input, resize: "vertical", fontFamily: "inherit" }}
              placeholder={"SCHOOL TIMINGS\nClasses run from 8:00 AM to 2:30 PM...\n\nUNIFORM\n..."} />
            <span style={s.muted}>A line in capitals, or ending with a colon, starts a new section so answers can cite it.</span>
          </label>
          <div style={s.row}>
            <label style={s.fileBtn}><FileUp size={15} aria-hidden /> {form.file ? form.file.name : "Upload a PDF instead"}
              <input type="file" accept="application/pdf" hidden onChange={(e) => set({ file: e.target.files?.[0] || null })} />
            </label>
            {form.file && <button type="button" style={s.linkBtn} onClick={() => set({ file: null })}>Remove file</button>}
            <button type="submit" disabled={!canSave} style={{ ...s.primary, opacity: canSave ? 1 : 0.5 }}>{busy ? <Loader2 size={15} className="kb-spin" /> : null} Add document</button>
          </div>
        </form>
      </section>

      <section style={s.card}>
        <h2 style={s.h2}>Documents {docs ? `(${docs.length}${limits ? ` of ${limits.documents}` : ""})` : ""}</h2>
        {!docs && <Skeleton rows={3} label="Loading" />}
        {docs?.length === 0 && <div style={s.empty}>No documents yet. Until you add some, questions about school rules are offered to the school office.</div>}
        {docs?.map((d) => (
          <div key={d.id} style={{ ...s.doc, opacity: d.isActive ? 1 : 0.6 }}>
            <div style={{ minWidth: 0 }}>
              <div style={s.docTitle}>{d.title} <span style={s.tag}>{label(CATEGORIES, d.category)}</span>{!d.isActive && <span style={s.tagOff}>Off</span>}</div>
              <div style={s.muted}>{d.sections} sections · {d.characters.toLocaleString("en-IN")} characters · {d.sourceType === "pdf" ? `PDF ${d.fileName || ""}` : "typed"} · {d.audience.length ? d.audience.map((a) => label(AUDIENCES, a)).join(", ") : "everyone"} · version {d.version} · updated {new Date(d.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
              <div style={s.preview}>{d.preview}</div>
            </div>
            <div style={s.actions}>
              <button type="button" style={s.iconBtn} title={d.isActive ? "Stop using this document" : "Use this document"} aria-label={d.isActive ? "Stop using this document" : "Use this document"} onClick={() => toggle(d)}>{d.isActive ? <Eye size={16} /> : <EyeOff size={16} />}</button>
              {confirmDelete === d.id ? (
                <><button type="button" style={s.danger} onClick={() => remove(d)}>Delete</button><button type="button" style={s.linkBtn} onClick={() => setConfirmDelete(null)}>Cancel</button></>
              ) : <button type="button" style={s.iconBtn} title="Delete" aria-label="Delete document" onClick={() => setConfirmDelete(d.id)}><Trash2 size={16} /></button>}
            </div>
          </div>
        ))}
      </section>
      <style>{".kb-spin{animation:kbspin 1s linear infinite}@keyframes kbspin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

const s = {
  wrap: { display: "grid", gap: 16 },
  card: { background: "var(--card)", border: "1px solid var(--ea-edge)", borderRadius: 14, padding: 16 },
  h2: { fontSize: 15, fontWeight: 800, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 },
  muted: { fontSize: 12, color: "var(--subtext)", lineHeight: 1.5 },
  form: { display: "grid", gap: 12, marginTop: 12 },
  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" },
  field: { display: "grid", gap: 5, flex: 1, minWidth: 200 },
  lab: { fontSize: 12, fontWeight: 700, color: "var(--text)" },
  input: { padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--ea-edge)", background: "var(--input)", color: "var(--text)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  chips: { display: "flex", gap: 6, flexWrap: "wrap" },
  chipOn: { padding: "6px 12px", borderRadius: 999, border: "1px solid var(--brand-border)", background: "var(--brand-soft)", color: "var(--brand-text)", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  chipOff: { padding: "6px 12px", borderRadius: 999, border: "1px solid var(--ea-edge)", background: "var(--card)", color: "var(--subtext)", fontWeight: 600, fontSize: 12, cursor: "pointer" },
  fileBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 10, border: "1.5px dashed var(--ea-edge)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  linkBtn: { background: "none", border: "none", color: "var(--brand-text)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  primary: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "var(--brand-gradient)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  doc: { display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border)" },
  docTitle: { fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  tag: { fontSize: 10, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--brand-text)", background: "var(--brand-soft)", borderRadius: 6, padding: "2px 6px" },
  tagOff: { fontSize: 10, fontWeight: 800, color: "#92400e", background: "#fef3c7", borderRadius: 6, padding: "2px 6px" },
  preview: { fontSize: 12, color: "var(--text)", marginTop: 4, opacity: 0.8 },
  actions: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  iconBtn: { background: "var(--card)", border: "1px solid var(--ea-edge)", borderRadius: 8, padding: 7, color: "var(--subtext)", cursor: "pointer", display: "flex" },
  danger: { background: "#b91c1c", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  empty: { fontSize: 13, color: "var(--subtext)", padding: "14px 0" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 12, padding: "9px 12px", fontSize: 13 },
};

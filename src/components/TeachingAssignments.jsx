import { useState } from "react";
import axios from "axios";
import { Plus, X } from "lucide-react";
import { toast, errorMessage } from "../utils/toast";
import { useLoad } from "./dash/helpers";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const field = { padding: "8px 10px", borderRadius: 8, border: "1px solid var(--ea-edge)", fontSize: 13, background: "#F8FAFC", fontFamily: "inherit", boxSizing: "border-box" };

// Which subject a teacher teaches in which class and section. Saved as a whole set; the server checks every row.
export default function TeachingAssignments({ teacherId, onSaved }) {
  const loaded = useLoad(async () => (await axios.get(`${API}/teachers/${teacherId}/assignments`, auth())).data.data, `ta-${teacherId}`);
  const [draft, setDraft] = useState({ class: "", section: "", subject: "", isClassTeacher: false });
  const [saving, setSaving] = useState(false);
  const rows = loaded.state === "ok" ? loaded.data : [];

  const put = async (next, done) => {
    setSaving(true);
    try {
      await axios.put(`${API}/teachers/${teacherId}/assignments`, { assignments: next }, auth());
      toast.success(done);
      loaded.reload();
      onSaved?.();
      return true;
    } catch (e) { toast.error(errorMessage(e, "Could not save the assignments")); return false; }
    finally { setSaving(false); }
  };
  const keep = rows.map((r) => ({ class: r.class, section: r.section, subject: r.subject, isClassTeacher: r.isClassTeacher }));

  const add = async (e) => {
    e.preventDefault();
    if (!draft.class.trim() || !draft.subject.trim()) { toast.error("Enter the class and the subject"); return; }
    if (await put([...keep, draft], "Assignment added")) setDraft({ class: "", section: "", subject: "", isClassTeacher: false });
  };

  return (
    <div>
      {loaded.state === "loading" && <p style={{ fontSize: 13, color: "var(--ea-muted)" }}>Loading…</p>}
      {loaded.state === "error" && <p role="alert" style={{ fontSize: 13 }}>Could not load assignments. <button type="button" className="ea-btn ea-btn--ghost" onClick={loaded.reload}>Try again</button></p>}
      {loaded.state === "ok" && rows.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--ea-muted)", margin: "0 0 12px" }}>No assignments yet. Until you add some, this teacher may act on any of their listed subjects in any of their classes. Adding assignments limits them to exactly these.</p>
      )}
      {rows.length > 0 && (
        <ul aria-label="Teaching assignments" style={{ listStyle: "none", margin: "0 0 14px", padding: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {rows.map((r) => (
            <li key={r._id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 6px 5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "var(--brand-soft)", color: "var(--brand-text)", border: "1px solid var(--brand-border)" }}>
              Class {r.class}{r.section ? `-${r.section}` : ""} · {r.subject}{r.isClassTeacher ? " · Class teacher" : ""}
              <button type="button" aria-label={`Remove ${r.subject} in class ${r.class}${r.section ? `-${r.section}` : ""}`} disabled={saving}
                onClick={() => put(keep.filter((k) => !(k.class === r.class && k.section === r.section && k.subject === r.subject)), "Assignment removed")}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "inherit", display: "inline-flex", padding: 4 }}><X size={14} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ea-muted)" }}>Class<br /><input aria-label="Class" value={draft.class} onChange={(e) => setDraft({ ...draft, class: e.target.value })} style={{ ...field, width: 80 }} placeholder="10" /></label>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ea-muted)" }}>Section<br /><input aria-label="Section" value={draft.section} onChange={(e) => setDraft({ ...draft, section: e.target.value })} style={{ ...field, width: 80 }} placeholder="all" /></label>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ea-muted)" }}>Subject<br /><input aria-label="Subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} style={{ ...field, width: 160 }} placeholder="Mathematics" /></label>
        <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", minHeight: 36 }}><input type="checkbox" checked={draft.isClassTeacher} onChange={(e) => setDraft({ ...draft, isClassTeacher: e.target.checked })} /> Class teacher</label>
        <button type="submit" className="ea-btn ea-btn--primary" disabled={saving}><Plus size={14} aria-hidden="true" /> Add</button>
      </form>
    </div>
  );
}

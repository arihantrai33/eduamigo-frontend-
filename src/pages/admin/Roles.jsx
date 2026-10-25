import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Copy, KeyRound, Lock, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast, confirmAction, errorMessage } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import { can } from "../../utils/permissions";
import { useLoad } from "../../components/dash/helpers";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import FieldError from "../../components/ui/FieldError";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const SCOPE_LEVELS = [["school", "Whole school"], ["assigned", "Only their own classes"], ["own", "Only what they created"], ["none", "No access"]];
// Which levels make sense for each family (a note belongs to someone, a leave request to a class).
const LEVELS_FOR = { students: ["school", "assigned", "none"], academic: ["school", "assigned", "none"], leaves: ["school", "assigned", "none"], notes: ["school", "own", "none"] };
const DOMAIN_LABEL = {
  students: "Students", parents: "Parents", teachers: "Teachers", attendance: "Attendance", marks: "Marks", results: "Results", exams: "Exams",
  fees: "Fees", leaves: "Leave", notes: "Study material", timetable: "Timetable", communication: "Communication", chat: "Chat",
  admissions: "Admissions", library: "Library", transport: "Transport", hr: "HR & payroll", bulk: "Bulk operations", users: "Users",
  roles: "Roles", settings: "Settings", audit: "Activity log", assistant: "AI assistant", academics: "Academic setup",
};
const domainOf = (key) => key.split(".")[0];
const labelDomain = (d) => DOMAIN_LABEL[d] || d.charAt(0).toUpperCase() + d.slice(1);

const field = { padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ea-edge)", fontSize: 13, background: "#F8FAFC", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const lab = { fontSize: 11, color: "var(--ea-muted)", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase" };

// One role: its permissions grouped by area, and how far each kind of record reaches. Built-in roles open read-only.
function RoleEditor({ catalogue, role, seed, onClose, onSaved }) {
  const { user } = useAuth();
  const readOnly = !!role?.isSystem;
  const editing = !!role && !role.isSystem;
  const [name, setName] = useState(role?.name || seed?.name || "");
  const [description, setDescription] = useState(role?.description || seed?.description || "");
  const [perms, setPerms] = useState(new Set(role?.permissions || seed?.permissions || []));
  const [scopes, setScopes] = useState({ ...(role?.scopes || seed?.scopes || {}) });
  const [isActive, setIsActive] = useState(role ? role.isActive !== false : true);
  const [templateKey, setTemplateKey] = useState(seed?.key || role?.templateKey || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [impact, setImpact] = useState(null);

  const groups = useMemo(() => {
    const map = new Map();
    for (const p of catalogue.permissions) {
      const d = domainOf(p.key);
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(p);
    }
    return [...map.entries()].sort((a, b) => labelDomain(a[0]).localeCompare(labelDomain(b[0])));
  }, [catalogue]);

  const body = () => ({ permissions: [...perms], scopes: Object.fromEntries(Object.entries(scopes).filter(([, v]) => v && v !== "none")) });

  // Before saving a change to a role that people hold, show what it would add and take away.
  useEffect(() => {
    if (!editing) return undefined;
    const t = setTimeout(() => {
      axios.post(`${API}/roles/${role._id}/preview`, body(), auth()).then((r) => setImpact(r.data.data)).catch(() => setImpact(null));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perms, scopes]);

  const applyTemplate = (key) => {
    setTemplateKey(key);
    const t = catalogue.templates.find((x) => x.key === key);
    if (!t) return;
    setPerms(new Set(t.permissions.filter((p) => can(user, p))));
    setScopes({ ...t.scopes });
    if (!name.trim()) setName(t.name);
    if (!description.trim()) setDescription(t.description);
  };

  const toggle = (key) => setPerms((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  const save = async () => {
    if (name.trim().length < 2) { setError("Give the role a name of at least 2 letters"); return; }
    if (!perms.size) { setError("Choose at least one permission"); return; }
    setError(""); setSaving(true);
    try {
      if (editing) await axios.patch(`${API}/roles/${role._id}`, { name, description, isActive, ...body() }, auth());
      else await axios.post(`${API}/roles`, { name, description, templateKey: templateKey || undefined, ...body() }, auth());
      toast.success(editing ? "Role updated" : "Role created");
      onSaved();
    } catch (e) { setError(errorMessage(e, "Could not save the role")); }
    setSaving(false);
  };

  return (
    <Modal show onClose={onClose} width={720} title={readOnly ? `${role.name} (built-in)` : editing ? "Edit role" : "New role"}>
      <div style={{ display: "grid", gap: 14 }}>
        {readOnly && <p style={{ margin: 0, fontSize: 13, color: "var(--ea-muted)" }}><Lock size={13} aria-hidden="true" /> Built-in roles cannot be changed. Use <b>Make a copy</b> to start a role of your own from this one.</p>}
        {!editing && !readOnly && (
          <div>
            <label htmlFor="role-template" style={lab}>Start from</label>
            <select id="role-template" value={templateKey} onChange={(e) => applyTemplate(e.target.value)} style={field}>
              <option value="">Empty role</option>
              {catalogue.templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
            </select>
          </div>
        )}
        {!readOnly && (
          <>
            <div>
              <label htmlFor="role-name" style={lab}>Role name</label>
              <input id="role-name" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} style={field} placeholder="e.g. Front office" maxLength={60} />
            </div>
            <div>
              <label htmlFor="role-desc" style={lab}>What it is for (optional)</label>
              <input id="role-desc" value={description} onChange={(e) => setDescription(e.target.value)} style={field} maxLength={300} />
            </div>
          </>
        )}

        <fieldset style={{ border: "1px solid var(--ea-edge)", borderRadius: 12, padding: 14, margin: 0 }}>
          <legend style={{ ...lab, padding: "0 6px", marginBottom: 0 }}>What this role can do</legend>
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {groups.map(([domain, list]) => (
              <div key={domain}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{labelDomain(domain)}</div>
                {list.map((p) => {
                  const held = can(user, p.key);
                  return (
                    <label key={p.key} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, padding: "4px 0", opacity: held || readOnly ? 1 : 0.55 }} title={held ? undefined : "You do not hold this permission, so you cannot give it"}>
                      <input type="checkbox" checked={perms.has(p.key)} disabled={readOnly || (!held && !perms.has(p.key))} onChange={() => toggle(p.key)} style={{ marginTop: 3 }} />
                      <span>{p.description}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ border: "1px solid var(--ea-edge)", borderRadius: 12, padding: 14, margin: 0 }}>
          <legend style={{ ...lab, padding: "0 6px", marginBottom: 0 }}>How far it reaches</legend>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {Object.entries(catalogue.scopeFamilies).map(([family, text]) => (
              <div key={family}>
                <label htmlFor={`scope-${family}`} style={{ ...lab, textTransform: "none", fontSize: 12 }}>{text}</label>
                <select id={`scope-${family}`} style={field} disabled={readOnly} value={scopes[family] || "none"} onChange={(e) => setScopes((s) => ({ ...s, [family]: e.target.value }))}>
                  {SCOPE_LEVELS.filter(([v]) => LEVELS_FOR[family].includes(v)).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </div>
            ))}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--ea-muted)" }}>Where a person has more than one role, the widest reach among them applies. Anything left as “No access” gives no access.</p>
        </fieldset>

        {editing && (
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Role is switched on (switching it off removes its permissions from everyone who holds it)
          </label>
        )}
        {editing && impact && (impact.added.length || impact.removed.length || impact.scopeChanges.length) > 0 && (
          <div role="status" style={{ background: "#F8FAFC", border: "1px solid var(--ea-edge)", borderRadius: 10, padding: 12, fontSize: 13 }}>
            <b>If you save:</b> {impact.added.length} permission{impact.added.length === 1 ? "" : "s"} added, {impact.removed.length} removed, {impact.scopeChanges.length} reach change{impact.scopeChanges.length === 1 ? "" : "s"}.
            {" "}It affects {impact.affectedUsers} {impact.affectedUsers === 1 ? "person" : "people"} who hold this role.
          </div>
        )}
        <FieldError id="role-error">{error}</FieldError>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button type="button" className="ea-btn ea-btn--ghost" onClick={onClose}>{readOnly ? "Close" : "Cancel"}</button>
        {!readOnly && <button type="button" className="ea-btn ea-btn--primary" onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create role"}</button>}
      </div>
    </Modal>
  );
}

export default function Roles() {
  const { user } = useAuth();
  const manage = can(user, "roles.manage");
  const [editor, setEditor] = useState(null); // { role?, seed? }
  const loaded = useLoad(async () => (await axios.get(`${API}/roles`, auth())).data.data, "roles");
  const state = loaded.state === "loading" ? "loading" : loaded.state === "ok" ? "ok" : "error";
  const data = loaded.state === "ok" ? loaded.data : null;
  const load = loaded.reload;
  const rec = useLoad(async () => (await axios.get(`${API}/roles/recommendations`, auth())).data.data, "rec");

  const remove = async (r) => {
    if (!(await confirmAction(`Delete the role "${r.name}"? This cannot be undone.`, { confirmLabel: "Delete" }))) return;
    try { await axios.delete(`${API}/roles/${r._id}`, auth()); toast.success("Role deleted"); load(); } catch (e) { toast.error(errorMessage(e, "Could not delete the role")); }
  };

  return (
    <div className="ea-page--wide">
      <PageHeader title="Roles & Access" subtitle="Decide who can do what. Give people a role, or several, instead of sharing logins."
        actions={<>
          <button type="button" className="ea-btn ea-btn--ghost" onClick={load} aria-label="Refresh"><RefreshCw size={16} aria-hidden="true" /></button>
          {manage && state === "ok" && <button type="button" className="ea-btn ea-btn--primary" onClick={() => setEditor({})}><Plus size={16} aria-hidden="true" /> New role</button>}
        </>} />

      {state === "ok" && rec.state === "ok" && rec.data.profile && rec.data.templates.some((t) => !t.created) && (
        <section aria-label="Suggested roles" style={{ background: "var(--brand-soft)", border: "1px solid var(--brand-border)", borderRadius: 14, padding: "14px 18px", marginBottom: 14, fontSize: 13 }}>
          <b>{rec.data.profile.label}: roles worth setting up</b>
          <p style={{ margin: "4px 0 10px" }}>{rec.data.profile.hint}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {rec.data.templates.filter((t) => !t.created).map((t) => (
              <button key={t.key} type="button" className="ea-btn ea-btn--ghost" disabled={!manage} title={t.description}
                onClick={() => setEditor({ seed: { ...data.templates.find((x) => x.key === t.key) } })}><Plus size={14} aria-hidden="true" /> {t.name}</button>
            ))}
          </div>
          <p style={{ margin: "10px 0 0", color: "var(--ea-muted)" }}>{rec.data.profile.staffNote}</p>
        </section>
      )}
      {state === "loading" && <Skeleton rows={4} label="Loading roles" />}
      {state === "error" && <EmptyState plain icon={KeyRound} title="Could not load roles" text="Check your connection and try again." actions={<button type="button" className="ea-btn ea-btn--primary" onClick={load}>Try again</button>} />}
      {state === "ok" && (
        <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 10 }} aria-label="Roles">
          {data.roles.map((r) => (
            <li key={r._id} style={{ background: "#fff", border: "1px solid var(--ea-edge)", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {r.name}
                  {r.isSystem && <span className="ea-badge"><Lock size={10} aria-hidden="true" /> Built-in</span>}
                  {!r.isActive && <span className="ea-badge ea-badge--warning">Switched off</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--ea-muted)", marginTop: 3 }}>{r.description || (r.templateKey ? "Made from a template" : "Custom role")}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--ea-muted)" }}>{r.permissions.length} permission{r.permissions.length === 1 ? "" : "s"} · {r.holders} {r.holders === 1 ? "person" : "people"}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setEditor({ role: r })}>{r.isSystem || !manage ? "View" : <><Pencil size={14} aria-hidden="true" /> Edit</>}</button>
                {manage && <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setEditor({ seed: { ...r, key: r.templateKey, name: `${r.name} (copy)` } })}><Copy size={14} aria-hidden="true" /> Make a copy</button>}
                {manage && !r.isSystem && <button type="button" className="ea-btn ea-btn--ghost" aria-label={`Delete ${r.name}`} onClick={() => remove(r)}><Trash2 size={14} aria-hidden="true" /></button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editor && data && (
        <RoleEditor catalogue={data} role={editor.role} seed={editor.seed} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />
      )}
    </div>
  );
}

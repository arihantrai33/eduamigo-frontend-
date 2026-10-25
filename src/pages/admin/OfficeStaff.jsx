import { useState } from "react";
import axios from "axios";
import { Briefcase, Pencil } from "lucide-react";
import { toast, errorMessage } from "../../utils/toast";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import FieldError from "../../components/ui/FieldError";
import { useLoad } from "../../components/dash/helpers";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const field = { padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ea-edge)", fontSize: 13, background: "#F8FAFC", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const lab = { fontSize: 11, color: "var(--ea-muted)", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase" };

// Employee records of non-teaching staff (office, accounts, library, transport). Logins and roles are in User Management and Roles.
export default function OfficeStaff() {
  const list = useLoad(async () => (await axios.get(`${API}/staff`, auth())).data.data, "staff");
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const open = (u) => {
    setError("");
    setForm({ employeeId: u.profile?.employeeId || "", designation: u.profile?.designation || "", department: u.profile?.department || "", phone: u.profile?.phone || "", joiningDate: u.profile?.joiningDate ? u.profile.joiningDate.slice(0, 10) : "" });
    setEdit(u);
  };
  const save = async () => {
    setSaving(true); setError("");
    try {
      await axios.put(`${API}/staff/${edit._id}`, form, auth());
      toast.success("Staff record saved"); setEdit(null); list.reload();
    } catch (e) { setError(errorMessage(e, "Could not save")); }
    setSaving(false);
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="ea-page--wide">
      <PageHeader title="Office staff" subtitle="Employee records for non-teaching staff. Teachers are in Teachers; logins and roles are in User Management and Roles & Access." />
      {list.state === "loading" && <Skeleton rows={3} label="Loading staff" />}
      {list.state === "error" && <EmptyState plain icon={Briefcase} title="Could not load staff" actions={<button type="button" className="ea-btn ea-btn--primary" onClick={list.reload}>Try again</button>} />}
      {list.state === "ok" && list.data.length === 0 && <EmptyState plain icon={Briefcase} title="No office staff yet" text="Add an account with the Staff or Accountant type in User Management." />}
      {list.state === "ok" && list.data.length > 0 && (
        <ul aria-label="Office staff" style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 10 }}>
          {list.data.map((u) => (
            <li key={u._id} style={{ background: "#fff", border: "1px solid var(--ea-edge)", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}{u.isActive === false && <span className="ea-badge ea-badge--warning" style={{ marginLeft: 8 }}>Inactive</span>}</div>
                <div style={{ fontSize: 12, color: "var(--ea-muted)", marginTop: 2 }}>{u.email}</div>
              </div>
              <div style={{ fontSize: 12, flex: "1 1 200px" }}>
                {u.profile?.designation || <span style={{ color: "var(--ea-muted)" }}>No designation yet</span>}
                {u.profile?.department ? ` · ${u.profile.department}` : ""}
                <div style={{ color: "var(--ea-muted)", marginTop: 2 }}>{u.extraRoles?.length ? `Roles: ${u.extraRoles.map((r) => r.name).join(", ")}` : "No extra roles"}</div>
              </div>
              <button type="button" className="ea-btn ea-btn--ghost" onClick={() => open(u)} aria-label={`Edit record of ${u.name}`}><Pencil size={14} aria-hidden="true" /> Edit</button>
            </li>
          ))}
        </ul>
      )}
      <Modal show={!!edit} onClose={() => setEdit(null)} width={460} title={edit ? `Staff record: ${edit.name}` : ""}>
        <div style={{ display: "grid", gap: 12 }}>
          {[["employeeId", "Employee ID", "text"], ["designation", "Designation", "text"], ["department", "Department", "text"], ["phone", "Phone", "tel"], ["joiningDate", "Joining date", "date"]].map(([k, l, t]) => (
            <div key={k}><label htmlFor={`staff-${k}`} style={lab}>{l}</label><input id={`staff-${k}`} type={t} value={form[k] || ""} onChange={set(k)} style={field} /></div>
          ))}
          <FieldError id="staff-error">{error}</FieldError>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setEdit(null)}>Cancel</button>
          <button type="button" className="ea-btn ea-btn--primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Briefcase, Calculator, GraduationCap, KeyRound, Plus, RefreshCw, SearchX, Shield, UserCheck, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { can } from "../../utils/permissions";
import { toast, showCredentials, confirmAction, errorMessage } from "../../utils/toast";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import SearchField from "../../components/ui/SearchField";

const FIELDS = { name: "user-name", email: "user-email" };

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Staff logins created here. Students, parents and teachers are added from their own screens so
// their school records (class, children, subjects) are created together with the login.
const STAFF_ROLES = ["staff", "accountant", "admin"];
// Accounts that can be given extra roles (administrators already hold everything).
// Accountants and other staff share one summary card, so the five cards stay in one row.
const OFFICE = ["accountant", "staff"];
const ROLE_HOLDERS = ["teacher", "accountant", "staff"];

// A role is a label, not a status: every role has the same neutral badge; the icon tells them apart.
const ROLE_META = {
  admin:   { color: "#475569", bg: "#F1F5F9", border: "#E2E8F0", icon: Shield },
  teacher: { color: "#475569", bg: "#F1F5F9", border: "#E2E8F0", icon: UserCheck },
  student: { color: "#475569", bg: "#F1F5F9", border: "#E2E8F0", icon: GraduationCap },
  parent:  { color: "#475569", bg: "#F1F5F9", border: "#E2E8F0", icon: Users },
  accountant: { color: "#475569", bg: "#F1F5F9", border: "#E2E8F0", icon: Calculator },
  staff: { color: "#475569", bg: "#F1F5F9", border: "#E2E8F0", icon: Briefcase },
};

const inp = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ea-edge)",
  fontSize: 13, outline: "none", background: "#F8FAFC",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};

export default function UserManagement() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: "", email: "", password: "", role: "staff" });
  const { user: me } = useAuth();
  const [assigning, setAssigning] = useState(null); // the person whose roles are being set
  const [allRoles, setAllRoles] = useState([]);
  const [picked, setPicked] = useState([]);
  const [rolesError, setRolesError] = useState("");
  const v = useFieldErrors(FIELDS);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users`, auth());
      setUsers(res.data.data || []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Deactivating stops the person from signing in, so it asks first; switching back on does not.
  const toggleStatus = async (u) => {
    if (u.isActive !== false && !(await confirmAction(`Deactivate ${u.name}? They will not be able to sign in until the account is switched on again.`, { confirmLabel: "Deactivate" }))) return;
    try {
      await axios.patch(`${API}/users/${u._id}/toggle`, {}, auth());
      fetchUsers();
    } catch (e) { toast.error(errorMessage(e, "Could not update the account")); }
  };

  const handleAdd = async () => {
    if (!v.check({ name: !form.name.trim() && "Enter the person's full name", email: !form.email.trim() && "Enter their email address" })) return;
    setSaving(true);
    try {
      const res = await axios.post(`${API}/users/register`, form, auth());
      if (res.data.credentials) showCredentials([{ label: form.role, ...res.data.credentials }], "User created");
      else toast.success("User created. They will be asked to change the password at first login.");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "staff" });
      fetchUsers();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to create user"); }
    setSaving(false);
  };

  const openRoles = async (u) => {
    setRolesError(""); setPicked((u.extraRoles || []).map(String)); setAssigning(u);
    try {
      const r = await axios.get(`${API}/roles`, auth());
      setAllRoles(r.data.data.roles || []);
    } catch (e) { setRolesError(errorMessage(e, "Could not load roles")); }
  };
  const saveRoles = async () => {
    setSaving(true); setRolesError("");
    try {
      await axios.put(`${API}/users/${assigning._id}/roles`, { roleIds: picked }, auth());
      toast.success("Roles updated"); setAssigning(null); fetchUsers();
    } catch (e) { setRolesError(errorMessage(e, "Could not update roles")); }
    setSaving(false);
  };

  const filtered = users.filter(u => {
    const matchRole = filter === "all" || u.role === filter || (filter === "office" && OFFICE.includes(u.role));
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = Object.keys(ROLE_META).reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  return (
    <div className="ea-page--wide" style={{ fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <PageHeader title="User Management" subtitle="Manage system access and roles"
          actions={<>
            <button type="button" className="ea-btn ea-btn--ghost" onClick={fetchUsers} aria-label="Refresh"><RefreshCw size={16} aria-hidden="true" /></button>
            <button type="button" className="ea-btn ea-btn--primary" onClick={() => setShowModal(true)}><Plus size={16} aria-hidden="true" /> Add User</button>
          </>} />
      </div>

      {/* Role Stats (each card filters the list by that role) */}
      <StatGrid label="Users by role" style={{ marginBottom: 20 }}>
        {[["admin", "Admin"], ["teacher", "Teacher"], ["student", "Student"], ["parent", "Parent"], ["office", "Office staff"]].map(([key, label]) => {
          const Icon = (ROLE_META[key] || ROLE_META.staff).icon;
          const n = key === "office" ? OFFICE.reduce((t, r) => t + (counts[r] || 0), 0) : counts[key];
          return (
            <StatCard key={key} label={label} value={loading ? "—" : n}
              icon={<Icon aria-hidden="true" />} selected={filter === key}
              onClick={() => setFilter(key === filter ? "all" : key)} />
          );
        })}
      </StatGrid>

      {/* Search + Filter */}
      <div className="ea-toolbar" style={{ marginBottom: 16 }}>
        <SearchField value={search} onChange={setSearch} label="Search users" placeholder="Search by name or email..." style={{ flex: "1 1 240px", maxWidth: 360 }} />
        <div className="ea-chips" role="group" aria-label="Filter by role" style={{ minWidth: 0 }}>
          {["all", ...Object.keys(ROLE_META)].map(r => (
            <button key={r} type="button" className="ea-chip" aria-pressed={filter === r} onClick={() => setFilter(r)} style={{ textTransform: "capitalize" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--ea-edge)", borderRadius: 16, overflow: "hidden" }}>
        <div className="ea-um-head" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "12px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          {["User", "Role", "School", "Joined", "Status"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "var(--ea-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>

        {/* "Loading" only on the first load: a refresh after a change keeps the rows (and keyboard focus) in place. */}
        {loading && users.length === 0 ? (
          <Skeleton rows={3} label="Loading users" />
        ) : filtered.length === 0 ? (
          <EmptyState plain icon={SearchX} title="No users found" text="Try a different search or role." />
        ) : filtered.map((u, i) => {
          const meta = ROLE_META[u.role] || ROLE_META.student;
          const Icon = meta.icon;
          return (
            <div key={u._id} className="ea-um-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "14px 20px", alignItems: "center", borderTop: i === 0 ? "none" : "1px solid #F1F5F9", transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: meta.color, flexShrink: 0 }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ea-muted)", marginTop: 1 }}>{u.email}</div>
                  {can(me, "roles.manage") && ROLE_HOLDERS.includes(u.role) && String(u._id) !== String(me?._id) && (
                    <button type="button" className="ea-btn ea-btn--ghost" style={{ padding: "2px 8px", fontSize: 11, marginTop: 4 }} onClick={() => openRoles(u)}>
                      <KeyRound size={11} aria-hidden="true" /> Roles{u.extraRoles?.length ? ` (${u.extraRoles.length})` : ""}
                    </button>
                  )}
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, width: "fit-content", textTransform: "capitalize" }}>
                <Icon size={10} /> {u.role}
              </span>
              <span className="ea-um-school" style={{ fontSize: 12, color: "var(--ea-muted)" }}>{u.school?.name || u.school || "—"}</span>
              <span className="ea-um-joined" style={{ fontSize: 12, color: "var(--ea-muted)" }}>
                {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <button type="button" role="switch" aria-checked={u.isActive !== false} aria-label={`Account active: ${u.name}`} className="ea-um-switch"
                onClick={() => toggleStatus(u)}
                style={{ width: 44, height: 24, padding: 0, border: "none", borderRadius: 12, cursor: "pointer", position: "relative", background: u.isActive !== false ? "var(--brand)" : "var(--ea-muted)", transition: "background 0.2s" }}>
                <span aria-hidden="true" style={{ position: "absolute", top: 4, left: u.isActive !== false ? 24 : 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
              </button>
            </div>
          );
        })}
      </div>

      <Modal show={!!assigning} onClose={() => setAssigning(null)} width={480} title={assigning ? `Roles for ${assigning.name}` : "Roles"}>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ea-muted)" }}>Their {assigning?.role} account stays as it is. Roles ticked here add to it; where they overlap, the widest access applies.</p>
        <div style={{ display: "grid", gap: 8, maxHeight: 320, overflowY: "auto" }}>
          {allRoles.filter((r) => !r.isSystem && r.isActive).map((r) => (
            <label key={r._id} style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "flex-start" }}>
              <input type="checkbox" checked={picked.includes(String(r._id))} onChange={() => setPicked((p) => p.includes(String(r._id)) ? p.filter((i) => i !== String(r._id)) : [...p, String(r._id)])} style={{ marginTop: 3 }} />
              <span><b>{r.name}</b><br /><small style={{ color: "var(--ea-muted)" }}>{r.description || `${r.permissions.length} permissions`}</small></span>
            </label>
          ))}
          {allRoles.filter((r) => !r.isSystem && r.isActive).length === 0 && <p style={{ fontSize: 13 }}>No extra roles exist yet. Make one in Roles &amp; Access first.</p>}
        </div>
        <FieldError id="roles-error">{rolesError}</FieldError>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setAssigning(null)}>Cancel</button>
          <button type="button" className="ea-btn ea-btn--primary" onClick={saveRoles} disabled={saving}>{saving ? "Saving…" : "Save roles"}</button>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal show={showModal} onClose={() => { setShowModal(false); v.setErrors({}); }} width={440} title="Add New User">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[{ label: "Full Name", key: "name", type: "text", placeholder: "e.g. John Smith" },
                { label: "Email Address", key: "email", type: "email", placeholder: "e.g. john@school.com" },
                { label: "Password (optional)", key: "password", type: "password", placeholder: "Leave blank to generate a temporary password" }
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label htmlFor={`user-${key}`} style={{ fontSize: 11, color: "var(--ea-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>{label.toUpperCase()}</label>
                  <input id={`user-${key}`} type={type} value={form[key]} onChange={e => { setForm({ ...form, [key]: e.target.value }); v.clear(key); }} placeholder={placeholder} style={inp} {...v.invalid(key)} />
                  <FieldError id={`user-${key}-error`}>{v.errors[key]}</FieldError>
                </div>
              ))}
              <div>
                <label htmlFor="user-role" style={{ fontSize: 11, color: "var(--ea-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>ROLE</label>
                <select id="user-role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="ea-btn ea-btn--primary" onClick={handleAdd} disabled={saving}>
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
      </Modal>
    </div>
  );
}

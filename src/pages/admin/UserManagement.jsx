import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Calculator, GraduationCap, Plus, RefreshCw, Search, SearchX, Shield, UserCheck, Users } from "lucide-react";
import { toast, showCredentials, confirmAction, errorMessage } from "../../utils/toast";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";
import EmptyState from "../../components/ui/EmptyState";

const FIELDS = { name: "user-name", email: "user-email" };

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Staff logins created here. Students, parents and teachers are added from their own screens so
// their school records (class, children, subjects) are created together with the login.
const STAFF_ROLES = ["accountant", "admin"];

const ROLE_META = {
  admin:   { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: Shield },
  teacher: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: UserCheck },
  student: { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", icon: GraduationCap },
  parent:  { color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD", icon: Users },
  accountant: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: Calculator },
};

const inp = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
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
  const [form, setForm]         = useState({ name: "", email: "", password: "", role: "accountant" });
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
      setForm({ name: "", email: "", password: "", role: "accountant" });
      fetchUsers();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to create user"); }
    setSaving(false);
  };

  const filtered = users.filter(u => {
    const matchRole = filter === "all" || u.role === filter;
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = Object.keys(ROLE_META).reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "inherit", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <PageHeader title="User Management" subtitle="Manage system access and roles"
          actions={<>
            <button type="button" className="ea-btn ea-btn--ghost" onClick={fetchUsers} aria-label="Refresh"><RefreshCw size={16} aria-hidden="true" /></button>
            <button type="button" className="ea-btn ea-btn--primary" onClick={() => setShowModal(true)}><Plus size={16} aria-hidden="true" /> Add User</button>
          </>} />
      </div>

      {/* Role Stats (each card filters the list by that role) */}
      <div className="ea-stats" style={{ marginBottom: 20 }}>
        {Object.entries(ROLE_META).map(([role, meta]) => {
          const Icon = meta.icon;
          return (
            <StatCard key={role} label={role.charAt(0).toUpperCase() + role.slice(1)} value={loading ? "—" : counts[role]}
              icon={<Icon aria-hidden="true" />} selected={filter === role}
              onClick={() => setFilter(role === filter ? "all" : role)} />
          );
        })}
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search users" placeholder="Search by name or email..."
            style={{ ...inp, paddingLeft: 36 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", ...Object.keys(ROLE_META)].map(r => (
            <button key={r} type="button" aria-pressed={filter === r} onClick={() => setFilter(r)}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: `1px solid ${filter === r ? "var(--brand)" : "#E2E8F0"}`, background: filter === r ? "var(--brand-soft)" : "#fff", color: filter === r ? "var(--brand)" : "#64748B", fontWeight: filter === r ? 600 : 400, textTransform: "capitalize" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
        <div className="ea-um-head" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "12px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          {["User", "Role", "School", "Joined", "Status"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>

        {/* "Loading" only on the first load: a refresh after a change keeps the rows (and keyboard focus) in place. */}
        {loading && users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>Loading users...</div>
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
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{u.email}</div>
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, width: "fit-content", textTransform: "capitalize" }}>
                <Icon size={10} /> {u.role}
              </span>
              <span className="ea-um-school" style={{ fontSize: 12, color: "#64748B" }}>{u.school?.name || u.school || "—"}</span>
              <span className="ea-um-joined" style={{ fontSize: 12, color: "#94A3B8" }}>
                {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <button type="button" role="switch" aria-checked={u.isActive !== false} aria-label={`Account active: ${u.name}`} className="ea-um-switch"
                onClick={() => toggleStatus(u)}
                style={{ width: 44, height: 24, padding: 0, border: "none", borderRadius: 12, cursor: "pointer", position: "relative", background: u.isActive !== false ? "#22C55E" : "#CBD5E1", transition: "background 0.2s" }}>
                <span aria-hidden="true" style={{ position: "absolute", top: 4, left: u.isActive !== false ? 24 : 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      <Modal show={showModal} onClose={() => { setShowModal(false); v.setErrors({}); }} width={440} title="Add New User">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[{ label: "Full Name", key: "name", type: "text", placeholder: "e.g. John Smith" },
                { label: "Email Address", key: "email", type: "email", placeholder: "e.g. john@school.com" },
                { label: "Password (optional)", key: "password", type: "password", placeholder: "Leave blank to generate a temporary password" }
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label htmlFor={`user-${key}`} style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>{label.toUpperCase()}</label>
                  <input id={`user-${key}`} type={type} value={form[key]} onChange={e => { setForm({ ...form, [key]: e.target.value }); v.clear(key); }} placeholder={placeholder} style={inp} {...v.invalid(key)} />
                  <FieldError id={`user-${key}-error`}>{v.errors[key]}</FieldError>
                </div>
              ))}
              <div>
                <label htmlFor="user-role" style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>ROLE</label>
                <select id="user-role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 13, cursor: "pointer", color: "#64748B" }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: saving ? "#94A3B8" : "var(--brand-gradient)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
      </Modal>
    </div>
  );
}

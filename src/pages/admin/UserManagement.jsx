import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, Plus, RefreshCw, Shield, GraduationCap, Users, UserCheck, Bus, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const ROLE_META = {
  admin:   { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: Shield },
  teacher: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: UserCheck },
  student: { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", icon: GraduationCap },
  parent:  { color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD", icon: Users },
  driver:  { color: "#9333EA", bg: "#FDF4FF", border: "#E9D5FF", icon: Bus },
};

const inp = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
  fontSize: 13, outline: "none", background: "#F8FAFC",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
};

export default function UserManagement() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: "", email: "", password: "", role: "student" });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users`, auth());
      setUsers(res.data.data || []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (id) => {
    try {
      await axios.patch(`${API}/users/${id}/toggle`, {}, auth());
      fetchUsers();
    } catch (e) { alert("Failed to update status"); }
  };

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return;
    setSaving(true);
    try {
      await axios.post(`${API}/users/register`, form, auth());
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "student" });
      fetchUsers();
    } catch (e) { alert(e?.response?.data?.message || "Failed to create user"); }
    setSaving(false);
  };

  const filtered = users.filter(u => {
    const matchRole = filter === "all" || u.role === filter;
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = ["admin","teacher","student","parent","driver"].reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>User Management</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Manage system access and roles</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchUsers} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RefreshCw size={14} color="#64748B" />
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Role Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        {Object.entries(ROLE_META).map(([role, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={role} onClick={() => setFilter(role === filter ? "all" : role)}
              style={{ background: filter === role ? meta.bg : "#fff", border: `1px solid ${filter === role ? meta.border : "#E2E8F0"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon size={14} color={meta.color} />
                <span style={{ fontSize: 11, color: meta.color, fontWeight: 600, textTransform: "capitalize" }}>{role}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: meta.color }}>{loading ? "—" : counts[role]}</div>
            </div>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            style={{ ...inp, paddingLeft: 36 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", ...Object.keys(ROLE_META)].map(r => (
            <button key={r} onClick={() => setFilter(r)}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: `1px solid ${filter === r ? "#4F46E5" : "#E2E8F0"}`, background: filter === r ? "#EEF2FF" : "#fff", color: filter === r ? "#4F46E5" : "#64748B", fontWeight: filter === r ? 600 : 400, textTransform: "capitalize" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "12px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          {["User", "Role", "School", "Joined", "Status"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>No users found</div>
        ) : filtered.map((u, i) => {
          const meta = ROLE_META[u.role] || ROLE_META.student;
          const Icon = meta.icon;
          return (
            <div key={u._id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "14px 20px", alignItems: "center", borderTop: i === 0 ? "none" : "1px solid #F1F5F9", transition: "background 0.1s" }}
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
              <span style={{ fontSize: 12, color: "#64748B" }}>{u.school?.name || u.school || "—"}</span>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>
                {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <div onClick={() => toggleStatus(u._id)}
                style={{ width: 40, height: 22, borderRadius: 11, cursor: "pointer", position: "relative", background: u.isActive !== false ? "#22C55E" : "#CBD5E1", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 3, left: u.isActive !== false ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440, maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>Add New User</div>
              <button onClick={() => setShowModal(false)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color="#64748B" />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[{ label: "Full Name", key: "name", type: "text", placeholder: "e.g. John Smith" },
                { label: "Email Address", key: "email", type: "email", placeholder: "e.g. john@school.com" },
                { label: "Password", key: "password", type: "password", placeholder: "Min. 6 characters" }
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>{label.toUpperCase()}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={inp} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>ROLE</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                  {Object.keys(ROLE_META).map(r => <option key={r} value={r} style={{ textTransform: "capitalize" }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 13, cursor: "pointer", color: "#64748B" }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: saving ? "#94A3B8" : "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

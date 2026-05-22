import { useState } from "react";

const USERS = [
  { id: "1", name: "Admin User", email: "admin@eduamigo.com", role: "admin", isActive: true, createdAt: "2026-01-01" },
  { id: "2", name: "Mr. Mahesh Sharma", email: "mahesh@eduamigo.com", role: "teacher", isActive: true, createdAt: "2026-01-15" },
  { id: "3", name: "Rahul Sharma", email: "rahul@eduamigo.com", role: "student", isActive: true, createdAt: "2026-02-01" },
  { id: "4", name: "Mr. Suresh Sharma", email: "suresh@eduamigo.com", role: "parent", isActive: false, createdAt: "2026-02-10" },
];

const roleColors = {
  admin:   { bg: "#FAECE7", color: "#993C1D" },
  teacher: { bg: "#EEEDFE", color: "#534AB7" },
  student: { bg: "#EAF3DE", color: "#3B6D11" },
  parent:  { bg: "#FAEEDA", color: "#854F0B" },
  driver:  { bg: "#E1F5EE", color: "#0F6E56" },
};

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const UserManagement = () => {
  const [users, setUsers] = useState(USERS);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ name: "", email: "", role: "student", password: "" });

  const filtered = filter === "all" ? users : users.filter(u => u.role === filter);

  const toggleActive = (id) => setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    setUsers([...users, { ...form, id: Date.now().toString(), isActive: true, createdAt: new Date().toISOString().split("T")[0] }]);
    setForm({ name: "", email: "", role: "student", password: "" });
    setShowModal(false);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>User Management</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Manage system users and roles</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>+ Add User</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "admin", "teacher", "student", "parent", "driver"].map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: "0.5px solid #E8E8E5", fontWeight: 500, background: filter === r ? "#534AB7" : "#fff", color: filter === r ? "#fff" : "#666" }}>{r}</button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 16px", background: "#F5F5F3", fontSize: 11, fontWeight: 500, color: "#666" }}>
          <span>User</span><span>Role</span><span>Joined</span><span>Status</span>
        </div>
        {filtered.map(u => (
          <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 16px", alignItems: "center", borderTop: "0.5px solid #E8E8E5" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{u.name}</div>
              <div style={{ fontSize: 11, color: "#999" }}>{u.email}</div>
            </div>
            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500, display: "inline-block", background: roleColors[u.role]?.bg, color: roleColors[u.role]?.color }}>{u.role}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{u.createdAt}</span>
            <div onClick={() => toggleActive(u.id)} style={{ width: 32, height: 18, borderRadius: 9, cursor: "pointer", position: "relative", background: u.isActive ? "#1D9E75" : "#B4B2A9", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: u.isActive ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: 400 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Add User</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {[{ label: "Name", key: "name" }, { label: "Email", key: "email" }, { label: "Password", key: "password", type: "password" }].map(({ label, key, type = "text" }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                  {["admin", "teacher", "student", "parent", "driver"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#F5F5F3", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
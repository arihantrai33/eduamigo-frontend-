import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TEACHERS = [
  { id: "1", initials: "MS", bg: "#E1F5EE", color: "#0F6E56", name: "Mr. Mahesh Sharma", subject: "Mathematics", employeeId: "T001", phone: "9876543210", experience: 8, isActive: true },
  { id: "2", initials: "PK", bg: "#EEEDFE", color: "#534AB7", name: "Mrs. Priya Kapoor", subject: "Science", employeeId: "T002", phone: "9876543211", experience: 5, isActive: true },
  { id: "3", initials: "RS", bg: "#FAEEDA", color: "#854F0B", name: "Mr. Rajesh Singh", subject: "English", employeeId: "T003", phone: "9876543212", experience: 12, isActive: true },
];

const Teachers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = TEACHERS.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Teachers</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{TEACHERS.length} total teachers</div>
        </div>
        <button onClick={() => navigate("/admin/teachers/add")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>+ Add Teacher</button>
      </div>

      <input placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #E8E8E5", fontSize: 12, background: "#fff", outline: "none", fontFamily: "Inter, sans-serif", marginBottom: 16, width: 260 }} />

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: "#F5F5F3", fontSize: 11, fontWeight: 500, color: "#666" }}>
          <span>Teacher</span><span>Subject</span><span>Emp ID</span><span>Experience</span><span>Action</span>
        </div>
        {filtered.map(t => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 16px", alignItems: "center", borderTop: "0.5px solid #E8E8E5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: t.bg, color: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500 }}>{t.initials}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "#999" }}>{t.phone}</div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: "#666" }}>{t.subject}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{t.employeeId}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{t.experience} yrs</span>
            <button onClick={() => navigate(`/admin/teachers/${t.id}`)} style={{ padding: "5px 12px", borderRadius: 6, border: "0.5px solid #E8E8E5", background: "#F5F5F3", fontSize: 11, cursor: "pointer", color: "#534AB7" }}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Teachers;
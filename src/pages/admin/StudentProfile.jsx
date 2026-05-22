import { useParams, useNavigate } from "react-router-dom";

const STUDENTS = {
  "1": { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210", rollNumber: "25", class: "10", section: "A", gender: "Male", dateOfBirth: "2010-05-15", address: "Sector 62, Noida", parentName: "Mr. Suresh Sharma", parentPhone: "9876543200", feeStatus: "Paid", isActive: true },
  "2": { name: "Priya Kapoor", email: "priya@example.com", phone: "9876543211", rollNumber: "14", class: "9", section: "B", gender: "Female", dateOfBirth: "2011-03-22", address: "Sector 18, Noida", parentName: "Mr. Rajesh Kapoor", parentPhone: "9876543201", feeStatus: "Pending", isActive: true },
};

const feeColors = { Paid: { bg: "#EAF3DE", color: "#3B6D11" }, Pending: { bg: "#FAECE7", color: "#993C1D" }, Partial: { bg: "#FAEEDA", color: "#854F0B" } };

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const s = STUDENTS[id] || STUDENTS["1"];

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
        <button onClick={() => navigate("/admin/students")} style={{ padding: "6px 12px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#fff", fontSize: 12, cursor: "pointer", color: "#666" }}>← Back</button>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Student Profile</div>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 500, color: "#534AB7" }}>{s.name[0]}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Class {s.class} · Section {s.section} · Roll {s.rollNumber}</div>
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 500, background: feeColors[s.feeStatus]?.bg, color: feeColors[s.feeStatus]?.color, marginTop: 4, display: "inline-block" }}>{s.feeStatus}</span>
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 10 }}>Personal Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Email", value: s.email },
            { label: "Phone", value: s.phone },
            { label: "Gender", value: s.gender },
            { label: "Date of Birth", value: s.dateOfBirth },
            { label: "Address", value: s.address },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: "#999" }}>{label}</div>
              <div style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 10 }}>Parent Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#999" }}>Parent Name</div>
            <div style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500, marginTop: 2 }}>{s.parentName}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#999" }}>Parent Phone</div>
            <div style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500, marginTop: 2 }}>{s.parentPhone}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
import { useParams, useNavigate } from "react-router-dom";

const TEACHERS = {
  "1": { name: "Mr. Mahesh Sharma", email: "mahesh@example.com", phone: "9876543210", employeeId: "T001", subject: "Mathematics", classes: ["10-A", "10-B", "11-A"], qualification: "M.Sc", experience: 8, joiningDate: "2018-06-01", gender: "Male", address: "Sector 45, Noida", salary: 45000, isActive: true },
};

const TeacherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = TEACHERS[id] || TEACHERS["1"];

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
        <button onClick={() => navigate("/admin/teachers")} style={{ padding: "6px 12px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#fff", fontSize: 12, cursor: "pointer", color: "#666" }}>← Back</button>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Teacher Profile</div>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 500, color: "#0F6E56" }}>{t.name[0]}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>{t.name}</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{t.subject} · Emp ID: {t.employeeId}</div>
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 500, background: "#EAF3DE", color: "#3B6D11", marginTop: 4, display: "inline-block" }}>Active</span>
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 10 }}>Personal Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Email", value: t.email },
            { label: "Phone", value: t.phone },
            { label: "Gender", value: t.gender },
            { label: "Address", value: t.address },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: "#999" }}>{label}</div>
              <div style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 10 }}>Professional Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Qualification", value: t.qualification },
            { label: "Experience", value: `${t.experience} years` },
            { label: "Joining Date", value: t.joiningDate },
            { label: "Salary", value: `₹${t.salary?.toLocaleString()}` },
            { label: "Classes", value: t.classes?.join(", ") },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: "#999" }}>{label}</div>
              <div style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
import { useState } from "react";

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const Settings = () => {
  const [school, setSchool] = useState({ name: "EduAmigo School", email: "admin@eduamigo.com", phone: "9876543210", address: "Sector 62, Noida", principal: "Dr. Rajesh Kumar" });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Settings</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Manage school information and preferences</div>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>School Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "School Name", key: "name" },
            { label: "Email", key: "email" },
            { label: "Phone", key: "phone" },
            { label: "Principal", key: "principal" },
            { label: "Address", key: "address" },
          ].map(({ label, key }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>{label}</label>
              <input value={school[key]} onChange={e => setSchool({ ...school, [key]: e.target.value })} style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Academic Year</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Current Session</label>
            <input value="2025-2026" style={inputStyle} readOnly />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Working Days</label>
            <select style={inputStyle}>
              <option>Monday - Saturday</option>
              <option>Monday - Friday</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{
          padding: "8px 24px", borderRadius: 8, border: "none",
          background: saved ? "#1D9E75" : "#534AB7",
          color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer",
          transition: "background 0.2s"
        }}>{saved ? "✓ Saved!" : "Save Changes"}</button>
      </div>
    </div>
  );
};

export default Settings;
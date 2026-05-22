import { useState } from "react";

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const AddTeacher = () => {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "",
    qualification: "", experience: "", gender: "",
    dateOfBirth: "", address: "", salary: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      alert("Teacher added successfully!");
      setForm({ name: "", email: "", phone: "", subject: "", qualification: "", experience: "", gender: "", dateOfBirth: "", address: "", salary: "" });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const inp = (label, name, type = "text", options = null) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>{label}</label>
      {options ? (
        <select name={name} value={form[name]} onChange={handleChange} style={inputStyle}>
          <option value="">Select</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={form[name]} onChange={handleChange} style={inputStyle} />
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Add Teacher</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Fill in the details to register a new teacher</div>
      </div>
      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Personal Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {inp("Full Name", "name")}
          {inp("Email", "email", "email")}
          {inp("Phone", "phone", "tel")}
          {inp("Date of Birth", "dateOfBirth", "date")}
          {inp("Gender", "gender", "text", ["Male", "Female", "Other"])}
          {inp("Address", "address")}
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Professional Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {inp("Subject", "subject")}
          {inp("Qualification", "qualification")}
          {inp("Experience (years)", "experience", "number")}
          {inp("Salary", "salary", "number")}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={{ padding: "8px 20px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#F5F5F3", fontSize: 12, color: "#666", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#534AB7", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 500 }}>
            Add Teacher
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTeacher;

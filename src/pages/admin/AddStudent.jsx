import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const AddStudent = () => {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", rollNumber: "",
    class: "", section: "", gender: "", dateOfBirth: "",
    address: "", parentName: "", parentPhone: "", feeStatus: "Pending",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.rollNumber || !form.class || !form.section) {
      showToast("Please fill all required fields"); return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/students`, form, authHeader());
      showToast("✅ Student added successfully!");
      setForm({
        name: "", email: "", phone: "", rollNumber: "",
        class: "", section: "", gender: "", dateOfBirth: "",
        address: "", parentName: "", parentPhone: "", feeStatus: "Pending",
      });
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add student");
    }
    setLoading(false);
  };

  const inp = (label, name, type = "text", options = null, required = false) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
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
      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#1C2033", color: "#fff", padding: "10px 20px", borderRadius: 30, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          {toast}
        </div>
      )}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Add Student</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
          Student login credentials: email + phone number as password
        </div>
      </div>
      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Personal Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {inp("Full Name", "name", "text", null, true)}
          {inp("Email", "email", "email", null, true)}
          {inp("Phone", "phone", "tel", null, true)}
          {inp("Date of Birth", "dateOfBirth", "date")}
          {inp("Gender", "gender", "text", ["Male", "Female", "Other"])}
          {inp("Address", "address")}
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Academic Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {inp("Roll Number", "rollNumber", "text", null, true)}
          {inp("Class", "class", "text", null, true)}
          {inp("Section", "section", "text", null, true)}
          {inp("Fee Status", "feeStatus", "text", ["Paid", "Pending", "Partial"])}
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Parent Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {inp("Parent Name", "parentName")}
          {inp("Parent Phone", "parentPhone", "tel")}
        </div>

        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400E" }}>
          ℹ️ Student login: <strong>{form.email || "email"}</strong> / Password: <strong>{form.phone || "phone number"}</strong>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => setForm({ name: "", email: "", phone: "", rollNumber: "", class: "", section: "", gender: "", dateOfBirth: "", address: "", parentName: "", parentPhone: "", feeStatus: "Pending" })}
            style={{ padding: "8px 20px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#F5F5F3", fontSize: 12, color: "#666", cursor: "pointer" }}>
            Clear
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : "#534AB7", fontSize: 12, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontWeight: 500 }}>
            {loading ? "Adding..." : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
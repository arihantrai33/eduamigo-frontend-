import { useState, useEffect } from "react";
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

const AddParent = () => {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    gender: "", address: "", occupation: "",
    children: [],
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${API}/students`, authHeader());
        setStudents(res.data.data || []);
      } catch {
        showToast("Failed to load students");
      }
    };
    fetchStudents();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleChild = (studentId) => {
    const id = studentId.toString();
    setForm(prev => ({
      ...prev,
      children: prev.children.includes(id)
        ? prev.children.filter(c => c !== id)
        : [...prev.children, id]
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) {
      showToast("Name, email and phone are required"); return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/parents`, form, authHeader());
      showToast(`✅ Parent added! Login: ${res.data.loginInfo.email} / ${res.data.loginInfo.defaultPassword}`);
      setForm({ name: "", email: "", phone: "", gender: "", address: "", occupation: "", children: [] });
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add parent");
    }
    setLoading(false);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Add Parent</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
          Parent login credentials: email + phone number as password
        </div>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Parent Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {inp("Full Name", "name", "text", null, true)}
          {inp("Email", "email", "email", null, true)}
          {inp("Phone", "phone", "tel", null, true)}
          {inp("Gender", "gender", "text", ["Male", "Female", "Other"])}
          {inp("Occupation", "occupation")}
          {inp("Address", "address")}
        </div>

        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400E" }}>
          ℹ️ Parent login: <strong>{form.email || "email"}</strong> / Password: <strong>{form.phone || "phone number"}</strong>
        </div>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>
          Link Children ({form.children.length} selected)
        </div>
        <input
          style={{ ...inputStyle, marginBottom: 12 }}
          placeholder="🔍 Search student by name or roll no..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
          {filteredStudents.length === 0 && (
            <div style={{ textAlign: "center", color: "#ccc", padding: "20px 0", fontSize: 13 }}>
              No students found
            </div>
          )}
          {filteredStudents.map(student => {
            const isSelected = form.children.includes(student._id.toString());
            return (
              <div
                key={student._id}
                onClick={() => toggleChild(student._id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: isSelected ? "#EFF6FF" : "#F8FAFC",
                  border: `1.5px solid ${isSelected ? "#0EA5E9" : "#E8E8E5"}`,
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: isSelected ? "#0EA5E9" : "#F5F5F3",
                  border: `2px solid ${isSelected ? "#0EA5E9" : "#D1D5DB"}`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {isSelected && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{student.name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    Roll: {student.rollNumber} • Class {student.class}-{student.section}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={() => setForm({ name: "", email: "", phone: "", gender: "", address: "", occupation: "", children: [] })}
          style={{ padding: "8px 20px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#F5F5F3", fontSize: 12, color: "#666", cursor: "pointer" }}>
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : "#534AB7", fontSize: 12, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontWeight: 500 }}>
          {loading ? "Adding..." : "Add Parent"}
        </button>
      </div>
    </div>
  );
};

export default AddParent;
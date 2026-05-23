import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const CLASSES  = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const SECTIONS = ["A","B","C","D","E"];

const emptyForm = {
  name: "", email: "", phone: "", rollNumber: "",
  class: "", section: "", gender: "", dateOfBirth: "",
  address: "", parentName: "", parentPhone: "", parentEmail: "",
  feeStatus: "Pending",
};

export default function AddStudent() {
  const [form, setForm]         = useState(emptyForm);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [credentials, setCredentials] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    const required = ["name","email","phone","rollNumber","class","section"];
    const missing  = required.find((k) => !form[k]?.trim());
    if (missing) { showToast("Please fill all required fields", "error"); return; }

    setLoading(true);
    setCredentials(null);
    try {
      const res = await axios.post(`${API}/students`, form, authHeader());
      setCredentials(res.data.credentials);
      showToast("Student added successfully");
      setForm(emptyForm);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add student", "error");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = "text", required = false, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children || (
        <input
          type={type} name={name} value={form[name]}
          onChange={handleChange}
          style={{
            padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
            fontSize: 13, color: "#111827", outline: "none", background: "#F9FAFB",
            fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
            transition: "border 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "#534AB7"}
          onBlur={e  => e.target.style.borderColor = "#E5E7EB"}
        />
      )}
    </div>
  );

  const Select = ({ label, name, options, required = false }) => (
    <Field label={label} name={name} required={required}>
      <select
        name={name} value={form[name]} onChange={handleChange}
        style={{
          padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
          fontSize: 13, color: form[name] ? "#111827" : "#9CA3AF",
          outline: "none", background: "#F9FAFB",
          fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
        }}>
        <option value="">Select {label}</option>
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </Field>
  );

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 760, margin: "0 auto" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? "#FEF2F2" : "#F0FDF4",
          border: `1px solid ${toast.type === "error" ? "#FECACA" : "#BBF7D0"}`,
          color: toast.type === "error" ? "#DC2626" : "#15803D",
          padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}>
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
          Add New Student
        </h1>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
          Student and parent accounts will be created automatically
        </p>
      </div>

      {/* Credentials Card — shown after success */}
      {credentials && (
        <div style={{
          background: "#F0FDF4", border: "1px solid #86EFAC",
          borderRadius: 12, padding: "16px 20px", marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 10 }}>
            ✅ Accounts Created
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "#166534" }}>
              <strong>Student Login:</strong> {credentials.student?.email} &nbsp;/&nbsp; {credentials.student?.password}
            </div>
            {credentials.parent && (
              <div style={{ fontSize: 12, color: "#166534" }}>
                <strong>Parent Login:</strong> {credentials.parent?.email} &nbsp;/&nbsp; {credentials.parent?.password}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Card */}
      <div style={{
        background: "#fff", border: "1px solid #E5E7EB",
        borderRadius: 14, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>

        {/* Personal Info */}
        <SectionTitle>Personal Information</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <Field label="Full Name"     name="name"        required />
          <Field label="Email Address" name="email"  type="email" required />
          <Field label="Phone Number"  name="phone"  type="tel"   required />
          <Field label="Date of Birth" name="dateOfBirth" type="date" />
          <Select label="Gender" name="gender"
            options={["Male","Female","Other"]} />
          <Field label="Address" name="address" />
        </div>

        {/* Academic Info */}
        <SectionTitle>Academic Information</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <Field label="Roll Number" name="rollNumber" required />
          <Select label="Class" name="class" required
            options={CLASSES.map(c => ({ value: c, label: `Class ${c}` }))} />
          <Select label="Section" name="section" required
            options={SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))} />
          <Select label="Fee Status" name="feeStatus"
            options={["Paid","Pending","Partial"]} />
        </div>

        {/* Parent Info */}
        <SectionTitle>Parent / Guardian Information</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <Field label="Parent Name"  name="parentName" />
          <Field label="Parent Phone" name="parentPhone" type="tel" />
          <Field label="Parent Email" name="parentEmail" type="email" />
        </div>

        {/* Login Preview */}
        {(form.email || form.parentEmail) && (
          <div style={{
            background: "#FAFAFA", border: "1px solid #E5E7EB",
            borderRadius: 10, padding: "12px 16px", marginBottom: 24,
            fontSize: 12, color: "#6B7280", display: "grid", gap: 4,
          }}>
            <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Login Credentials Preview
            </div>
            {form.email && (
              <div>Student: <strong>{form.email}</strong> / <strong>{form.phone || "phone number"}</strong></div>
            )}
            {form.parentEmail && (
              <div>Parent: <strong>{form.parentEmail}</strong> / <strong>{form.parentPhone || form.phone || "phone number"}</strong></div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => { setForm(emptyForm); setCredentials(null); }}
            style={{
              padding: "10px 22px", borderRadius: 8,
              border: "1px solid #E5E7EB", background: "#F9FAFB",
              fontSize: 13, color: "#374151", cursor: "pointer", fontWeight: 500,
            }}>
            Clear
          </button>
          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: loading ? "#A5B4FC" : "#534AB7",
              fontSize: 13, color: "#fff", cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600, letterSpacing: "0.02em",
            }}>
            {loading ? "Adding..." : "Add Student"}
          </button>
        </div>

      </div>
    </div>
  );
}

// Section title helper
function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: "#534AB7",
      textTransform: "uppercase", letterSpacing: "0.08em",
      marginBottom: 14, paddingBottom: 8,
      borderBottom: "1px solid #EEF2FF",
    }}>
      {children}
    </div>
  );
}
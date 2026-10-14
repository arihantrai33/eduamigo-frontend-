import { useEffect, useState } from "react";
import axios from "axios";

import Glyph from "../../components/Glyph";
import PageHeader from "../../components/ui/PageHeader";
import { hasEntries, useUnsavedChanges } from "../../utils/unsavedChanges";
import { todayLocal } from "../../utils/dates";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";

// Fields checked before saving; each input's id is "add-student-<name>".
const FIELDS = { name: "add-student-name", class: "add-student-class", section: "add-student-section", parentPhone: "add-student-parentPhone" };
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Used until the school sets up its class list (Settings > Classes & Sections).
const DEFAULT_CLASSES  = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const DEFAULT_SECTIONS = ["A","B","C","D","E"];

const emptyForm = {
  name: "", admissionNo: "", email: "", phone: "", rollNumber: "",
  class: "", section: "", gender: "", dateOfBirth: "", admittedOn: "",
  address: "", parentName: "", parentPhone: "", parentEmail: "",
};

export default function AddStudent() {
  const [form, setForm]         = useState(emptyForm);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [classList, setClassList] = useState([]); // school's class master: [{ name, sections: [{ name }] }]
  useUnsavedChanges(hasEntries(form) || !!photoFile);

  useEffect(() => {
    axios.get(`${API}/academic/classes`, authHeader())
      .then((r) => setClassList(r.data?.data || []))
      .catch(() => setClassList([]));
  }, []);
  const classOptions = classList.length
    ? classList.map((c) => ({ value: c.name, label: c.displayName || `Class ${c.name}` }))
    : DEFAULT_CLASSES.map((c) => ({ value: c, label: `Class ${c}` }));
  const chosenClass = classList.find((c) => c.name === form.class);
  const sectionOptions = (classList.length ? (chosenClass?.sections || []).map((x) => x.name) : DEFAULT_SECTIONS)
    .map((x) => ({ value: x, label: `Section ${x}` }));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const v = useFieldErrors(FIELDS);
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value, ...(e.target.name === "class" ? { section: "" } : {}) }));
    v.clear(e.target.name === "phone" ? "parentPhone" : e.target.name);
  };

  const handleSubmit = async () => {
    if (!v.check({
      name: !form.name.trim() && "Enter the student's full name",
      class: !form.class && "Choose the class",
      section: !form.section && "Choose the section",
      parentPhone: !form.phone.trim() && !form.parentPhone.trim() && "Enter the student's phone or the parent's mobile number",
    })) return;

    setLoading(true);
    setCredentials(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (photoFile) fd.append("photo", photoFile);

      const res = await axios.post(`${API}/students`, fd, {
        headers: {
          ...authHeader().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      setCredentials(res.data.credentials);
      showToast("Student added successfully");
      setForm(emptyForm);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add student", "error");
    } finally {
      setLoading(false);
    }
  };

  // Plain render helpers, called as functions: defining components inside render would remount
  // the inputs on every keystroke and lose focus.
  const Field = ({ label, name, type = "text", required = false, hint, max, children }) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </span>
      {children || (
        <input
          id={`add-student-${name}`} type={type} name={name} value={form[name]} max={max}
          onChange={handleChange} {...v.invalid(name)}
          style={{
            padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
            fontSize: 13, color: "#111827", outline: "none", background: "#F9FAFB",
            fontFamily: "inherit", width: "100%", boxSizing: "border-box",
            transition: "border 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "var(--brand)"}
          onBlur={e  => e.target.style.borderColor = "#E5E7EB"}
        />
      )}
      {hint && <span style={{ fontSize: 11, color: "#9CA3AF" }}>{hint}</span>}
      <FieldError id={`add-student-${name}-error`}>{v.errors[name]}</FieldError>
    </label>
  );

  const Select = ({ label, name, options, required = false, hint }) => Field({
    label, name, required, hint, children: (
      <select
        id={`add-student-${name}`} name={name} value={form[name]} onChange={handleChange} {...v.invalid(name)}
        style={{
          padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
          fontSize: 13, color: form[name] ? "#111827" : "#9CA3AF",
          outline: "none", background: "#F9FAFB",
          fontFamily: "inherit", width: "100%", boxSizing: "border-box",
        }}>
        <option value="">Select {label}</option>
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    ),
  });

  return (
    <div style={{ fontFamily: "inherit", maxWidth: 760, margin: "0 auto" }}>

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
          {toast.type === "error" ? <Glyph e="⚠" /> : <Glyph e="✅" />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <PageHeader title="Add New Student" subtitle="Student and parent accounts will be created automatically" />
      </div>

      {/* Credentials Card — shown after success */}
      {credentials && (
        <div style={{
          background: "#F0FDF4", border: "1px solid #86EFAC",
          borderRadius: 12, padding: "16px 20px", marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 10 }}>
            <Glyph e="✅" /> Accounts Created
          </div>
          <div style={{ display: "grid", gap: 6, fontSize: 12, color: "#166534" }}>
            <div>School code: <strong>{credentials.student?.schoolCode || "—"}</strong></div>
            <div>
              <strong>Student</strong> · Admission No: <strong>{credentials.student?.loginId}</strong>
              &nbsp;·&nbsp; Password: <strong>{credentials.student?.password}</strong>
            </div>
            {credentials.parent && (
              <div>
                <strong>Parent</strong> · Login ID: <strong>{credentials.parent?.loginId}</strong>
                &nbsp;·&nbsp; Password: <strong>{credentials.parent?.password}</strong>
              </div>
            )}
            <div style={{ color: "#4B5563", marginTop: 4 }}>
              Share these once. Passwords are temporary: everyone sets their own at first login.
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div style={{
        background: "#fff", border: "1px solid #E5E7EB",
        borderRadius: 14, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>

        {/* Photo Upload */}
        <SectionTitle>Student Photo</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
            background: "#F3F4F6", border: "1px solid #E5E7EB",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 24, color: "#9CA3AF" }}><Glyph e="👤" /></span>
            )}
          </div>
          <div>
            <label style={{
              display: "inline-block", padding: "8px 16px", borderRadius: 8,
              border: "1px solid #E5E7EB", background: "#F9FAFB",
              fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer",
            }}>
              {photoFile ? "Change Photo" : "Upload Photo"}
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
            </label>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Optional. JPG or PNG, up to 5MB.</div>
          </div>
        </div>

        {/* Personal Info */}
        <SectionTitle>Personal Information</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          {Field({ label: "Full Name", name: "name", required: true })}
          {Field({ label: "Phone Number", name: "phone", type: "tel", hint: "Leave empty to use the parent's mobile" })}
          {Field({ label: "Email Address", name: "email", type: "email", hint: "Optional. Students log in with their admission number" })}
          {Field({ label: "Date of Birth", name: "dateOfBirth", type: "date" })}
          {Select({ label: "Gender", name: "gender", options: ["Male","Female","Other"] })}
          {Field({ label: "Address", name: "address" })}
        </div>

        {/* Academic Info */}
        <SectionTitle>Academic Information</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          {Field({ label: "Admission Number", name: "admissionNo", hint: "Leave empty to assign the next number" })}
          {Field({ label: "Roll Number", name: "rollNumber", hint: "Leave empty for the next roll number" })}
          {Field({ label: "Date of Admission", name: "admittedOn", type: "date", max: todayLocal(), hint: "The day the school admitted the student. Leave empty if not known; it is printed on the transfer certificate" })}
          {Select({ label: "Class", name: "class", required: true, options: classOptions })}
          {Select({ label: "Section", name: "section", required: true, options: sectionOptions,
            hint: classList.length && form.class && !sectionOptions.length ? "This class has no sections yet" : undefined })}
        </div>

        {/* Parent Info */}
        <SectionTitle>Parent / Guardian Information</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          {Field({ label: "Parent Name", name: "parentName" })}
          {Field({ label: "Parent Mobile", name: "parentPhone", type: "tel", hint: "Parents log in with this number" })}
          {Field({ label: "Parent Email", name: "parentEmail", type: "email", hint: "Optional. Needed for password reset by email" })}
        </div>

        <div style={{
          background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10,
          padding: "12px 16px", marginBottom: 24, fontSize: 12, color: "#6B7280", lineHeight: 1.6,
        }}>
          <strong style={{ color: "#374151" }}>How they will log in:</strong> the student with the school code and
          admission number, the parent with the school code and mobile number. Temporary passwords are shown
          after saving.
        </div>

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
              background: loading ? "#A5B4FC" : "var(--brand)",
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
      fontSize: 11, fontWeight: 700, color: "var(--brand)",
      textTransform: "uppercase", letterSpacing: "0.08em",
      marginBottom: 14, paddingBottom: 8,
      borderBottom: "1px solid var(--brand-soft)",
    }}>
      {children}
    </div>
  );
}
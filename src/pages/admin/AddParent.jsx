import { useState, useEffect } from "react";
import axios from "axios";
import { showCredentials } from "../../utils/toast";
import PageHeader from "../../components/ui/PageHeader";
import { hasEntries, useUnsavedChanges } from "../../utils/unsavedChanges";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";

const API = import.meta.env.VITE_API_URL;
// Fields checked before saving; each input's id is "add-parent-<name>".
const FIELDS = { name: "add-parent-name", email: "add-parent-email", phone: "add-parent-phone" };
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const AddParent = () => {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    gender: "", address: "", occupation: "",
    children: [],
  });
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [searchQuery, setSearchQuery] = useState("");
  useUnsavedChanges(hasEntries(form));
  const v = useFieldErrors(FIELDS);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${API}/students`, authHeader());
        setStudents(res.data.data || []);
      } catch {
        showToast("Failed to load students list");
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); v.clear(e.target.name); };

  const toggleChild = (studentId) => {
    const id = studentId.toString();
    setForm((prev) => ({
      ...prev,
      children: prev.children.includes(id)
        ? prev.children.filter((c) => c !== id)
        : [...prev.children, id],
    }));
  };

  const emptyForm = { name: "", email: "", phone: "", gender: "", address: "", occupation: "", children: [] };

  const handleSubmit = async () => {
    if (!v.check({
      name: !form.name.trim() && "Enter the parent's full name",
      email: !form.email.trim() && "Enter the parent's email",
      phone: !form.phone.trim() && "Enter the parent's phone number",
    })) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/parents`, form, authHeader());
      showCredentials([{ label: "Parent", ...res.data.credentials }], "Parent added");
      setForm(emptyForm);
      setSearchQuery("");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add parent");
    }
    setLoading(false);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inp = (label, name, type = "text", options = null, required = false) => (
    <label className="ea-field">
      <span className="ea-label">
        {label}{required && <span className="ea-label__req" aria-hidden="true">*</span>}
      </span>
      {options ? (
        <select id={`add-parent-${name}`} name={name} value={form[name]} onChange={handleChange} className="ea-select" aria-required={required || undefined} {...v.invalid(name)}>
          <option value="">Select</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input id={`add-parent-${name}`} type={type} name={name} value={form[name]} onChange={handleChange} className="ea-input" aria-required={required || undefined} {...v.invalid(name)} />
      )}
      <FieldError id={`add-parent-${name}-error`}>{v.errors[name]}</FieldError>
    </label>
  );

  return (
    <div style={{ fontFamily: "inherit", maxWidth: 760, margin: "0 auto" }}>

      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#16A34A" : "#DC2626",
          color: "#fff", padding: "10px 20px", borderRadius: 30,
          fontSize: 13, fontWeight: 600, zIndex: 9999,
          maxWidth: "90vw", textAlign: "center",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <PageHeader title="Add Parent" subtitle="A temporary password is generated and shown once after saving" />
      </div>

      {/* Parent Info */}
      <div className="ea-card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 className="ea-form-section__title">Parent Info</h2>
        <div className="ea-form-grid" style={{ marginBottom: 16 }}>
          {inp("Full Name", "name", "text", null, true)}
          {inp("Email", "email", "email", null, true)}
          {inp("Phone", "phone", "tel", null, true)}
          {inp("Gender", "gender", "text", ["Male", "Female", "Other"])}
          {inp("Occupation", "occupation")}
          {inp("Address", "address")}
        </div>
        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400E" }}>
          Parent login: <strong>{form.email || "email"}</strong>. A temporary password will be shown after saving.
        </div>
      </div>

      {/* Link Children */}
      <div className="ea-card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 className="ea-form-section__title">
          Link Children ({form.children.length} selected)
        </h2>

        <input
          className="ea-input" style={{ width: "100%", marginBottom: 12 }}
          aria-label="Search students to link"
          placeholder="Search student by name or roll number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>

          {/* Loading state */}
          {studentsLoading && (
            <div style={{ textAlign: "center", color: "#999", padding: "20px 0", fontSize: 13 }}>
              Loading students...
            </div>
          )}

          {/* Empty state */}
          {!studentsLoading && filteredStudents.length === 0 && (
            <div style={{ textAlign: "center", color: "#ccc", padding: "20px 0", fontSize: 13 }}>
              {searchQuery ? "No students match your search" : "No students found in the system"}
            </div>
          )}

          {/* Student list */}
          {!studentsLoading && filteredStudents.map((student) => {
            const isSelected = form.children.includes(student._id.toString());
            return (
              <button
                type="button"
                key={student._id}
                aria-pressed={isSelected}
                onClick={() => toggleChild(student._id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", font: "inherit",
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: isSelected ? "var(--brand-soft)" : "var(--ea-surface)",
                  border: `1.5px solid ${isSelected ? "var(--brand)" : "var(--ea-line)"}`,
                  transition: "all 0.15s ease",
                }}
              >
                <div aria-hidden="true" style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: isSelected ? "var(--brand)" : "var(--ea-surface)",
                  border: `2px solid ${isSelected ? "var(--brand)" : "#94A3B8"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ea-ink)" }}>{student.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ea-muted)" }}>
                    Roll: {student.rollNumber} • Class {student.class}-{student.section}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="ea-form-actions" style={{ borderTop: 0, marginTop: 0 }}>
        <button type="button" className="ea-btn ea-btn--ghost" onClick={() => { setForm(emptyForm); setSearchQuery(""); }}>
          Clear
        </button>
        <button type="button" className="ea-btn ea-btn--primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Adding..." : "Add Parent"}
        </button>
      </div>

    </div>
  );
};

export default AddParent;
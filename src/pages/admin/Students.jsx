import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

function getInitials(name = "") {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const avatarColors = ["#6366F1","#8B5CF6","#EC4899","#F59E0B","#10B981","#3B82F6","#EF4444","#14B8A6"];
function getAvatarColor(name = "") {
  const i = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[i];
}

const feeBadge
 = {
  Paid:    { bg: "#D1FAE5", color: "#065F46" },
  Pending: { bg: "#FEE2E2", color: "#991B1B" },
  Partial: { bg: "#FEF3C7", color: "#92400E" },
};

export default function Students() {
  const navigate = useNavigate();

  const [students,    setStudents]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form,        setForm]        = useState(emptyForm);
  const [submitting,  setSubmitting]  = useState(false);
  const [toast,       setToast]       = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => { fetchStudents(); }, [search, filterClass]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/students`, {
        params: { search, class: filterClass },
        ...authHeader(),
      });
      setStudents(res.data.data || []);
    } catch (err) {
      showToast("Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const required = ["name","email","phone","rollNumber","class","section"];
    if (required.some(k => !form[k]?.trim())) {
      showToast("Please fill all required fields", "error"); return;
    }
    setSubmitting(true);
    try {
      if (editStudent) {
        await axios.put(`${API}/students/${editStudent._id}`, form, authHeader());
        showToast("Student updated successfully");
      } else {
        const res = await axios.post(`${API}/students`, form, authHeader());
        if (res.data.credentials) setCredentials(res.data.credentials);
        showToast("Student added successfully");
      }
      setShowModal(false);
      setEditStudent(null);
      setForm(emptyForm);
      fetchStudents();
    } catch (err) {
      showToast(err?.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (s) => {
    setEditStudent(s);
    setForm({ ...emptyForm, ...s, dateOfBirth: s.dateOfBirth?.split("T")[0] || "" });
    setCredentials(null);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/students/${deleteId}`, authHeader());
      showToast("Student removed successfully");
      setDeleteId(null);
      fetchStudents();
    } catch (err) {
      showToast("Failed to delete student", "error");
    }
  };

  // Stats
  const total   = students.length;
  const paid    = students.filter(s => s.feeStatus === "Paid").length;
  const pending = students.filter(s => s.feeStatus === "Pending").length;
  const partial = students.filter(s => s.feeStatus === "Partial").length;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100vh", background: "#F8F9FC", padding: "24px" }}>

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

      {/* Credentials Card */}
      {credentials && (
        <div style={{
          background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12,
          padding: "14px 18px", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 6 }}>
              ✅ Account Created
            </div>
            <div style={{ fontSize: 12, color: "#166534" }}>
              Student: <strong>{credentials.student?.email}</strong> / <strong>{credentials.student?.password}</strong>
            </div>
            {credentials.parent && (
              <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                Parent: <strong>{credentials.parent?.email}</strong> / <strong>{credentials.parent?.password}</strong>
              </div>
            )}
          </div>
          <button onClick={() => setCredentials(null)}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6B7280" }}>
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Students</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: "4px 0 0" }}>Manage all students</p>
        </div>
        <button
          onClick={() => { setEditStudent(null); setForm(emptyForm); setCredentials(null); setShowModal(true); }}
          style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "#534AB7", color: "#fff", fontSize: 13,
            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
          + Add Student
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Students", val: total,   color: "#534AB7", bg: "#EEF2FF" },
          { label: "Fee Paid",       val: paid,    color: "#065F46", bg: "#D1FAE5" },
          { label: "Fee Pending",    val: pending, color: "#991B1B", bg: "#FEE2E2" },
          { label: "Partial",        val: partial, color: "#92400E", bg: "#FEF3C7" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#fff", borderRadius: 12, padding: "16px 18px",
            border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {s.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          type="text" placeholder="Search by name..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            padding: "9px 14px", borderRadius: 9, border: "1px solid #E5E7EB",
            fontSize: 13, outline: "none", background: "#fff", width: 240,
          }}
        />
        <select
          value={filterClass} onChange={e => setFilterClass(e.target.value)}
          style={{
            padding: "9px 14px", borderRadius: 9, border: "1px solid #E5E7EB",
            fontSize: 13, outline: "none", background: "#fff", color: filterClass ? "#111" : "#9CA3AF",
          }}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Student", "Roll No", "Class", "Parent", "Phone", "Fee Status", "Actions"].map(h => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left",
                  fontSize: 11, fontWeight: 700, color: "#6B7280",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  borderBottom: "1px solid #E5E7EB",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                  Loading students...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                  No students found
                </td>
              </tr>
            ) : students.map((s, idx) => (
              <tr key={s._id}
                style={{
                  borderBottom: idx < students.length - 1 ? "1px solid #F3F4F6" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Student */}
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: getAvatarColor(s.name),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, color: "#fff", fontSize: 13, flexShrink: 0,
                    }}>
                      {getInitials(s.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.email}</div>
                    </div>
                  </div>
                </td>

                {/* Roll No */}
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151", fontWeight: 500 }}>
                  #{s.rollNumber}
                </td>

                {/* Class */}
                <td style={{ padding: "14px 16px" }}>
                  <span style={{
                    background: "#EEF2FF", color: "#4338CA",
                    padding: "4px 10px", borderRadius: 20,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {s.class}-{s.section}
                  </span>
                </td>

                {/* Parent */}
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, color: "#374151" }}>{s.parentName || "—"}</div>
                  {s.parentEmail && (
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.parentEmail}</div>
                  )}
                </td>

                {/* Phone */}
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>
                  {s.phone}
                </td>

                {/* Fee Status */}
                <td style={{ padding: "14px 16px" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    ...(feeBadge
[s.feeStatus] || { bg: "#F3F4F6", color: "#6B7280" }),
                    background: (feeBadge
[s.feeStatus] || { bg: "#F3F4F6" }).bg,
                  }}>
                    {s.feeStatus}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleEdit(s)}
                      style={{
                        padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB",
                        background: "#fff", fontSize: 12, color: "#374151",
                        cursor: "pointer", fontWeight: 500,
                      }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(s._id)}
                      style={{
                        padding: "6px 12px", borderRadius: 7, border: "1px solid #FECACA",
                        background: "#FEF2F2", fontSize: 12, color: "#DC2626",
                        cursor: "pointer", fontWeight: 500,
                      }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 28,
            width: "100%", maxWidth: 640,
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                {editStudent ? "Edit Student" : "Add New Student"}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9CA3AF" }}>
                ×
              </button>
            </div>

            {/* Sections */}
            {[
              {
                title: "Personal Information",
                fields: [
                  { label: "Full Name",     key: "name",        type: "text",  required: true },
                  { label: "Email Address", key: "email",       type: "email", required: true },
                  { label: "Phone Number",  key: "phone",       type: "tel",   required: true },
                  { label: "Date of Birth", key: "dateOfBirth", type: "date" },
                ],
              },
              {
                title: "Academic Information",
                fields: [],
                custom: (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <FormField label="Roll Number" required>
                      <input type="text" value={form.rollNumber}
                        onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))}
                        style={inputSt} />
                    </FormField>
                    <FormField label="Class" required>
                      <select value={form.class}
                        onChange={e => setForm(f => ({ ...f, class: e.target.value }))}
                        style={inputSt}>
                        <option value="">Select Class</option>
                        {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Section" required>
                      <select value={form.section}
                        onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                        style={inputSt}>
                        <option value="">Select Section</option>
                        {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Gender">
                      <select value={form.gender}
                        onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                        style={inputSt}>
                        <option value="">Select Gender</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </FormField>
                    <FormField label="Fee Status">
                      <select value={form.feeStatus}
                        onChange={e => setForm(f => ({ ...f, feeStatus: e.target.value }))}
                        style={inputSt}>
                        <option>Pending</option>
                        <option>Paid</option>
                        <option>Partial</option>
                      </select>
                    </FormField>
                    <FormField label="Address">
                      <input type="text" value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        style={inputSt} />
                    </FormField>
                  </div>
                ),
              },
              {
                title: "Parent / Guardian",
                fields: [
                  { label: "Parent Name",  key: "parentName",  type: "text"  },
                  { label: "Parent Phone", key: "parentPhone", type: "tel"   },
                  { label: "Parent Email", key: "parentEmail", type: "email" },
                ],
              },
            ].map(sec => (
              <div key={sec.title} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#534AB7",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  borderBottom: "1px solid #EEF2FF", paddingBottom: 8, marginBottom: 14,
                }}>
                  {sec.title}
                </div>
                {sec.custom || (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {sec.fields.map(f => (
                      <FormField key={f.key} label={f.label} required={f.required}>
                        <input type={f.type} value={form[f.key]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          style={inputSt} />
                      </FormField>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Credentials preview */}
            {!editStudent && (form.email || form.parentEmail) && (
              <div style={{
                background: "#FAFAFA", border: "1px solid #E5E7EB",
                borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                fontSize: 12, color: "#6B7280",
              }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Login Credentials Preview</div>
                {form.email && <div>Student: <strong>{form.email}</strong> / <strong>{form.phone || "phone"}</strong></div>}
                {form.parentEmail && <div>Parent: <strong>{form.parentEmail}</strong> / <strong>{form.parentPhone || form.phone || "phone"}</strong></div>}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 13, color: "#374151", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{
                  padding: "10px 24px", borderRadius: 9, border: "none",
                  background: submitting ? "#A5B4FC" : "#534AB7",
                  fontSize: 13, color: "#fff", cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}>
                {submitting ? "Saving..." : editStudent ? "Update Student" : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 28,
            width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Remove Student?
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>
              This will deactivate the student and parent accounts. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeleteId(null)}
                style={{ padding: "10px 22px", borderRadius: 9, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleDelete}
                style={{ padding: "10px 22px", borderRadius: 9, border: "none", background: "#EF4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function FormField({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputSt = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
  fontSize: 13, color: "#111827", outline: "none", background: "#F9FAFB",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
};
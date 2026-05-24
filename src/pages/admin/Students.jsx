import { useState, useEffect, useCallback } from "react";
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
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

const feeBadge = {
  Paid:    { bg: "#D1FAE5", color: "#065F46" },
  Pending: { bg: "#FEE2E2", color: "#991B1B" },
  Partial: { bg: "#FEF3C7", color: "#92400E" },
};

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

export default function Students() {
  const navigate = useNavigate();
  const [allStudents,  setAllStudents]  = useState([]);
  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterClass,  setFilterClass]  = useState("");
  const [showModal,    setShowModal]    = useState(false);
  const [editStudent,  setEditStudent]  = useState(null);
  const [form,         setForm]         = useState(emptyForm);
  const [submitting,   setSubmitting]   = useState(false);
  const [toast,        setToast]        = useState(null);
  const [deleteId,     setDeleteId]     = useState(null);
  const [credentials,  setCredentials]  = useState(null);

  useEffect(() => { fetchStudents(); }, []);

  // Client-side filter — no API call on every keystroke
  useEffect(() => {
    let filtered = allStudents;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.rollNumber?.toString().includes(q)
      );
    }
    if (filterClass) {
      filtered = filtered.filter(s => s.class === filterClass);
    }
    setStudents(filtered);
  }, [search, filterClass, allStudents]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/students`, authHeader());
      const data = res.data.data || [];
      setAllStudents(data);
      setStudents(data);
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

  const total   = allStudents.length;
  const paid    = allStudents.filter(s => s.feeStatus === "Paid").length;
  const pending = allStudents.filter(s => s.feeStatus === "Pending").length;
  const partial = allStudents.filter(s => s.feeStatus === "Partial").length;

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
              ✅ Student Account Created — Save these credentials
            </div>
            <div style={{ fontSize: 12, color: "#166534" }}>
              Student Login: <strong>{credentials.student?.email}</strong> &nbsp;|&nbsp; Password: <strong>{credentials.student?.password}</strong>
            </div>
            {credentials.parent && (
              <div style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>
                Parent Login: <strong>{credentials.parent?.email}</strong> &nbsp;|&nbsp; Password: <strong>{credentials.parent?.password}</strong>
              </div>
            )}
          </div>
          <button onClick={() => setCredentials(null)}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6B7280" }}>×</button>
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
            fontWeight: 600, cursor: "pointer",
          }}>
          + Add Student
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Students", val: total,   color: "#534AB7" },
          { label: "Fee Paid",       val: paid,    color: "#065F46" },
          { label: "Fee Pending",    val: pending, color: "#991B1B" },
          { label: "Partial",        val: partial, color: "#92400E" },
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
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input
          type="text" placeholder="Search by name, email or roll number..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            padding: "9px 14px", borderRadius: 9, border: "1px solid #E5E7EB",
            fontSize: 13, outline: "none", background: "#fff", width: 300,
          }}
        />
        <select
          value={filterClass} onChange={e => setFilterClass(e.target.value)}
          style={{
            padding: "9px 14px", borderRadius: 9, border: "1px solid #E5E7EB",
            fontSize: 13, outline: "none", background: "#fff",
          }}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        {(search || filterClass) && (
          <button
            onClick={() => { setSearch(""); setFilterClass(""); }}
            style={{
              padding: "9px 14px", borderRadius: 9, border: "1px solid #E5E7EB",
              background: "#fff", fontSize: 12, color: "#6B7280", cursor: "pointer",
            }}>
            Clear filters
          </button>
        )}
        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>
          Showing {students.length} of {total} students
        </span>
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
                <td colSpan="7" style={{ padding: "48px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                  Loading students...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "48px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                  {search || filterClass ? "No students match your filters" : "No students added yet"}
                </td>
              </tr>
            ) : students.map((s, idx) => (
              <tr key={s._id}
                style={{ borderBottom: idx < students.length - 1 ? "1px solid #F3F4F6" : "none", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Student */}
                <td style={{ padding: "14px 16px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    onClick={() => navigate(`/admin/students/${s._id}`)}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: getAvatarColor(s.name),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, color: "#fff", fontSize: 13, flexShrink: 0,
                    }}>
                      {getInitials(s.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#534AB7", textDecoration: "underline" }}>{s.name}</div>
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
                    padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  }}>
                    {s.class}-{s.section}
                  </span>
                </td>

                {/* Parent */}
                <td style={{ padding: "14px 16px" }}>
                  {s.parentName ? (
                    <>
                      <div style={{ fontSize: 13, color: "#374151" }}>{s.parentName}</div>
                      {s.parentEmail && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.parentEmail}</div>}
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "#EF4444", background: "#FEF2F2", padding: "2px 8px", borderRadius: 20 }}>
                      Not linked
                    </span>
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
                    background: (feeBadge[s.feeStatus] || { bg: "#F3F4F6" }).bg,
                    color: (feeBadge[s.feeStatus] || { color: "#6B7280" }).color,
                  }}>
                    {s.feeStatus || "Pending"}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => navigate(`/admin/students/${s._id}`)}
                      style={{
                        padding: "6px 12px", borderRadius: 7, border: "1px solid #EEF2FF",
                        background: "#EEF2FF", fontSize: 12, color: "#534AB7",
                        cursor: "pointer", fontWeight: 500,
                      }}>
                      View
                    </button>
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
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9CA3AF" }}>×</button>
            </div>

            {/* Personal Information */}
            <SectionTitle>Personal Information</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <FormField label="Full Name" required>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputSt} />
              </FormField>
              <FormField label="Email Address" required>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputSt} />
              </FormField>
              <FormField label="Phone Number" required>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputSt} />
              </FormField>
              <FormField label="Date of Birth">
                <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} style={inputSt} />
              </FormField>
            </div>

            {/* Academic Information */}
            <SectionTitle>Academic Information</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <FormField label="Roll Number" required>
                <input type="text" value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} style={inputSt} />
              </FormField>
              <FormField label="Class" required>
                <select value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} style={inputSt}>
                  <option value="">Select Class</option>
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </FormField>
              <FormField label="Section" required>
                <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} style={inputSt}>
                  <option value="">Select Section</option>
                  {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </FormField>
              <FormField label="Gender">
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={inputSt}>
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </FormField>
              <FormField label="Fee Status">
                <select value={form.feeStatus} onChange={e => setForm(f => ({ ...f, feeStatus: e.target.value }))} style={inputSt}>
                  <option>Pending</option>
                  <option>Paid</option>
                  <option>Partial</option>
                </select>
              </FormField>
              <FormField label="Address">
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inputSt} />
              </FormField>
            </div>

            {/* Parent / Guardian */}
            <SectionTitle>Parent / Guardian</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <FormField label="Parent Name">
                <input type="text" value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} style={inputSt} />
              </FormField>
              <FormField label="Parent Phone">
                <input type="tel" value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} style={inputSt} />
              </FormField>
              <FormField label="Parent Email">
                <input type="email" value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))} style={inputSt} />
              </FormField>
            </div>

            {/* Credentials Preview */}
            {!editStudent && (form.email || form.parentEmail) && (
              <div style={{
                background: "#FAFAFA", border: "1px solid #E5E7EB",
                borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                fontSize: 12, color: "#6B7280",
              }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Login Credentials Preview</div>
                {form.email && <div>Student: <strong>{form.email}</strong> / <strong>{form.phone || "phone number"}</strong></div>}
                {form.parentEmail && <div style={{ marginTop: 2 }}>Parent: <strong>{form.parentEmail}</strong> / <strong>{form.parentPhone || form.phone || "phone number"}</strong></div>}
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
                  fontSize: 13, color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 600,
                }}>
                {submitting ? "Saving..." : editStudent ? "Update Student" : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
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
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Remove Student?</h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>
              This will permanently remove the student and deactivate linked parent account.
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

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: "#534AB7",
      textTransform: "uppercase", letterSpacing: "0.08em",
      borderBottom: "1px solid #EEF2FF", paddingBottom: 8, marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

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
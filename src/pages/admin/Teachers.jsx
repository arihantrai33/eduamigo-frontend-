import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const DEFAULT_SUBJECTS = ["Mathematics","Science","English","Hindi","Social Studies","Physics","Chemistry","Biology","Computer Science","Physical Education","Art","Music"];
const CLASSES = ["1","2","3","4","5","6","7","8","9","10","11","12"];

const emptyForm = {
  name: "", email: "", phone: "", employeeId: "",
  subjects: [], qualification: "", experience: "",
  salary: "", address: "", gender: "", dateOfBirth: "",
  assignedClasses: [],
};

const avatarColors = ["#6366F1","#8B5CF6","#EC4899","#F59E0B","#10B981","#3B82F6","#EF4444","#14B8A6"];
function getAvatarColor(name = "") {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}
function getInitials(name = "") {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const inputSt = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB",
  fontSize: 13, color: "#111827", outline: "none", background: "#F9FAFB",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
};

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

export default function Teachers() {
  const navigate = useNavigate();
  const [allTeachers, setAllTeachers] = useState([]);
  const [teachers,    setTeachers]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [form,        setForm]        = useState(emptyForm);
  const [submitting,  setSubmitting]  = useState(false);
  const [toast,       setToast]       = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [allSubjects, setAllSubjects] = useState(DEFAULT_SUBJECTS);
  const [newSubject,  setNewSubject]  = useState("");

  useEffect(() => { fetchTeachers(); fetchSubjects(); }, []);

  useEffect(() => {
    if (!search.trim()) { setTeachers(allTeachers); return; }
    const q = search.toLowerCase();
    setTeachers(allTeachers.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.subjects?.some(s => s.toLowerCase().includes(q)) ||
      t.employeeId?.toLowerCase().includes(q)
    ));
  }, [search, allTeachers]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/teachers`, authHeader());
      const data = res.data.data || [];
      setAllTeachers(data);
      setTeachers(data);
    } catch (err) {
      showToast("Failed to load teachers", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API}/schools/subjects`, authHeader());
      if (res.data.data?.length > 0) {
        setAllSubjects(prev => {
          const merged = [...prev];
          res.data.data.forEach(s => { if (!merged.includes(s)) merged.push(s); });
          return merged;
        });
      }
    } catch (err) {
      // silently fail — default subjects already set
    }
  };

  const addCustomSubject = async () => {
    const val = newSubject.trim();
    if (!val) return;
    if (allSubjects.includes(val)) {
      toggleSubject(val);
      setNewSubject("");
      return;
    }
    try {
      await axios.post(`${API}/schools/subjects`, { subject: val }, authHeader());
      setAllSubjects(prev => [...prev, val]);
      toggleSubject(val);
      setNewSubject("");
      showToast(`"${val}" added to school subjects`);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add subject", "error");
    }
  };

  const handleSubmit = async () => {
    if (!form.name?.trim() || !form.email?.trim() || !form.phone?.trim() || !form.employeeId?.trim()) {
      showToast("Please fill all required fields", "error"); return;
    }
    if (form.subjects.length === 0) {
      showToast("Please select at least one subject", "error"); return;
    }
    setSubmitting(true);
    try {
      if (editTeacher) {
        await axios.put(`${API}/teachers/${editTeacher._id}`, form, authHeader());
        showToast("Teacher updated successfully");
      } else {
        const res = await axios.post(`${API}/teachers`, form, authHeader());
        if (res.data.credentials) setCredentials(res.data.credentials);
        showToast("Teacher added successfully");
      }
      setShowModal(false);
      setEditTeacher(null);
      setForm(emptyForm);
      fetchTeachers();
    } catch (err) {
      showToast(err?.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (t) => {
    setEditTeacher(t);
    setForm({
      ...emptyForm, ...t,
      subjects: Array.isArray(t.subjects) ? t.subjects : (t.subject ? [t.subject] : []),
      assignedClasses: Array.isArray(t.assignedClasses) ? t.assignedClasses : [],
      dateOfBirth: t.dateOfBirth?.split("T")[0] || "",
    });
    setCredentials(null);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/teachers/${deleteId}`, authHeader());
      showToast("Teacher removed successfully");
      setDeleteId(null);
      fetchTeachers();
    } catch (err) {
      showToast("Failed to delete teacher", "error");
    }
  };

  const toggleSubject = (s) => {
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(s)
        ? f.subjects.filter(x => x !== s)
        : [...f.subjects, s],
    }));
  };

  const toggleClass = (cls) => {
    setForm(f => ({
      ...f,
      assignedClasses: f.assignedClasses.includes(cls)
        ? f.assignedClasses.filter(c => c !== cls)
        : [...f.assignedClasses, cls],
    }));
  };

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
              ✅ Teacher Account Created — Save these credentials
            </div>
            <div style={{ fontSize: 12, color: "#166534" }}>
              Login: <strong>{credentials.email}</strong> &nbsp;|&nbsp; Password: <strong>{credentials.password}</strong>
            </div>
          </div>
          <button onClick={() => setCredentials(null)}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6B7280" }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Teachers</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: "4px 0 0" }}>Manage all teaching staff</p>
        </div>
        <button
          onClick={() => { setEditTeacher(null); setForm(emptyForm); setCredentials(null); setShowModal(true); }}
          style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "#534AB7", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
          + Add Teacher
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Teachers", val: allTeachers.length, color: "#534AB7" },
          { label: "Active", val: allTeachers.filter(t => t.isActive !== false).length, color: "#065F46" },
          { label: "Subjects", val: [...new Set(allTeachers.flatMap(t => t.subjects || []))].length, color: "#92400E" },
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

      {/* Search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input
          type="text" placeholder="Search by name, subject or employee ID..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            padding: "9px 14px", borderRadius: 9, border: "1px solid #E5E7EB",
            fontSize: 13, outline: "none", background: "#fff", width: 340,
          }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #E5E7EB", background: "#fff", fontSize: 12, color: "#6B7280", cursor: "pointer" }}>
            Clear
          </button>
        )}
        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>
          Showing {teachers.length} of {allTeachers.length} teachers
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Teacher", "Subjects", "Emp ID", "Phone", "Experience", "Actions"].map(h => (
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
              <tr><td colSpan="6" style={{ padding: "48px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>Loading teachers...</td></tr>
            ) : teachers.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: "48px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                {search ? "No teachers match your search" : "No teachers added yet"}
              </td></tr>
            ) : teachers.map((t, idx) => (
              <tr key={t._id}
                style={{ borderBottom: idx < teachers.length - 1 ? "1px solid #F3F4F6" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    onClick={() => navigate(`/admin/teachers/${t._id}`)}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: getAvatarColor(t.name),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, color: "#fff", fontSize: 13, flexShrink: 0,
                    }}>
                      {getInitials(t.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#534AB7", textDecoration: "underline" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{t.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {t.subjects?.length > 0 ? t.subjects.map(s => (
                      <span key={s} style={{ background: "#EEF2FF", color: "#4338CA", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {s}
                      </span>
                    )) : <span style={{ color: "#9CA3AF", fontSize: 12 }}>—</span>}
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151", fontWeight: 500 }}>{t.employeeId || "—"}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>{t.phone || "—"}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>{t.experience ? `${t.experience} yrs` : "—"}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => navigate(`/admin/teachers/${t._id}`)}
                      style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #EEF2FF", background: "#EEF2FF", fontSize: 12, color: "#534AB7", cursor: "pointer", fontWeight: 500 }}>
                      View
                    </button>
                    <button onClick={() => handleEdit(t)}
                      style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #E5E7EB", background: "#fff", fontSize: 12, color: "#374151", cursor: "pointer", fontWeight: 500 }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(t._id)}
                      style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #FECACA", background: "#FEF2F2", fontSize: 12, color: "#DC2626", cursor: "pointer", fontWeight: 500 }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                {editTeacher ? "Edit Teacher" : "Add New Teacher"}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9CA3AF" }}>×</button>
            </div>

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
              <FormField label="Gender">
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={inputSt}>
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </FormField>
              <FormField label="Date of Birth">
                <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} style={inputSt} />
              </FormField>
              <FormField label="Address">
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inputSt} />
              </FormField>
            </div>

            <SectionTitle>Professional Information</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <FormField label="Employee ID" required>
                <input type="text" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} style={inputSt} />
              </FormField>
              <FormField label="Qualification">
                <input type="text" value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} style={inputSt} placeholder="e.g. B.Ed, M.Sc" />
              </FormField>
              <FormField label="Experience (years)">
                <input type="number" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} style={inputSt} min="0" />
              </FormField>
              <FormField label="Salary">
                <input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} style={inputSt} placeholder="Monthly salary" />
              </FormField>
            </div>

            <SectionTitle>Subjects</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {allSubjects.map(s => (
                <div key={s} onClick={() => toggleSubject(s)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  cursor: "pointer",
                  background: form.subjects.includes(s) ? "#534AB7" : "#F3F4F6",
                  color: form.subjects.includes(s) ? "#fff" : "#374151",
                  border: form.subjects.includes(s) ? "1px solid #534AB7" : "1px solid #E5E7EB",
                }}>
                  {s}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Add custom subject (e.g. Sanskrit, EVS, Moral Science...)"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                style={{ ...inputSt, flex: 1 }}
              />
              <button onClick={addCustomSubject} style={{
                padding: "9px 16px", borderRadius: 8, border: "1px solid #534AB7",
                background: "#EEF2FF", color: "#534AB7", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
              }}>+ Add</button>
            </div>

            <SectionTitle>Assigned Classes</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {CLASSES.map(cls => (
                <div key={cls} onClick={() => toggleClass(cls)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  cursor: "pointer",
                  background: form.assignedClasses.includes(cls) ? "#534AB7" : "#F3F4F6",
                  color: form.assignedClasses.includes(cls) ? "#fff" : "#374151",
                  border: form.assignedClasses.includes(cls) ? "1px solid #534AB7" : "1px solid #E5E7EB",
                }}>
                  Class {cls}
                </div>
              ))}
            </div>

            {!editTeacher && form.email && (
              <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#6B7280" }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Login Credentials Preview</div>
                <div>Email: <strong>{form.email}</strong> / Password: <strong>{form.phone || "phone number"}</strong></div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 13, color: "#374151", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: submitting ? "#A5B4FC" : "#534AB7", fontSize: 13, color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 600 }}>
                {submitting ? "Saving..." : editTeacher ? "Update Teacher" : "Add Teacher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Remove Teacher?</h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>
              This will permanently remove the teacher and deactivate their account.
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
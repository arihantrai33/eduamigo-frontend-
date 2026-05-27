import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const getTeachers = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.subject) query.append("subject", params.subject);
  if (params.search) query.append("search", params.search);
  const res = await axios.get(
    `${API}/teachers${query.toString() ? `?${query}` : ""}`,
    authHeader()
  );
  return res.data;
};

const createTeacher = async (data) => {
  const res = await axios.post(`${API}/teachers`, data, authHeader());
  return res.data;
};

const updateTeacher = async (id, data) => {
  const res = await axios.put(`${API}/teachers/${id}`, data, authHeader());
  return res.data;
};

const deleteTeacher = async (id) => {
  const res = await axios.delete(`${API}/teachers/${id}`, authHeader());
  return res.data;
};

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  employeeId: "",
  subject: "",
  qualification: "",
  experience: "",
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTeachers({ search, subject: subjectFilter });
      setTeachers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter]);

  useEffect(() => {
    const delay = setTimeout(fetchTeachers, 400);
    return () => clearTimeout(delay);
  }, [fetchTeachers]);

  const uniqueSubjects = [...new Set(teachers.map((t) => t.subject).filter(Boolean))];
  const activeCount = teachers.filter((t) => t.isActive !== false).length;

  const openAddModal = () => {
    setEditTeacher(null);
    setForm(INITIAL_FORM);
    setFormError(null);
    setCredentials(null);
    setShowModal(true);
  };

  const openEditModal = (teacher) => {
    setEditTeacher(teacher);
    setForm({
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      employeeId: teacher.employeeId || "",
      subject: teacher.subject || "",
      qualification: teacher.qualification || "",
      experience: teacher.experience || "",
    });
    setFormError(null);
    setCredentials(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTeacher(null);
    setForm(INITIAL_FORM);
    setFormError(null);
    setCredentials(null);
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFormLoading(true);
    try {
      if (editTeacher) {
        await updateTeacher(editTeacher._id, form);
        showToast("Teacher updated successfully.");
        closeModal();
        fetchTeachers();
      } else {
        const res = await createTeacher(form);
        if (res.credentials) {
          setCredentials(res.credentials);
        } else {
          closeModal();
        }
        showToast("Teacher added successfully.");
        fetchTeachers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTeacher(id);
      showToast("Teacher deactivated successfully.");
      setDeleteConfirm(null);
      fetchTeachers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to deactivate teacher.", "error");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto", fontFamily: "inherit" }}>

      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
          color: toast.type === "error" ? "#991b1b" : "#166534",
          padding: "12px 20px", borderRadius: "8px",
          border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
          fontSize: "14px", fontWeight: 500, maxWidth: "340px",
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 500, color: "var(--color-text-primary)" }}>Teachers</h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--color-text-secondary)" }}>Manage all teaching staff</p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            background: "#6366f1", color: "#fff", border: "none",
            borderRadius: "8px", padding: "10px 20px", fontSize: "14px",
            fontWeight: 500, cursor: "pointer",
          }}
        >
          + Add Teacher
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Teachers", value: teachers.length },
          { label: "Active", value: activeCount },
          { label: "Subjects", value: uniqueSubjects.length },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "var(--color-background-secondary)", borderRadius: "8px",
            padding: "16px", display: "flex", flexDirection: "column", gap: "6px"
          }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{stat.label}</span>
            <span style={{ fontSize: "28px", fontWeight: 500, color: "var(--color-text-primary)" }}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name, subject or employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: "220px", padding: "9px 14px", fontSize: "14px",
            border: "0.5px solid var(--color-border-tertiary)", borderRadius: "8px",
            background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none"
          }}
        />
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={{
            padding: "9px 14px", fontSize: "14px",
            border: "0.5px solid var(--color-border-tertiary)", borderRadius: "8px",
            background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none"
          }}
        >
          <option value="">All Subjects</option>
          {uniqueSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", alignSelf: "center" }}>
          Showing {teachers.length} teacher{teachers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "12px", overflow: "hidden"
      }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Loading teachers...
          </div>
        ) : error ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#dc2626", fontSize: "14px" }}>{error}</div>
        ) : teachers.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px" }}>
            No teachers found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "var(--color-background-secondary)" }}>
                {["Teacher", "Subject", "Emp ID", "Phone", "Experience", "Status", "Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left", fontSize: "12px",
                    fontWeight: 500, color: "var(--color-text-secondary)",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    borderBottom: "0.5px solid var(--color-border-tertiary)"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, i) => (
                <tr
                  key={teacher._id}
                  style={{ borderBottom: i < teachers.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-background-secondary)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "50%",
                        background: "#ede9fe", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "13px", fontWeight: 500, color: "#6d28d9", flexShrink: 0
                      }}>
                        {teacher.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{teacher.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-primary)" }}>{teacher.subject || "—"}</td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-secondary)", fontFamily: "monospace" }}>{teacher.employeeId || "—"}</td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-secondary)" }}>{teacher.phone || "—"}</td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-secondary)" }}>{teacher.experience ? `${teacher.experience} yrs` : "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500,
                      background: teacher.isActive !== false ? "#dcfce7" : "#fee2e2",
                      color: teacher.isActive !== false ? "#166534" : "#991b1b"
                    }}>
                      {teacher.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => openEditModal(teacher)}
                        style={{
                          padding: "5px 12px", fontSize: "12px", borderRadius: "6px", cursor: "pointer",
                          border: "0.5px solid var(--color-border-secondary)",
                          background: "transparent", color: "var(--color-text-primary)"
                        }}
                      >Edit</button>
                      <button
                        onClick={() => setDeleteConfirm(teacher)}
                        style={{
                          padding: "5px 12px", fontSize: "12px", borderRadius: "6px", cursor: "pointer",
                          border: "0.5px solid #fca5a5", background: "transparent", color: "#dc2626"
                        }}
                      >Deactivate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px"
        }}>
          <div style={{
            background: "var(--color-background-primary)", borderRadius: "12px",
            width: "100%", maxWidth: "520px", padding: "28px",
            border: "0.5px solid var(--color-border-tertiary)", maxHeight: "90vh", overflowY: "auto"
          }}>
            {credentials ? (
              <>
                <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 500 }}>Teacher Added</h2>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
                  Share these login credentials with the teacher. They will not be shown again.
                </p>
                <div style={{ background: "var(--color-background-secondary)", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Email</span>
                    <div style={{ fontSize: "14px", fontWeight: 500, marginTop: "2px" }}>{credentials.email}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Password</span>
                    <div style={{ fontSize: "14px", fontWeight: 500, marginTop: "2px", fontFamily: "monospace" }}>{credentials.password}</div>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    width: "100%", padding: "10px", background: "#6366f1", color: "#fff",
                    border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: "pointer"
                  }}
                >Done</button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 500 }}>
                    {editTeacher ? "Edit Teacher" : "Add Teacher"}
                  </h2>
                  <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--color-text-secondary)" }}>×</button>
                </div>
                {formError && (
                  <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
                    {formError}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    { label: "Full Name", name: "name", type: "text", required: true },
                    { label: "Email", name: "email", type: "email", required: true },
                    { label: "Phone", name: "phone", type: "tel", required: false },
                    { label: "Employee ID", name: "employeeId", type: "text", required: true },
                    { label: "Subject", name: "subject", type: "text", required: false },
                    { label: "Qualification", name: "qualification", type: "text", required: false },
                    { label: "Experience (years)", name: "experience", type: "number", required: false },
                  ].map((field) => (
                    <div key={field.name}>
                      <label style={{ display: "block", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "5px" }}>
                        {field.label}{field.required && <span style={{ color: "#dc2626" }}> *</span>}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleFormChange}
                        style={{
                          width: "100%", padding: "9px 12px", fontSize: "14px",
                          border: "0.5px solid var(--color-border-tertiary)", borderRadius: "8px",
                          background: "var(--color-background-primary)", color: "var(--color-text-primary)",
                          outline: "none", boxSizing: "border-box"
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      style={{
                        flex: 1, padding: "10px", border: "0.5px solid var(--color-border-secondary)",
                        borderRadius: "8px", background: "transparent", color: "var(--color-text-primary)",
                        fontSize: "14px", cursor: "pointer"
                      }}
                    >Cancel</button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={formLoading}
                      style={{
                        flex: 1, padding: "10px", background: formLoading ? "#a5b4fc" : "#6366f1",
                        color: "#fff", border: "none", borderRadius: "8px",
                        fontSize: "14px", fontWeight: 500, cursor: formLoading ? "not-allowed" : "pointer"
                      }}
                    >
                      {formLoading ? "Saving..." : editTeacher ? "Update Teacher" : "Add Teacher"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px"
        }}>
          <div style={{
            background: "var(--color-background-primary)", borderRadius: "12px",
            padding: "28px", maxWidth: "400px", width: "100%",
            border: "0.5px solid var(--color-border-tertiary)"
          }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 500 }}>Deactivate Teacher</h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "24px" }}>
              Are you sure you want to deactivate <strong>{deleteConfirm.name}</strong>? Their account will be disabled but data will be retained.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: "10px", border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: "8px", background: "transparent", color: "var(--color-text-primary)",
                  fontSize: "14px", cursor: "pointer"
                }}
              >Cancel</button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm._id)}
                style={{
                  flex: 1, padding: "10px", background: "#dc2626", color: "#fff",
                  border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: "pointer"
                }}
              >Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
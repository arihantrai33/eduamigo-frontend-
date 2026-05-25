import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const FEE_TYPES = ["Tuition","Transport","Library","Exam","Sports","Laboratory","Hostel","Miscellaneous"];
const YEARS     = ["2024-25","2025-26","2026-27"];

const inputStyle = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
  fontSize: 13, color: "#1a1a1a", outline: "none", background: "#f9fafb",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
};

export default function FeeStructure() {
  const [structures,  setStructures]  = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [applyingId,  setApplyingId]  = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [toast,       setToast]       = useState(null);
  const [filterYear,  setFilterYear]  = useState("2025-26");
  const [filterClass, setFilterClass] = useState("");
  const [activeTab,   setActiveTab]   = useState("structures");

  // Dynamic classes and sections
  const [availableClasses,  setAvailableClasses]  = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [sectionsLoading,   setSectionsLoading]   = useState(false);

  const [form, setForm] = useState({
    academicYear: "2025-26",
    class: "", section: "", feeType: "Tuition",
    amount: "", dueDate: "", description: "",
  });

  useEffect(() => { fetchAll(); },           [filterYear, filterClass]);
  useEffect(() => { fetchClasses(); },       []);
  useEffect(() => { fetchSections(); },      [form.class]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/students/classes`, authHeader());
      if (res.data.success) setAvailableClasses(res.data.data);
    } catch {
      setAvailableClasses([]);
    }
  };

  const fetchSections = async () => {
    if (!form.class) { setAvailableSections([]); return; }
    setSectionsLoading(true);
    try {
      const res = await axios.get(`${API}/students/sections?class=${form.class}`, authHeader());
      if (res.data.success) setAvailableSections(res.data.data);
    } catch {
      setAvailableSections([]);
    } finally {
      setSectionsLoading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ academicYear: filterYear });
      if (filterClass) params.set("class", filterClass);
      const [sRes, sumRes] = await Promise.all([
        axios.get(`${API}/fee-structures?${params}`, authHeader()),
        axios.get(`${API}/fee-structures/summary?academicYear=${filterYear}`, authHeader()),
      ]);
      if (sRes.data.success)   setStructures(sRes.data.data);
      if (sumRes.data.success) setSummary(sumRes.data.data);
    } catch {
      showToast("Failed to load fee structures", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ academicYear: "2025-26", class: "", section: "", feeType: "Tuition", amount: "", dueDate: "", description: "" });
    setAvailableSections([]);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      academicYear: s.academicYear, class: s.class, section: s.section,
      feeType: s.feeType, amount: s.amount,
      dueDate: s.dueDate ? s.dueDate.slice(0, 10) : "",
      description: s.description || "",
    });
    setShowModal(true);
  };

  const handleClassChange = (cls) => {
    setForm(f => ({ ...f, class: cls, section: "" }));
  };

  const handleSubmit = async () => {
    if (!form.class || !form.section || !form.amount || !form.dueDate) {
      showToast("Please fill all required fields", "error");
      return;
    }
    try {
      if (editTarget) {
        await axios.put(`${API}/fee-structures/${editTarget._id}`, form, authHeader());
        showToast("Fee structure updated successfully");
      } else {
        await axios.post(`${API}/fee-structures`, form, authHeader());
        showToast("Fee structure created successfully");
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed", "error");
    }
  };

  const handleApply = async (id, cls, section) => {
    if (!window.confirm(`Apply this fee to all students of Class ${cls}-${section}? Fee records will be created and parents will be notified.`)) return;
    setApplyingId(id);
    try {
      const res = await axios.post(`${API}/fee-structures/${id}/apply`, {}, authHeader());
      showToast(res.data.message);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to apply", "error");
    } finally {
      setApplyingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee structure?")) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/fee-structures/${id}`, authHeader());
      showToast("Fee structure deleted");
      fetchAll();
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100vh", background: "#f8f9fb", padding: "32px" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.type === "error" ? "#dc2626" : "#16a34a",
          color: "white", padding: "12px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Fee Structure Management</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Configure class-wise fee structures and apply them to students
          </div>
        </div>
        <button onClick={openCreate} style={{
          padding: "10px 20px", borderRadius: 9, border: "none",
          background: "#4f46e5", color: "#fff", fontSize: 13,
          fontWeight: 600, cursor: "pointer",
        }}>
          + New Fee Structure
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Billed",    value: `₹${summary.totalBilled?.toLocaleString("en-IN") ?? 0}`,  color: "#4f46e5" },
            { label: "Total Collected", value: `₹${summary.totalPaid?.toLocaleString("en-IN") ?? 0}`,   color: "#16a34a" },
            { label: "Total Pending",   value: `₹${summary.totalDue?.toLocaleString("en-IN") ?? 0}`,    color: "#dc2626" },
            { label: "Fee Records",     value: summary.totalRecords ?? 0,                                 color: "#d97706" },
          ].map((c) => (
            <div key={c.label} style={{
              background: "white", borderRadius: 12, padding: "20px 24px",
              border: "1px solid #f3f4f6", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f3f4f6", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          { key: "structures", label: "All Structures" },
          { key: "by-type",    label: "By Fee Type" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
            background: activeTab === tab.key ? "white" : "transparent",
            color:      activeTab === tab.key ? "#4f46e5" : "#6b7280",
            boxShadow:  activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ ...inputStyle, width: 140 }}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ ...inputStyle, width: 160 }}>
          <option value="">All Classes</option>
          {availableClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <button onClick={fetchAll} style={{
          padding: "9px 16px", borderRadius: 8, border: "1px solid #e5e7eb",
          background: "white", fontSize: 13, cursor: "pointer", color: "#374151", fontWeight: 500,
        }}>
          Refresh
        </button>
      </div>

      {/* Structures Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", fontSize: 14 }}>
          Loading fee structures...
        </div>
      ) : activeTab === "structures" ? (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "80px 80px 1fr 100px 110px 120px 160px",
            padding: "12px 20px", background: "#f9fafb",
            fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5, textTransform: "uppercase",
          }}>
            <span>Class</span><span>Section</span><span>Fee Type</span>
            <span>Amount</span><span>Due Date</span><span>Year</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {structures.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, color: "#374151", fontSize: 15 }}>No fee structures found</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>Create a fee structure to get started</div>
            </div>
          ) : (
            structures.map((s, i) => (
              <div key={s._id} style={{
                display: "grid", gridTemplateColumns: "80px 80px 1fr 100px 110px 120px 160px",
                padding: "14px 20px", alignItems: "center",
                borderTop: i === 0 ? "none" : "1px solid #f3f4f6",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Class {s.class}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5" }}>{s.section}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.feeType}</div>
                  {s.description && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{s.description}</div>}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>₹{s.amount?.toLocaleString("en-IN")}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {s.dueDate ? new Date(s.dueDate).toLocaleDateString("en-IN") : "—"}
                </span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{s.academicYear}</span>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => openEdit(s)} style={{
                    padding: "6px 12px", borderRadius: 7, border: "1px solid #e5e7eb",
                    background: "white", fontSize: 12, cursor: "pointer", color: "#374151", fontWeight: 500,
                  }}>Edit</button>
                  <button onClick={() => handleApply(s._id, s.class, s.section)}
                    disabled={applyingId === s._id}
                    style={{
                      padding: "6px 12px", borderRadius: 7, border: "none",
                      background: applyingId === s._id ? "#c7d2fe" : "#4f46e5",
                      color: "white", fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}>
                    {applyingId === s._id ? "Applying..." : "Apply"}
                  </button>
                  <button onClick={() => handleDelete(s._id)}
                    disabled={deletingId === s._id}
                    style={{
                      padding: "6px 10px", borderRadius: 7, border: "1px solid #fee2e2",
                      background: "#fef2f2", color: "#dc2626", fontSize: 12, cursor: "pointer",
                    }}>
                    {deletingId === s._id ? "..." : "✕"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {summary && Object.entries(summary.byType || {}).map(([type, data]) => (
            <div key={type} style={{
              background: "white", borderRadius: 14, padding: "20px 24px",
              border: "1px solid #f3f4f6", boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 16 }}>{type}</div>
              {[
                { label: "Total Billed", value: `₹${data.billed?.toLocaleString("en-IN")}`, color: "#4f46e5" },
                { label: "Collected",    value: `₹${data.paid?.toLocaleString("en-IN")}`,   color: "#16a34a" },
                { label: "Pending",      value: `₹${data.due?.toLocaleString("en-IN")}`,    color: "#dc2626" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.value}</span>
                </div>
              ))}
              <div style={{ height: 6, borderRadius: 99, background: "#f3f4f6", overflow: "hidden", marginTop: 8 }}>
                <div style={{
                  height: "100%", borderRadius: 99, background: "#4f46e5",
                  width: data.billed > 0 ? `${Math.round((data.paid / data.billed) * 100)}%` : "0%",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>
                {data.billed > 0 ? Math.round((data.paid / data.billed) * 100) : 0}% collected
              </div>
            </div>
          ))}
          {(!summary || Object.keys(summary.byType || {}).length === 0) && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
              No fee data available for this academic year
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "white", borderRadius: 16, padding: "28px 32px",
            width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
              {editTarget ? "Edit Fee Structure" : "Create Fee Structure"}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
              Define a fee structure and apply it to a class
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

              {/* Academic Year */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Academic Year *</label>
                <select value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} style={inputStyle}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Fee Type */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Fee Type *</label>
                <select value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))} style={inputStyle}>
                  {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Class — dynamic */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Class *</label>
                <select value={form.class} onChange={e => handleClassChange(e.target.value)} style={inputStyle}>
                  <option value="">Select class</option>
                  {availableClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>

              {/* Section — dynamic based on class */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Section *</label>
                <select
                  value={form.section}
                  onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                  disabled={!form.class || sectionsLoading}
                  style={{ ...inputStyle, opacity: !form.class ? 0.5 : 1 }}
                >
                  <option value="">
                    {sectionsLoading ? "Loading..." : !form.class ? "Select class first" : "Select section"}
                  </option>
                  {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Amount */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Amount (₹) *</label>
                <input
                  type="number"
                  value={form.amount}
                  placeholder="e.g. 5000"
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Due Date */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Due Date *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Description (optional)</label>
              <input
                type="text"
                value={form.description}
                placeholder="e.g. Annual tuition fee for academic year 2025-26"
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: "12px 16px", marginBottom: 24,
              fontSize: 12, color: "#15803d", lineHeight: 1.6,
            }}>
              <strong>Note:</strong> After creating, click <strong>Apply</strong> to generate fee records for all students in that class and section. Parents will be notified automatically.
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: "10px 24px", borderRadius: 9, border: "1px solid #e5e7eb",
                background: "white", fontSize: 13, cursor: "pointer", color: "#374151", fontWeight: 500,
              }}>Cancel</button>
              <button onClick={handleSubmit} style={{
                padding: "10px 24px", borderRadius: 9, border: "none",
                background: "#4f46e5", color: "#fff", fontSize: 13,
                cursor: "pointer", fontWeight: 600,
              }}>
                {editTarget ? "Update Structure" : "Create Structure"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
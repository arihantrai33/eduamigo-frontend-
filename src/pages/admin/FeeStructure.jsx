import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
  fontSize: 13, color: "#1a1a1a", outline: "none", background: "#f9fafb",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
};

const CURRENT_YEAR = "2025-26";
const YEARS = ["2024-25", "2025-26", "2026-27"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const FEE_TYPES = ["Tuition","Transport","Library","Exam","Sports","Laboratory","Hostel","Miscellaneous"];

export default function FeeStructure() {
  const [structures,   setStructures]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [applyModal,   setApplyModal]   = useState(null);
  const [toast,        setToast]        = useState(null);
  const [selYear,      setSelYear]      = useState(CURRENT_YEAR);
  const [applyForm,    setApplyForm]    = useState({ month: "", year: new Date().getFullYear() });
  const [applying,     setApplying]     = useState(false);

  const [form, setForm] = useState({
    academicYear: CURRENT_YEAR, class: "", section: "All",
    feeType: "Tuition", amount: "", dueDate: "", description: "",
  });

  useEffect(() => { fetchStructures(); }, [selYear]);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/fee-structures?academicYear=${selYear}`, authHeader());
      if (res.data.success) setStructures(res.data.data || []);
    } catch {
      showToast("Failed to load fee structures", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    if (!form.class || !form.feeType || !form.amount || !form.dueDate || !form.academicYear) {
      showToast("Please fill all required fields", "error"); return;
    }
    try {
      if (editItem) {
        await axios.put(`${API}/fee-structures/${editItem._id}`,
          { amount: Number(form.amount), dueDate: form.dueDate, description: form.description },
          authHeader());
        showToast("Fee structure updated successfully");
      } else {
        await axios.post(`${API}/fee-structures`,
          { ...form, amount: Number(form.amount) },
          authHeader());
        showToast("Fee structure created successfully");
      }
      setShowModal(false);
      setEditItem(null);
      setForm({ academicYear: CURRENT_YEAR, class: "", section: "All", feeType: "Tuition", amount: "", dueDate: "", description: "" });
      fetchStructures();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee structure?")) return;
    try {
      await axios.delete(`${API}/fee-structures/${id}`, authHeader());
      showToast("Deleted successfully");
      fetchStructures();
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const handleApply = async () => {
    if (!applyForm.month || !applyForm.year) {
      showToast("Select month and year", "error"); return;
    }
    setApplying(true);
    try {
      const res = await axios.post(
        `${API}/fee-structures/${applyModal._id}/apply`,
        { month: applyForm.month, year: Number(applyForm.year) },
        authHeader()
      );
      showToast(res.data.message);
      setApplyModal(null);
      setApplyForm({ month: "", year: new Date().getFullYear() });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to apply", "error");
    } finally {
      setApplying(false);
    }
  };

  const openEdit = (s) => {
    setEditItem(s);
    setForm({
      academicYear: s.academicYear, class: s.class, section: s.section,
      feeType: s.feeType, amount: s.amount,
      dueDate: s.dueDate ? s.dueDate.split("T")[0] : "",
      description: s.description || "",
    });
    setShowModal(true);
  };

  // Group by class for display
  const grouped = structures.reduce((acc, s) => {
    const key = `Class ${s.class}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "white", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Fee Structure</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
            Design fee structure once — apply to entire class anytime
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select value={selYear} onChange={e => setSelYear(e.target.value)}
            style={{ ...inputStyle, width: 130 }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => { setEditItem(null); setForm({ academicYear: selYear, class: "", section: "All", feeType: "Tuition", amount: "", dueDate: "", description: "" }); setShowModal(true); }}
            style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            + New Structure
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ fontSize: 20 }}>💡</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>How it works</div>
          <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4, lineHeight: 1.7 }}>
            1. Create a fee structure for each class (e.g. Class 10 — Tuition — ₹5000). <br />
            2. Click <strong>Apply</strong> to instantly generate fee records for all students of that class. <br />
            3. Students and parents will see the fee on their portal immediately. <br />
            4. You can edit the structure anytime — changes apply on next Apply action.
          </div>
        </div>
      </div>

      {/* Structures grouped by class */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>Loading fee structures...</div>
      ) : structures.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>No fee structures yet</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>Create your first fee structure to get started</div>
        </div>
      ) : (
        Object.entries(grouped).sort().map(([classLabel, items]) => (
          <div key={classLabel} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10, paddingLeft: 4 }}>
              {classLabel}
            </div>
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 180px", padding: "10px 20px", background: "#f9fafb", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
                <span>Fee Type</span><span>Section</span><span>Amount</span><span>Due Date</span><span>Last Applied</span><span style={{ textAlign: "right" }}>Actions</span>
              </div>
              {items.map((s, i) => {
                const lastApply = s.applyHistory?.[s.applyHistory.length - 1];
                return (
                  <div key={s._id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 180px", padding: "14px 20px", alignItems: "center", borderTop: i === 0 ? "none" : "1px solid #f3f4f6" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{s.feeType}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{s.section}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#4f46e5" }}>₹{s.amount.toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      {s.dueDate ? new Date(s.dueDate).toLocaleDateString("en-IN") : "—"}
                    </span>
                    <div>
                      {lastApply ? (
                        <div>
                          <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                            {new Date(lastApply.appliedAt).toLocaleDateString("en-IN")}
                          </div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>
                            {lastApply.created} students
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>Never applied</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => setApplyModal(s)}
                        style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#dcfce7", color: "#16a34a", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                        Apply
                      </button>
                      <button onClick={() => openEdit(s)}
                        style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#ede9fe", color: "#4f46e5", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(s._id)}
                        style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#fee2e2", color: "#dc2626", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 16, padding: "28px 32px", width: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 20 }}>
              {editItem ? "Edit Fee Structure" : "New Fee Structure"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Academic Year *</label>
                <select value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} style={inputStyle} disabled={!!editItem}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Fee Type *</label>
                <select value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))} style={inputStyle} disabled={!!editItem}>
                  {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Class *</label>
                <input type="text" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. 10" style={inputStyle} disabled={!!editItem} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Section</label>
                <input type="text" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="All / A / B" style={inputStyle} disabled={!!editItem} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 5000" style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional note" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} style={{ padding: "10px 24px", borderRadius: 9, border: "1px solid #e5e7eb", background: "white", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: "#4f46e5", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                {editItem ? "Save Changes" : "Create Structure"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 16, padding: "28px 32px", width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Apply Fee Structure</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              Class {applyModal.class} — {applyModal.feeType} — ₹{applyModal.amount.toLocaleString("en-IN")}
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: "#92400e" }}>
              This will create fee records for all students of Class {applyModal.class}
              {applyModal.section !== "All" ? ` Section ${applyModal.section}` : ""}. Students already having this fee for selected month will be skipped.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Month *</label>
                <select value={applyForm.month} onChange={e => setApplyForm(f => ({ ...f, month: e.target.value }))} style={inputStyle}>
                  <option value="">Select month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Year *</label>
                <input type="number" value={applyForm.year} onChange={e => setApplyForm(f => ({ ...f, year: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setApplyModal(null)} style={{ padding: "10px 24px", borderRadius: 9, border: "1px solid #e5e7eb", background: "white", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleApply} disabled={applying}
                style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: applying ? "#c7d2fe" : "#16a34a", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                {applying ? "Applying..." : "Apply to All Students"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
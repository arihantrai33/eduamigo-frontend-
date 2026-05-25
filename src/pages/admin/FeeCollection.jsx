import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const STATUS_COLORS = {
  Paid:    { bg: "#dcfce7", color: "#16a34a" },
  Unpaid:  { bg: "#fee2e2", color: "#dc2626" },
  Partial: { bg: "#fef3c7", color: "#d97706" },
};

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#f9fafb",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
};

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const FEE_TYPES = ["Tuition","Transport","Library","Exam","Sports","Laboratory","Hostel","Miscellaneous"];

export default function FeeCollection() {
  const [fees,         setFees]         = useState([]);
  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [markingId,    setMarkingId]    = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClass,  setFilterClass]  = useState("");
  const [toast,        setToast]        = useState(null);
  const [form, setForm] = useState({
    studentId: "", feeType: "Tuition",
    amount: "", dueDate: "", month: "", year: new Date().getFullYear(),
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [feesRes, studentsRes] = await Promise.all([
        axios.get(`${API}/fees/all`, authHeader()),
        axios.get(`${API}/students`, authHeader()),
      ]);
      if (feesRes.data.success)     setFees(feesRes.data.data || []);
      if (studentsRes.data.success) setStudents(studentsRes.data.data || []);
    } catch {
      showToast("Failed to load fee data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleMarkPaid = async (feeId) => {
    setMarkingId(feeId);
    try {
      const res = await axios.patch(`${API}/fees/${feeId}/pay`, {}, authHeader());
      showToast(res.data.message || "Fee marked as paid");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to mark as paid", "error");
    } finally {
      setMarkingId(null);
    }
  };

  const handleAddFee = async () => {
    if (!form.studentId || !form.amount || !form.dueDate || !form.month) {
      showToast("Please fill all required fields", "error"); return;
    }
    try {
      await axios.post(`${API}/fees/add`, {
        ...form,
        amount: Number(form.amount),
        year:   Number(form.year),
      }, authHeader());
      showToast("Fee record added successfully");
      setShowModal(false);
      setForm({ studentId: "", feeType: "Tuition", amount: "", dueDate: "", month: "", year: new Date().getFullYear() });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add fee", "error");
    }
  };

  const filtered = fees.filter(f => {
    if (filterStatus && f.status !== filterStatus) return false;
    if (filterClass && f.studentId?.class !== filterClass) return false;
    return true;
  });

  const totalCollected = fees.filter(f => f.status === "Paid").reduce((s, f) => s + f.amount, 0);
  const totalPending   = fees.filter(f => f.status !== "Paid").reduce((s, f) => s + f.amount, 0);
  const uniqueClasses  = [...new Set(students.map(s => s.class))].sort();

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
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Fee Collection</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Track and manage all student fee payments</div>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Add Fee Record
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Records",   value: fees.length,                                           color: "#4f46e5", bg: "#ede9fe" },
          { label: "Total Collected", value: `₹${totalCollected.toLocaleString("en-IN")}`,          color: "#16a34a", bg: "#dcfce7" },
          { label: "Total Pending",   value: `₹${totalPending.toLocaleString("en-IN")}`,            color: "#dc2626", bg: "#fee2e2" },
          { label: "Total Students",  value: students.length,                                        color: "#d97706", bg: "#fef3c7" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="">All Status</option>
          {["Paid","Unpaid","Partial"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="">All Classes</option>
          {uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <button onClick={fetchAll} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", fontSize: 12, cursor: "pointer", color: "#374151" }}>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 120px", padding: "11px 20px", background: "#f9fafb", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>Student</span><span>Fee Type</span><span>Amount</span><span>Due Date</span><span>Status</span><span style={{ textAlign: "right" }}>Action</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 14 }}>Loading fee records...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <div style={{ fontWeight: 600, color: "#374151" }}>No fee records found</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Try changing the filters or add a fee record</div>
          </div>
        ) : (
          filtered.map((f, i) => {
            const student = f.studentId;
            const sc = STATUS_COLORS[f.status] ?? STATUS_COLORS.Unpaid;
            return (
              <div key={f._id}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 120px", padding: "13px 20px", alignItems: "center", borderTop: i === 0 ? "none" : "1px solid #f3f4f6" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{student?.name ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    Class {student?.class ?? "—"}-{student?.section ?? "—"} · {f.month} {f.year}
                  </div>
                </div>
                <span style={{ fontSize: 13, color: "#374151" }}>{f.feeType}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>₹{(f.amount ?? 0).toLocaleString("en-IN")}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN") : "—"}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.color, display: "inline-block" }}>
                  {f.status}
                </span>
                <div style={{ textAlign: "right" }}>
                  {f.status !== "Paid" ? (
                    <button onClick={() => handleMarkPaid(f._id)} disabled={markingId === f._id}
                      style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: markingId === f._id ? "#c7d2fe" : "#4f46e5", color: "white", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                      {markingId === f._id ? "..." : "Mark Paid"}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>✓ Collected</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Fee Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 16, padding: "28px 32px", width: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Add Fee Record</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Student *</label>
                <select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} style={inputStyle}>
                  <option value="">Select student</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name} — Class {s.class}-{s.section}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Fee Type *</label>
                <select value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))} style={inputStyle}>
                  {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 5000" style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Month *</label>
                <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} style={inputStyle}>
                  <option value="">Select month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Year *</label>
                <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 24px", borderRadius: 9, border: "1px solid #e5e7eb", background: "white", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddFee} style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: "#4f46e5", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Add Fee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
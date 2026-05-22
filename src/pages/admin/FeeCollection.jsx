import { useState } from "react";

const FEES = [
  { id: "1", studentName: "Rahul Sharma", class: "10", section: "A", feeType: "Tuition", amount: 5000, paidAmount: 5000, dueAmount: 0, status: "Paid", paymentMode: "Online", month: "May 2026" },
  { id: "2", studentName: "Priya Kapoor", class: "9", section: "B", feeType: "Tuition", amount: 5000, paidAmount: 2500, dueAmount: 2500, status: "Partial", paymentMode: "Cash", month: "May 2026" },
  { id: "3", studentName: "Arjun Mehta", class: "8", section: "C", feeType: "Transport", amount: 2000, paidAmount: 0, dueAmount: 2000, status: "Pending", paymentMode: "", month: "May 2026" },
  { id: "4", studentName: "Sneha Gupta", class: "11", section: "A", feeType: "Tuition", amount: 5000, paidAmount: 5000, dueAmount: 0, status: "Paid", paymentMode: "UPI", month: "May 2026" },
];

const statusColors = {
  Paid:    { bg: "#EAF3DE", color: "#3B6D11" },
  Pending: { bg: "#FAECE7", color: "#993C1D" },
  Partial: { bg: "#FAEEDA", color: "#854F0B" },
};

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const FeeCollection = () => {
  const [fees, setFees] = useState(FEES);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({
    studentName: "", class: "", section: "", feeType: "Tuition",
    amount: "", paidAmount: "", month: "", paymentMode: "Cash", remarks: ""
  });

  const filtered = fees.filter(f => filterStatus ? f.status === filterStatus : true);

  const totalCollected = fees.reduce((acc, f) => acc + f.paidAmount, 0);
  const totalPending = fees.reduce((acc, f) => acc + f.dueAmount, 0);

  const handleSubmit = () => {
    if (!form.studentName || !form.amount) return;
    const amount = Number(form.amount);
    const paidAmount = Number(form.paidAmount);
    const dueAmount = amount - paidAmount;
    const status = dueAmount <= 0 ? "Paid" : paidAmount === 0 ? "Pending" : "Partial";
    setFees([...fees, { ...form, id: Date.now().toString(), amount, paidAmount, dueAmount, status }]);
    setForm({ studentName: "", class: "", section: "", feeType: "Tuition", amount: "", paidAmount: "", month: "", paymentMode: "Cash", remarks: "" });
    setShowModal(false);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Fee Collection</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Track and manage fee payments</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: "8px 16px", borderRadius: 8, border: "none",
          background: "#534AB7", color: "#fff", fontSize: 12,
          fontWeight: 500, cursor: "pointer"
        }}>+ Collect Fee</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Collected", value: `₹${totalCollected.toLocaleString()}`, color: "#3B6D11", bg: "#EAF3DE" },
          { label: "Total Pending", value: `₹${totalPending.toLocaleString()}`, color: "#993C1D", bg: "#FAECE7" },
          { label: "Total Students", value: fees.length, color: "#534AB7", bg: "#EEEDFE" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 12 }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 160 }}>
          <option value="">All Status</option>
          {["Paid", "Pending", "Partial"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
          padding: "10px 16px", background: "#F5F5F3",
          fontSize: 11, fontWeight: 500, color: "#666"
        }}>
          <span>Student</span><span>Fee Type</span><span>Amount</span><span>Paid</span><span>Due</span><span>Status</span>
        </div>
        {filtered.map((f) => (
          <div key={f.id} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
            padding: "12px 16px", alignItems: "center",
            borderTop: "0.5px solid #E8E8E5"
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{f.studentName}</div>
              <div style={{ fontSize: 11, color: "#999" }}>Class {f.class}-{f.section} · {f.month}</div>
            </div>
            <span style={{ fontSize: 12, color: "#666" }}>{f.feeType}</span>
            <span style={{ fontSize: 12, color: "#666" }}>₹{f.amount.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: "#3B6D11" }}>₹{f.paidAmount.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: "#993C1D" }}>₹{f.dueAmount.toLocaleString()}</span>
            <span style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500,
              display: "inline-block",
              background: statusColors[f.status].bg, color: statusColors[f.status].color
            }}>{f.status}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Collect Fee</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Student Name", key: "studentName" },
                { label: "Month", key: "month" },
                { label: "Amount", key: "amount", type: "number" },
                { label: "Paid Amount", key: "paidAmount", type: "number" },
                { label: "Receipt No", key: "receiptNo" },
                { label: "Remarks", key: "remarks" },
              ].map(({ label, key, type = "text" }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>{label}</label>
                  <input type={type} value={form[key] || ""} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Fee Type</label>
                <select value={form.feeType} onChange={e => setForm({ ...form, feeType: e.target.value })} style={inputStyle}>
                  {["Tuition", "Transport", "Library", "Exam", "Other"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Payment Mode</label>
                <select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })} style={inputStyle}>
                  {["Cash", "Online", "Cheque", "UPI"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#F5F5F3", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCollection;
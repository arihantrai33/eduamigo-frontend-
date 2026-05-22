import { useState } from "react";

const STRUCTURES = [
  { id: "1", class: "8", feeType: "Tuition", amount: 4500, frequency: "Monthly" },
  { id: "2", class: "9", feeType: "Tuition", amount: 4500, frequency: "Monthly" },
  { id: "3", class: "10", feeType: "Tuition", amount: 5000, frequency: "Monthly" },
  { id: "4", class: "11", feeType: "Tuition", amount: 5500, frequency: "Monthly" },
  { id: "5", class: "12", feeType: "Tuition", amount: 5500, frequency: "Monthly" },
  { id: "6", class: "All", feeType: "Transport", amount: 2000, frequency: "Monthly" },
  { id: "7", class: "All", feeType: "Library", amount: 500, frequency: "Yearly" },
  { id: "8", class: "All", feeType: "Exam", amount: 1000, frequency: "Per Exam" },
];

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const FeeStructure = () => {
  const [structures, setStructures] = useState(STRUCTURES);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ class: "", feeType: "Tuition", amount: "", frequency: "Monthly" });

  const handleSubmit = () => {
    if (!form.class || !form.amount) return;
    setStructures([...structures, { ...form, id: Date.now().toString(), amount: Number(form.amount) }]);
    setForm({ class: "", feeType: "Tuition", amount: "", frequency: "Monthly" });
    setShowModal(false);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Fee Structure</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Define fee structure for each class</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: "8px 16px", borderRadius: 8, border: "none",
          background: "#534AB7", color: "#fff", fontSize: 12,
          fontWeight: 500, cursor: "pointer"
        }}>+ Add Structure</button>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr",
          padding: "10px 16px", background: "#F5F5F3",
          fontSize: 11, fontWeight: 500, color: "#666"
        }}>
          <span>Class</span><span>Fee Type</span><span>Amount</span><span>Frequency</span>
        </div>
        {structures.map((s) => (
          <div key={s.id} style={{
            display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr",
            padding: "12px 16px", alignItems: "center",
            borderTop: "0.5px solid #E8E8E5"
          }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>Class {s.class}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{s.feeType}</span>
            <span style={{ fontSize: 12, color: "#534AB7", fontWeight: 500 }}>₹{s.amount.toLocaleString()}</span>
            <span style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500,
              display: "inline-block", background: "#EEEDFE", color: "#534AB7"
            }}>{s.frequency}</span>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: 400 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Add Fee Structure</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Class</label>
                <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} style={inputStyle}>
                  <option value="">Select</option>
                  {["8","9","10","11","12","All"].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Fee Type</label>
                <select value={form.feeType} onChange={e => setForm({ ...form, feeType: e.target.value })} style={inputStyle}>
                  {["Tuition","Transport","Library","Exam","Other"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Amount (₹)</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Frequency</label>
                <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={inputStyle}>
                  {["Monthly","Yearly","Per Exam","One Time"].map(f => <option key={f} value={f}>{f}</option>)}
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

export default FeeStructure;
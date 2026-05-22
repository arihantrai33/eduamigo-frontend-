import { useState } from "react";

const MARKS = [
  { id: "1", studentName: "Rahul Sharma", class: "10", section: "A", subject: "Mathematics", examName: "Mid Term 2026", totalMarks: 100, marksObtained: 87, grade: "A", percentage: 87 },
  { id: "2", studentName: "Priya Kapoor", class: "9", section: "B", subject: "Science", examName: "Mid Term 2026", totalMarks: 100, marksObtained: 92, grade: "A+", percentage: 92 },
  { id: "3", studentName: "Arjun Mehta", class: "8", section: "C", subject: "English", examName: "Mid Term 2026", totalMarks: 50, marksObtained: 38, grade: "B", percentage: 76 },
];

const gradeColor = (g) => {
  if (g === "A+" || g === "A") return { bg: "#EAF3DE", color: "#3B6D11" };
  if (g === "B") return { bg: "#EEEDFE", color: "#534AB7" };
  return { bg: "#FAEEDA", color: "#854F0B" };
};

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const Marks = () => {
  const [marks, setMarks] = useState(MARKS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentName: "", class: "", section: "", subject: "", examName: "", totalMarks: "", marksObtained: "" });

  const handleSubmit = () => {
    if (!form.studentName || !form.marksObtained) return;
    const total = Number(form.totalMarks);
    const obtained = Number(form.marksObtained);
    const percentage = Math.round((obtained / total) * 100);
    const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "D";
    setMarks([...marks, { ...form, id: Date.now().toString(), totalMarks: total, marksObtained: obtained, percentage, grade }]);
    setForm({ studentName: "", class: "", section: "", subject: "", examName: "", totalMarks: "", marksObtained: "" });
    setShowModal(false);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Marks</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Enter and manage student marks</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>+ Add Marks</button>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: "#F5F5F3", fontSize: 11, fontWeight: 500, color: "#666" }}>
          <span>Student</span><span>Subject</span><span>Exam</span><span>Marks</span><span>%</span><span>Grade</span>
        </div>
        {marks.map(m => (
          <div key={m.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "12px 16px", alignItems: "center", borderTop: "0.5px solid #E8E8E5" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{m.studentName}</div>
              <div style={{ fontSize: 11, color: "#999" }}>Class {m.class}-{m.section}</div>
            </div>
            <span style={{ fontSize: 12, color: "#666" }}>{m.subject}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{m.examName}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{m.marksObtained}/{m.totalMarks}</span>
            <span style={{ fontSize: 12, color: "#534AB7", fontWeight: 500 }}>{m.percentage}%</span>
            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500, display: "inline-block", background: gradeColor(m.grade).bg, color: gradeColor(m.grade).color }}>{m.grade}</span>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Add Marks</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Student Name", key: "studentName" },
                { label: "Exam Name", key: "examName" },
                { label: "Subject", key: "subject" },
                { label: "Total Marks", key: "totalMarks", type: "number" },
                { label: "Marks Obtained", key: "marksObtained", type: "number" },
              ].map(({ label, key, type = "text" }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Class</label>
                <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} style={inputStyle}>
                  <option value="">Select</option>
                  {["8","9","10","11","12"].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Section</label>
                <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} style={inputStyle}>
                  <option value="">Select</option>
                  {["A","B","C","D"].map(s => <option key={s} value={s}>Section {s}</option>)}
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

export default Marks;
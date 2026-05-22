import { useState } from "react";

const EXAMS = [
  { id: "1", examName: "Mid Term 2026", subject: "Mathematics", class: "10", section: "A", date: "2026-06-10", totalMarks: 100, teacher: "Mr. Sharma" },
  { id: "2", examName: "Mid Term 2026", subject: "Science", class: "10", section: "A", date: "2026-06-12", totalMarks: 100, teacher: "Mrs. Kapoor" },
  { id: "3", examName: "Mid Term 2026", subject: "English", class: "9", section: "B", date: "2026-06-14", totalMarks: 50, teacher: "Mr. Mehta" },
  { id: "4", examName: "Final 2026", subject: "Hindi", class: "11", section: "A", date: "2026-07-01", totalMarks: 100, teacher: "Mrs. Gupta" },
];

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const ExamSchedule = () => {
  const [exams, setExams] = useState(EXAMS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ examName: "", subject: "", class: "", section: "", date: "", totalMarks: "", teacher: "" });

  const handleSubmit = () => {
    if (!form.examName || !form.subject) return;
    setExams([...exams, { ...form, id: Date.now().toString() }]);
    setForm({ examName: "", subject: "", class: "", section: "", date: "", totalMarks: "", teacher: "" });
    setShowModal(false);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Exam Schedule</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Manage exams and schedules</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: "8px 16px", borderRadius: 8, border: "none",
          background: "#534AB7", color: "#fff", fontSize: 12,
          fontWeight: 500, cursor: "pointer"
        }}>+ Add Exam</button>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
          padding: "10px 16px", background: "#F5F5F3",
          fontSize: 11, fontWeight: 500, color: "#666"
        }}>
          <span>Exam</span><span>Subject</span><span>Class</span><span>Date</span><span>Marks</span><span>Teacher</span>
        </div>
        {exams.map((e, i) => (
          <div key={e.id} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
            padding: "12px 16px", alignItems: "center",
            borderTop: "0.5px solid #E8E8E5"
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{e.examName}</div>
            </div>
            <span style={{ fontSize: 12, color: "#666" }}>{e.subject}</span>
            <span style={{ fontSize: 12, color: "#666" }}>Class {e.class}-{e.section}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{e.date}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{e.totalMarks}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{e.teacher}</span>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Add Exam</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Exam Name", key: "examName" },
                { label: "Subject", key: "subject" },
                { label: "Teacher", key: "teacher" },
                { label: "Total Marks", key: "totalMarks" },
                { label: "Date", key: "date", type: "date" },
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
              <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Add Exam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSchedule;
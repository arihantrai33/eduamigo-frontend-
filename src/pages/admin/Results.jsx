const RESULTS = [
  { id: "1", studentName: "Rahul Sharma", class: "10", section: "A", examName: "Mid Term 2026", totalMarks: 500, marksObtained: 435, percentage: 87, grade: "A", remarks: "Excellent" },
  { id: "2", studentName: "Priya Kapoor", class: "9", section: "B", examName: "Mid Term 2026", totalMarks: 500, marksObtained: 460, percentage: 92, grade: "A+", remarks: "Outstanding" },
  { id: "3", studentName: "Arjun Mehta", class: "8", section: "C", examName: "Mid Term 2026", totalMarks: 500, marksObtained: 320, percentage: 64, grade: "C", remarks: "Needs Improvement" },
];

const gradeColor = (g) => {
  if (g === "A+") return { bg: "#EAF3DE", color: "#3B6D11" };
  if (g === "A") return { bg: "#E1F5EE", color: "#0F6E56" };
  if (g === "B") return { bg: "#EEEDFE", color: "#534AB7" };
  if (g === "C") return { bg: "#FAEEDA", color: "#854F0B" };
  return { bg: "#FAECE7", color: "#993C1D" };
};

const Results = () => (
  <div style={{ fontFamily: "Inter, sans-serif" }}>
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Results</div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Student exam results and performance</div>
    </div>

    <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: "#F5F5F3", fontSize: 11, fontWeight: 500, color: "#666" }}>
        <span>Student</span><span>Exam</span><span>Marks</span><span>%</span><span>Grade</span><span>Remarks</span>
      </div>
      {RESULTS.map(r => (
        <div key={r.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "12px 16px", alignItems: "center", borderTop: "0.5px solid #E8E8E5" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{r.studentName}</div>
            <div style={{ fontSize: 11, color: "#999" }}>Class {r.class}-{r.section}</div>
          </div>
          <span style={{ fontSize: 12, color: "#666" }}>{r.examName}</span>
          <span style={{ fontSize: 12, color: "#666" }}>{r.marksObtained}/{r.totalMarks}</span>
          <span style={{ fontSize: 12, color: "#534AB7", fontWeight: 500 }}>{r.percentage}%</span>
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500, display: "inline-block", background: gradeColor(r.grade).bg, color: gradeColor(r.grade).color }}>{r.grade}</span>
          <span style={{ fontSize: 11, color: "#666" }}>{r.remarks}</span>
        </div>
      ))}
    </div>
  </div>
);

export default Results;
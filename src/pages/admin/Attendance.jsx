import { useState } from "react";

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const STUDENTS = [
  { id: "1", name: "Rahul Sharma", class: "10", section: "A" },
  { id: "2", name: "Priya Kapoor", class: "9", section: "B" },
  { id: "3", name: "Arjun Mehta", class: "8", section: "C" },
  { id: "4", name: "Sneha Gupta", class: "11", section: "A" },
];

const Attendance = () => {
  const [filters, setFilters] = useState({ class: "", section: "", date: "" });
  const [attendance, setAttendance] = useState(
    STUDENTS.reduce((acc, s) => ({ ...acc, [s.id]: { status: "Present", remarks: "" } }), {})
  );
  const [submitted, setSubmitted] = useState(false);

  const handleFilter = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleStatus = (id, status) =>
    setAttendance({ ...attendance, [id]: { ...attendance[id], status } });

  const handleRemarks = (id, remarks) =>
    setAttendance({ ...attendance, [id]: { ...attendance[id], remarks } });

  const handleSubmit = () => {
    console.log({ filters, attendance });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const statusColors = {
    Present: { bg: "#EAF3DE", color: "#3B6D11" },
    Absent:  { bg: "#FAECE7", color: "#993C1D" },
    Late:    { bg: "#FAEEDA", color: "#854F0B" },
    Holiday: { bg: "#EEEDFE", color: "#534AB7" },
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Attendance</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Mark daily class-wise attendance</div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.25rem", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Filter</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Class</label>
            <select name="class" value={filters.class} onChange={handleFilter} style={inputStyle}>
              <option value="">Select Class</option>
              {["8","9","10","11","12"].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Section</label>
            <select name="section" value={filters.section} onChange={handleFilter} style={inputStyle}>
              <option value="">Select Section</option>
              {["A","B","C","D"].map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Date</label>
            <input type="date" name="date" value={filters.date} onChange={handleFilter} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.25rem" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Students</div>

        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 2fr",
          padding: "8px 10px", background: "#F5F5F3", borderRadius: 8,
          fontSize: 11, fontWeight: 500, color: "#666", marginBottom: 8
        }}>
          <span>Student</span>
          <span>Class</span>
          <span>Section</span>
          <span>Status</span>
          <span>Remarks</span>
        </div>

        {STUDENTS.map((s, i) => (
          <div key={s.id} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 2fr",
            padding: "10px", alignItems: "center",
            borderBottom: i < STUDENTS.length - 1 ? "0.5px solid #E8E8E5" : "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "#EEEDFE",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 500, color: "#534AB7"
              }}>{s.name[0]}</div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{s.name}</span>
            </div>
            <span style={{ fontSize: 12, color: "#666" }}>{s.class}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{s.section}</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {["Present", "Absent", "Late", "Holiday"].map(st => (
                <span
                  key={st}
                  onClick={() => handleStatus(s.id, st)}
                  style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 20,
                    cursor: "pointer", fontWeight: 500,
                    background: attendance[s.id].status === st ? statusColors[st].bg : "#F5F5F3",
                    color: attendance[s.id].status === st ? statusColors[st].color : "#999",
                    border: attendance[s.id].status === st ? `1px solid ${statusColors[st].color}` : "1px solid transparent",
                    transition: "all 0.15s"
                  }}
                >{st}</span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add remark..."
              value={attendance[s.id].remarks}
              onChange={(e) => handleRemarks(s.id, e.target.value)}
              style={{ ...inputStyle, fontSize: 11 }}
            />
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button
            onClick={handleSubmit}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: submitted ? "#1D9E75" : "#534AB7",
              fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 500,
              transition: "background 0.2s"
            }}
          >
            {submitted ? "✓ Saved!" : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
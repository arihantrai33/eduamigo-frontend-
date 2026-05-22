const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [
  { no: 1, time: "09:00 - 09:45" },
  { no: 2, time: "09:45 - 10:30" },
  { no: 3, time: "10:45 - 11:30" },
  { no: 4, time: "11:30 - 12:15" },
  { no: 5, time: "01:00 - 01:45" },
  { no: 6, time: "01:45 - 02:30" },
];

const TIMETABLE = {
  Monday:    ["Mathematics", "Science", "Break", "English", "Hindi", "Computer"],
  Tuesday:   ["English", "Mathematics", "Break", "Science", "Social", "Art"],
  Wednesday: ["Science", "Hindi", "Break", "Mathematics", "Computer", "PE"],
  Thursday:  ["Hindi", "English", "Break", "Art", "Mathematics", "Science"],
  Friday:    ["Computer", "Social", "Break", "Hindi", "English", "Mathematics"],
  Saturday:  ["PE", "Art", "Break", "Science", "Hindi", "English"],
};

const colors = ["#EEEDFE", "#E1F5EE", "#FAEEDA", "#FAECE7", "#EAF3DE", "#E1F5EE"];
const textColors = ["#534AB7", "#0F6E56", "#854F0B", "#993C1D", "#3B6D11", "#0F6E56"];

const Timetable = () => (
  <div style={{ fontFamily: "Inter, sans-serif" }}>
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Timetable</div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Weekly class schedule</div>
    </div>

    <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F5F5F3" }}>
            <th style={{ padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#666", textAlign: "left", borderBottom: "0.5px solid #E8E8E5" }}>Period</th>
            {DAYS.map(d => (
              <th key={d} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 500, color: "#666", textAlign: "center", borderBottom: "0.5px solid #E8E8E5" }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((p, i) => (
            <tr key={i}>
              <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #E8E8E5" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>Period {p.no}</div>
                <div style={{ fontSize: 10, color: "#999" }}>{p.time}</div>
              </td>
              {DAYS.map(d => {
                const subject = TIMETABLE[d][i];
                const isBreak = subject === "Break";
                return (
                  <td key={d} style={{ padding: "8px 12px", borderBottom: "0.5px solid #E8E8E5", textAlign: "center" }}>
                    <span style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 8, fontWeight: 500,
                      background: isBreak ? "#F5F5F3" : colors[i % colors.length],
                      color: isBreak ? "#999" : textColors[i % textColors.length],
                      display: "inline-block"
                    }}>{subject}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Timetable;
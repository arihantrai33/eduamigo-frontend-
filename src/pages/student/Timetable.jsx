import { useState } from "react";
import { useNavigate } from "react-router-dom";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const timetableData = {
  Mon: [
    { time: "8:00", subject: "Physics", teacher: "Ms. Verma", room: "Lab 301" },
    { time: "9:00", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 204" },
    { time: "10:00", subject: "Chemistry", teacher: "Mr. Joshi", room: "Lab 201" },
    { time: "11:00", subject: "English Literature", teacher: "Mrs. Gupta", room: "Room 101" },
    { time: "12:00", subject: "🍱 Lunch Break", teacher: "Canteen", room: "" },
    { time: "1:00", subject: "Computer Science", teacher: "Mr. Kapoor", room: "Lab 401" },
    { time: "2:00", subject: "Hindi", teacher: "Mrs. Singh", room: "Room 105" },
    { time: "3:00", subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Tue: [
    { time: "8:00", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 204" },
    { time: "9:00", subject: "Physics", teacher: "Ms. Verma", room: "Lab 301" },
    { time: "10:00", subject: "English Literature", teacher: "Mrs. Gupta", room: "Room 101" },
    { time: "11:00", subject: "Chemistry", teacher: "Mr. Joshi", room: "Lab 201" },
    { time: "12:00", subject: "🍱 Lunch Break", teacher: "Canteen", room: "" },
    { time: "1:00", subject: "Hindi", teacher: "Mrs. Singh", room: "Room 105" },
    { time: "2:00", subject: "Computer Science", teacher: "Mr. Kapoor", room: "Lab 401" },
    { time: "3:00", subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Wed: [
    { time: "8:00", subject: "English Literature", teacher: "Mrs. Gupta", room: "Room 101" },
    { time: "9:00", subject: "Chemistry", teacher: "Mr. Joshi", room: "Lab 201" },
    { time: "10:00", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 204" },
    { time: "11:00", subject: "Physics", teacher: "Ms. Verma", room: "Lab 301" },
    { time: "12:00", subject: "🍱 Lunch Break", teacher: "Canteen", room: "" },
    { time: "1:00", subject: "Computer Science", teacher: "Mr. Kapoor", room: "Lab 401" },
    { time: "2:00", subject: "Hindi", teacher: "Mrs. Singh", room: "Room 105" },
    { time: "3:00", subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Thu: [
    { time: "8:00", subject: "Hindi", teacher: "Mrs. Singh", room: "Room 105" },
    { time: "9:00", subject: "Computer Science", teacher: "Mr. Kapoor", room: "Lab 401" },
    { time: "10:00", subject: "Physics", teacher: "Ms. Verma", room: "Lab 301" },
    { time: "11:00", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 204" },
    { time: "12:00", subject: "🍱 Lunch Break", teacher: "Canteen", room: "" },
    { time: "1:00", subject: "Chemistry", teacher: "Mr. Joshi", room: "Lab 201" },
    { time: "2:00", subject: "English Literature", teacher: "Mrs. Gupta", room: "Room 101" },
    { time: "3:00", subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Fri: [
    { time: "8:00", subject: "Computer Science", teacher: "Mr. Kapoor", room: "Lab 401" },
    { time: "9:00", subject: "Hindi", teacher: "Mrs. Singh", room: "Room 105" },
    { time: "10:00", subject: "Chemistry", teacher: "Mr. Joshi", room: "Lab 201" },
    { time: "11:00", subject: "English Literature", teacher: "Mrs. Gupta", room: "Room 101" },
    { time: "12:00", subject: "🍱 Lunch Break", teacher: "Canteen", room: "" },
    { time: "1:00", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 204" },
    { time: "2:00", subject: "Physics", teacher: "Ms. Verma", room: "Lab 301" },
    { time: "3:00", subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Sat: [
    { time: "8:00", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 204" },
    { time: "9:00", subject: "English Literature", teacher: "Mrs. Gupta", room: "Room 101" },
    { time: "10:00", subject: "Hindi", teacher: "Mrs. Singh", room: "Room 105" },
    { time: "11:00", subject: "Physics", teacher: "Ms. Verma", room: "Lab 301" },
    { time: "12:00", subject: "🍱 Lunch Break", teacher: "Canteen", room: "" },
    { time: "1:00", subject: "Computer Science", teacher: "Mr. Kapoor", room: "Lab 401" },
  ],
};

const getStatus = (time, selectedDay) => {
  const now = new Date();
  const currentDay = days[now.getDay() - 1];
  if (selectedDay !== currentDay) return time === "12:00" ? "Break" : "Upcoming";
  if (time === "12:00") return "Break";
  const hour = now.getHours();
  let classHour = parseInt(time.split(":")[0]);
  if (classHour < 8) classHour += 12;
  if (classHour < hour) return "Done";
  if (classHour === hour) return "Now";
  return "Upcoming";
};

const getStatusStyle = (status) => {
  switch (status) {
    case "Done": return { bg: "#E8F5E9", color: "#2E7D32" };
    case "Now": return { bg: "#E3F2FD", color: "#1565C0" };
    case "Break": return { bg: "#E8F5E9", color: "#2E7D32" };
    case "Upcoming": return { bg: "#FFF3E0", color: "#E65100" };
    default: return { bg: "#f5f5f5", color: "#999" };
  }
};

const getTimeStyle = (status) => {
  switch (status) {
    case "Now": return { bg: "#FF6B35", color: "white" };
    default: return { bg: "#EEF2FF", color: "#6366f1" };
  }
};

export default function Timetable() {
  const navigate = useNavigate();
  const now = new Date();
  const todayIndex = now.getDay() === 0 ? 5 : now.getDay() - 1;
  const todayDay = days[Math.min(todayIndex, 5)];
  const [selectedDay, setSelectedDay] = useState(todayDay);
  const classes = timetableData[selectedDay] || [];
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).toUpperCase();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f6fa", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ background: "white", padding: "48px 20px 0px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <button onClick={() => navigate("/student/home")} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>←</button>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#111" }}>📅 Timetable</div>
        </div>

        {/* Day Selector */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "16px" }}>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                background: selectedDay === day ? "#6366f1" : "#f0f0f0",
                color: selectedDay === day ? "white" : "#666",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Classes List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "#999", marginBottom: "12px", letterSpacing: "1px" }}>
          {dateStr}
        </div>

        <div style={{ background: "white", borderRadius: "16px", padding: "4px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {classes.map((cls, i) => {
            const status = getStatus(cls.time, selectedDay);
            const statusStyle = getStatusStyle(status);
            const timeStyle = getTimeStyle(status);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", borderBottom: i < classes.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <div style={{ minWidth: "52px", background: timeStyle.bg, borderRadius: "10px", padding: "6px 4px", textAlign: "center", color: timeStyle.color, fontWeight: "800", fontSize: "13px" }}>
                  {cls.time}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#111" }}>{cls.subject}</div>
                  <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                    {cls.teacher}{cls.room ? ` • ${cls.room}` : ""}
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "700", background: statusStyle.bg, color: statusStyle.color, padding: "4px 10px", borderRadius: "8px", flexShrink: 0 }}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
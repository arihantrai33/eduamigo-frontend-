import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getStatus = (startTime) => {
  const now = new Date();
  const hour = now.getHours();
  const classHour = parseInt(startTime?.split(":")[0] || "0");
  if (classHour < hour) return "Done";
  if (classHour === hour) return "Now";
  return "Upcoming";
};

const getStatusStyle = (status) => {
  switch (status) {
    case "Done":     return { bg: "#E8F5E9", color: "#2E7D32" };
    case "Now":      return { bg: "#E3F2FD", color: "#1565C0" };
    case "Break":    return { bg: "#E8F5E9", color: "#2E7D32" };
    case "Upcoming": return { bg: "#FFF3E0", color: "#E65100" };
    default:         return { bg: "#f5f5f5", color: "#999" };
  }
};

const getTimeStyle = (status) => ({
  bg:    status === "Now" ? "#FF6B35" : "#EEF2FF",
  color: status === "Now" ? "white"   : "#6366f1",
});

export default function Timetable() {
  const navigate = useNavigate();
  const now = new Date();
  const todayIndex = now.getDay() === 0 ? 5 : now.getDay() - 1;
  const todayDay = days[Math.min(todayIndex, 5)];

  const [selectedDay, setSelectedDay] = useState(todayDay);
  const [timetableCache, setTimetableCache] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimetable(selectedDay);
  }, [selectedDay]);

  const fetchTimetable = async (day) => {
    if (timetableCache[day]) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/timetable/my?day=${day}`, authHeader());
      if (res.data.success) {
        setTimetableCache(prev => ({ ...prev, [day]: res.data.data || [] }));
      }
    } catch (err) {
      setTimetableCache(prev => ({ ...prev, [day]: [] }));
    } finally {
      setLoading(false);
    }
  };

  const classes = timetableCache[selectedDay] || [];
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).toUpperCase();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f6fa", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", padding: "48px 20px 0px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <button onClick={() => navigate("/student/home")} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>←</button>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#111" }}>📅 Timetable</div>
        </div>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "16px" }}>
          {days.map((day) => (
            <button key={day} onClick={() => setSelectedDay(day)}
              style={{ padding: "8px 16px", borderRadius: "20px", border: "none",
                background: selectedDay === day ? "#6366f1" : "#f0f0f0",
                color: selectedDay === day ? "white" : "#666",
                fontWeight: "700", fontSize: "13px", cursor: "pointer", flexShrink: 0 }}>
              {day}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "#999", marginBottom: "12px", letterSpacing: "1px" }}>
          {dateStr}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#999", fontSize: 14 }}>Loading...</div>
        ) : classes.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", padding: "40px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>No classes scheduled</div>
            <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>No timetable found for {selectedDay}</div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "16px", padding: "4px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {classes.map((cls, i) => {
              const status = cls.subject?.includes("Lunch") ? "Break" : getStatus(cls.startTime);
              const statusStyle = getStatusStyle(status);
              const timeStyle = getTimeStyle(status);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", borderBottom: i < classes.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <div style={{ minWidth: "52px", background: timeStyle.bg, borderRadius: "10px", padding: "6px 4px", textAlign: "center", color: timeStyle.color, fontWeight: "800", fontSize: "13px" }}>
                    {cls.startTime || "—"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#111" }}>{cls.subject}</div>
                    <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                      {cls.teacher?.name || cls.teacherName || "—"}
                      {cls.room ? ` • ${cls.room}` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", background: statusStyle.bg, color: statusStyle.color, padding: "4px 10px", borderRadius: "8px", flexShrink: 0 }}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
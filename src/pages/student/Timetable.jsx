import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday",
};
// JS getDay(): 0=Sun,1=Mon,...,6=Sat — map to our DAYS index
const JS_DAY_TO_INDEX = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };

const MONTHS = ["January","February","March","April","May","June",
               "July","August","September","October","November","December"];
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const getDateForDay = (day, weekOffset = 0) => {
  const targetIndex = DAYS.indexOf(day); // 0=Mon … 5=Sat
  const today = new Date();
  const jsDay = today.getDay(); // 0=Sun … 6=Sat
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1; // Mon=0 … Sat=5, Sun=6
  // Find this week's Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - todayIndex + (weekOffset * 7));
  // Target day = monday + targetIndex days
  const date = new Date(monday);
  date.setDate(monday.getDate() + targetIndex);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`.toUpperCase();
};

// time format: "09:00 - 09:45" — school hours assumed 07:00–18:00
// Hours below 7 are treated as PM (e.g. 01:00 → 13:00, 02:30 → 14:30)
const toSchoolMins = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  const hour = h < 7 ? h + 12 : h;
  return hour * 60 + m;
};
const getStatus = (time, isBreak) => {
  if (isBreak) return "Break";
  if (!time) return "Upcoming";
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const parts = time.split("-").map(s => s.trim());
  const startMins = toSchoolMins(parts[0]);
  const endMins = parts[1] ? toSchoolMins(parts[1]) : startMins + 45;
  if (nowMins > endMins) return "Done";
  if (nowMins >= startMins) return "Now";
  return "Upcoming";
};

const STATUS_STYLE = {
  Done:     { bg: "#E8F5E9", color: "#2E7D32" },
  Now:      { bg: "#E3F2FD", color: "#1565C0" },
  Break:    { bg: "#F3E5F5", color: "#6A1B9A" },
  Upcoming: { bg: "#FFF3E0", color: "#E65100" },
  default:  { bg: "#f5f5f5", color: "#999" },
};

export default function Timetable() {
  const navigate = useNavigate();

  const getTodayKey = () => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? "Mon" : DAYS[jsDay - 1] ?? "Mon";
  };

  const [selectedDay, setSelectedDay] = useState(getTodayKey);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = last week
  const [timetableCache, setTimetableCache] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimetable(selectedDay);
  }, [selectedDay]);

  const fetchTimetable = async (day) => {
    if (timetableCache[day] !== undefined) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/timetable/my?day=${DAY_FULL[day]}`, authHeader());
      setTimetableCache(prev => ({ ...prev, [day]: res.data.success ? (res.data.data || []) : [] }));
    } catch {
      setTimetableCache(prev => ({ ...prev, [day]: [] }));
    } finally {
      setLoading(false);
    }
  };

  const classes = timetableCache[selectedDay] || [];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f6fa", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "48px 20px 0px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <button onClick={() => navigate("/student/home")}
            style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>←</button>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#111" }}>Timetable</div>
        </div>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
          {DAYS.map((day) => (
            <button key={day} onClick={() => setSelectedDay(day)}
              style={{
                padding: "8px 16px", borderRadius: "20px", border: "none",
                background: selectedDay === day ? "#6366f1" : "#f0f0f0",
                color: selectedDay === day ? "white" : "#666",
                fontWeight: "700", fontSize: "13px", cursor: "pointer", flexShrink: 0,
              }}>
              {day}
            </button>
          ))}
        </div>
        {/* Week navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", paddingTop: "4px" }}>
          <button onClick={() => setWeekOffset(w => w - 1)}
            style={{ background: "none", border: "none", fontSize: "13px", color: "#6366f1", fontWeight: "700", cursor: "pointer", padding: "4px 8px" }}>
            ← Prev Week
          </button>
          <span style={{ fontSize: "12px", color: "#999", fontWeight: "600" }}>
            {weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Next Week" : weekOffset === -1 ? "Last Week" : `${weekOffset > 0 ? "+" : ""}${weekOffset} Weeks`}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)}
            style={{ background: "none", border: "none", fontSize: "13px", color: "#6366f1", fontWeight: "700", cursor: "pointer", padding: "4px 8px" }}>
            Next Week →
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "#999", marginBottom: "12px", letterSpacing: "1px" }}>
          {getDateForDay(selectedDay, weekOffset)}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#999", fontSize: 14 }}>Loading...</div>
        ) : classes.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", padding: "40px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>No classes scheduled</div>
            <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>No timetable found for {DAY_FULL[selectedDay]}</div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "16px", padding: "4px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {classes.map((cls, i) => {
              const isBreak = cls.subject === "Break" || cls.subject?.toLowerCase().includes("lunch");
              const status = getStatus(cls.time, isBreak);
              const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.default;
              const timeHighlight = status === "Now";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "14px 0",
                  borderBottom: i < classes.length - 1 ? "1px solid #f5f5f5" : "none",
                }}>
                  {/* Period number */}
                  <div style={{ minWidth: "24px", fontSize: "12px", fontWeight: "700", color: "#bbb", textAlign: "center" }}>
                    {isBreak ? "" : `P${i + 1}`}
                  </div>
                  {/* Time */}
                  <div style={{
                    minWidth: "80px", background: timeHighlight ? "#6366f1" : "#EEF2FF",
                    borderRadius: "10px", padding: "6px 6px", textAlign: "center",
                    color: timeHighlight ? "white" : "#6366f1",
                    fontWeight: "800", fontSize: "11px",
                  }}>
                    {cls.time || "—"}
                  </div>
                  {/* Subject + Teacher */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: isBreak ? "#6A1B9A" : "#111" }}>
                      {cls.subject || "—"}
                    </div>
                    {!isBreak && (
                      <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                        {cls.teacher?.name || cls.teacherName || "—"}
                        {cls.room ? ` • Room ${cls.room}` : ""}
                      </div>
                    )}
                  </div>
                  {/* Status badge */}
                  <span style={{
                    fontSize: "11px", fontWeight: "700",
                    background: statusStyle.bg, color: statusStyle.color,
                    padding: "4px 10px", borderRadius: "8px", flexShrink: 0,
                  }}>
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

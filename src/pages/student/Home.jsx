import { useNavigate } from "react-router-dom";

const student = {
  name: "Rahul Kumar",
  initials: "RK",
  class: "Class X-A",
  roll: "Roll #14",
  school: "DPS Noida",
  bus: "Bus #42",
  attendance: "87%",
  grade: "A+",
  rank: "4th",
  marks: "87.4",
};

const quickTiles = [
  { icon: "🚌", label: "Live Bus",    sub: "Bus #42 • 12 min",  path: "/student/bus" },
  { icon: "📅", label: "Timetable",  sub: "3 classes today",   path: "/student/timetable" },
  { icon: "📊", label: "Results",    sub: "Term 2 • 87.4%",    path: "/student/result" },
  { icon: "📚", label: "Notes",      sub: "3 pending tasks",   path: "/student/notes" },
  { icon: "💳", label: "Fee Status", sub: "Due: 7 Apr",        path: "/student/fee" },
  { icon: "🗓️", label: "Apply Leave",sub: "1 approved",        path: "/student/apply-leave" },
];

// ── Timetable data — same as Timetable.jsx ──
const timetableData = {
  Mon: [
    { time: "8:00",  subject: "Physics",           teacher: "Ms. Verma",   room: "Lab 301" },
    { time: "9:00",  subject: "Mathematics",        teacher: "Mr. Sharma",  room: "Room 204" },
    { time: "10:00", subject: "Chemistry",          teacher: "Mr. Joshi",   room: "Lab 201" },
    { time: "11:00", subject: "English Literature", teacher: "Mrs. Gupta",  room: "Room 101" },
    { time: "12:00", subject: "🍱 Lunch Break",     teacher: "Canteen",     room: "" },
    { time: "1:00",  subject: "Computer Science",   teacher: "Mr. Kapoor",  room: "Lab 401" },
    { time: "2:00",  subject: "Hindi",              teacher: "Mrs. Singh",  room: "Room 105" },
    { time: "3:00",  subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Tue: [
    { time: "8:00",  subject: "Mathematics",        teacher: "Mr. Sharma",  room: "Room 204" },
    { time: "9:00",  subject: "Physics",            teacher: "Ms. Verma",   room: "Lab 301" },
    { time: "10:00", subject: "English Literature", teacher: "Mrs. Gupta",  room: "Room 101" },
    { time: "11:00", subject: "Chemistry",          teacher: "Mr. Joshi",   room: "Lab 201" },
    { time: "12:00", subject: "🍱 Lunch Break",     teacher: "Canteen",     room: "" },
    { time: "1:00",  subject: "Hindi",              teacher: "Mrs. Singh",  room: "Room 105" },
    { time: "2:00",  subject: "Computer Science",   teacher: "Mr. Kapoor",  room: "Lab 401" },
    { time: "3:00",  subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Wed: [
    { time: "8:00",  subject: "English Literature", teacher: "Mrs. Gupta",  room: "Room 101" },
    { time: "9:00",  subject: "Chemistry",          teacher: "Mr. Joshi",   room: "Lab 201" },
    { time: "10:00", subject: "Mathematics",        teacher: "Mr. Sharma",  room: "Room 204" },
    { time: "11:00", subject: "Physics",            teacher: "Ms. Verma",   room: "Lab 301" },
    { time: "12:00", subject: "🍱 Lunch Break",     teacher: "Canteen",     room: "" },
    { time: "1:00",  subject: "Computer Science",   teacher: "Mr. Kapoor",  room: "Lab 401" },
    { time: "2:00",  subject: "Hindi",              teacher: "Mrs. Singh",  room: "Room 105" },
    { time: "3:00",  subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Thu: [
    { time: "8:00",  subject: "Hindi",              teacher: "Mrs. Singh",  room: "Room 105" },
    { time: "9:00",  subject: "Computer Science",   teacher: "Mr. Kapoor",  room: "Lab 401" },
    { time: "10:00", subject: "Physics",            teacher: "Ms. Verma",   room: "Lab 301" },
    { time: "11:00", subject: "Mathematics",        teacher: "Mr. Sharma",  room: "Room 204" },
    { time: "12:00", subject: "🍱 Lunch Break",     teacher: "Canteen",     room: "" },
    { time: "1:00",  subject: "Chemistry",          teacher: "Mr. Joshi",   room: "Lab 201" },
    { time: "2:00",  subject: "English Literature", teacher: "Mrs. Gupta",  room: "Room 101" },
    { time: "3:00",  subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Fri: [
    { time: "8:00",  subject: "Computer Science",   teacher: "Mr. Kapoor",  room: "Lab 401" },
    { time: "9:00",  subject: "Hindi",              teacher: "Mrs. Singh",  room: "Room 105" },
    { time: "10:00", subject: "Chemistry",          teacher: "Mr. Joshi",   room: "Lab 201" },
    { time: "11:00", subject: "English Literature", teacher: "Mrs. Gupta",  room: "Room 101" },
    { time: "12:00", subject: "🍱 Lunch Break",     teacher: "Canteen",     room: "" },
    { time: "1:00",  subject: "Mathematics",        teacher: "Mr. Sharma",  room: "Room 204" },
    { time: "2:00",  subject: "Physics",            teacher: "Ms. Verma",   room: "Lab 301" },
    { time: "3:00",  subject: "Physical Education", teacher: "Ground / Gymnasium", room: "" },
  ],
  Sat: [
    { time: "8:00",  subject: "Mathematics",        teacher: "Mr. Sharma",  room: "Room 204" },
    { time: "9:00",  subject: "English Literature", teacher: "Mrs. Gupta",  room: "Room 101" },
    { time: "10:00", subject: "Hindi",              teacher: "Mrs. Singh",  room: "Room 105" },
    { time: "11:00", subject: "Physics",            teacher: "Ms. Verma",   room: "Lab 301" },
    { time: "12:00", subject: "🍱 Lunch Break",     teacher: "Canteen",     room: "" },
    { time: "1:00",  subject: "Computer Science",   teacher: "Mr. Kapoor",  room: "Lab 401" },
  ],
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Same getStatus logic as Timetable.jsx ──
function getStatus(time, selectedDay) {
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
}

function getStatusStyle(status) {
  switch (status) {
    case "Done":     return { bg: "#E8F5E9", color: "#2E7D32" };
    case "Now":      return { bg: "#E3F2FD", color: "#1565C0" };
    case "Break":    return { bg: "#E8F5E9", color: "#2E7D32" };
    case "Upcoming": return { bg: "#FFF3E0", color: "#E65100" };
    default:         return { bg: "#f5f5f5", color: "#999" };
  }
}

// ── Get today's classes dynamically ──
function getTodayClasses() {
  const now     = new Date();
  const dayIdx  = now.getDay();
  const todayKey = dayIdx === 0 ? "Sat" : days[Math.min(dayIdx - 1, 5)];
  const allClasses = timetableData[todayKey] || [];
  // Show max 4 classes on dashboard, skip lunch break
  return allClasses
    .filter(c => c.time !== "12:00")
    .slice(0, 4)
    .map(c => ({
      ...c,
      status: getStatus(c.time, todayKey),
    }));
}

const notices = [
  { dot: "#5C6BC0", title: "Annual Sports Day — 5 April 2026",  time: "Today, 9:00 AM" },
  { dot: "#FF7043", title: "Term 2 Results now available",       time: "Yesterday, 3:00 PM" },
  { dot: "#E53935", title: "Fee due in 10 days — April Quarter", time: "27 Mar, 10:00 AM" },
];

export default function StudentHome() {
  const navigate    = useNavigate();
  const todayClasses = getTodayClasses();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f6fa", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a73e8 0%, #6c63ff 100%)", padding: "48px 20px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: "700", marginBottom: "2px" }}>GOOD MORNING ☀️</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#fff" }}>{student.name}</div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => navigate("/student/notifications")} style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", fontSize: "16px", position: "relative" }}>
              🔔
              <div style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", background: "#FF5252", borderRadius: "50%", border: "2px solid white" }} />
            </button>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "#fff", cursor: "pointer", fontSize: "13px" }}>
              {student.initials}
            </div>
          </div>
        </div>

        {/* Student ID Card */}
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "16px", padding: "16px", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", fontWeight: "700" }}>STUDENT ID</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#fff", margin: "2px 0" }}>{student.name}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>{student.class} • {student.roll}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>{student.school} • {student.bus}</div>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", color: "#fff", fontSize: "16px" }}>
              {student.initials}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            {[
              { val: student.attendance, label: "Attendance" },
              { val: student.grade,      label: "Grade" },
              { val: student.rank,       label: "Rank" },
              { val: student.marks,      label: "Marks %" },
            ].map((stat) => (
              <div key={stat.label} style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#fff" }}>{stat.val}</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", fontWeight: "700", textTransform: "uppercase" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>

        {/* Quick Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {quickTiles.map((tile) => (
            <button key={tile.label} onClick={() => navigate(tile.path)} style={{ background: "white", borderRadius: "14px", padding: "14px", border: "none", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>{tile.icon}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#111" }}>{tile.label}</div>
              <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{tile.sub}</div>
            </button>
          ))}
        </div>

        {/* Today's Classes — dynamic, real time */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#111" }}>📅 Today's Classes</h3>
          <span style={{ fontSize: "13px", color: "#1a73e8", cursor: "pointer" }} onClick={() => navigate("/student/timetable")}>Full →</span>
        </div>
        <div style={{ background: "white", borderRadius: "14px", padding: "4px 12px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {todayClasses.map((c, i) => {
            const style = getStatusStyle(c.status);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: i < todayClasses.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ minWidth: "44px", background: c.status === "Now" ? "#FF6B35" : "#f5f6fa", borderRadius: "8px", padding: "4px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: c.status === "Now" ? "white" : "#555", lineHeight: "1.4" }}>
                  {c.time.split(":")[0]}<br /><span style={{ fontSize: "9px" }}>{parseInt(c.time) >= 8 && parseInt(c.time) <= 11 ? "AM" : "PM"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#111" }}>{c.subject}</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>{c.teacher} • {c.room}</div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "700", background: style.bg, color: style.color, padding: "4px 8px", borderRadius: "6px" }}>
                  {c.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Notices */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#111" }}>📢 Notices</h3>
          <span style={{ fontSize: "13px", color: "#1a73e8", cursor: "pointer" }}>All →</span>
        </div>
        <div style={{ background: "white", borderRadius: "14px", padding: "4px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {notices.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 0", borderBottom: i < notices.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: n.dot, marginTop: "5px", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#111" }}>{n.title}</div>
                <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "430px", background: "white", borderTop: "1px solid #eee", display: "flex", padding: "8px 0 16px", boxShadow: "0 -4px 12px rgba(0,0,0,0.06)" }}>
        {[
          { icon: "🏠", label: "Home", path: "/student/home", active: true },
          { icon: "🚌", label: "Bus",  path: "/student/bus" },
          { icon: "📚", label: "Learn",path: "/student/notes" },
          { icon: "💬", label: "Chat", path: "/student/chat" },
          { icon: "👤", label: "Me",   path: "/student/profile" },
        ].map((tab) => (
          <button key={tab.label} onClick={() => navigate(tab.path)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", color: tab.active ? "#1a73e8" : "#999" }}>
            <span style={{ fontSize: "22px" }}>{tab.icon}</span>
            <span style={{ fontSize: "10px", fontWeight: tab.active ? "700" : "500" }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
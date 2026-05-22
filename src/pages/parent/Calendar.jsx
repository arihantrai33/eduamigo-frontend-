import { useNavigate } from "react-router-dom";

export default function ParentCalendar() {
  const navigate = useNavigate();

  const events = [
    { icon: "🏃", iconBg: "#e8f5e9", iconColor: "#2e7d32", title: "Annual Sports Day", sub: "5 April 2026 • School Ground", badge: "5 Apr", badgeBg: "#e8f5e9", badgeColor: "#2e7d32" },
    { icon: "💳", iconBg: "#ffebee", iconColor: "#ef4444", title: "Fee Due Date", sub: "7 April 2026 • April Quarter", badge: "7 Apr", badgeBg: "#ffebee", badgeColor: "#ef4444" },
    { icon: "📝", iconBg: "#fff9c4", iconColor: "#f57f17", title: "Unit Test — All Subjects", sub: "12–16 April 2026", badge: "12 Apr", badgeBg: "#fff9c4", badgeColor: "#f57f17" },
    { icon: "👨‍👩‍👧", iconBg: "#e8f5e9", iconColor: "#2e7d32", title: "Parent-Teacher Meeting", sub: "20 April 2026 • 9 AM – 1 PM", badge: "20 Apr", badgeBg: "#e8f5e9", badgeColor: "#2e7d32" },
    { icon: "🏖️", iconBg: "#fce4ec", iconColor: "#c2185b", title: "Summer Vacation Begins", sub: "25 May 2026", badge: "25 May", badgeBg: "#fce4ec", badgeColor: "#c2185b" },
  ];

  const exams = [
    { title: "Board Pre-Board Exam", sub: "1–10 April 2026", badge: "Board", badgeBg: "#ffebee", badgeColor: "#ef4444" },
    { title: "CBSE Board Practical Exams", sub: "15–20 April 2026", badge: "Practical", badgeBg: "#fff3e0", badgeColor: "#e65100" },
    { title: "CBSE Board Theory Exams", sub: "5 May – 10 June 2026", badge: "Main", badgeBg: "#e3f2fd", badgeColor: "#1565c0" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "sans-serif", paddingBottom: "30px" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 40px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}>←</button>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>📅 School Calendar</h2>
        </div>
      </div>

      <div style={{ padding: "16px", marginTop: "-20px" }}>
        {/* Upcoming Events */}
        <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
          <div style={{ padding: "16px 16px 8px", fontWeight: "700", fontSize: "14px", color: "#444" }}>Upcoming Events — April 2026</div>
          {events.map((e, i) => (
            <div key={i} style={{ padding: "12px 16px", borderBottom: i < events.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: e.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                {e.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>{e.title}</div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{e.sub}</div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: e.badgeColor, background: e.badgeBg, padding: "4px 10px", borderRadius: "20px", flexShrink: 0 }}>{e.badge}</span>
            </div>
          ))}
        </div>

        {/* Exam Schedule */}
        <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ padding: "16px 16px 8px", fontWeight: "700", fontSize: "14px", color: "#444" }}>Exam Schedule</div>
          {exams.map((e, i) => (
            <div key={i} style={{ padding: "12px 16px", borderBottom: i < exams.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>{e.title}</div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{e.sub}</div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: e.badgeColor, background: e.badgeBg, padding: "4px 10px", borderRadius: "20px", flexShrink: 0, marginLeft: "8px" }}>{e.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
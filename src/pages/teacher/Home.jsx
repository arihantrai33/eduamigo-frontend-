// Teacher.jsx
// Shiksha360 — Global ERP | Teacher Portal
// All 10 teacher screens in one component
// Navigation: screen state + history stack (back support)
// No external dependencies beyond React

import { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────
// CONSTANTS / MOCK DATA
// ─────────────────────────────────────────

const TEACHER = {
  name: "Mr. Rajesh Sharma",
  initials: "RS",
  subject: "Mathematics",
  wing: "Senior Wing",
  empId: "T042",
  school: "DPS Noida",
  students: 105,
  avgAttendance: "92%",
  classes: 4,
  rating: "4.8",
  experience: "8",
};

const STUDENTS = [
  { id: 1, name: "Rahul Kumar",    roll: 1,  bg: "#E3F2FD", tc: "#1565C0" },
  { id: 2, name: "Priya Sharma",   roll: 2,  bg: "#FCE4EC", tc: "#C2185B" },
  { id: 3, name: "Arjun Singh",    roll: 3,  bg: "#E8F5E9", tc: "#2E7D32" },
  { id: 4, name: "Sneha Gupta",    roll: 4,  bg: "#FFF3E0", tc: "#E65100" },
  { id: 5, name: "Vikram Patel",   roll: 5,  bg: "#F3E8FF", tc: "#6A1B9A" },
  { id: 6, name: "Ananya Verma",   roll: 6,  bg: "#E0F7F4", tc: "#00695C" },
  { id: 7, name: "Rohan Mehta",    roll: 7,  bg: "#FFF9C4", tc: "#F57F17" },
];

const TIMETABLE = {
  Mon: [
    { time: "8:00",  subject: "Class X-A — Mathematics",  room: "Room 204 • 35 students",  status: "upcoming" },
    { time: "10:00", subject: "Class IX-B — Algebra",     room: "Room 105 • 38 students",  status: "upcoming" },
    { time: "2:00",  subject: "Class XII-A — Calculus",   room: "Room 302 • 28 students",  status: "upcoming" },
  ],
  Tue: [
    { time: "8:00",  subject: "Class IX-A — Algebra",        room: "Room 105 • 40 students",               status: "done" },
    { time: "10:00", subject: "Class X-A — Mathematics",     room: "Room 204 • 35 students • Trigonometry", status: "now" },
    { time: "12:00", subject: "Class XII-B — Calculus",      room: "Room 302 • 28 students • Integration",  status: "upcoming" },
    { time: "12:30", subject: "🍱 Lunch Break",              room: "Staff Room",                            status: "break" },
    { time: "2:00",  subject: "Class XI-A — Statistics",     room: "Room 201 • 32 students",               status: "upcoming" },
  ],
  Wed: [
    { time: "9:00",  subject: "Class X-B — Mathematics",  room: "Room 206 • 33 students",  status: "upcoming" },
    { time: "11:00", subject: "Class XI-A — Statistics",  room: "Room 201 • 32 students",  status: "upcoming" },
  ],
  Thu: [
    { time: "8:00",  subject: "Class XII-A — Calculus",   room: "Room 302 • 28 students",  status: "upcoming" },
    { time: "10:00", subject: "Class X-A — Mathematics",  room: "Room 204 • 35 students",  status: "upcoming" },
  ],
  Fri: [
    { time: "9:00",  subject: "Class IX-A — Algebra",     room: "Room 105 • 40 students",  status: "upcoming" },
    { time: "2:00",  subject: "Class XII-B — Calculus",   room: "Room 302 • 28 students",  status: "upcoming" },
  ],
  Sat: [
    { time: "8:00",  subject: "Class X-A — Revision",    room: "Room 204 • 35 students",  status: "upcoming" },
  ],
};

const PARENT_CHATS = [
  {
    id: 1, parentName: "Mrs. Sonia Kumar", initials: "SK",
    bg: "#FCE4EC", tc: "#C2185B",
    relation: "Rahul's Mom", lastMsg: "Should we arrange extra tuition?",
    time: "2:30 PM", unread: 1,
    messages: [
      { from: "them", text: "Sir, how is Rahul performing this term? We're a bit worried.", time: "10:15 AM" },
      { from: "me",   text: "Rahul is doing very well! His score in the last test was 92/100.", time: "10:20 AM" },
      { from: "them", text: "That's great! Should we arrange extra tuition for boards?", time: "2:22 PM" },
      { from: "me",   text: "Not needed right now. Focus on sample papers. Attendance should improve though.", time: "2:28 PM" },
    ],
  },
  {
    id: 2, parentName: "Mr. Arjun Mehta", initials: "AM",
    bg: "#E8F5E9", tc: "#2E7D32",
    relation: "Priya's Dad", lastMsg: "When is PTM scheduled?",
    time: "Yesterday", unread: 2,
    messages: [
      { from: "them", text: "Hello sir, when is the next Parent Teacher Meeting?", time: "Yesterday" },
      { from: "me",   text: "PTM is on 20 April 2026, 9 AM to 1 PM.", time: "Yesterday" },
      { from: "them", text: "Thank you! Priya is very excited.", time: "Yesterday" },
    ],
  },
  {
    id: 3, parentName: "Mrs. Vidya Patel", initials: "VP",
    bg: "#E3F2FD", tc: "#1565C0",
    relation: "Rohan's Mom", lastMsg: "Thank you for the extra help! 🙏",
    time: "Mon", unread: 0,
    messages: [
      { from: "them", text: "Sir, Rohan said you helped him with extra problems. Thank you! 🙏", time: "Mon" },
      { from: "me",   text: "My pleasure! He's working hard. Keep encouraging him at home.", time: "Mon" },
    ],
  },
];

const NOTIFICATIONS = [
  { id: 1, icon: "💬", bg: "#FCE4EC", title: "New message from Mrs. Kumar", desc: "Parent of Rahul Kumar, X-A: Should we arrange extra tuition?", time: "Today, 2:22 PM" },
  { id: 2, icon: "📌", bg: "#E8F5E9", title: "Attendance Reminder — X-A",    desc: "Attendance for Class X-A not yet marked for today.",          time: "Today, 9:00 AM" },
  { id: 3, icon: "📊", bg: "#E8EAF6", title: "Marks Entry Pending",           desc: "Term 2 marks for Class X-A not submitted. Deadline: 30 Mar.", time: "Yesterday, 3:00 PM" },
  { id: 4, icon: "🏃", bg: "#FFF3E0", title: "Annual Sports Day — 5 April",  desc: "All teachers requested to supervise respective sections.",     time: "27 Mar, 10:00 AM" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─────────────────────────────────────────
// CSS-IN-JS STYLES (design token aligned)
// ─────────────────────────────────────────

const S = {
  // Colors
  p:   "#5C6BC0", p2:  "#3949AB", pl: "#E8EAF6", pll: "#F3F4FD",
  acc: "#FF7043", acc2:"#00BFA5", warn:"#FFB300", danger:"#EF5350",
  bg:  "#F4F6FB", card:"#FFFFFF", text:"#1C2033", muted:"#7B8099",
  border:"#E8EAF0",

  // Layout tokens
  r: "20px", rs: "12px",

  // Helper builders
  flex: (ai="center", jc="flex-start", gap=0, dir="row") => ({
    display:"flex", alignItems:ai, justifyContent:jc,
    gap: gap||undefined, flexDirection:dir,
  }),
  card: (extra={}) => ({
    background:"#FFFFFF", borderRadius:"20px", padding:"18px",
    marginBottom:"14px", boxShadow:"0 2px 16px rgba(92,107,192,.10)", ...extra
  }),
  btn: (variant="p", extra={}) => {
    const variants = {
      p:  { background:"#5C6BC0", color:"#fff" },
      a:  { background:"#FF7043", color:"#fff" },
      g:  { background:"#00BFA5", color:"#fff" },
      o:  { background:"#E8EAF6", color:"#5C6BC0" },
      d:  { background:"#FFEBEE", color:"#EF5350" },
      gy: { background:"#F4F6FB", color:"#7B8099" },
    };
    return {
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      gap:"8px", padding:"13px 22px", borderRadius:"14px", border:"none",
      cursor:"pointer", fontFamily:"'Poppins',sans-serif", fontSize:"14px",
      fontWeight:700, ...variants[variant], ...extra,
    };
  },
  badge: (type="b") => {
    const types = {
      g: { background:"#E0F7F4", color:"#00897B" },
      r: { background:"#FFEBEE", color:"#EF5350" },
      o: { background:"#FFF3E0", color:"#E65100" },
      b: { background:"#E8EAF6", color:"#5C6BC0" },
      y: { background:"#FFF9C4", color:"#F57F17" },
    };
    return {
      display:"inline-block", padding:"3px 10px", borderRadius:"20px",
      fontSize:"10.5px", fontWeight:700, ...types[type],
    };
  },
  input: {
    width:"100%", padding:"13px 15px", borderRadius:"12px",
    border:"1.5px solid #E8EAF0", background:"#F3F4FD",
    fontFamily:"'Poppins',sans-serif", fontSize:"14px",
    color:"#1C2033", outline:"none",
  },
  select: {
    width:"100%", padding:"13px 15px", borderRadius:"12px",
    border:"1.5px solid #E8EAF0", background:"#F3F4FD",
    fontFamily:"'Poppins',sans-serif", fontSize:"14px", color:"#1C2033",
    outline:"none", appearance:"none",
  },
  label: {
    display:"block", fontSize:"11px", fontWeight:700, color:"#7B8099",
    marginBottom:"6px", textTransform:"uppercase", letterSpacing:".4px",
  },
  ig: { marginBottom:"14px" },
};

// ─────────────────────────────────────────
// SHARED TINY COMPONENTS
// ─────────────────────────────────────────

function Avatar({ initials, bg, tc, size=42, radius="14px", fontSize="14px" }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:radius, background:bg, color:tc,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:800, fontSize, flexShrink:0,
    }}>
      {initials}
    </div>
  );
}

function Badge({ type="b", children }) {
  return <span style={S.badge(type)}>{children}</span>;
}

function TopBar({ title, onBack, gradient=false, right=null }) {
  return (
    <div style={{
      padding:"48px 18px 14px", background: gradient
        ? "linear-gradient(160deg,#3949AB,#5C6BC0)"
        : "#FFFFFF",
      display:"flex", alignItems:"center", gap:"10px",
      boxShadow: gradient ? "none" : "0 1px 0 #E8EAF0", flexShrink:0,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          width:38, height:38, borderRadius:12, border:"none", cursor:"pointer",
          background:"rgba(255,255,255,.15)", fontSize:20,
          color: gradient ? "#fff" : "#1C2033",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>←</button>
      )}
      <h2 style={{
        fontFamily:"'Baloo 2',cursive", fontSize:18, fontWeight:800,
        flex:1, color: gradient ? "#fff" : "#1C2033",
      }}>{title}</h2>
      {right}
    </div>
  );
}

function BottomNav({ active, navigate }) {
  const tabs = [
    { id:"t-home",      icon:"🏠", label:"Home"       },
    { id:"t-attendance",icon:"✅", label:"Attendance" },
    { id:"t-upload",    icon:"📤", label:"Upload"     },
    { id:"t-chat-list", icon:"💬", label:"Messages"  },
    { id:"t-profile",   icon:"👤", label:"Me"         },
  ];
  return (
    <div style={{
      position:"absolute", bottom:0, left:0, right:0, height:66,
      background:"#FFFFFF", display:"flex", borderTop:"1px solid #E8EAF0",
      boxShadow:"0 -4px 24px rgba(92,107,192,.08)", zIndex:200,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => navigate(t.id)} style={{
          flex:1, display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", gap:3, cursor:"pointer",
          fontSize:"9.5px", fontWeight:700, letterSpacing:".3px",
          textTransform:"uppercase", border:"none", background:"none",
          color: active===t.id ? "#5C6BC0" : "#7B8099",
          borderTop: active===t.id ? "3px solid #5C6BC0" : "3px solid transparent",
          transition:"color .2s",
        }}>
          <span style={{ fontSize:20, transition:"transform .2s", transform: active===t.id?"scale(1.2)":"scale(1)" }}>
            {t.icon}
          </span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position:"absolute", bottom:80, left:"50%",
      transform:"translateX(-50%)",
      background:"#1C2033", color:"#fff",
      padding:"11px 20px", borderRadius:30,
      fontSize:13, fontWeight:600, zIndex:999,
      whiteSpace:"nowrap", boxShadow:"0 8px 24px rgba(0,0,0,.3)",
      animation:"fadeIn .3s ease",
    }}>
      {message}
    </div>
  );
}

function StatTile({ value, label, color="#5C6BC0", change=null }) {
  return (
    <div style={{
      background:"#FFFFFF", borderRadius:"12px", padding:"14px",
      boxShadow:"0 2px 16px rgba(92,107,192,.10)",
    }}>
      <div style={{ fontSize:26, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:10, color:"#7B8099", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px" }}>
        {label}
      </div>
      {change && <div style={{ fontSize:10.5, fontWeight:700, color:"#00BFA5", marginTop:3 }}>{change}</div>}
    </div>
  );
}

function SectionHeader({ title, action=null, onAction=null }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
      <h3 style={{ fontFamily:"'Baloo 2',cursive", fontSize:16, fontWeight:800, color:"#1C2033" }}>
        {title}
      </h3>
      {action && (
        <span onClick={onAction} style={{ fontSize:12.5, color:"#5C6BC0", fontWeight:700, cursor:"pointer" }}>
          {action}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER HOME
// ─────────────────────────────────────────

function TeacherHome({ navigate, showToast }) {
  const tiles = [
    { icon:"✅", label:"Take Attendance", sub:"X-A pending",       screen:"t-attendance" },
    { icon:"📤", label:"Upload Notes",    sub:"Share with class",  screen:"t-upload"     },
    { icon:"📊", label:"Enter Marks",     sub:"Term 2 pending",    screen:"t-marks"      },
    { icon:"💬", label:"Parent Messages", sub:"4 unread",          screen:"t-chat-list"  },
    { icon:"📅", label:"My Timetable",    sub:"Today: 4 periods",  screen:"t-timetable"  },
    { icon:"🗓️", label:"Leave Request",  sub:"Apply for leave",   screen:"t-leave"      },
  ];

  const todaySchedule = [
    { class:"Class IX-A — Algebra",    room:"Room 105 • 40 students • 8:00 AM",                    status:"done",    dot:"#ccc" },
    { class:"Class X-A — Mathematics", room:"Room 204 • 35 students • 10:00 AM",                   status:"now",     dot:"#5C6BC0" },
    { class:"Class XII-B — Calculus",  room:"Room 302 • 28 students • 12:00 PM",                   status:"next",    dot:"#00BFA5" },
    { class:"Class XI-A — Statistics", room:"Room 201 • 32 students • 2:00 PM",                    status:"upcoming",dot:"#7B8099" },
  ];

  const statusBadge = (s) => {
    if (s==="done")    return <Badge type="b">Done</Badge>;
    if (s==="now")     return <Badge type="b">Now</Badge>;
    if (s==="next")    return <Badge type="y">Next</Badge>;
    return <Badge type="y">Upcoming</Badge>;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Gradient Header */}
      <div style={{
        background:"linear-gradient(160deg,#3949AB,#5C6BC0)",
        padding:"48px 18px 16px",
        display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0,
      }}>
        <div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.7)", fontWeight:700 }}>TEACHER PORTAL 👩‍🏫</div>
          <div style={{ fontFamily:"'Baloo 2',cursive", fontSize:20, fontWeight:800, color:"#fff" }}>
            {TEACHER.name}
          </div>
        </div>
        <button onClick={() => navigate("t-notif")} style={{
          width:38, height:38, borderRadius:12, border:"none", cursor:"pointer",
          background:"rgba(255,255,255,.15)", fontSize:18, position:"relative",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          🔔
          <div style={{
            position:"absolute", top:6, right:6, width:9, height:9,
            borderRadius:"50%", background:"#EF5350", border:"2px solid transparent",
          }} />
        </button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0 16px calc(66px + 16px)" }}>
        {/* Hero Card */}
        <div style={{
          background:"linear-gradient(135deg,#3949AB,#5C6BC0)",
          borderRadius:"20px", padding:"22px 20px", marginBottom:14,
          color:"#fff", position:"relative", overflow:"hidden",
          marginTop:14,
        }}>
          <div style={{ fontSize:11, opacity:.75, position:"relative", zIndex:2 }}>
            {TEACHER.subject} • {TEACHER.wing}
          </div>
          <div style={{ fontFamily:"'Baloo 2',cursive", fontSize:22, fontWeight:800, position:"relative", zIndex:2 }}>
            Good Morning! ☀️
          </div>
          <div style={{ fontSize:12.5, opacity:.8, position:"relative", zIndex:2 }}>
            28 March 2026 • {TEACHER.classes} classes today
          </div>
          <div style={{ display:"flex", gap:10, marginTop:14, position:"relative", zIndex:2 }}>
            {[
              { val:TEACHER.students, lbl:"Students" },
              { val:TEACHER.avgAttendance, lbl:"Avg Att." },
              { val:TEACHER.classes, lbl:"Classes" },
            ].map(s => (
              <div key={s.lbl} style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"9px 13px", textAlign:"center" }}>
                <div style={{ fontSize:19, fontWeight:800 }}>{s.val}</div>
                <div style={{ fontSize:9, opacity:.8, textTransform:"uppercase" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tiles */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
          {tiles.map(t => (
            <button key={t.screen} onClick={() => navigate(t.screen)} style={{
              background:"#FFFFFF", borderRadius:"20px", padding:"16px 14px",
              cursor:"pointer", border:"none", textAlign:"left",
              boxShadow:"0 2px 16px rgba(92,107,192,.10)",
            }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{t.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1C2033" }}>{t.label}</div>
              <div style={{ fontSize:10.5, color:"#7B8099", fontWeight:500, marginTop:2 }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* Today's Schedule */}
        <SectionHeader title="📋 Today's Schedule" />
        {todaySchedule.map((p, i) => (
          <div key={i} onClick={() => navigate("t-attendance")} style={{
            background:"#FFFFFF", borderRadius:"20px", padding:"13px 15px",
            display:"flex", alignItems:"center", gap:10, cursor:"pointer",
            boxShadow:"0 2px 16px rgba(92,107,192,.10)", marginBottom:8,
            border: p.status==="now" ? "2px solid #5C6BC0" : "2px solid transparent",
            opacity: p.status==="done" ? .55 : 1,
          }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:p.dot, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:"#1C2033" }}>{p.class}</div>
              <div style={{ fontSize:11.5, color:"#7B8099", fontWeight:500, marginTop:1 }}>{p.room}</div>
            </div>
            {statusBadge(p.status)}
          </div>
        ))}
      </div>

      <BottomNav active="t-home" navigate={navigate} />
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER ATTENDANCE
// ─────────────────────────────────────────

function TeacherAttendance({ onBack, showToast }) {
  const [attendance, setAttendance] = useState({}); // { studentId: 'P' | 'A' }
  const [selectedClass, setSelectedClass] = useState("Class X-A");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");

  const present = Object.values(attendance).filter(v => v==="P").length;
  const absent  = Object.values(attendance).filter(v => v==="A").length;
  const pending = STUDENTS.length - present - absent;

  const mark = (id, type) => {
    setAttendance(prev => ({ ...prev, [id]: type }));
  };

  const markAll = (type) => {
    const all = {};
    STUDENTS.forEach(s => { all[s.id] = type; });
    setAttendance(all);
  };

  const submit = () => {
    if (pending > 0) { showToast("⚠️ Please mark all students first!"); return; }
    showToast(`✅ Submitted! ${present} Present, ${absent} Absent. Parents notified 🔔`);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <TopBar title="✅ Take Attendance" onBack={onBack} />

      {/* Filters */}
      <div style={{ background:"#FFFFFF", padding:"12px 16px", flexShrink:0, borderBottom:"1px solid #E8EAF0" }}>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          <div style={{ flex:1, ...S.ig, marginBottom:0 }}>
            <label style={S.label}>Class</label>
            <select style={S.select} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {["Class X-A","Class XII-B","Class IX-A"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex:1, ...S.ig, marginBottom:0 }}>
            <label style={S.label}>Subject</label>
            <select style={S.select} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              {["Mathematics","Physics","English","Chemistry"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={S.ig}>
          <label style={S.label}>Date</label>
          <input type="date" defaultValue="2026-03-28" style={S.input} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, padding:"10px 16px", flexShrink:0 }}>
        <StatTile value={present} label="Present" color="#00BFA5" />
        <StatTile value={absent}  label="Absent"  color="#EF5350" />
        <StatTile value={pending} label="Pending"  color="#7B8099" />
      </div>

      {/* Bulk actions */}
      <div style={{ padding:"0 16px 8px", flexShrink:0, display:"flex", gap:8 }}>
        <button onClick={() => markAll("P")} style={{ ...S.btn("g"), flex:1, padding:"8px 16px", fontSize:12, borderRadius:10 }}>
          ✅ All Present
        </button>
        <button onClick={() => markAll("A")} style={{ ...S.btn("d"), flex:1, padding:"8px 16px", fontSize:12, borderRadius:10 }}>
          ❌ All Absent
        </button>
      </div>

      {/* Student List */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px 10px" }}>
        {STUDENTS.map(s => {
          const status = attendance[s.id];
          return (
            <div key={s.id} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"11px 0", borderBottom:"1px solid #E8EAF0",
            }}>
              <Avatar initials={s.name.split(" ").map(w=>w[0]).join("")} bg={s.bg} tc={s.tc} size={38} radius="50%" fontSize="13px" />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:"#1C2033" }}>{s.name}</div>
                <div style={{ fontSize:11, color:"#7B8099" }}>Roll #{s.roll}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {/* Present */}
                <button onClick={() => mark(s.id,"P")} style={{
                  width:36, height:36, borderRadius:10, cursor:"pointer", fontSize:16,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  border:`2px solid ${status==="P" ? "#00BFA5" : "#E8EAF0"}`,
                  background: status==="P" ? "#E0F7F4" : "#F4F6FB",
                  transition:"all .15s",
                }}>✅</button>
                {/* Absent */}
                <button onClick={() => mark(s.id,"A")} style={{
                  width:36, height:36, borderRadius:10, cursor:"pointer", fontSize:16,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  border:`2px solid ${status==="A" ? "#EF5350" : "#E8EAF0"}`,
                  background: status==="A" ? "#FFEBEE" : "#F4F6FB",
                  transition:"all .15s",
                }}>❌</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div style={{ padding:"12px 16px", background:"#FFFFFF", borderTop:"1px solid #E8EAF0", flexShrink:0 }}>
        <button onClick={submit} style={{ ...S.btn("g"), width:"100%", borderRadius:14 }}>
          📤 Submit & Notify Parents
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER UPLOAD
// ─────────────────────────────────────────

function TeacherUpload({ onBack, navigate, showToast }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["📝 Notes", "📌 Assignment", "📋 Resource"];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <TopBar title="📤 Upload Content" onBack={onBack} />

      <div style={{ flex:1, overflowY:"auto", padding:"0 16px calc(66px + 16px)" }}>
        {/* Tabs */}
        <div style={{ display:"flex", background:"#F3F4FD", borderRadius:12, padding:4, margin:"14px 0", gap:3 }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              flex:1, textAlign:"center", padding:"9px 4px", borderRadius:9,
              fontSize:12, fontWeight:700, cursor:"pointer", border:"none",
              background: activeTab===i ? "#fff" : "transparent",
              color: activeTab===i ? "#5C6BC0" : "#7B8099",
              boxShadow: activeTab===i ? "0 2px 8px rgba(0,0,0,.08)" : "none",
              transition:"all .2s",
            }}>{t}</button>
          ))}
        </div>

        <div style={S.card()}>
          <div style={S.ig}>
            <label style={S.label}>Select Class</label>
            <select style={S.select}>
              {["Class X-A","Class X-B","Class XII-B","Class IX-A"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={S.ig}>
            <label style={S.label}>Subject</label>
            <select style={S.select}>
              {["Mathematics","Physics","Chemistry","English"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={S.ig}>
            <label style={S.label}>Title</label>
            <input style={S.input} placeholder="e.g. Trigonometry Chapter 8 Notes" />
          </div>
          <div style={S.ig}>
            <label style={S.label}>Description</label>
            <textarea style={{ ...S.input, resize:"none", height:90 }} placeholder="Brief description of content..." />
          </div>
          {activeTab===1 && (
            <div style={S.ig}>
              <label style={S.label}>Due Date</label>
              <input type="date" style={S.input} defaultValue="2026-04-05" />
            </div>
          )}
        </div>

        {/* Upload Zone */}
        <div onClick={() => showToast("📁 File picker opened!")} style={{
          border:"2px dashed #5C6BC0", borderRadius:"20px", padding:28,
          textAlign:"center", background:"#F3F4FD", cursor:"pointer",
          marginBottom:14,
        }}>
          <div style={{ fontSize:36, marginBottom:6 }}>📁</div>
          <div style={{ fontSize:14, fontWeight:700, color:"#5C6BC0" }}>Tap to choose file</div>
          <div style={{ fontSize:11.5, color:"#7B8099", marginTop:3 }}>PDF, DOC, PPT, Images supported</div>
        </div>

        <button onClick={() => showToast("✅ Uploaded & students notified!")}
          style={{ ...S.btn("p"), width:"100%", borderRadius:14 }}>
          📤 Upload & Notify Students
        </button>
      </div>

      <BottomNav active="t-upload" navigate={navigate} />
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER MARKS
// ─────────────────────────────────────────

function TeacherMarks({ onBack, showToast }) {
  const [marks, setMarks] = useState({});

  const updateMark = (id, val) => {
    const n = parseInt(val);
    if (val === "" || (n >= 0 && n <= 100)) {
      setMarks(prev => ({ ...prev, [id]: val }));
    }
  };

  const save = () => {
    const unfilled = STUDENTS.filter(s => !marks[s.id] && marks[s.id] !== 0);
    if (unfilled.length > 0) {
      showToast(`⚠️ ${unfilled.length} student(s) have no marks entered.`);
      return;
    }
    showToast("✅ Marks saved & published to students!");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <TopBar title="📊 Enter Marks" onBack={onBack} />

      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px calc(66px + 16px)" }}>
        <div style={{ ...S.card(), padding:12, marginBottom:14 }}>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1 }}>
              <label style={S.label}>Class</label>
              <select style={S.select}>
                {["Class X-A","Class XII-B"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={S.label}>Exam</label>
              <select style={S.select}>
                {["Term 2","Unit Test","Pre-Board"].map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop:10 }}>
            <label style={S.label}>Subject</label>
            <select style={S.select}>
              <option>Mathematics (Max: 100)</option>
              <option>Physics (Max: 70)</option>
            </select>
          </div>
        </div>

        <div style={S.card()}>
          <div style={{ fontSize:11, fontWeight:700, color:"#7B8099", textTransform:"uppercase", letterSpacing:".6px", marginBottom:12 }}>
            Class X-A — Enter Marks
          </div>
          {STUDENTS.map(s => (
            <div key={s.id} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"11px 0", borderBottom:"1px solid #E8EAF0",
            }}>
              <Avatar initials={s.name.split(" ").map(w=>w[0]).join("")} bg={s.bg} tc={s.tc} size={36} radius="50%" fontSize="12px" />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#1C2033" }}>{s.name}</div>
              </div>
              <input
                type="number" min={0} max={100}
                placeholder="/100"
                value={marks[s.id] || ""}
                onChange={e => updateMark(s.id, e.target.value)}
                style={{
                  width:72, padding:"8px 10px", borderRadius:9,
                  border:`1.5px solid ${marks[s.id] ? "#5C6BC0" : "#E8EAF0"}`,
                  fontFamily:"'Poppins',sans-serif", fontSize:14,
                  fontWeight:700, textAlign:"center", outline:"none",
                  background:"#F4F6FB", color:"#1C2033",
                }}
              />
            </div>
          ))}
        </div>

        <button onClick={save} style={{ ...S.btn("p"), width:"100%", borderRadius:14, marginTop:4 }}>
          💾 Save & Publish Results
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER CHAT LIST
// ─────────────────────────────────────────

function TeacherChatList({ onBack, navigate, onOpenChat, showToast }) {
  const [search, setSearch] = useState("");

  const filtered = PARENT_CHATS.filter(c =>
    c.parentName.toLowerCase().includes(search.toLowerCase()) ||
    c.relation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <TopBar title="💬 Parent Messages" onBack={onBack} />

      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px calc(66px + 16px)" }}>
        {/* Search */}
        <div style={{
          background:"#F3F4FD", borderRadius:14, padding:"12px 15px",
          display:"flex", gap:10, alignItems:"center", marginBottom:14,
        }}>
          <span style={{ fontSize:18, color:"#7B8099" }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search parents..."
            style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"'Poppins',sans-serif", fontSize:14, color:"#1C2033" }}
          />
        </div>

        <div style={{ ...S.card(), padding:"0 14px" }}>
          {filtered.map((chat, i) => (
            <div key={chat.id} onClick={() => onOpenChat(chat)} style={{
              display:"flex", gap:12, alignItems:"center",
              padding:"12px 0",
              borderBottom: i < filtered.length-1 ? "1px solid #E8EAF0" : "none",
              cursor:"pointer",
            }}>
              <Avatar initials={chat.initials} bg={chat.bg} tc={chat.tc} size={42} radius="50%" />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#1C2033" }}>
                  {chat.parentName}{" "}
                  <span style={{ fontSize:10, color:"#7B8099" }}>· {chat.relation}</span>
                </div>
                <div style={{ fontSize:11.5, color:"#7B8099", fontWeight:500, marginTop:1 }}>
                  {chat.lastMsg}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                <span style={{ fontSize:10, color:"#7B8099" }}>{chat.time}</span>
                {chat.unread > 0 && (
                  <span style={{
                    background:"#5C6BC0", color:"#fff", borderRadius:20,
                    padding:"1px 7px", fontSize:10, fontWeight:800,
                  }}>{chat.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="t-chat-list" navigate={navigate} />
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER CHAT (individual)
// ─────────────────────────────────────────

function TeacherChat({ onBack, chat }) {
  const [messages, setMessages] = useState(chat?.messages || []);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const newMsg = { from:"me", text:input.trim(), time:"Just now" };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        from:"them",
        text:"Thank you for your message. I will respond shortly. 🙏",
        time:"Just now",
      }]);
    }, 1200);
  };

  const handleKey = (e) => { if (e.key==="Enter") send(); };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Header */}
      <div style={{
        padding:"48px 18px 12px", background:"#FFFFFF",
        display:"flex", alignItems:"center", gap:10,
        boxShadow:"0 1px 0 #E8EAF0", flexShrink:0,
      }}>
        <button onClick={onBack} style={{
          width:38, height:38, borderRadius:12, border:"none", cursor:"pointer",
          background:"#E8EAF6", fontSize:20, color:"#1C2033",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>←</button>
        <Avatar initials={chat?.initials||"??"} bg={chat?.bg||"#eee"} tc={chat?.tc||"#333"} size={34} radius="50%" fontSize="11px" />
        <div style={{ flex:1, marginLeft:6 }}>
          <div style={{ fontFamily:"'Baloo 2',cursive", fontSize:15, fontWeight:800, color:"#1C2033" }}>
            {chat?.parentName}
          </div>
          <div style={{ fontSize:10.5, color:"#7B8099" }}>
            Parent of {chat?.relation?.split("'s")[0]} — {chat?.relation?.includes("Mom")?"Mother":"Father"}
          </div>
        </div>
        <button style={{
          width:38, height:38, borderRadius:12, border:"none", cursor:"pointer",
          background:"#E8EAF6", fontSize:18,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>📞</button>
      </div>

      {/* Messages */}
      <div style={{
        flex:1, overflowY:"auto", padding:"14px 14px 80px",
        display:"flex", flexDirection:"column", gap:10,
      }}>
        <div style={{ textAlign:"center", fontSize:10.5, color:"#7B8099", padding:"5px 0" }}>
          Today, 28 March
        </div>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth:"80%", padding:"12px 15px", borderRadius:18,
            fontSize:13.5, lineHeight:1.55, fontWeight:500,
            alignSelf: m.from==="me" ? "flex-end" : "flex-start",
            background: m.from==="me" ? "#5C6BC0" : "#FFFFFF",
            color: m.from==="me" ? "#fff" : "#1C2033",
            borderBottomRightRadius: m.from==="me" ? 4 : 18,
            borderBottomLeftRadius: m.from==="them" ? 4 : 18,
            boxShadow: m.from==="them" ? "0 2px 16px rgba(92,107,192,.10)" : "none",
          }}>
            {m.text}
            <div style={{ fontSize:10, opacity:.6, marginTop:5, textAlign: m.from==="me" ? "right" : "left" }}>
              {m.time}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        background:"#FFFFFF", padding:"10px 12px",
        display:"flex", gap:8, alignItems:"center",
        borderTop:"1px solid #E8EAF0", zIndex:100,
      }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Reply to parent..."
          style={{
            flex:1, padding:"11px 14px", borderRadius:22,
            border:"1.5px solid #E8EAF0", fontFamily:"'Poppins',sans-serif",
            fontSize:14, background:"#F4F6FB", outline:"none", color:"#1C2033",
          }}
        />
        <button onClick={send} style={{
          width:42, height:42, borderRadius:"50%", background:"#5C6BC0",
          border:"none", cursor:"pointer", color:"#fff", fontSize:18,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>➤</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER LEAVE
// ─────────────────────────────────────────

function TeacherLeave({ onBack, showToast }) {
  const leaveHistory = [
    { type:"Medical / Sick", from:"15 Feb", to:"16 Feb", status:"approved", days:2 },
    { type:"Casual Leave",   from:"3 Jan",  to:"3 Jan",  status:"approved", days:1 },
    { type:"Personal",       from:"20 Dec", to:"20 Dec", status:"rejected", days:1 },
  ];

  const statusBadge = (s) => {
    if (s==="approved") return <Badge type="g">Approved ✅</Badge>;
    if (s==="pending")  return <Badge type="y">Pending ⏳</Badge>;
    return <Badge type="r">Rejected ❌</Badge>;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <TopBar title="🗓️ Leave Request" onBack={onBack} />

      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
        <div style={S.card()}>
          <div style={{ fontSize:11, fontWeight:700, color:"#7B8099", textTransform:"uppercase", letterSpacing:".6px", marginBottom:14 }}>
            Apply New Leave
          </div>
          <div style={S.ig}>
            <label style={S.label}>Leave Type</label>
            <select style={S.select}>
              {["Medical / Sick","Casual Leave","Emergency","Personal"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1, ...S.ig }}>
              <label style={S.label}>From Date</label>
              <input type="date" style={S.input} defaultValue="2026-04-03" />
            </div>
            <div style={{ flex:1, ...S.ig }}>
              <label style={S.label}>To Date</label>
              <input type="date" style={S.input} defaultValue="2026-04-03" />
            </div>
          </div>
          <div style={S.ig}>
            <label style={S.label}>Substitute Teacher (if arranged)</label>
            <input style={S.input} placeholder="Name of substitute" />
          </div>
          <div style={S.ig}>
            <label style={S.label}>Reason</label>
            <textarea style={{ ...S.input, resize:"none", height:90 }} placeholder="Explain reason for leave..." />
          </div>
          <button onClick={() => showToast("✅ Leave request sent to Admin!")}
            style={{ ...S.btn("p"), width:"100%", borderRadius:14 }}>
            Submit Leave Request
          </button>
        </div>

        <SectionHeader title="📋 Leave History" />
        {leaveHistory.map((l, i) => (
          <div key={i} style={{ background:"#F3F4FD", borderRadius:12, padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:"#1C2033" }}>{l.type}</div>
              {statusBadge(l.status)}
            </div>
            <div style={{ fontSize:11.5, color:"#7B8099" }}>
              {l.from} – {l.to} &nbsp;•&nbsp; {l.days} day{l.days>1?"s":""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER TIMETABLE
// ─────────────────────────────────────────

function TeacherTimetable({ onBack }) {
  const today = "Tue";
  const [activeDay, setActiveDay] = useState(today);

  const periods = TIMETABLE[activeDay] || [];

  const statusBadge = (s) => {
    if (s==="done")     return <Badge type="g">Done</Badge>;
    if (s==="now")      return <Badge type="b">Now</Badge>;
    if (s==="upcoming") return <Badge type="y">Upcoming</Badge>;
    if (s==="break")    return null;
    return <Badge type="y">Upcoming</Badge>;
  };

  const timeStyle = (s) => {
    if (s==="now")   return { background:"#FFF3E0", color:"#E65100" };
    if (s==="done")  return { background:"#E8EAF6", color:"#5C6BC0" };
    return { background:"#E8EAF6", color:"#5C6BC0" };
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <TopBar title="📅 My Timetable" onBack={onBack} />

      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
        {/* Day chips */}
        <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4, marginBottom:12 }}>
          {DAYS.map(d => (
            <button key={d} onClick={() => setActiveDay(d)} style={{
              display:"inline-flex", alignItems:"center", gap:5,
              background: activeDay===d ? "#5C6BC0" : "#E8EAF6",
              color: activeDay===d ? "#fff" : "#5C6BC0",
              borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700,
              cursor:"pointer", border:"none", flexShrink:0,
            }}>{d}</button>
          ))}
        </div>

        <div style={S.card()}>
          <div style={{ fontSize:11, fontWeight:700, color:"#7B8099", textTransform:"uppercase", letterSpacing:".6px", marginBottom:12 }}>
            {activeDay} — 28 March 2026
          </div>
          {periods.map((p, i) => (
            <div key={i} style={{
              display:"flex", gap:10, alignItems:"center", padding:"11px 0",
              borderBottom: i < periods.length-1 ? "1px solid #E8EAF0" : "none",
            }}>
              <div style={{
                minWidth:52, borderRadius:9, padding:"7px 6px", textAlign:"center",
                fontSize:10.5, fontWeight:800, ...timeStyle(p.status),
              }}>{p.time}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#1C2033" }}>{p.subject}</div>
                <div style={{ fontSize:11.5, color:"#7B8099", fontWeight:500, marginTop:1 }}>{p.room}</div>
              </div>
              {statusBadge(p.status)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER NOTIFICATIONS
// ─────────────────────────────────────────

function TeacherNotifications({ onBack }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <TopBar title="🔔 Notifications" onBack={onBack} />
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
        <div style={S.card()}>
          {NOTIFICATIONS.map((n, i) => (
            <div key={n.id} style={{
              display:"flex", gap:12, padding:"13px 0",
              borderBottom: i < NOTIFICATIONS.length-1 ? "1px solid #E8EAF0" : "none",
            }}>
              <div style={{
                width:44, height:44, borderRadius:14, background:n.bg,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:20, flexShrink:0,
              }}>{n.icon}</div>
              <div>
                <div style={{ fontSize:13.5, fontWeight:700, color:"#1C2033" }}>{n.title}</div>
                <div style={{ fontSize:11.5, color:"#7B8099", fontWeight:500, marginTop:2, lineHeight:1.5 }}>
                  {n.desc}
                </div>
                <div style={{ fontSize:10.5, color:"#7B8099", marginTop:4 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEACHER PROFILE
// ─────────────────────────────────────────

function TeacherProfile({ navigate, showToast }) {
  const menuItems = [
    { icon:"✏️", bg:"#E8EAF6", label:"Edit Profile",    action:() => showToast("✏️ Edit Profile") },
    { icon:"⚙️", bg:"#E8F5E9", label:"Settings",        action:() => showToast("⚙️ Settings") },
    { icon:"📞", bg:"#E3F2FD", label:"Help & Support",  action:() => showToast("📞 Support") },
    { icon:"🚪", bg:"#FFEBEE", label:"Logout",          action:() => navigate("login"), danger:true },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <TopBar title="My Profile" />
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px calc(66px + 16px)" }}>
        {/* Profile Hero */}
        <div style={{ textAlign:"center", padding:"28px 0 20px" }}>
          <div style={{
            width:90, height:90, borderRadius:"50%",
            background:"linear-gradient(135deg,#3949AB,#7B61FF)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:32, fontWeight:900, color:"#fff",
            margin:"0 auto 12px", boxShadow:"0 8px 28px rgba(92,107,192,.35)",
          }}>RS</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#1C2033" }}>{TEACHER.name}</div>
          <div style={{ fontSize:13, color:"#7B8099", marginTop:3 }}>
            {TEACHER.subject} • Emp ID: {TEACHER.empId} • {TEACHER.school}
          </div>
          <Badge type="b" style={{ marginTop:8 }}>👩‍🏫 Teacher</Badge>
        </div>

        {/* Stats */}
        <div style={{
          display:"flex", background:"#FFFFFF", borderRadius:"20px",
          overflow:"hidden", boxShadow:"0 2px 16px rgba(92,107,192,.10)", marginBottom:14,
        }}>
          {[
            { val:TEACHER.students, lbl:"Students" },
            { val:TEACHER.experience, lbl:"Yrs Exp" },
            { val:`${TEACHER.rating}⭐`, lbl:"Rating" },
          ].map((s, i, arr) => (
            <div key={s.lbl} style={{
              flex:1, textAlign:"center", padding:"14px 6px",
              borderRight: i < arr.length-1 ? "1px solid #E8EAF0" : "none",
            }}>
              <div style={{ fontSize:20, fontWeight:800, color:"#5C6BC0" }}>{s.val}</div>
              <div style={{ fontSize:9.5, color:"#7B8099", fontWeight:700, textTransform:"uppercase" }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Subject Info */}
        <div style={S.card()}>
          <div style={{ fontSize:11, fontWeight:700, color:"#7B8099", textTransform:"uppercase", letterSpacing:".6px", marginBottom:12 }}>
            Teaching Info
          </div>
          {[
            { label:"Subject", value:"Mathematics" },
            { label:"Wing", value:"Senior Wing (IX–XII)" },
            { label:"Classes", value:"IX-A, X-A, XI-A, XII-B" },
            { label:"School", value:"DPS Noida" },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #E8EAF0" }}>
              <span style={{ fontSize:13, color:"#7B8099", fontWeight:600 }}>{r.label}</span>
              <span style={{ fontSize:13, fontWeight:700, color:"#1C2033" }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Menu */}
        {menuItems.map((m, i) => (
          <div key={i} onClick={m.action} style={{
            display:"flex", alignItems:"center", gap:13,
            padding:"14px 16px", background:"#FFFFFF", borderRadius:12,
            marginBottom:8, cursor:"pointer", boxShadow:"0 2px 16px rgba(92,107,192,.10)",
          }}>
            <div style={{
              width:38, height:38, borderRadius:11, background:m.bg,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
            }}>{m.icon}</div>
            <div style={{ flex:1, fontSize:14, fontWeight:700, color: m.danger ? "#EF5350" : "#1C2033" }}>
              {m.label}
            </div>
            <span style={{ color: m.danger ? "#EF5350" : "#7B8099" }}>›</span>
          </div>
        ))}
      </div>
      <BottomNav active="t-profile" navigate={navigate} />
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN TEACHER COMPONENT (Navigation Hub)
// ─────────────────────────────────────────

export default function Teacher({ onLogout }) {
  const [screen, setScreen]   = useState("t-home");
  const [history, setHistory] = useState([]);
  const [toast, setToast]     = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const toastTimer = useRef(null);

  // Navigate forward (push to history)
  const navigate = useCallback((id) => {
    if (id === "login") { onLogout?.(); return; }
    setHistory(prev => [...prev, screen]);
    setScreen(id);
  }, [screen, onLogout]);

  // Back (pop history)
  const back = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setScreen(prev);
  }, [history]);

  // Toast helper
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  }, []);

  // Open individual chat
  const openChat = useCallback((chat) => {
    setActiveChat(chat);
    navigate("t-chat");
  }, [navigate]);

  // Screen resolver
  const renderScreen = () => {
    switch (screen) {
      case "t-home":
        return <TeacherHome navigate={navigate} showToast={showToast} />;
      case "t-attendance":
        return <TeacherAttendance onBack={back} showToast={showToast} />;
      case "t-upload":
        return <TeacherUpload onBack={back} navigate={navigate} showToast={showToast} />;
      case "t-marks":
        return <TeacherMarks onBack={back} showToast={showToast} />;
      case "t-chat-list":
        return <TeacherChatList onBack={back} navigate={navigate} onOpenChat={openChat} showToast={showToast} />;
      case "t-chat":
        return <TeacherChat onBack={back} chat={activeChat} />;
      case "t-leave":
        return <TeacherLeave onBack={back} showToast={showToast} />;
      case "t-timetable":
        return <TeacherTimetable onBack={back} />;
      case "t-notif":
        return <TeacherNotifications onBack={back} />;
      case "t-profile":
        return <TeacherProfile navigate={navigate} showToast={showToast} />;
      default:
        return <TeacherHome navigate={navigate} showToast={showToast} />;
    }
  };

  return (
    <div style={{ position:"relative", width:"100%", height:"100%", overflow:"hidden", background:"#F4F6FB", fontFamily:"'Poppins',sans-serif" }}>
      {renderScreen()}
      <Toast message={toast} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}
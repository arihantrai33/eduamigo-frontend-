// src/pages/parent/Attendance.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "../../context/AuthContext";

export default function ParentAttendance() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── State ────────────────────────────────────────────────────
  const [percent, setPercent]       = useState(87);
  const [present, setPresent]       = useState(20);
  const [absent, setAbsent]         = useState(3);
  const [late, setLate]             = useState(0);
  const [absentDays, setAbsentDays] = useState([]);
  const [calDays, setCalDays]       = useState([]);

  // ── Firebase fetch ───────────────────────────────────────────
  useEffect(() => {
    if (!user?.childId) return;

    const unsub = onValue(ref(db, `attendance/${user.childId}`), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();

      // Summary
      if (data.summary) {
        setPercent(data.summary.percent ?? 87);
        setPresent(data.summary.present ?? 20);
        setAbsent(data.summary.absent  ?? 3);
        setLate(data.summary.late      ?? 0);
      }

      // Absent days list
      if (data.absentDays) {
        const list = Object.values(data.absentDays).map((a) => ({
          day:    a.dateLabel,
          note:   a.note,
          status: a.status === "L" ? "Leave" : "Absent",
          color:  a.status === "L" ? "#22c55e" : "#ef4444",
          bg:     a.status === "L" ? "#dcfce7" : "#fee2e2",
        }));
        setAbsentDays(list);
      }

      // Calendar — build from data.calendar object { "2026-03-06": "A", ... }
      if (data.calendar) {
        const now        = new Date();
        const year       = now.getFullYear();
        const month      = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay    = new Date(year, month, 1).getDay();

        const cells = [];
        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
          cells.push({ d: "", p: false, a: false });
        }
        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
          const key    = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const status = data.calendar[key];
          cells.push({
            d:       String(d),
            p:       status === "P",
            a:       status === "A",
            today:   d === now.getDate(),
            holiday: status === "H",
          });
        }
        setCalDays(cells);
      }
    });

    return () => unsub();
  }, [user]);

  // ── Fallback static data (jab tak Firebase mein data nahi) ──
  const displayAbsentDays = absentDays.length > 0 ? absentDays : [
    { day:"Thursday, 26 March",   note:"Absent — Parent notified via push", status:"Absent", color:"#ef4444", bg:"#fee2e2" },
    { day:"Wednesday, 19 March",  note:"Absent — App notification sent",    status:"Absent", color:"#ef4444", bg:"#fee2e2" },
    { day:"Friday, 6 March",      note:"Medical leave — Approved",          status:"Leave",  color:"#22c55e", bg:"#dcfce7" },
  ];

  const displayCalDays = calDays.length > 0 ? calDays : [
    { d:"",  p:false, a:false }, { d:"",  p:false, a:false }, { d:"",  p:false, a:false },
    { d:"",  p:false, a:false }, { d:"",  p:false, a:false }, { d:"",  p:false, a:false },
    { d:"1", p:false, a:false, holiday:true },
    { d:"2", p:false }, { d:"3", p:true }, { d:"4", p:true }, { d:"5", p:true },
    { d:"6", a:true  }, { d:"7", p:true },
    { d:"8",  p:false, holiday:true },
    { d:"9",  p:false }, { d:"10", p:true }, { d:"11", p:true }, { d:"12", p:true },
    { d:"13", p:true  }, { d:"14", p:true },
    { d:"15", p:false, holiday:true },
    { d:"16", p:false }, { d:"17", p:true }, { d:"18", p:true }, { d:"19", a:true  },
    { d:"20", p:true  }, { d:"21", p:true },
    { d:"22", p:false, holiday:true },
    { d:"23", p:false }, { d:"24", p:true }, { d:"25", p:true }, { d:"26", a:true  },
    { d:"27", p:true  }, { d:"28", p:true, today:true },
    { d:"29", p:false }, { d:"30", p:false }, { d:"31", p:false },
  ];

  // ── UI (exactly same as before) ──────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#f5f6fa", fontFamily:"sans-serif", paddingBottom:"30px" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#4f46e5,#7c3aed)", padding:"48px 16px 40px", color:"white" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"8px", padding:"8px 12px", color:"white", cursor:"pointer", fontSize:"16px" }}
          >←</button>
          <h2 style={{ margin:0, fontSize:"18px", fontWeight:"800" }}>✅ Attendance Report</h2>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"12px", opacity:0.8 }}>
            March 2026 — {user?.childName || "Rahul Kumar"}
          </div>
          <div style={{ fontSize:"64px", fontWeight:"900", lineHeight:1.1 }}>{percent}%</div>
          <div style={{ fontSize:"13px", opacity:0.85 }}>
            {present} Present &nbsp;•&nbsp; {absent} Absent &nbsp;•&nbsp; {late} Late
          </div>
        </div>
      </div>

      <div style={{ padding:"16px", marginTop:"-20px" }}>

        {/* Calendar */}
        <div style={{ background:"white", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)", marginBottom:"16px" }}>
          <div style={{ fontWeight:"700", fontSize:"14px", marginBottom:"12px" }}>March 2026 Calendar</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", textAlign:"center" }}>
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} style={{ fontSize:"11px", fontWeight:"700", color:"#888", padding:"4px 0" }}>{d}</div>
            ))}
            {displayCalDays.map((c, i) => (
              <div key={i} style={{
                padding:"6px 2px", borderRadius:"8px", fontSize:"12px", fontWeight:"600",
                background: c.today ? "#4f46e5" : c.p ? "#e8f5e9" : c.a ? "#ffebee" : "transparent",
                color:      c.today ? "white"   : c.p ? "#2e7d32" : c.a ? "#ef4444" : "#ccc",
              }}>{c.d}</div>
            ))}
          </div>
          {/* Legend */}
          <div style={{ display:"flex", gap:"16px", marginTop:"12px", flexWrap:"wrap" }}>
            {[
              { color:"#e8f5e9", label:"Present" },
              { color:"#ffebee", label:"Absent"  },
              { color:"#4f46e5", label:"Today"   },
            ].map((l) => (
              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"11px" }}>
                <div style={{ width:"12px", height:"12px", borderRadius:"3px", background:l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Absent Days */}
        <div style={{ background:"white", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight:"700", fontSize:"14px", marginBottom:"12px" }}>Absent Days</div>
          {displayAbsentDays.map((a, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:"12px",
              padding:"12px 0",
              borderBottom: i < displayAbsentDays.length - 1 ? "1px solid #f3f4f6" : "none",
            }}>
              <span style={{ fontSize:"20px" }}>{a.status === "Absent" ? "❌" : "✅"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:"600", fontSize:"14px" }}>{a.day}</div>
                <div style={{ fontSize:"12px", color:"#888", marginTop:"2px" }}>{a.note}</div>
              </div>
              <span style={{ fontSize:"11px", fontWeight:"700", color:a.color, background:a.bg, padding:"4px 10px", borderRadius:"20px" }}>
                {a.status}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
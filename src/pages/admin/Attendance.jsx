import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const STATUS_CONFIG = {
  Present: { bg: "#F0FDF4", color: "#15803D", dot: "#22C55E", hover: "#DCFCE7" },
  Absent:  { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444", hover: "#FEE2E2" },
  Late:    { bg: "#FFFBEB", color: "#D97706", dot: "#F59E0B", hover: "#FEF3C7" },
};

function Avatar({ name, size = 38 }) {
  const colors = ["#6366F1","#8B5CF6","#EC4899","#F43F5E","#F97316","#22C55E","#14B8A6","#06B6D4","#3B82F6"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${color},${color}BB)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color: "white", flexShrink: 0, boxShadow: `0 2px 8px ${color}44` }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, icon, color, bg, delay }) {
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "18px 22px", boxShadow: "0 4px 20px rgba(15,23,42,0.07)", border: `2px solid ${color}`, animation: `fadeUp 0.5s ease ${delay}s both`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: bg, opacity: 0.15 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A" }}>{value}</div>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    axios.get(`${API}/students`, auth()).then(r => {
      const data = r.data.data || [];
      setAllStudents(data);
      setClasses([...new Set(data.map(s => s.class))].sort());
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) { setSections([]); setSelectedSection(""); return; }
    const secs = [...new Set(allStudents.filter(s => s.class === selectedClass).map(s => s.section))].sort();
    setSections(secs);
    setSelectedSection("");
    setStudents([]);
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection) loadStudents();
  }, [selectedClass, selectedSection, date]);

  const loadStudents = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const filtered = allStudents.filter(s => s.class === selectedClass && s.section === selectedSection);
      setStudents(filtered);
      const init = {};
      filtered.forEach(s => init[s._id] = "Present");
      // Try to load existing attendance
      try {
        const r = await axios.get(`${API}/attendance?class=${selectedClass}&section=${selectedSection}&date=${date}`, auth());
        const existing = r.data.data || [];
        existing.forEach(a => { if (init[a.student]) init[a.student] = a.status; });
      } catch(e) {}
      setAttendance(init);
    } catch(e) {}
    setLoading(false);
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => updated[s._id] = status);
    setAttendance(updated);
  };

  const toggle = (id) => {
    const order = ["Present", "Absent", "Late"];
    const curr = attendance[id] || "Present";
    const next = order[(order.indexOf(curr) + 1) % order.length];
    setAttendance(prev => ({ ...prev, [id]: next }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({ student: s._id, date, status: attendance[s._id] || "Present", class: selectedClass, section: selectedSection }));
      await axios.post(`${API}/attendance/bulk`, { records }, auth());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch(e) { alert(e.response?.data?.message || "Error saving attendance"); }
    setSaving(false);
  };

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(v => v === "Present").length,
    absent: Object.values(attendance).filter(v => v === "Absent").length,
    late: Object.values(attendance).filter(v => v === "Late").length,
  };
  const pct = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .student-row:hover { background: #F8FAFF !important; transform: translateX(2px); }
        .student-row { transition: all 0.15s ease; }
        .status-btn:hover { transform: scale(1.05); }
        .status-btn { transition: all 0.15s ease; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0EA5E9,#6366F1,#8B5CF6)", borderRadius: 20, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden", animation: "fadeUp 0.4s ease" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -30, left: 120, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>Attendance</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Mark and manage daily class attendance</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 20px rgba(15,23,42,0.07)", border: "1px solid #E2E8F0", marginBottom: 24, animation: "fadeUp 0.4s ease 0.05s both" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 16, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, letterSpacing: "0.06em" }}>CLASS</div>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: 13, fontWeight: 600, outline: "none", background: "white", cursor: "pointer" }}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, letterSpacing: "0.06em" }}>SECTION</div>
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} disabled={!selectedClass}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: 13, fontWeight: 600, outline: "none", background: selectedClass ? "white" : "#F8FAFC", cursor: selectedClass ? "pointer" : "not-allowed", opacity: selectedClass ? 1 : 0.6 }}>
              <option value="">Select Section</option>
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, letterSpacing: "0.06em" }}>DATE</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: 13, fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          {students.length > 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              {["Present","Absent","Late"].map(s => (
                <button key={s} onClick={() => markAll(s)} className="status-btn"
                  style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].color, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  All {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {students.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard label="TOTAL STUDENTS" value={stats.total} icon="👥" color="#6366F1" bg="#EEF2FF" delay={0} />
          <StatCard label="PRESENT" value={stats.present} icon="✅" color="#10B981" bg="#F0FDF4" delay={0.05} />
          <StatCard label="ABSENT" value={stats.absent} icon="❌" color="#EF4444" bg="#FEF2F2" delay={0.1} />
          <StatCard label="LATE" value={stats.late} icon="⏰" color="#F59E0B" bg="#FFFBEB" delay={0.15} />
        </div>
      )}

      {/* Progress Bar */}
      {students.length > 0 && (
        <div style={{ background: "white", borderRadius: 16, padding: "16px 24px", boxShadow: "0 4px 20px rgba(15,23,42,0.07)", border: "1px solid #E2E8F0", marginBottom: 24, animation: "fadeUp 0.4s ease 0.2s both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Attendance Rate</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: pct >= 75 ? "#10B981" : "#EF4444" }}>{pct}%</div>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: "#F1F5F9", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 999, width: `${pct}%`, background: pct >= 75 ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#EF4444,#DC2626)", transition: "width 0.8s ease" }} />
          </div>
        </div>
      )}

      {/* Student List */}
      {!selectedClass || !selectedSection ? (
        <div style={{ background: "white", borderRadius: 20, padding: "80px 40px", textAlign: "center", boxShadow: "0 4px 20px rgba(15,23,42,0.07)", border: "1px solid #E2E8F0", animation: "fadeUp 0.4s ease 0.1s both" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Select Class and Section</div>
          <div style={{ fontSize: 13, color: "#CBD5E1" }}>Choose a class and section to load students and mark attendance</div>
        </div>
      ) : loading ? (
        <div style={{ background: "white", borderRadius: 20, padding: "80px 40px", textAlign: "center", boxShadow: "0 4px 20px rgba(15,23,42,0.07)", border: "1px solid #E2E8F0" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #E2E8F0", borderTop: "3px solid #6366F1", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "#94A3B8", fontSize: 13, fontWeight: 600 }}>Loading students...</div>
        </div>
      ) : students.length === 0 ? (
        <div style={{ background: "white", borderRadius: 20, padding: "80px 40px", textAlign: "center", boxShadow: "0 4px 20px rgba(15,23,42,0.07)", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#94A3B8" }}>No students found</div>
          <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>No students enrolled in Class {selectedClass}-{selectedSection}</div>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 20, boxShadow: "0 4px 24px rgba(15,23,42,0.07)", border: "1px solid rgba(226,232,240,0.8)", overflow: "hidden", animation: "fadeUp 0.4s ease 0.25s both" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
              Class {selectedClass}-{selectedSection} · {students.length} Students
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>Click on status to toggle</div>
          </div>
          <div>
            {students.map((s, i) => {
              const status = attendance[s._id] || "Present";
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={s._id} className="student-row" style={{ display: "flex", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #F8FAFC", background: "white", animation: `fadeUp 0.3s ease ${i * 0.03}s both` }}>
                  <div style={{ width: 36, fontSize: 13, fontWeight: 700, color: "#94A3B8", marginRight: 12 }}>#{i + 1}</div>
                  <Avatar name={s.name} size={40} />
                  <div style={{ flex: 1, marginLeft: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Roll #{s.rollNumber} · {s.email}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Present","Absent","Late"].map(st => (
                      <button key={st} onClick={() => setAttendance(prev => ({ ...prev, [s._id]: st }))} className="status-btn"
                        style={{ padding: "7px 16px", borderRadius: 20, border: status === st ? `2px solid ${STATUS_CONFIG[st].dot}` : "2px solid #E2E8F0", background: status === st ? STATUS_CONFIG[st].bg : "white", color: status === st ? STATUS_CONFIG[st].color : "#94A3B8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "20px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
              {stats.present} Present · {stats.absent} Absent · {stats.late} Late
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {saved && <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>✅ Attendance saved successfully!</div>}
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "12px 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.4)", opacity: saving ? 0.7 : 1, transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

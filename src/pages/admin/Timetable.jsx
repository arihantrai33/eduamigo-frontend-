import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_COLORS = { Monday:"#6366F1", Tuesday:"#10B981", Wednesday:"#F59E0B", Thursday:"#EC4899", Friday:"#3B82F6", Saturday:"#8B5CF6" };
const PERIODS = [1,2,3,4,5,6,7,8];

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", borderRadius:24, padding:32, width:560, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.25)", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:16, color:"#64748B" }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Timetable() {
  const [timetables, setTimetables] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [showModal, setShowModal] = useState(false);
  const [editPeriod, setEditPeriod] = useState(null);
  const [periodForm, setPeriodForm] = useState({ no:1, subject:"", teacherId:"", startTime:"", endTime:"" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tRes, teachRes] = await Promise.allSettled([
        axios.get(`${API}/timetable`, auth()),
        axios.get(`${API}/teachers`, auth()),
      ]);
      setTimetables(tRes.status === "fulfilled" ? (tRes.value.data.data || []) : []);
      setTeachers(teachRes.status === "fulfilled" ? (teachRes.value.data.data || []) : []);
    } catch(e) {}
    setLoading(false);
  };

  const classes = [...new Set(timetables.map(t => t.class))].sort();
  const sections = [...new Set(timetables.filter(t => t.class === selectedClass).map(t => t.section))].sort();

  const currentTimetable = timetables.find(t =>
    t.class === selectedClass && t.section === selectedSection && t.day === selectedDay
  );

  const openAddPeriod = (periodNo) => {
    setEditPeriod(null);
    setPeriodForm({ no: periodNo, subject:"", teacherId:"", startTime:"", endTime:"" });
    setShowModal(true);
  };

  const openEditPeriod = (period) => {
    setEditPeriod(period);
    setPeriodForm({
      no: period.periodNo || period.no,
      subject: period.subject || "",
      teacherId: period.teacher?._id || period.teacher || "",
      startTime: period.startTime || "",
      endTime: period.endTime || "",
    });
    setShowModal(true);
  };

  const handleSavePeriod = async () => {
    if (!selectedClass || !selectedSection) return alert("Select class and section first");
    if (!periodForm.subject) return alert("Subject is required");
    setSaving(true);
    try {
      const payload = {
        class: selectedClass,
        section: selectedSection,
        day: selectedDay,
        period: {
          periodNo: periodForm.no,
          no: periodForm.no,
          subject: periodForm.subject,
          teacher: periodForm.teacherId || undefined,
          startTime: periodForm.startTime,
          endTime: periodForm.endTime,
        }
      };
      if (currentTimetable) {
        await axios.put(`${API}/timetable/${currentTimetable._id}`, payload, auth());
      } else {
        await axios.post(`${API}/timetable`, payload, auth());
      }
      setShowModal(false);
      fetchAll();
    } catch(e) { alert(e.response?.data?.message || "Error saving"); }
    setSaving(false);
  };

  const getTeacherName = (teacher) => {
    if (!teacher) return null;
    if (typeof teacher === "object") return teacher.name;
    const found = teachers.find(t => t._id === teacher);
    return found?.name || null;
  };

  const f = (k, v) => setPeriodForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .period-cell:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .period-cell { transition: all 0.2s ease; }
        .day-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .day-btn { transition: all 0.15s ease; }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#3B82F6,#6366F1,#8B5CF6)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Timetable</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Create and manage class schedules</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background:"white", borderRadius:16, padding:"20px 24px", marginBottom:24, boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", animation:"fadeUp 0.4s ease 0.05s both" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>CLASS</div>
            <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(""); }}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white" }}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>SECTION</div>
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white" }}>
              <option value="">Select Section</option>
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end" }}>
            <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600 }}>
              {timetables.length} timetable entries in database
            </div>
          </div>
        </div>

        {/* Day Selector */}
        <div style={{ display:"flex", gap:8 }}>
          {DAYS.map(day => (
            <button key={day} className="day-btn" onClick={() => setSelectedDay(day)}
              style={{ flex:1, padding:"10px 8px", borderRadius:12, border:"none", cursor:"pointer", fontWeight:700, fontSize:12,
                background: selectedDay === day ? DAY_COLORS[day] : "#F8FAFC",
                color: selectedDay === day ? "white" : "#64748B",
                boxShadow: selectedDay === day ? `0 4px 14px ${DAY_COLORS[day]}44` : "none" }}>
              {day.slice(0,3)}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Grid */}
      {!selectedClass || !selectedSection ? (
        <div style={{ background:"white", borderRadius:20, padding:"80px 0", textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🗓️</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>Select a class and section</div>
          <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>to view or edit the timetable</div>
        </div>
      ) : (
        <div style={{ animation:"fadeUp 0.4s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>
              Class {selectedClass}-{selectedSection} · <span style={{ color: DAY_COLORS[selectedDay] }}>{selectedDay}</span>
            </div>
            <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600 }}>
              {currentTimetable ? `${currentTimetable.periods?.length || 0} periods scheduled` : "No timetable yet — add periods below"}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {PERIODS.map(pNo => {
              const period = currentTimetable?.periods?.find(p => (p.periodNo || p.no) === pNo);
              const color = DAY_COLORS[selectedDay];
              return (
                <div key={pNo} className="period-cell"
                  style={{ background:"white", borderRadius:16, padding:"18px", boxShadow:"0 2px 12px rgba(15,23,42,0.06)", border: period ? `2px solid ${color}30` : "2px dashed #E2E8F0", cursor:"pointer", minHeight:120 }}
                  onClick={() => period ? openEditPeriod(period) : openAddPeriod(pNo)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background: period ? color : "#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color: period ? "white" : "#94A3B8" }}>
                      {pNo}
                    </div>
                    {period && (
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${color}15`, color }}>Period {pNo}</span>
                    )}
                  </div>
                  {period ? (
                    <>
                      <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:4 }}>{period.subject}</div>
                      {getTeacherName(period.teacher) && (
                        <div style={{ fontSize:11, color:"#64748B", fontWeight:600 }}>👩‍🏫 {getTeacherName(period.teacher)}</div>
                      )}
                      {(period.startTime || period.endTime) && (
                        <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>🕐 {period.startTime} - {period.endTime}</div>
                      )}
                      <div style={{ marginTop:8, fontSize:11, color, fontWeight:700 }}>Click to edit →</div>
                    </>
                  ) : (
                    <div style={{ textAlign:"center", paddingTop:8 }}>
                      <div style={{ fontSize:24, marginBottom:4 }}>+</div>
                      <div style={{ fontSize:12, color:"#CBD5E1", fontWeight:600 }}>Add Period</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editPeriod ? `Edit Period ${periodForm.no}` : `Add Period ${periodForm.no}`}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#F8FAFC", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#64748B", fontWeight:600 }}>
            Class {selectedClass}-{selectedSection} · {selectedDay} · Period {periodForm.no}
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>SUBJECT</div>
            <input value={periodForm.subject} onChange={e => f("subject", e.target.value)} placeholder="e.g. Mathematics"
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor="#6366F1"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>TEACHER</div>
            <select value={periodForm.teacherId} onChange={e => f("teacherId", e.target.value)}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white", fontFamily:"inherit" }}>
              <option value="">Select Teacher (optional)</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name}{t.subjects ? ` — ${Array.isArray(t.subjects) ? t.subjects.join(", ") : t.subjects}` : ""}</option>)}
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>START TIME</div>
              <input type="time" value={periodForm.startTime} onChange={e => f("startTime", e.target.value)}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>END TIME</div>
              <input type="time" value={periodForm.endTime} onChange={e => f("endTime", e.target.value)}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:4 }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleSavePeriod} disabled={saving}
              style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#3B82F6,#6366F1)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 4px 14px rgba(99,102,241,0.4)", opacity:saving?0.7:1 }}>
              {saving ? "Saving..." : "Save Period"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

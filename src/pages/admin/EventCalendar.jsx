import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Calendar, Sparkles } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const EVENT_TYPES = {
  holiday: { label: "Holiday", color: "#EF4444", light: "#FEF2F2", grad: "linear-gradient(135deg,#EF4444,#EC4899)", icon: "🏖️" },
  exam:    { label: "Exam",    color: "#F59E0B", light: "#FFFBEB", grad: "linear-gradient(135deg,#F59E0B,#EF4444)", icon: "📝" },
  ptm:     { label: "PTM",     color: "#8B5CF6", light: "#F5F3FF", grad: "linear-gradient(135deg,#8B5CF6,#6366F1)", icon: "👨‍👩‍👧" },
  event:   { label: "Event",   color: "#6366F1", light: "#EEF2FF", grad: "linear-gradient(135deg,#6366F1,#3B82F6)", icon: "🎉" },
  sports:  { label: "Sports",  color: "#10B981", light: "#F0FDF4", grad: "linear-gradient(135deg,#10B981,#06B6D4)", icon: "🏆" },
  other:   { label: "Other",   color: "#64748B", light: "#F8FAFC", grad: "linear-gradient(135deg,#64748B,#475569)", icon: "📌" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["S","M","T","W","T","F","S"];

export default function EventCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", endDate: "", type: "event", targetRole: "all" });
  const [saving, setSaving] = useState(false);
  const [animDir, setAnimDir] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => { fetchEvents(); }, [currentMonth, currentYear]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/events?month=${currentMonth + 1}&year=${currentYear}`, authHeader());
      setEvents(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      await axios.post(`${API}/events`, form, authHeader());
      setShowForm(false);
      setForm({ title: "", description: "", date: "", endDate: "", type: "event", targetRole: "all" });
      fetchEvents();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/events/${id}`, authHeader());
      fetchEvents();
      setSelectedDayEvents(prev => prev.filter(e => e._id !== id));
    } catch (e) { console.error(e); }
  };

  const changeMonth = (dir) => {
    setVisible(false);
    setAnimDir(dir);
    setTimeout(() => {
      if (dir === -1) {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
      } else {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
      }
      setVisible(true);
    }, 200);
  };

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m, y) => new Date(y, m, 1).getDay();

  const getEventsForDay = (day) => events.filter(e => {
    const d = new Date(e.date);
    return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const handleDayClick = (day) => {
    const dayEvs = getEventsForDay(day);
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setSelectedDate({ day, dateStr });
    setSelectedDayEvents(dayEvs);
    setShowDayModal(true);
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const allUpcoming = events
    .filter(e => new Date(e.date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  const inputStyle = { width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  // BG gradient colors for calendar header based on month
  const monthColors = [
    ["#3B82F6","#6366F1"], ["#EC4899","#F43F5E"], ["#10B981","#059669"],
    ["#F59E0B","#EF4444"], ["#8B5CF6","#6366F1"], ["#06B6D4","#3B82F6"],
    ["#EF4444","#EC4899"], ["#F97316","#EF4444"], ["#10B981","#06B6D4"],
    ["#6366F1","#8B5CF6"], ["#F59E0B","#10B981"], ["#EF4444","#8B5CF6"]
  ];
  const [c1, c2] = monthColors[currentMonth];

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:"#0F172A", letterSpacing:"-0.3px" }}>Event Calendar</div>
          <div style={{ fontSize:12, color:"#94A3B8", marginTop:3 }}>{events.length} events this month</div>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ display:"flex", alignItems:"center", gap:8, background:`linear-gradient(135deg,${c1},${c2})`, color:"white", border:"none", borderRadius:14, padding:"11px 22px", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 16px ${c1}55`, transition:"all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; }}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1.25rem" }}>
        {Object.entries(EVENT_TYPES).map(([key,val]) => (
          <span key={key} style={{ fontSize:11, fontWeight:700, color:val.color, background:val.light, padding:"4px 10px", borderRadius:20, border:`1px solid ${val.color}30`, display:"flex", alignItems:"center", gap:4 }}>
            {val.icon} {val.label}
          </span>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:20 }}>
        {/* LEFT: Compact Calendar */}
        <div style={{ borderRadius:24, overflow:"hidden", boxShadow:"0 8px 32px rgba(15,23,42,0.12)", flexShrink:0 }}>
          {/* Calendar Header - Colorful gradient */}
          <div style={{ background:`linear-gradient(135deg,${c1},${c2})`, padding:"24px 20px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.1)" }} />
            <div style={{ position:"absolute", bottom:-40, left:-10, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, position:"relative" }}>
              <button onClick={() => changeMonth(-1)}
                style={{ width:32, height:32, borderRadius:10, border:"none", background:"rgba(255,255,255,0.2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white", backdropFilter:"blur(8px)" }}>
                <ChevronLeft size={16} />
              </button>
              <div style={{ textAlign:"center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : `translateY(${animDir * 10}px)`, transition:"all 0.2s" }}>
                <div style={{ fontSize:20, fontWeight:800, color:"white", letterSpacing:"-0.3px" }}>{MONTHS[currentMonth]}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>{currentYear}</div>
              </div>
              <button onClick={() => changeMonth(1)}
                style={{ width:32, height:32, borderRadius:10, border:"none", background:"rgba(255,255,255,0.2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
              {DAYS.map((d,i) => (
                <div key={i} style={{ textAlign:"center", fontSize:11, fontWeight:700, color: i===0||i===6 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.7)", padding:"4px 0" }}>{d}</div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ background:"white", padding:"12px 16px 16px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, opacity: visible ? 1 : 0, transition:"opacity 0.2s" }}>
              {Array.from({ length: totalCells }).map((_,i) => {
                const day = i - firstDay + 1;
                const isValid = day >= 1 && day <= daysInMonth;
                const isToday = isValid && day===today.getDate() && currentMonth===today.getMonth() && currentYear===today.getFullYear();
                const isSun = i%7===0;
                const isSat = i%7===6;
                const dayEvs = isValid ? getEventsForDay(day) : [];
                const hasEvs = dayEvs.length > 0;
                const firstEv = hasEvs ? EVENT_TYPES[dayEvs[0].type] : null;

                return (
                  <div key={i} onClick={() => isValid && handleDayClick(day)}
                    style={{
                      height:40, borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                      cursor: isValid ? "pointer" : "default",
                      background: isToday ? `linear-gradient(135deg,${c1},${c2})` : "transparent",
                      boxShadow: isToday ? `0 4px 12px ${c1}55` : "none",
                      transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                      position:"relative",
                    }}
                    onMouseEnter={e => { if(isValid&&!isToday) { e.currentTarget.style.background="#F1F5F9"; e.currentTarget.style.transform="scale(1.1)"; }}}
                    onMouseLeave={e => { if(isValid&&!isToday) { e.currentTarget.style.background="transparent"; e.currentTarget.style.transform="scale(1)"; }}}>
                    {isValid && (
                      <>
                        <div style={{ fontSize:12, fontWeight: isToday ? 800 : hasEvs ? 700 : 500, color: isToday ? "white" : isSun ? "#EF4444" : isSat ? c1 : "#374151", lineHeight:1 }}>
                          {day}
                        </div>
                        {hasEvs && (
                          <div style={{ display:"flex", gap:2, marginTop:2 }}>
                            {dayEvs.slice(0,3).map((ev,ei) => (
                              <div key={ei} style={{ width:4, height:4, borderRadius:"50%", background: isToday ? "rgba(255,255,255,0.8)" : EVENT_TYPES[ev.type]?.color || "#6366F1" }} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Today info */}
            <div style={{ marginTop:14, padding:"12px 14px", borderRadius:14, background:`linear-gradient(135deg,${c1}15,${c2}10)`, border:`1px solid ${c1}25` }}>
              <div style={{ fontSize:11, fontWeight:700, color:c1, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>Today</div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>
                {today.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Events List */}
        <div style={{ background:"white", borderRadius:24, padding:"24px", boxShadow:"0 4px 24px rgba(15,23,42,0.08)", border:"1px solid rgba(226,232,240,0.8)", overflowY:"auto", maxHeight:560 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", display:"flex", alignItems:"center", gap:8 }}>
              <Sparkles size={16} color={c1} /> Upcoming Events — {MONTHS[currentMonth]}
            </div>
            <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600 }}>{allUpcoming.length} events</div>
          </div>

          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height:72, borderRadius:16, background:"linear-gradient(90deg,#F1F5F9,#E2E8F0,#F1F5F9)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
              ))}
            </div>
          ) : allUpcoming.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", color:"#CBD5E1" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#94A3B8" }}>No upcoming events</div>
              <div style={{ fontSize:12, color:"#CBD5E1", marginTop:4 }}>Add your first event!</div>
            </div>
          ) : allUpcoming.map((ev, i) => {
            const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
            const d = new Date(ev.date);
            const isEventToday = d.getDate()===today.getDate() && d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear();
            return (
              <div key={i}
                style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 16px", borderRadius:16, background: isEventToday ? tc.light : "#F8FAFC", border:`1.5px solid ${isEventToday ? tc.color+"40" : "#F1F5F9"}`, marginBottom:10, transition:"all 0.2s", cursor:"pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background=tc.light; e.currentTarget.style.borderColor=tc.color+"40"; e.currentTarget.style.transform="translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background= isEventToday ? tc.light : "#F8FAFC"; e.currentTarget.style.borderColor= isEventToday ? tc.color+"40" : "#F1F5F9"; e.currentTarget.style.transform="translateX(0)"; }}>
                {/* Date Badge */}
                <div style={{ width:52, height:52, borderRadius:16, background:tc.grad, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 4px 12px ${tc.color}40` }}>
                  <div style={{ fontSize:18, fontWeight:800, color:"white", lineHeight:1 }}>{d.getDate()}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.85)", fontWeight:700, letterSpacing:"0.05em" }}>{MONTHS[d.getMonth()].slice(0,3).toUpperCase()}</div>
                </div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:3 }}>{ev.title}</div>
                  {ev.description && <div style={{ fontSize:11, color:"#94A3B8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.description}</div>}
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:tc.color, background:tc.light, padding:"2px 8px", borderRadius:6 }}>{tc.icon} {tc.label}</span>
                    {isEventToday && <span style={{ fontSize:10, fontWeight:700, color:"white", background:`linear-gradient(135deg,${c1},${c2})`, padding:"2px 8px", borderRadius:6 }}>Today</span>}
                  </div>
                </div>
                {/* Delete */}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(ev._id); }}
                  style={{ width:32, height:32, borderRadius:10, border:"none", background:"rgba(239,68,68,0.08)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,0.18)"}
                  onMouseLeave={e => e.currentTarget.style.background="rgba(239,68,68,0.08)"}>
                  <Trash2 size={13} color="#EF4444" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Modal */}
      {showDayModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.7)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}>
          <div style={{ background:"white", borderRadius:24, padding:"28px", width:"100%", maxWidth:440, boxShadow:"0 32px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{MONTHS[currentMonth]} {selectedDate?.day}, {currentYear}</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{selectedDayEvents.length} event{selectedDayEvents.length!==1?"s":""}</div>
              </div>
              <div onClick={() => setShowDayModal(false)} style={{ cursor:"pointer", color:"#94A3B8", width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16} />
              </div>
            </div>
            {selectedDayEvents.length===0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:"#CBD5E1" }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📅</div>
                <div style={{ fontSize:14, fontWeight:600 }}>No events on this day</div>
              </div>
            ) : selectedDayEvents.map((ev,i) => {
              const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
              return (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px", borderRadius:14, background:tc.light, marginBottom:10, border:`1.5px solid ${tc.color}25` }}>
                  <div style={{ fontSize:24 }}>{tc.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>{ev.title}</div>
                    {ev.description && <div style={{ fontSize:12, color:"#64748B", marginTop:4, lineHeight:1.5 }}>{ev.description}</div>}
                    <div style={{ fontSize:10, fontWeight:700, color:tc.color, marginTop:6, textTransform:"uppercase" }}>{tc.label}</div>
                  </div>
                  <button onClick={() => handleDelete(ev._id)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"rgba(239,68,68,0.1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Trash2 size={12} color="#EF4444" />
                  </button>
                </div>
              );
            })}
            <button onClick={() => { setShowDayModal(false); setShowForm(true); setForm(f => ({...f, date: selectedDate?.dateStr||""})); }}
              style={{ width:"100%", marginTop:14, padding:"12px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${c1},${c2})`, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 12px ${c1}40` }}>
              + Add Event on this day
            </button>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.7)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}>
          <div style={{ background:"white", borderRadius:24, padding:"32px", width:"100%", maxWidth:500, boxShadow:"0 32px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>Add New Event</div>
              <div onClick={() => setShowForm(false)} style={{ cursor:"pointer", width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8" }}>
                <X size={16} />
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>Event Type</label>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {Object.entries(EVENT_TYPES).map(([key,val]) => (
                  <button key={key} onClick={() => setForm({...form, type:key})}
                    style={{ padding:"6px 12px", borderRadius:10, border:`2px solid ${form.type===key ? val.color : "#E2E8F0"}`, background: form.type===key ? val.light : "white", color: form.type===key ? val.color : "#94A3B8", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
                    {val.icon} {val.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>Title *</label>
              <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="Event title..." style={inputStyle} onFocus={e => e.target.style.borderColor=c1} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={2} style={{...inputStyle,resize:"none"}} onFocus={e => e.target.style.borderColor=c1} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>Start Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({...form,endDate:e.target.value})} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>Visible To</label>
              <select value={form.targetRole} onChange={e => setForm({...form,targetRole:e.target.value})} style={{...inputStyle,background:"white"}}>
                <option value="all">Everyone</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
                <option value="parent">Parents Only</option>
              </select>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontSize:13, fontWeight:600, cursor:"pointer", color:"#64748B" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} style={{ flex:2, padding:"12px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${c1},${c2})`, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 12px ${c1}40` }}>
                {saving ? "Saving..." : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

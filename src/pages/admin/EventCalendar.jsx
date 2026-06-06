import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Calendar } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const EVENT_TYPES = {
  holiday: { label: "Holiday", color: "#EF4444", bg: "linear-gradient(135deg,#FEF2F2,#FEE2E2)", dot: "#EF4444" },
  exam:    { label: "Exam",    color: "#F59E0B", bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", dot: "#F59E0B" },
  ptm:     { label: "PTM",     color: "#8B5CF6", bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", dot: "#8B5CF6" },
  event:   { label: "Event",   color: "#6366F1", bg: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", dot: "#6366F1" },
  sports:  { label: "Sports",  color: "#10B981", bg: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", dot: "#10B981" },
  other:   { label: "Other",   color: "#64748B", bg: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", dot: "#64748B" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

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
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState(1);

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

  const navigate = (dir) => {
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      if (dir === -1) {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
      } else {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
      }
      setAnimating(false);
    }, 200);
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month, year) => new Date(year, month, 1).getDay();

  const getEventsForDay = (day) => events.filter(e => {
    const d = new Date(e.date);
    return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const handleDayClick = (day) => {
    const dayEvents = getEventsForDay(day);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setSelectedDate({ day, dateStr });
    setSelectedDayEvents(dayEvents);
    setShowDayModal(true);
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const upcomingEvents = events.filter(e => new Date(e.date) >= today).slice(0, 6);

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border 0.2s" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>Event Calendar</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>{events.length} events this month</div>
        </div>
        <button onClick={() => { setShowForm(true); setForm({ title: "", description: "", date: "", endDate: "", type: "event", targetRole: "all" }); }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", border: "none", borderRadius: 14, padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.4)", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.4)"; }}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {Object.entries(EVENT_TYPES).map(([key, val]) => (
          <span key={key} style={{ fontSize: 11, fontWeight: 700, color: val.color, background: val.bg, padding: "5px 12px", borderRadius: 20, border: `1px solid ${val.color}30`, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: val.color, display: "inline-block" }} />
            {val.label}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Main Calendar */}
        <div style={{ background: "white", borderRadius: 24, padding: "28px", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", border: "1px solid rgba(226,232,240,0.8)" }}>
          {/* Month Nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <button onClick={() => navigate(-1)}
              style={{ width: 40, height: 40, borderRadius: 12, border: "1.5px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#C7D2FE"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#E2E8F0"; }}>
              <ChevronLeft size={18} color="#64748B" />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px", opacity: animating ? 0 : 1, transform: animating ? `translateX(${direction * 20}px)` : "translateX(0)", transition: "all 0.2s" }}>
                {MONTHS[currentMonth]}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>{currentYear}</div>
            </div>
            <button onClick={() => navigate(1)}
              style={{ width: 40, height: 40, borderRadius: 12, border: "1.5px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#C7D2FE"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#E2E8F0"; }}>
              <ChevronRight size={18} color="#64748B" />
            </button>
          </div>

          {/* Day Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8 }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: i === 0 ? "#EF4444" : i === 6 ? "#6366F1" : "#94A3B8", padding: "8px 0", letterSpacing: "0.05em" }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, opacity: animating ? 0 : 1, transition: "opacity 0.2s" }}>
            {Array.from({ length: totalCells }).map((_, i) => {
              const day = i - firstDay + 1;
              const isValid = day >= 1 && day <= daysInMonth;
              const isToday = isValid && day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              const isSunday = i % 7 === 0;
              const isSaturday = i % 7 === 6;
              const dayEvents = isValid ? getEventsForDay(day) : [];
              const hasEvents = dayEvents.length > 0;

              return (
                <div key={i} onClick={() => isValid && handleDayClick(day)}
                  style={{
                    minHeight: 80, borderRadius: 14, padding: "8px 6px",
                    background: isToday ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "transparent",
                    cursor: isValid ? "pointer" : "default",
                    transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    border: isToday ? "none" : isValid ? "1.5px solid transparent" : "none",
                    position: "relative",
                  }}
                  onMouseEnter={e => { if (isValid && !isToday) { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.borderColor = "#C7D2FE"; e.currentTarget.style.transform = "scale(1.04)"; } }}
                  onMouseLeave={e => { if (isValid && !isToday) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.transform = "scale(1)"; } }}>
                  {isValid && (
                    <>
                      <div style={{
                        fontSize: 13, fontWeight: isToday ? 800 : 600,
                        color: isToday ? "white" : isSunday ? "#EF4444" : isSaturday ? "#6366F1" : "#374151",
                        marginBottom: 4, textAlign: "center",
                        width: 26, height: 26, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 4px",
                        background: isToday ? "rgba(255,255,255,0.2)" : "transparent",
                      }}>{day}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {dayEvents.slice(0, 2).map((ev, ei) => {
                          const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
                          return (
                            <div key={ei} style={{
                              fontSize: 9, fontWeight: 700,
                              color: isToday ? "white" : tc.color,
                              background: isToday ? "rgba(255,255,255,0.2)" : tc.bg,
                              borderRadius: 5, padding: "2px 5px",
                              overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                              display: "flex", alignItems: "center", gap: 3,
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: isToday ? "white" : tc.dot, flexShrink: 0 }} />
                              {ev.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div style={{ fontSize: 9, color: isToday ? "rgba(255,255,255,0.8)" : "#6366F1", fontWeight: 700, textAlign: "center" }}>
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                      {hasEvents && !isToday && (
                        <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: EVENT_TYPES[dayEvents[0].type]?.dot || "#6366F1" }} />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Today Card */}
          <div style={{ background: "linear-gradient(135deg,#1E1B4B,#4338CA)", borderRadius: 20, padding: "20px", boxShadow: "0 8px 24px rgba(99,102,241,0.3)" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Today</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: "white", lineHeight: 1 }}>{today.getDate()}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginTop: 4 }}>{MONTHS[today.getMonth()]} {today.getFullYear()}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{DAYS[today.getDay()]}day</div>
          </div>

          {/* Upcoming */}
          <div style={{ background: "white", borderRadius: 20, padding: "20px", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", border: "1px solid rgba(226,232,240,0.8)", flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={15} color="#6366F1" /> Upcoming
            </div>
            {loading ? (
              <div style={{ color: "#94A3B8", fontSize: 13 }}>Loading...</div>
            ) : upcomingEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#CBD5E1" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>No upcoming events</div>
              </div>
            ) : upcomingEvents.map((ev, i) => {
              const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
              const d = new Date(ev.date);
              return (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start", padding: "10px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #F1F5F9", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.borderColor = "#C7D2FE"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#F1F5F9"; }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: tc.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${tc.color}25`, boxShadow: `0 2px 8px ${tc.color}20` }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: tc.color, lineHeight: 1 }}>{d.getDate()}</div>
                    <div style={{ fontSize: 9, color: tc.color, fontWeight: 700 }}>{MONTHS[d.getMonth()].slice(0,3).toUpperCase()}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: tc.color, marginTop: 4, background: tc.bg, display: "inline-block", padding: "2px 8px", borderRadius: 6 }}>{tc.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Modal */}
      {showDayModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div style={{ background: "white", borderRadius: 24, padding: "28px", width: "100%", maxWidth: 460, boxShadow: "0 32px 80px rgba(0,0,0,0.25)", animation: "slideUp 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{selectedDate && `${MONTHS[currentMonth]} ${selectedDate.day}`}</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""}</div>
              </div>
              <div onClick={() => setShowDayModal(false)} style={{ cursor: "pointer", color: "#94A3B8", width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#94A3B8"; }}>
                <X size={16} />
              </div>
            </div>
            {selectedDayEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#CBD5E1" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No events on this day</div>
              </div>
            ) : selectedDayEvents.map((ev, i) => {
              const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px", borderRadius: 14, background: tc.bg, marginBottom: 10, border: `1.5px solid ${tc.color}20`, transition: "all 0.2s" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tc.dot, flexShrink: 0, marginTop: 3 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{ev.title}</div>
                    {ev.description && <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 1.5 }}>{ev.description}</div>}
                    <div style={{ fontSize: 10, fontWeight: 700, color: tc.color, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tc.label}</div>
                  </div>
                  <button onClick={() => handleDelete(ev._id)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}>
                    <Trash2 size={12} color="#EF4444" />
                  </button>
                </div>
              );
            })}
            <button onClick={() => { setShowDayModal(false); setShowForm(true); setForm(f => ({ ...f, date: selectedDate?.dateStr || "" })); }}
              style={{ width: "100%", marginTop: 14, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              + Add Event on this day
            </button>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: "100%", maxWidth: 500, boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Add New Event</div>
              <div onClick={() => setShowForm(false)} style={{ cursor: "pointer", color: "#94A3B8", width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </div>
            </div>

            {/* Event Type Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Event Type</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(EVENT_TYPES).map(([key, val]) => (
                  <button key={key} onClick={() => setForm({...form, type: key})}
                    style={{ padding: "6px 12px", borderRadius: 10, border: `2px solid ${form.type === key ? val.color : "#E2E8F0"}`, background: form.type === key ? val.bg : "white", color: form.type === key ? val.color : "#94A3B8", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Event title..."
                style={inputStyle} onFocus={e => e.target.style.borderColor = "#6366F1"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                style={{ ...inputStyle, resize: "none" }} onFocus={e => e.target.style.borderColor = "#6366F1"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Start Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Visible To</label>
              <select value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})} style={{ ...inputStyle, background: "white" }}>
                <option value="all">Everyone</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
                <option value="parent">Parents Only</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748B" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
                {saving ? "Saving..." : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const EVENT_TYPES = {
  holiday: { label: "Holiday",  color: "#EF4444", bg: "#FEF2F2" },
  exam:    { label: "Exam",     color: "#F59E0B", bg: "#FFFBEB" },
  ptm:     { label: "PTM",      color: "#8B5CF6", bg: "#F5F3FF" },
  event:   { label: "Event",    color: "#6366F1", bg: "#EEF2FF" },
  sports:  { label: "Sports",   color: "#10B981", bg: "#F0FDF4" },
  other:   { label: "Other",    color: "#64748B", bg: "#F8FAFC" },
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

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month, year) => new Date(year, month, 1).getDay();

  const getEventsForDay = (day) => {
    return events.filter(e => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  };

  const handleDayClick = (day) => {
    const dayEvents = getEventsForDay(day);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate({ day, dateStr });
    setSelectedDayEvents(dayEvents);
    setShowDayModal(true);
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const upcomingEvents = events.filter(e => new Date(e.date) >= today).slice(0, 8);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>Event Calendar</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>{events.length} events this month</div>
        </div>
        <button onClick={() => { setShowForm(true); setForm({ title: "", description: "", date: "", endDate: "", type: "event", targetRole: "all" }); }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Event Type Legend */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {Object.entries(EVENT_TYPES).map(([key, val]) => (
          <span key={key} style={{ fontSize: 11, fontWeight: 700, color: val.color, background: val.bg, padding: "4px 10px", borderRadius: 20, border: `1px solid ${val.color}22` }}>
            ● {val.label}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Calendar */}
        <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "0 2px 16px rgba(15,23,42,0.06)", border: "1px solid rgba(226,232,240,0.8)" }}>
          {/* Month Nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={16} color="#64748B" />
            </button>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{MONTHS[currentMonth]} {currentYear}</div>
            <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={16} color="#64748B" />
            </button>
          </div>

          {/* Day Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94A3B8", padding: "6px 0" }}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {Array.from({ length: totalCells }).map((_, i) => {
              const day = i - firstDay + 1;
              const isValid = day >= 1 && day <= daysInMonth;
              const isToday = isValid && day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              const dayEvents = isValid ? getEventsForDay(day) : [];

              return (
                <div key={i} onClick={() => isValid && handleDayClick(day)}
                  style={{ minHeight: 70, borderRadius: 10, padding: "6px", background: isToday ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : isValid ? "#F8FAFC" : "transparent",
                    border: isToday ? "none" : isValid ? "1px solid #F1F5F9" : "none",
                    cursor: isValid ? "pointer" : "default", transition: "all 0.15s",
                    boxShadow: isToday ? "0 4px 12px rgba(99,102,241,0.3)" : "none" }}
                  onMouseEnter={e => { if (isValid && !isToday) e.currentTarget.style.background = "#EEF2FF"; }}
                  onMouseLeave={e => { if (isValid && !isToday) e.currentTarget.style.background = "#F8FAFC"; }}>
                  {isValid && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? "white" : "#374151", marginBottom: 4 }}>{day}</div>
                      {dayEvents.slice(0, 2).map((ev, ei) => {
                        const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
                        return (
                          <div key={ei} style={{ fontSize: 9, fontWeight: 700, color: isToday ? "white" : tc.color, background: isToday ? "rgba(255,255,255,0.2)" : tc.bg, borderRadius: 4, padding: "2px 4px", marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && <div style={{ fontSize: 9, color: isToday ? "rgba(255,255,255,0.7)" : "#94A3B8", fontWeight: 600 }}>+{dayEvents.length - 2} more</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div style={{ background: "white", borderRadius: 20, padding: "20px", boxShadow: "0 2px 16px rgba(15,23,42,0.06)", border: "1px solid rgba(226,232,240,0.8)", height: "fit-content" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>Upcoming Events</div>
          {loading ? <div style={{ color: "#94A3B8", fontSize: 13 }}>Loading...</div>
            : upcomingEvents.length === 0 ? <div style={{ color: "#CBD5E1", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No upcoming events</div>
            : upcomingEvents.map((ev, i) => {
              const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
              const d = new Date(ev.date);
              return (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: tc.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${tc.color}22` }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: tc.color, lineHeight: 1 }}>{d.getDate()}</div>
                    <div style={{ fontSize: 9, color: tc.color, fontWeight: 600 }}>{MONTHS[d.getMonth()].slice(0, 3)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: tc.color, fontWeight: 700, marginTop: 3, background: tc.bg, display: "inline-block", padding: "2px 6px", borderRadius: 4 }}>{tc.label}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Day Events Modal */}
      {showDayModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 24, padding: "28px", width: "100%", maxWidth: 460, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                {selectedDate && `${MONTHS[currentMonth]} ${selectedDate.day}, ${currentYear}`}
              </div>
              <div onClick={() => setShowDayModal(false)} style={{ cursor: "pointer", color: "#94A3B8" }}><X size={20} /></div>
            </div>
            {selectedDayEvents.length === 0
              ? <div style={{ textAlign: "center", padding: "20px 0", color: "#CBD5E1" }}>No events on this day</div>
              : selectedDayEvents.map((ev, i) => {
                const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px", borderRadius: 12, background: tc.bg, marginBottom: 10, border: `1px solid ${tc.color}22` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{ev.title}</div>
                      {ev.description && <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{ev.description}</div>}
                      <div style={{ fontSize: 10, fontWeight: 700, color: tc.color, marginTop: 6, textTransform: "uppercase" }}>{tc.label}</div>
                    </div>
                    <button onClick={() => handleDelete(ev._id)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={12} color="#EF4444" />
                    </button>
                  </div>
                );
              })}
            <button onClick={() => { setShowDayModal(false); setShowForm(true); setForm(f => ({ ...f, date: selectedDate?.dateStr || "" })); }}
              style={{ width: "100%", marginTop: 12, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Add Event on this day
            </button>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Add Event</div>
              <div onClick={() => setShowForm(false)} style={{ cursor: "pointer", color: "#94A3B8" }}><X size={20} /></div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Event Title *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Annual Sports Day"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Start Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Event Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", background: "white" }}>
                  {Object.entries(EVENT_TYPES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Visible To</label>
                <select value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", background: "white" }}>
                  <option value="all">Everyone</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="parent">Parents</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748B" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving..." : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

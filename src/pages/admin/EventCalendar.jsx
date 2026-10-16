import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";

import Glyph from "../../components/Glyph";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { toast, errorMessage, confirmAction } from "../../utils/toast";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";

const FIELDS = { title: "event-title", date: "event-start" };
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Event types are categories: the six fixed category colours (--ea-cat-*).
const EVENT_TYPES = {
  holiday: { label: "Holiday", color: "var(--ea-cat-4)", light: "var(--ea-cat-4-bg)", grad: "var(--ea-cat-4)", icon: <Glyph e="🏖" /> },
  exam:    { label: "Exam",    color: "var(--ea-cat-3)", light: "var(--ea-cat-3-bg)", grad: "var(--ea-cat-3)", icon: <Glyph e="📝" /> },
  ptm:     { label: "PTM",     color: "var(--ea-cat-2)", light: "var(--ea-cat-2-bg)", grad: "var(--ea-cat-2)", icon: <Glyph e="👨‍👩‍👧" /> },
  event:   { label: "Event",   color: "var(--ea-cat-1)", light: "var(--ea-cat-1-bg)", grad: "var(--ea-cat-1)", icon: "" },
  sports:  { label: "Sports",  color: "var(--ea-cat-5)", light: "var(--ea-cat-5-bg)", grad: "var(--ea-cat-5)", icon: <Glyph e="🏆" /> },
  other:   { label: "Other",   color: "var(--ea-cat-6)", light: "var(--ea-cat-6-bg)", grad: "var(--ea-cat-6)", icon: <Glyph e="📌" /> },
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
  const v = useFieldErrors(FIELDS);
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
    // Saving with a missing field used to do nothing at all; now each missing field says so.
    if (!v.check({ title: !form.title.trim() && "Enter the event title", date: !form.date && "Choose the start date" })) return;
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
    const title = events.find((e) => e._id === id)?.title;
    if (!(await confirmAction(`Delete ${title ? `"${title}"` : "this event"} from the school calendar?`, { confirmLabel: "Delete event" }))) return;
    try {
      await axios.delete(`${API}/events/${id}`, authHeader());
      toast.success("Event deleted");
      fetchEvents();
      setSelectedDayEvents(prev => prev.filter(e => e._id !== id));
    } catch (e) { toast.error(errorMessage(e, "Could not delete the event")); }
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

  // The calendar header and today's date use the school's brand colour (it used to change colour every month).

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom:"1.25rem" }}>
        <PageHeader title="Event Calendar" subtitle={`${events.length} events this month`}
          actions={<button type="button" className="ea-btn ea-btn--primary" onClick={() => setShowForm(true)}><Plus size={16} aria-hidden="true" /> Add Event</button>} />
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1.25rem" }}>
        {Object.entries(EVENT_TYPES).map(([key,val]) => (
          <span key={key} style={{ fontSize:11, fontWeight:700, color:val.color, background:val.light, padding:"4px 10px", borderRadius:20, border:`1px solid color-mix(in srgb, ${val.color} 19%, transparent)`, display:"flex", alignItems:"center", gap:4 }}>
            {val.icon} {val.label}
          </span>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:20 }}>
        {/* LEFT: Compact Calendar */}
        <div style={{ borderRadius:16, overflow:"hidden", boxShadow:"var(--ea-shadow)", border:"1px solid var(--ea-line)", background:"var(--ea-surface)", flexShrink:0 }}>
          {/* Calendar header: month, year and the month arrows on the card */}
          <div style={{ background:"var(--ea-surface)", padding:"18px 16px 8px", borderBottom:"1px solid var(--ea-line)", position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, position:"relative" }}>
              <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}
                style={{ width:32, height:32, borderRadius:10, border:"1px solid var(--ea-line)", background:"var(--ea-surface)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ea-ink)" }}>
                <ChevronLeft size={16} />
              </button>
              <div style={{ textAlign:"center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : `translateY(${animDir * 10}px)`, transition:"all 0.2s" }}>
                <div style={{ fontSize:18, fontWeight:750, color:"var(--ea-ink)", letterSpacing:"-0.2px" }}>{MONTHS[currentMonth]}</div>
                <div style={{ fontSize:12, color:"var(--ea-muted)", fontWeight:600 }}>{currentYear}</div>
              </div>
              <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}
                style={{ width:32, height:32, borderRadius:10, border:"1px solid var(--ea-line)", background:"var(--ea-surface)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ea-ink)" }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
              {DAYS.map((d,i) => (
                <div key={i} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"var(--ea-muted)", padding:"4px 0" }}>{d}</div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ background:"var(--ea-surface)", padding:"12px 16px 16px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, opacity: visible ? 1 : 0, transition:"opacity 0.2s" }}>
              {Array.from({ length: totalCells }).map((_,i) => {
                const day = i - firstDay + 1;
                const isValid = day >= 1 && day <= daysInMonth;
                const isToday = isValid && day===today.getDate() && currentMonth===today.getMonth() && currentYear===today.getFullYear();
                const isSun = i%7===0;
                const dayEvs = isValid ? getEventsForDay(day) : [];
                const hasEvs = dayEvs.length > 0;
                const firstEv = hasEvs ? EVENT_TYPES[dayEvs[0].type] : null;

                return (
                  <div key={i} onClick={() => isValid && handleDayClick(day)}
                    style={{
                      height:40, borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                      cursor: isValid ? "pointer" : "default",
                      background: isToday ? "var(--brand)" : "transparent",
                      transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                      position:"relative",
                    }}
                    onMouseEnter={e => { if(isValid&&!isToday) { e.currentTarget.style.background="#F1F5F9"; e.currentTarget.style.transform="scale(1.1)"; }}}
                    onMouseLeave={e => { if(isValid&&!isToday) { e.currentTarget.style.background="transparent"; e.currentTarget.style.transform="scale(1)"; }}}>
                    {isValid && (
                      <>
                        <div style={{ fontSize:12, fontWeight: isToday ? 800 : hasEvs ? 700 : 500, color: isToday ? "white" : isSun ? "var(--ea-danger)" : "var(--ea-ink)", lineHeight:1 }}>
                          {day}
                        </div>
                        {hasEvs && (
                          <div style={{ display:"flex", gap:2, marginTop:2 }}>
                            {dayEvs.slice(0,3).map((ev,ei) => (
                              <div key={ei} style={{ width:4, height:4, borderRadius:"50%", background: isToday ? "rgba(255,255,255,0.8)" : EVENT_TYPES[ev.type]?.color || "var(--brand)" }} />
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
            <div style={{ marginTop:14, padding:"12px 14px", borderRadius:12, background:"var(--brand-soft)", border:"1px solid var(--brand-border)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--brand-dark)", marginBottom:2 }}>Today</div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0F172A" }}>
                {today.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Events List */}
        <div style={{ background:"var(--ea-surface)", borderRadius:16, padding:"20px", boxShadow:"var(--ea-shadow)", border:"1px solid var(--ea-line)", overflowY:"auto", maxHeight:560 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", display:"flex", alignItems:"center", gap:8 }}>
              Upcoming events in {MONTHS[currentMonth]}
            </div>
            <div style={{ fontSize:12, color:"var(--ea-muted)", fontWeight:600 }}>{allUpcoming.length} events</div>
          </div>

          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height:72, borderRadius:16, background:"linear-gradient(90deg,#F1F5F9,#E2E8F0,#F1F5F9)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
              ))}
            </div>
          ) : allUpcoming.length === 0 ? (
            <EmptyState plain icon={CalendarDays} title="No upcoming events" text="Holidays, exams, PTMs and events you add for this month appear here." />
          ) : allUpcoming.map((ev, i) => {
            const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
            const d = new Date(ev.date);
            const isEventToday = d.getDate()===today.getDate() && d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear();
            return (
              <div key={i}
                style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 16px", borderRadius:16, background: isEventToday ? tc.light : "#F8FAFC", border:`1.5px solid ${isEventToday ? `color-mix(in srgb, ${tc.color} 25%, transparent)` : "#F1F5F9"}`, marginBottom:10, transition:"all 0.2s", cursor:"pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background=tc.light; e.currentTarget.style.borderColor=`color-mix(in srgb, ${tc.color} 25%, transparent)`; e.currentTarget.style.transform="translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background= isEventToday ? tc.light : "#F8FAFC"; e.currentTarget.style.borderColor= isEventToday ? `color-mix(in srgb, ${tc.color} 25%, transparent)` : "#F1F5F9"; e.currentTarget.style.transform="translateX(0)"; }}>
                {/* Date Badge */}
                <div style={{ width:52, height:52, borderRadius:16, background:tc.grad, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 4px 12px color-mix(in srgb, ${tc.color} 25%, transparent)` }}>
                  <div style={{ fontSize:18, fontWeight:800, color:"white", lineHeight:1 }}>{d.getDate()}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.85)", fontWeight:700, letterSpacing:"0.05em" }}>{MONTHS[d.getMonth()].slice(0,3).toUpperCase()}</div>
                </div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:3 }}>{ev.title}</div>
                  {ev.description && <div style={{ fontSize:11, color:"var(--ea-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.description}</div>}
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:tc.color, background:tc.light, padding:"2px 8px", borderRadius:6 }}>{tc.icon} {tc.label}</span>
                    {isEventToday && <span className="ea-badge ea-badge--brand">Today</span>}
                  </div>
                </div>
                {/* Delete */}
                <button type="button" aria-label={`Delete ${ev.title}`} title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(ev._id); }}
                  style={{ width:32, height:32, borderRadius:10, border:"none", background:"rgba(239,68,68,0.08)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,0.18)"}
                  onMouseLeave={e => e.currentTarget.style.background="rgba(239,68,68,0.08)"}>
                  <Trash2 size={13} color="var(--ea-on-card-danger)" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Modal */}
      <Modal show={showDayModal} onClose={() => setShowDayModal(false)} width={440}
        title={`${MONTHS[currentMonth]} ${selectedDate?.day}, ${currentYear}`}>
            <div style={{ fontSize:12, color:"var(--ea-muted)", margin:"-12px 0 16px" }}>{selectedDayEvents.length} event{selectedDayEvents.length!==1?"s":""}</div>
            {selectedDayEvents.length===0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--ea-faint)" }}>
                <div style={{ fontSize:36, marginBottom:8 }}><Glyph e="📅" /></div>
                <div style={{ fontSize:14, fontWeight:600 }}>No events on this day</div>
              </div>
            ) : selectedDayEvents.map((ev,i) => {
              const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
              return (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px", borderRadius:14, background:tc.light, marginBottom:10, border:`1.5px solid color-mix(in srgb, ${tc.color} 15%, transparent)` }}>
                  <div style={{ fontSize:24 }}>{tc.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>{ev.title}</div>
                    {ev.description && <div style={{ fontSize:12, color:"#56657A", marginTop:4, lineHeight:1.5 }}>{ev.description}</div>}
                    <div style={{ fontSize:10, fontWeight:700, color:tc.color, marginTop:6, textTransform:"uppercase" }}>{tc.label}</div>
                  </div>
                  <button type="button" aria-label={`Delete ${ev.title}`} onClick={() => handleDelete(ev._id)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"rgba(239,68,68,0.1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Trash2 size={12} color="var(--ea-on-card-danger)" />
                  </button>
                </div>
              );
            })}
            <button onClick={() => { setShowDayModal(false); setShowForm(true); setForm(f => ({...f, date: selectedDate?.dateStr||""})); }}
              className="ea-btn ea-btn--primary" style={{ width:"100%", marginTop:14 }}>
              + Add Event on this day
            </button>
      </Modal>

      {/* Add Form Modal */}
      <Modal show={showForm} onClose={() => { setShowForm(false); v.setErrors({}); }} width={500} title="Add New Event">

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>Event Type</label>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {Object.entries(EVENT_TYPES).map(([key,val]) => (
                  <button key={key} onClick={() => setForm({...form, type:key})}
                    style={{ padding:"6px 12px", borderRadius:10, border:`2px solid ${form.type===key ? val.color : "#E2E8F0"}`, background: form.type===key ? val.light : "white", color: form.type===key ? val.color : "var(--ea-muted)", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
                    {val.icon} {val.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label htmlFor="event-title" style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>Title *</label>
              <input id="event-title" value={form.title} onChange={e => { setForm({...form,title:e.target.value}); v.clear("title"); }} placeholder="Event title..." style={inputStyle} onFocus={e => e.target.style.borderColor="var(--brand)"} onBlur={e => e.target.style.borderColor="#E2E8F0"} {...v.invalid("title")} />
              <FieldError id={v.errorId("title")}>{v.errors.title}</FieldError>
            </div>

            <div style={{ marginBottom:14 }}>
              <label htmlFor="event-description" style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>Description</label>
              <textarea id="event-description" value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={2} style={{...inputStyle,resize:"none"}} onFocus={e => e.target.style.borderColor="var(--brand)"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label htmlFor="event-start" style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>Start Date *</label>
                <input id="event-start" type="date" value={form.date} onChange={e => { setForm({...form,date:e.target.value}); v.clear("date"); }} style={inputStyle} {...v.invalid("date")} />
                <FieldError id={v.errorId("date")}>{v.errors.date}</FieldError>
              </div>
              <div>
                <label htmlFor="event-end" style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>End Date</label>
                <input id="event-end" type="date" value={form.endDate} onChange={e => setForm({...form,endDate:e.target.value})} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label htmlFor="event-audience" style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>Visible To</label>
              <select id="event-audience" value={form.targetRole} onChange={e => setForm({...form,targetRole:e.target.value})} style={{...inputStyle,background:"white"}}>
                <option value="all">Everyone</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
                <option value="parent">Parents Only</option>
              </select>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button type="button" onClick={() => { setShowForm(false); v.setErrors({}); }} className="ea-btn ea-btn--ghost" style={{ flex:1 }}>Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={saving} className="ea-btn ea-btn--primary" style={{ flex:2 }}>
                {saving ? "Saving..." : "Add Event"}
              </button>
            </div>
      </Modal>
    </div>
  );
}

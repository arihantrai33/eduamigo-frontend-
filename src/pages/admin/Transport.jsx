import { useState, useEffect } from "react";
import axios from "axios";
import { toast, confirmAction, errorMessage } from "../../utils/toast";
import EmptyState from "../../components/ui/EmptyState";

import { Bus, Plus } from "lucide-react";
import Glyph from "../../components/Glyph";
import Dialog from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";

// Checked fields of the bus form; each input's id is "bus-<key>".
const FIELDS = Object.fromEntries(["busNumber", "driverName", "driverPhone", "routeName"].map((k) => [k, `bus-${k}`]));
const STOP_FIELDS = { name: "stop-name", latitude: "stop-latitude", longitude: "stop-longitude" };
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
import Skeleton from "../../components/ui/Skeleton";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const STATUS_CONFIG = {
  "On Route":  { bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0", dot:"#22C55E" },
  "Idle":      { bg:"#F8FAFC", color:"#56657A", border:"#E2E8F0", dot:"#94A3B8" },
  "Completed": { bg:"#F1F5F9", color:"#475569", border:"#E2E8F0", dot:"#94A3B8" },
};

const Modal = (props) => <Dialog width={560} {...props} />;

export default function Transport() {
  const [buses, setBuses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedBus, setExpandedBus] = useState(null);

  const [form, setForm] = useState({ busNumber:"", driverName:"", driverPhone:"", routeName:"", capacity:40, serviceArea:"" });
  const fe = useFieldErrors(FIELDS);
  const [stops, setStops] = useState([]);
  const [newStop, setNewStop] = useState({ name:"", latitude:"", longitude:"", estimatedTime:"", order:1 });
  const stopErrors = useFieldErrors(STOP_FIELDS);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.allSettled([
        axios.get(`${API}/transport`, auth()),
        axios.get(`${API}/transport/students`, auth()),
      ]);
      setBuses(bRes.status === "fulfilled" ? (bRes.value.data.data || []) : []);
      setAllStudents(sRes.status === "fulfilled" ? (sRes.value.data.data || []) : []);
    } catch(e) {}
    setLoading(false);
  };

  const handleAddBus = async () => {
    if (!fe.check({
      busNumber: !String(form.busNumber || "").trim() && "Enter the bus number",
      driverName: !String(form.driverName || "").trim() && "Enter the driver's name",
      driverPhone: !String(form.driverPhone || "").trim() && "Enter the driver's phone number",
      routeName: !String(form.routeName || "").trim() && "Enter the route name",
    })) return;
    setSaving(true);
    try {
      await axios.post(`${API}/transport`, form, auth());
      setShowAddModal(false);
      setForm({ busNumber:"", driverName:"", driverPhone:"", routeName:"", capacity:40, serviceArea:"" });
      fetchAll();
    } catch(e) { toast.error(errorMessage(e, "Could not add the bus")); }
    setSaving(false);
  };

  const handleDeleteBus = async (id) => {
    if (!(await confirmAction("Delete this bus?"))) return;
    try { await axios.delete(`${API}/transport/${id}`, auth()); fetchAll(); }
    catch(e) { toast.error(errorMessage(e, "Could not delete the bus")); }
  };

  const openStops = (bus) => {
    setSelectedBus(bus);
    setStops(bus.stops || []);
    setNewStop({ name:"", latitude:"", longitude:"", estimatedTime:"", order:(bus.stops?.length||0)+1 });
    setShowStopsModal(true);
  };

  const handleAddStop = async () => {
    if (!stopErrors.check({
      name: !String(newStop.name || "").trim() && "Enter the stop name",
      latitude: newStop.latitude === "" && "Enter the latitude",
      longitude: newStop.longitude === "" && "Enter the longitude",
    })) return;
    const updated = [...stops, { ...newStop, latitude: Number(newStop.latitude), longitude: Number(newStop.longitude), order: stops.length+1 }];
    try {
      await axios.put(`${API}/transport/${selectedBus._id}/stops`, { stops: updated }, auth());
      fetchAll();
      setStops(updated);
      setNewStop({ name:"", latitude:"", longitude:"", estimatedTime:"", order:updated.length+1 });
    } catch(e) { toast.error(errorMessage(e, "Could not save the stop")); }
  };

  const openStudents = (bus) => {
    setSelectedBus(bus);
    setSelectedStudents((bus.assignedStudents||[]).map(s => s._id || s));
    setShowStudentsModal(true);
  };

  const handleAssignStudents = async () => {
    try {
      await axios.put(`${API}/transport/${selectedBus._id}/assign-students`, { studentIds: selectedStudents }, auth());
      setShowStudentsModal(false);
      fetchAll();
    } catch(e) { toast.error(errorMessage(e, "Could not assign the students")); }
  };

  const toggleStudent = (id) => setSelectedStudents(p => p.includes(id) ? p.filter(s=>s!==id) : [...p,id]);
  const f = (k,v) => { setForm(p=>({...p,[k]:v})); fe.clear(k); };

  const totalStudents = buses.reduce((a,b) => a + (b.assignedStudents?.length||0), 0);
  const onRoute = buses.filter(b => b.busStatus === "On Route").length;


  return (
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .bus-card:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(0,0,0,0.12) !important; }
        .bus-card { transition: all 0.25s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Transport" subtitle="Manage school buses, routes and students"
          actions={<button type="button" className="ea-btn ea-btn--primary" onClick={() => setShowAddModal(true)}><Plus size={16} aria-hidden="true" /> New Bus</button>} />
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom:24 }}>
        <StatGrid>
          {[
            { label:"TOTAL BUSES",      value: buses.length,   icon:<Glyph e="🚌" />, border:"var(--brand)" },
            { label:"ON ROUTE",         value: onRoute,        icon:<Glyph e="🗺" />, border:"#10B981" },
            { label:"IDLE",             value: buses.filter(b=>b.busStatus==="Idle").length, icon:<Glyph e="⏸" />, border:"neutral" },
            { label:"STUDENTS ASSIGNED",value: totalStudents,  icon:<Glyph e="👥" />, border:"var(--brand)" },
          ].map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={toneOf(card.border)} />)}
        </StatGrid>
      </div>

      {/* Bus Cards */}
      {loading ? (
        <div style={{ padding:"60px 0", textAlign:"center" }}>
          <Skeleton rows={4} label="Loading buses" />
        </div>
      ) : buses.length === 0 ? (
        <EmptyState icon={Bus} title="No buses added yet" text="Add your first bus to get started." />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {buses.map((bus, i) => {
            const scfg = STATUS_CONFIG[bus.busStatus] || STATUS_CONFIG.Idle;
            const isExpanded = expandedBus === bus._id;
            return (
              <div key={bus._id} className="bus-card"
                style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", overflow:"hidden", animation:`fadeUp 0.4s ease ${i*0.1}s both` }}>
                {/* Bus Header */}
                <div className="ea-row-wrap" style={{ padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
                  {/* Bus Icon */}
                  <div style={{ width:56, height:56, borderRadius:16, background:"var(--brand-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
                    <Glyph e="🚌" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:"6px 10px", marginBottom:4 }}>
                      <span style={{ fontSize:17, fontWeight:800, color:"#0F172A" }}>{bus.busNumber}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:scfg.bg, color:scfg.color, border:`1px solid ${scfg.border}`, display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:scfg.dot }} />{bus.busStatus}
                      </span>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 16px", fontSize:12, color:"#56657A", fontWeight:500 }}>
                      <span><Glyph e="👤" /> {bus.driverName}</span>
                      <span><Glyph e="📞" /> {bus.driverPhone}</span>
                      <span><Glyph e="🗺" /> {bus.routeName}</span>
                      <span><Glyph e="📍" /> {bus.stops?.length||0} stops</span>
                      <span><Glyph e="👦" /> {bus.assignedStudents?.length||0} students</span>
                    </div>
                  </div>
                  <div className="ea-row-wrap__end" style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <button type="button" className="ea-btn ea-btn--ghost ea-btn--sm" onClick={() => openStops(bus)}>
                      <Glyph e="📍" /> Stops ({bus.stops?.length||0})
                    </button>
                    <button type="button" className="ea-btn ea-btn--ghost ea-btn--sm" onClick={() => openStudents(bus)}>
                      <Glyph e="👦" /> Students ({bus.assignedStudents?.length||0})
                    </button>
                    <button type="button" className="ea-btn ea-btn--ghost ea-btn--sm ea-btn--icon" onClick={() => setExpandedBus(isExpanded ? null : bus._id)} aria-expanded={isExpanded} aria-label={isExpanded ? "Hide bus details" : "Show bus details"}>
                      {isExpanded ? "▲" : "▼"}
                    </button>
                    <button type="button" className="ea-btn ea-btn--danger-ghost ea-btn--sm ea-btn--icon" onClick={() => handleDeleteBus(bus._id)} aria-label={`Delete bus ${bus.busNumber}`} title="Delete">
                      <Glyph e="🗑" />
                    </button>
                  </div>
                </div>

                {/* Driver Token */}
                <div style={{ margin:"0 24px 16px", padding:"8px 8px 8px 14px", background:"var(--ea-hover)", borderRadius:10, border:"1px solid var(--ea-line)", display:"flex", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--ea-muted)" }}>Driver token</span>
                  <code style={{ fontSize:13, fontWeight:700, color:"var(--ea-ink)", letterSpacing:"0.5px", fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", flex:"1 1 auto", minWidth:0, overflowWrap:"anywhere" }}>{bus.driverToken}</code>
                  <button type="button" className="ea-btn ea-btn--ghost ea-btn--sm" aria-label={`Copy driver token for bus ${bus.busNumber}`}
                    onClick={() => navigator.clipboard?.writeText(bus.driverToken).then(() => toast.success("Driver token copied"), () => toast.error("Could not copy the token"))}>
                    Copy
                  </button>
                </div>

                {/* Expanded — Stops */}
                {isExpanded && bus.stops?.length > 0 && (
                  <div style={{ margin:"0 24px 20px", padding:"16px", background:"#F8FAFC", borderRadius:14, border:"1px solid #E2E8F0" }}>
                    <div style={{ fontSize:12, fontWeight:800, color:"#56657A", marginBottom:12, letterSpacing:"0.06em" }}>ROUTE STOPS</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {bus.stops.sort((a,b)=>a.order-b.order).map((stop, si) => (
                        <div key={si} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--brand-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"var(--brand-dark)", flexShrink:0 }}>{si+1}</div>
                          <div style={{ flex:1 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{stop.name}</span>
                            {stop.estimatedTime && <span style={{ fontSize:11, color:"var(--ea-muted)", marginLeft:8 }}><Glyph e="⏱" /> {stop.estimatedTime}</span>}
                          </div>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background: stop.status==="Live"?"#F0FDF4":stop.status==="Departed"?"var(--brand-soft)":"#F1F5F9", color: stop.status==="Live"?"#15803D":stop.status==="Departed"?"var(--brand)":"var(--ea-muted)", fontWeight:700 }}>{stop.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Bus Modal */}
      <Modal show={showAddModal} onClose={() => { setShowAddModal(false); fe.setErrors({}); }} title="Add New Bus">
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["BUS NUMBER","busNumber","text"],["DRIVER NAME","driverName","text"],["DRIVER PHONE","driverPhone","tel"],["ROUTE NAME","routeName","text"],["CAPACITY","capacity","number"],["SERVICE AREA","serviceArea","text"]].map(([label,key,type]) => (
              <label key={key} style={{ display:"block" }}>
                <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>{label}</span>
                <input id={`bus-${key}`} type={type} value={form[key]||""} onChange={e => f(key,e.target.value)} {...fe.invalid(key)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                  onFocus={e=>e.target.style.borderColor="#F59E0B"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                <FieldError id={`bus-${key}-error`}>{fe.errors[key]}</FieldError>
              </label>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="button" className="ea-btn ea-btn--primary" onClick={handleAddBus} disabled={saving}>
              {saving ? "Adding..." : "Add Bus"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stops Modal */}
      <Modal show={showStopsModal} onClose={() => { setShowStopsModal(false); stopErrors.setErrors({}); }} title={`Stops — ${selectedBus?.busNumber}`}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {stops.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:180, overflowY:"auto", marginBottom:4 }}>
              {stops.sort((a,b)=>a.order-b.order).map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#F8FAFC", borderRadius:10 }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:"#F59E0B", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"white" }}>{i+1}</div>
                  <span style={{ fontSize:13, fontWeight:600, color:"#0F172A", flex:1 }}>{s.name}</span>
                  {s.estimatedTime && <span style={{ fontSize:11, color:"var(--ea-muted)" }}><Glyph e="⏱" /> {s.estimatedTime}</span>}
                </div>
              ))}
            </div>
          )}
          <div style={{ borderTop:"1px solid #E2E8F0", paddingTop:14 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"var(--ea-muted)", marginBottom:10 }}>ADD NEW STOP</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["STOP NAME","name","text"],["EST. TIME","estimatedTime","text"],["LATITUDE","latitude","number"],["LONGITUDE","longitude","number"]].map(([label,key,type]) => (
                <label key={key} style={{ display:"block" }}>
                  <span style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--ea-muted)", marginBottom:4 }}>{label}</span>
                  <input id={`stop-${key}`} type={type} value={newStop[key]||""} onChange={e => { setNewStop(p=>({...p,[key]:e.target.value})); stopErrors.clear(key); }} {...stopErrors.invalid(key)}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
                  <FieldError id={`stop-${key}-error`}>{stopErrors.errors[key]}</FieldError>
                </label>
              ))}
            </div>
            <button type="button" className="ea-btn ea-btn--primary" onClick={handleAddStop} style={{ marginTop:12, width:"100%" }}>
              + Add Stop
            </button>
          </div>
        </div>
      </Modal>

      {/* Students Modal */}
      <Modal show={showStudentsModal} onClose={() => setShowStudentsModal(false)} title={`Assign Students — ${selectedBus?.busNumber}`}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:12, color:"var(--ea-muted)", fontWeight:600 }}>{selectedStudents.length} students selected</div>
          <div style={{ maxHeight:320, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
            {allStudents.map(s => (
              <label key={s._id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background: selectedStudents.includes(s._id) ? "#FFFBEB" : "#F8FAFC", cursor:"pointer", border:`1px solid ${selectedStudents.includes(s._id)?"#FDE68A":"#E2E8F0"}` }}>
                <input type="checkbox" checked={selectedStudents.includes(s._id)} onChange={() => toggleStudent(s._id)} style={{ accentColor:"#F59E0B", width:16, height:16 }} />
                <span style={{ fontSize:13, fontWeight:600, color:"#0F172A", flex:1 }}>{s.name}</span>
                <span style={{ fontSize:11, color:"var(--ea-on-card-warning)", fontWeight:700 }}>Class {s.class}{s.section?`-${s.section}`:""}</span>
              </label>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setShowStudentsModal(false)}>Cancel</button>
            <button type="button" className="ea-btn ea-btn--primary" onClick={handleAssignStudents}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

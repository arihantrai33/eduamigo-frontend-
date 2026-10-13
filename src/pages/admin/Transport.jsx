import { useState, useEffect } from "react";
import axios from "axios";
import { toast, confirmAction } from "../../utils/toast";

import { Plus } from "lucide-react";
import Glyph from "../../components/Glyph";
import Dialog from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const STATUS_CONFIG = {
  "On Route":  { bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0", dot:"#22C55E" },
  "Idle":      { bg:"#F8FAFC", color:"#64748B", border:"#E2E8F0", dot:"#94A3B8" },
  "Completed": { bg:"#EEF2FF", color:"#6366F1", border:"#C7D2FE", dot:"#818CF8" },
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
  const [stops, setStops] = useState([]);
  const [newStop, setNewStop] = useState({ name:"", latitude:"", longitude:"", estimatedTime:"", order:1 });
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
    if (!form.busNumber || !form.driverName || !form.driverPhone || !form.routeName) return toast.error("All fields required");
    setSaving(true);
    try {
      await axios.post(`${API}/transport`, form, auth());
      setShowAddModal(false);
      setForm({ busNumber:"", driverName:"", driverPhone:"", routeName:"", capacity:40, serviceArea:"" });
      fetchAll();
    } catch(e) { toast.error(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleDeleteBus = async (id) => {
    if (!(await confirmAction("Delete this bus?"))) return;
    try { await axios.delete(`${API}/transport/${id}`, auth()); fetchAll(); }
    catch(e) { toast.error("Error deleting bus"); }
  };

  const openStops = (bus) => {
    setSelectedBus(bus);
    setStops(bus.stops || []);
    setNewStop({ name:"", latitude:"", longitude:"", estimatedTime:"", order:(bus.stops?.length||0)+1 });
    setShowStopsModal(true);
  };

  const handleAddStop = async () => {
    if (!newStop.name || !newStop.latitude || !newStop.longitude) return toast.error("Name, lat, lng required");
    const updated = [...stops, { ...newStop, latitude: Number(newStop.latitude), longitude: Number(newStop.longitude), order: stops.length+1 }];
    try {
      await axios.put(`${API}/transport/${selectedBus._id}/stops`, { stops: updated }, auth());
      fetchAll();
      setStops(updated);
      setNewStop({ name:"", latitude:"", longitude:"", estimatedTime:"", order:updated.length+1 });
    } catch(e) { toast.error("Error saving stop"); }
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
    } catch(e) { toast.error("Error assigning students"); }
  };

  const toggleStudent = (id) => setSelectedStudents(p => p.includes(id) ? p.filter(s=>s!==id) : [...p,id]);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

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
        .act-btn { transition: all 0.15s ease; }
        .act-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.12); }
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
          <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #F59E0B", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading buses...</div>
        </div>
      ) : buses.length === 0 ? (
        <div style={{ background:"white", borderRadius:20, padding:"80px 0", textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
          <div style={{ fontSize:56, marginBottom:12 }}><Glyph e="🚌" /></div>
          <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No buses added yet</div>
          <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Add your first bus to get started</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {buses.map((bus, i) => {
            const scfg = STATUS_CONFIG[bus.busStatus] || STATUS_CONFIG.Idle;
            const isExpanded = expandedBus === bus._id;
            return (
              <div key={bus._id} className="bus-card"
                style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", overflow:"hidden", animation:`fadeUp 0.4s ease ${i*0.1}s both` }}>
                {/* Bus Header */}
                <div style={{ padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
                  {/* Bus Icon */}
                  <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#F59E0B,#F97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
                    <Glyph e="🚌" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <span style={{ fontSize:17, fontWeight:800, color:"#0F172A" }}>{bus.busNumber}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:scfg.bg, color:scfg.color, border:`1px solid ${scfg.border}`, display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:scfg.dot }} />{bus.busStatus}
                      </span>
                    </div>
                    <div style={{ display:"flex", gap:16, fontSize:12, color:"#64748B", fontWeight:500 }}>
                      <span><Glyph e="👤" /> {bus.driverName}</span>
                      <span><Glyph e="📞" /> {bus.driverPhone}</span>
                      <span><Glyph e="🗺" /> {bus.routeName}</span>
                      <span><Glyph e="📍" /> {bus.stops?.length||0} stops</span>
                      <span><Glyph e="👦" /> {bus.assignedStudents?.length||0} students</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <button className="act-btn" onClick={() => openStops(bus)}
                      style={{ padding:"8px 16px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", fontSize:12, fontWeight:700, cursor:"pointer", color:"var(--brand)" }}>
                      <Glyph e="📍" /> Stops ({bus.stops?.length||0})
                    </button>
                    <button className="act-btn" onClick={() => openStudents(bus)}
                      style={{ padding:"8px 16px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", fontSize:12, fontWeight:700, cursor:"pointer", color:"#10B981" }}>
                      <Glyph e="👦" /> Students ({bus.assignedStudents?.length||0})
                    </button>
                    <button className="act-btn" onClick={() => setExpandedBus(isExpanded ? null : bus._id)}
                      style={{ padding:"8px 14px", borderRadius:10, border:"1px solid #E2E8F0", background: isExpanded ? "#F1F5F9" : "white", fontSize:12, fontWeight:700, cursor:"pointer", color:"#64748B" }}>
                      {isExpanded ? "▲" : "▼"}
                    </button>
                    <button className="act-btn" onClick={() => handleDeleteBus(bus._id)}
                      style={{ width:34, height:34, borderRadius:10, border:"none", background:"#FEF2F2", cursor:"pointer", fontSize:14 }}>
                      <Glyph e="🗑" />
                    </button>
                  </div>
                </div>

                {/* Driver Token */}
                <div style={{ margin:"0 24px 16px", padding:"10px 16px", background:"#FFFBEB", borderRadius:12, border:"1px solid #FDE68A", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:12, color:"#92400E" }}><Glyph e="🔑" /> Driver Token:</span>
                  <code style={{ fontSize:12, fontWeight:800, color:"#D97706", letterSpacing:"1px" }}>{bus.driverToken}</code>
                </div>

                {/* Expanded — Stops */}
                {isExpanded && bus.stops?.length > 0 && (
                  <div style={{ margin:"0 24px 20px", padding:"16px", background:"#F8FAFC", borderRadius:14, border:"1px solid #E2E8F0" }}>
                    <div style={{ fontSize:12, fontWeight:800, color:"#64748B", marginBottom:12, letterSpacing:"0.06em" }}>ROUTE STOPS</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {bus.stops.sort((a,b)=>a.order-b.order).map((stop, si) => (
                        <div key={si} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,#F59E0B,#F97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"white", flexShrink:0 }}>{si+1}</div>
                          <div style={{ flex:1 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{stop.name}</span>
                            {stop.estimatedTime && <span style={{ fontSize:11, color:"#94A3B8", marginLeft:8 }}><Glyph e="⏱" /> {stop.estimatedTime}</span>}
                          </div>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background: stop.status==="Live"?"#F0FDF4":stop.status==="Departed"?"var(--brand-soft)":"#F1F5F9", color: stop.status==="Live"?"#15803D":stop.status==="Departed"?"var(--brand)":"#94A3B8", fontWeight:700 }}>{stop.status}</span>
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
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Bus">
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["BUS NUMBER","busNumber","text"],["DRIVER NAME","driverName","text"],["DRIVER PHONE","driverPhone","tel"],["ROUTE NAME","routeName","text"],["CAPACITY","capacity","number"],["SERVICE AREA","serviceArea","text"]].map(([label,key,type]) => (
              <div key={key}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
                <input type={type} value={form[key]||""} onChange={e => f(key,e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                  onFocus={e=>e.target.style.borderColor="#F59E0B"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowAddModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleAddBus} disabled={saving} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#F59E0B,#F97316)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Adding..." : "Add Bus"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stops Modal */}
      <Modal show={showStopsModal} onClose={() => setShowStopsModal(false)} title={`Stops — ${selectedBus?.busNumber}`}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {stops.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:180, overflowY:"auto", marginBottom:4 }}>
              {stops.sort((a,b)=>a.order-b.order).map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#F8FAFC", borderRadius:10 }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:"#F59E0B", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"white" }}>{i+1}</div>
                  <span style={{ fontSize:13, fontWeight:600, color:"#0F172A", flex:1 }}>{s.name}</span>
                  {s.estimatedTime && <span style={{ fontSize:11, color:"#94A3B8" }}><Glyph e="⏱" /> {s.estimatedTime}</span>}
                </div>
              ))}
            </div>
          )}
          <div style={{ borderTop:"1px solid #E2E8F0", paddingTop:14 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"#94A3B8", marginBottom:10 }}>ADD NEW STOP</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["STOP NAME","name","text"],["EST. TIME","estimatedTime","text"],["LATITUDE","latitude","number"],["LONGITUDE","longitude","number"]].map(([label,key,type]) => (
                <div key={key}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", marginBottom:4 }}>{label}</div>
                  <input type={type} value={newStop[key]||""} onChange={e => setNewStop(p=>({...p,[key]:e.target.value}))}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
                </div>
              ))}
            </div>
            <button onClick={handleAddStop} style={{ marginTop:12, width:"100%", padding:"10px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#F59E0B,#F97316)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              + Add Stop
            </button>
          </div>
        </div>
      </Modal>

      {/* Students Modal */}
      <Modal show={showStudentsModal} onClose={() => setShowStudentsModal(false)} title={`Assign Students — ${selectedBus?.busNumber}`}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600 }}>{selectedStudents.length} students selected</div>
          <div style={{ maxHeight:320, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
            {allStudents.map(s => (
              <label key={s._id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background: selectedStudents.includes(s._id) ? "#FFFBEB" : "#F8FAFC", cursor:"pointer", border:`1px solid ${selectedStudents.includes(s._id)?"#FDE68A":"#E2E8F0"}` }}>
                <input type="checkbox" checked={selectedStudents.includes(s._id)} onChange={() => toggleStudent(s._id)} style={{ accentColor:"#F59E0B", width:16, height:16 }} />
                <span style={{ fontSize:13, fontWeight:600, color:"#0F172A", flex:1 }}>{s.name}</span>
                <span style={{ fontSize:11, color:"#F59E0B", fontWeight:700 }}>Class {s.class}{s.section?`-${s.section}`:""}</span>
              </label>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowStudentsModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleAssignStudents} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#F59E0B,#F97316)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

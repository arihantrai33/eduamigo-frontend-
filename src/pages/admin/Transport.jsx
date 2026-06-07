import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const STATUS_CONFIG = {
  "On Route":  { bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0", dot:"#22C55E" },
  "Idle":      { bg:"#F8FAFC", color:"#64748B", border:"#E2E8F0", dot:"#94A3B8" },
  "Completed": { bg:"#EEF2FF", color:"#6366F1", border:"#C7D2FE", dot:"#818CF8" },
};

function BusAnimation({ onDone }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"linear-gradient(135deg,#0F172A,#1E3A5F)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
      <style>{`
        @keyframes busRide {
          0%   { transform: translateX(-30vw); }
          30%  { transform: translateX(20vw); }
          70%  { transform: translateX(20vw); }
          100% { transform: translateX(130vw); }
        }
        @keyframes roadLine {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-200px); }
        }
        @keyframes dust1 {
          0%   { transform: translateX(0) translateY(0) scale(1); opacity:0.7; }
          100% { transform: translateX(-60px) translateY(-30px) scale(2.5); opacity:0; }
        }
        @keyframes dust2 {
          0%   { transform: translateX(0) translateY(0) scale(1); opacity:0.5; }
          100% { transform: translateX(-80px) translateY(-50px) scale(3); opacity:0; }
        }
        @keyframes dust3 {
          0%   { transform: translateX(0) translateY(0) scale(1); opacity:0.6; }
          100% { transform: translateX(-40px) translateY(-20px) scale(2); opacity:0; }
        }
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes windLine {
          0%   { transform: translateX(120vw); opacity:0; }
          20%  { opacity:0.6; }
          100% { transform: translateX(-20vw); opacity:0; }
        }
        @keyframes fadeOut {
          0%   { opacity:1; }
          80%  { opacity:1; }
          100% { opacity:0; }
        }
        .bus-wrap { animation: busRide 3s ease-in-out forwards, fadeOut 3s forwards; }
        .wind-1 { position:absolute; height:3px; border-radius:4px; background:rgba(255,255,255,0.15); animation: windLine 1.4s 0s ease-in forwards; width:180px; top:44%; }
        .wind-2 { position:absolute; height:2px; border-radius:4px; background:rgba(255,255,255,0.1); animation: windLine 1.4s 0.1s ease-in forwards; width:120px; top:47%; }
        .wind-3 { position:absolute; height:2px; border-radius:4px; background:rgba(255,255,255,0.08); animation: windLine 1.4s 0.05s ease-in forwards; width:90px; top:42%; }
      `}</style>

      {/* Road */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"38%", background:"linear-gradient(180deg,#1a2744,#0d1b35)" }}>
        <div style={{ position:"absolute", top:"30%", left:0, right:0, height:4, overflow:"hidden" }}>
          <div style={{ display:"flex", gap:0, animation:"roadLine 0.3s linear infinite" }}>
            {Array(30).fill(0).map((_,i) => (
              <div key={i} style={{ width:100, height:4, background: i%2===0 ? "rgba(255,255,255,0.5)" : "transparent", flexShrink:0 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Wind lines */}
      <div className="wind-1" />
      <div className="wind-2" />
      <div className="wind-3" />

      {/* Bus */}
      <div className="bus-wrap" style={{ position:"absolute", bottom:"34%", left:"50%", transform:"translateX(-120vw)" }}>
        {/* Dust particles */}
        <div style={{ position:"absolute", left:-10, bottom:8, width:12, height:12, borderRadius:"50%", background:"rgba(180,140,80,0.6)", animation:"dust1 0.4s ease-out infinite" }} />
        <div style={{ position:"absolute", left:-5, bottom:4, width:8, height:8, borderRadius:"50%", background:"rgba(160,120,60,0.5)", animation:"dust2 0.5s ease-out 0.1s infinite" }} />
        <div style={{ position:"absolute", left:-15, bottom:10, width:6, height:6, borderRadius:"50%", background:"rgba(200,160,90,0.4)", animation:"dust3 0.35s ease-out 0.05s infinite" }} />

        {/* Bus SVG */}
        <svg width="160" height="80" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <rect x="10" y="15" width="135" height="45" rx="8" fill="#F59E0B" />
          <rect x="10" y="15" width="135" height="12" rx="4" fill="#D97706" />
          {/* Windows */}
          <rect x="20" y="20" width="18" height="14" rx="3" fill="#BAE6FD" opacity="0.9" />
          <rect x="44" y="20" width="18" height="14" rx="3" fill="#BAE6FD" opacity="0.9" />
          <rect x="68" y="20" width="18" height="14" rx="3" fill="#BAE6FD" opacity="0.9" />
          <rect x="92" y="20" width="18" height="14" rx="3" fill="#BAE6FD" opacity="0.9" />
          {/* Door */}
          <rect x="116" y="28" width="20" height="28" rx="3" fill="#92400E" />
          <rect x="118" y="30" width="8" height="24" rx="2" fill="#78350F" />
          <circle cx="127" cy="42" r="2" fill="#FCD34D" />
          {/* Front */}
          <rect x="138" y="20" width="10" height="35" rx="4" fill="#D97706" />
          <rect x="140" y="22" width="6" height="12" rx="2" fill="#FEF3C7" opacity="0.9" />
          {/* Headlight */}
          <ellipse cx="148" cy="42" rx="4" ry="3" fill="#FEF08A" opacity="0.9" />
          {/* Bumper */}
          <rect x="8" y="52" width="6" height="8" rx="2" fill="#92400E" />
          {/* Wheels */}
          <g style={{ animation:"wheelSpin 0.2s linear infinite", transformOrigin:"30px 63px" }}>
            <circle cx="30" cy="63" r="12" fill="#1E293B" />
            <circle cx="30" cy="63" r="7" fill="#334155" />
            <circle cx="30" cy="63" r="3" fill="#94A3B8" />
            <line x1="30" y1="56" x2="30" y2="70" stroke="#475569" strokeWidth="1.5" />
            <line x1="23" y1="63" x2="37" y2="63" stroke="#475569" strokeWidth="1.5" />
          </g>
          <g style={{ animation:"wheelSpin 0.2s linear infinite", transformOrigin:"110px 63px" }}>
            <circle cx="110" cy="63" r="12" fill="#1E293B" />
            <circle cx="110" cy="63" r="7" fill="#334155" />
            <circle cx="110" cy="63" r="3" fill="#94A3B8" />
            <line x1="110" y1="56" x2="110" y2="70" stroke="#475569" strokeWidth="1.5" />
            <line x1="103" y1="63" x2="117" y2="63" stroke="#475569" strokeWidth="1.5" />
          </g>
          {/* EduAmigo text */}
          <text x="52" y="47" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="#7C2D12">EduAmigo</text>
        </svg>
      </div>

      <div style={{ position:"absolute", bottom:"12%", fontSize:13, color:"rgba(255,255,255,0.4)", letterSpacing:"3px", fontWeight:600 }}>TRANSPORT</div>
    </div>
  );
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", borderRadius:24, padding:32, width:560, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.3)", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:16, color:"#64748B" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Transport() {
  const [showAnim, setShowAnim] = useState(true);
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

  useEffect(() => {
    const timer = setTimeout(() => setShowAnim(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { if (!showAnim) fetchAll(); }, [showAnim]);

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
    if (!form.busNumber || !form.driverName || !form.driverPhone || !form.routeName) return alert("All fields required");
    setSaving(true);
    try {
      await axios.post(`${API}/transport`, form, auth());
      setShowAddModal(false);
      setForm({ busNumber:"", driverName:"", driverPhone:"", routeName:"", capacity:40, serviceArea:"" });
      fetchAll();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleDeleteBus = async (id) => {
    if (!confirm("Delete this bus?")) return;
    try { await axios.delete(`${API}/transport/${id}`, auth()); fetchAll(); }
    catch(e) { alert("Error deleting bus"); }
  };

  const openStops = (bus) => {
    setSelectedBus(bus);
    setStops(bus.stops || []);
    setNewStop({ name:"", latitude:"", longitude:"", estimatedTime:"", order:(bus.stops?.length||0)+1 });
    setShowStopsModal(true);
  };

  const handleAddStop = async () => {
    if (!newStop.name || !newStop.latitude || !newStop.longitude) return alert("Name, lat, lng required");
    const updated = [...stops, { ...newStop, latitude: Number(newStop.latitude), longitude: Number(newStop.longitude), order: stops.length+1 }];
    try {
      await axios.put(`${API}/transport/${selectedBus._id}/stops`, { stops: updated }, auth());
      fetchAll();
      setStops(updated);
      setNewStop({ name:"", latitude:"", longitude:"", estimatedTime:"", order:updated.length+1 });
    } catch(e) { alert("Error saving stop"); }
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
    } catch(e) { alert("Error assigning students"); }
  };

  const toggleStudent = (id) => setSelectedStudents(p => p.includes(id) ? p.filter(s=>s!==id) : [...p,id]);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const totalStudents = buses.reduce((a,b) => a + (b.assignedStudents?.length||0), 0);
  const onRoute = buses.filter(b => b.busStatus === "On Route").length;

  if (showAnim) return <BusAnimation />;

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
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
      <div style={{ background:"linear-gradient(135deg,#F59E0B,#F97316,#EF4444)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:80, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>🚌 Transport</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Manage school buses, routes and students</div>
          </div>
          <button onClick={() => setShowAddModal(true)}
            style={{ padding:"12px 24px", borderRadius:14, border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.2)", color:"white", fontWeight:700, fontSize:14, cursor:"pointer" }}>
            + New Bus
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"TOTAL BUSES",      value: buses.length,   icon:"🚌", border:"#F59E0B", bg:"#FFFBEB" },
          { label:"ON ROUTE",         value: onRoute,        icon:"🟢", border:"#10B981", bg:"#F0FDF4" },
          { label:"IDLE",             value: buses.filter(b=>b.busStatus==="Idle").length, icon:"⏸️", border:"#6366F1", bg:"#EEF2FF" },
          { label:"STUDENTS ASSIGNED",value: totalStudents,  icon:"👦", border:"#EC4899", bg:"#FDF4FF" },
        ].map((card,i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${card.border}`, animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{card.label}</div>
                <div style={{ fontSize:26, fontWeight:900, color:"#0F172A" }}>{card.value}</div>
              </div>
              <div style={{ width:42, height:42, borderRadius:12, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bus Cards */}
      {loading ? (
        <div style={{ padding:"60px 0", textAlign:"center" }}>
          <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #F59E0B", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading buses...</div>
        </div>
      ) : buses.length === 0 ? (
        <div style={{ background:"white", borderRadius:20, padding:"80px 0", textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
          <div style={{ fontSize:56, marginBottom:12 }}>🚌</div>
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
                    🚌
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <span style={{ fontSize:17, fontWeight:800, color:"#0F172A" }}>{bus.busNumber}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:scfg.bg, color:scfg.color, border:`1px solid ${scfg.border}`, display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:scfg.dot }} />{bus.busStatus}
                      </span>
                    </div>
                    <div style={{ display:"flex", gap:16, fontSize:12, color:"#64748B", fontWeight:500 }}>
                      <span>�� {bus.driverName}</span>
                      <span>📞 {bus.driverPhone}</span>
                      <span>🗺️ {bus.routeName}</span>
                      <span>📍 {bus.stops?.length||0} stops</span>
                      <span>👦 {bus.assignedStudents?.length||0} students</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <button className="act-btn" onClick={() => openStops(bus)}
                      style={{ padding:"8px 16px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", fontSize:12, fontWeight:700, cursor:"pointer", color:"#6366F1" }}>
                      📍 Stops ({bus.stops?.length||0})
                    </button>
                    <button className="act-btn" onClick={() => openStudents(bus)}
                      style={{ padding:"8px 16px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", fontSize:12, fontWeight:700, cursor:"pointer", color:"#10B981" }}>
                      👦 Students ({bus.assignedStudents?.length||0})
                    </button>
                    <button className="act-btn" onClick={() => setExpandedBus(isExpanded ? null : bus._id)}
                      style={{ padding:"8px 14px", borderRadius:10, border:"1px solid #E2E8F0", background: isExpanded ? "#F1F5F9" : "white", fontSize:12, fontWeight:700, cursor:"pointer", color:"#64748B" }}>
                      {isExpanded ? "▲" : "▼"}
                    </button>
                    <button className="act-btn" onClick={() => handleDeleteBus(bus._id)}
                      style={{ width:34, height:34, borderRadius:10, border:"none", background:"#FEF2F2", cursor:"pointer", fontSize:14 }}>
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Driver Token */}
                <div style={{ margin:"0 24px 16px", padding:"10px 16px", background:"#FFFBEB", borderRadius:12, border:"1px solid #FDE68A", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:12, color:"#92400E" }}>🔑 Driver Token:</span>
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
                            {stop.estimatedTime && <span style={{ fontSize:11, color:"#94A3B8", marginLeft:8 }}>⏱ {stop.estimatedTime}</span>}
                          </div>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background: stop.status==="Live"?"#F0FDF4":stop.status==="Departed"?"#EEF2FF":"#F1F5F9", color: stop.status==="Live"?"#15803D":stop.status==="Departed"?"#6366F1":"#94A3B8", fontWeight:700 }}>{stop.status}</span>
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
                  {s.estimatedTime && <span style={{ fontSize:11, color:"#94A3B8" }}>⏱ {s.estimatedTime}</span>}
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

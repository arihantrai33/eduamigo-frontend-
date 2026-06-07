import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const PRIORITY_CONFIG = {
  urgent:    { bg:"#FEF2F2", color:"#DC2626", border:"#FECACA", label:"URGENT" },
  important: { bg:"#FFFBEB", color:"#D97706", border:"#FDE68A", label:"IMPORTANT" },
  normal:    { bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0", label:"NORMAL" },
};

const TARGET_CONFIG = {
  all:     { bg:"#EEF2FF", color:"#6366F1", label:"Everyone" },
  student: { bg:"#F0FDF4", color:"#15803D", label:"Students" },
  teacher: { bg:"#FFF7ED", color:"#EA580C", label:"Teachers" },
  parent:  { bg:"#FDF4FF", color:"#9333EA", label:"Parents" },
  admin:   { bg:"#F1F5F9", color:"#475569", label:"Admin" },
};

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", borderRadius:24, padding:32, width:540, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.25)", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:16, color:"#64748B" }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Communications() {
  const [activeTab, setActiveTab] = useState("announcements");
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("announcement");
  const [editItem, setEditItem] = useState(null);
  const [filterTarget, setFilterTarget] = useState("all");
  const [filterPriority, setFilterPriority] = useState("");
  const [search, setSearch] = useState("");

  const [annForm, setAnnForm] = useState({ title:"", message:"", targetRole:"all", priority:"normal", isPinned:false });
  const [notifForm, setNotifForm] = useState({ title:"", message:"", targetRole:"all" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, nRes] = await Promise.allSettled([
        axios.get(`${API}/announcements`, auth()),
        axios.get(`${API}/notifications`, auth()),
      ]);
      setAnnouncements(aRes.status === "fulfilled" ? (aRes.value.data.data || aRes.value.data || []) : []);
      setNotifications(nRes.status === "fulfilled" ? (nRes.value.data.data || nRes.value.data || []) : []);
    } catch(e) {}
    setLoading(false);
  };

  const openAddAnnouncement = () => {
    setEditItem(null);
    setAnnForm({ title:"", message:"", targetRole:"all", priority:"normal", isPinned:false });
    setModalType("announcement");
    setShowModal(true);
  };

  const openEditAnnouncement = (a) => {
    setEditItem(a);
    setAnnForm({ title:a.title, message:a.message, targetRole:a.targetRole, priority:a.priority, isPinned:a.isPinned });
    setModalType("announcement");
    setShowModal(true);
  };

  const openAddNotification = () => {
    setNotifForm({ title:"", message:"", targetRole:"all" });
    setModalType("notification");
    setShowModal(true);
  };

  const handleSaveAnnouncement = async () => {
    if (!annForm.title || !annForm.message) return alert("Title and message required");
    setSaving(true);
    try {
      if (editItem) await axios.put(`${API}/announcements/${editItem._id}`, annForm, auth());
      else await axios.post(`${API}/announcements`, annForm, auth());
      setShowModal(false);
      fetchAll();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleSendNotification = async () => {
    if (!notifForm.title || !notifForm.message) return alert("Title and message required");
    setSaving(true);
    try {
      await axios.post(`${API}/notifications/send`, notifForm, auth());
      setShowModal(false);
      fetchAll();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleTogglePin = async (id) => {
    try { await axios.patch(`${API}/announcements/${id}/pin`, {}, auth()); fetchAll(); }
    catch(e) {}
  };

  const handleDeleteAnn = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try { await axios.delete(`${API}/announcements/${id}`, auth()); fetchAll(); }
    catch(e) {}
  };

  const handleDeleteNotif = async (id) => {
    if (!confirm("Delete this notification?")) return;
    try { await axios.delete(`${API}/notifications/${id}`, auth()); fetchAll(); }
    catch(e) {}
  };

  const filteredAnn = announcements.filter(a =>
    (filterTarget === "all" || a.targetRole === filterTarget) &&
    (!filterPriority || a.priority === filterPriority) &&
    (!search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.message?.toLowerCase().includes(search.toLowerCase()))
  );

  const circulars = announcements.filter(a => a.priority === "important" || a.priority === "urgent");

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";

  const TABS = [
    { id:"announcements", label:"📢 Announcements", count: announcements.length },
    { id:"circulars",     label:"📋 Circulars",     count: circulars.length },
    { id:"notifications", label:"🔔 Notifications", count: notifications.length },
  ];

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .comm-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.1) !important; }
        .comm-card { transition: all 0.2s ease; }
        .act-btn { transition: all 0.15s ease; }
        .act-btn:hover { transform:translateY(-1px); }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6,#EC4899)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Communications</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Announcements, Circulars & Notifications — all in one place</div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={openAddAnnouncement}
              style={{ padding:"11px 20px", borderRadius:12, border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.15)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              + Announcement
            </button>
            <button onClick={openAddNotification}
              style={{ padding:"11px 20px", borderRadius:12, border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.2)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              🔔 Send Notification
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"ANNOUNCEMENTS", value: announcements.length,                                    icon:"📢", border:"#6366F1", bg:"#EEF2FF" },
          { label:"PINNED",        value: announcements.filter(a=>a.isPinned).length,              icon:"📌", border:"#F59E0B", bg:"#FFFBEB" },
          { label:"CIRCULARS",     value: circulars.length,                                        icon:"📋", border:"#EC4899", bg:"#FDF4FF" },
          { label:"NOTIFICATIONS", value: notifications.length,                                    icon:"🔔", border:"#10B981", bg:"#F0FDF4" },
        ].map((card, i) => (
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

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20, background:"white", padding:"6px", borderRadius:14, boxShadow:"0 2px 12px rgba(15,23,42,0.06)", border:"1px solid #E2E8F0", width:"fit-content" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding:"10px 20px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, transition:"all 0.2s",
              background: activeTab === tab.id ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "transparent",
              color: activeTab === tab.id ? "white" : "#64748B",
              boxShadow: activeTab === tab.id ? "0 4px 12px rgba(99,102,241,0.3)" : "none" }}>
            {tab.label} <span style={{ fontSize:11, opacity:0.8 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Announcements Tab */}
      {activeTab === "announcements" && (
        <div style={{ animation:"fadeUp 0.3s ease" }}>
          {/* Filters */}
          <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center" }}>
            <div style={{ flex:1, position:"relative" }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94A3B8" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search announcements..."
                style={{ width:"100%", padding:"11px 14px 11px 38px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" }}
                onFocus={e => e.target.style.borderColor="#6366F1"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
            </div>
            {["all","student","teacher","parent","admin"].map(t => (
              <button key={t} onClick={() => setFilterTarget(t)}
                style={{ padding:"9px 16px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background: filterTarget===t ? "#6366F1" : "#F1F5F9", color: filterTarget===t ? "white" : "#64748B" }}>
                {t === "all" ? "Everyone" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            {["","normal","important","urgent"].map(p => p ? (
              <button key={p} onClick={() => setFilterPriority(filterPriority===p?"":p)}
                style={{ padding:"9px 14px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background: filterPriority===p ? PRIORITY_CONFIG[p].color : "#F1F5F9", color: filterPriority===p ? "white" : "#64748B" }}>
                {p.charAt(0).toUpperCase()+p.slice(1)}
              </button>
            ) : null)}
          </div>

          {loading ? (
            <div style={{ padding:"60px 0", textAlign:"center" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #6366F1", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            </div>
          ) : filteredAnn.length === 0 ? (
            <div style={{ background:"white", borderRadius:20, padding:"80px 0", textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📢</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No announcements yet</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {filteredAnn.map((a, i) => {
                const pcfg = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
                const tcfg = TARGET_CONFIG[a.targetRole] || TARGET_CONFIG.all;
                return (
                  <div key={a._id} className="comm-card"
                    style={{ background:"white", borderRadius:16, padding:"20px 24px", boxShadow:"0 2px 16px rgba(15,23,42,0.06)", border:`1px solid #E2E8F0`, borderLeft:`4px solid ${pcfg.color}`, animation:`fadeUp 0.3s ease ${i*0.04}s both` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          {a.isPinned && <span style={{ fontSize:12 }}>📌</span>}
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:pcfg.bg, color:pcfg.color, border:`1px solid ${pcfg.border}` }}>{pcfg.label}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:tcfg.bg, color:tcfg.color }}>{tcfg.label}</span>
                        </div>
                        <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:6 }}>{a.title}</div>
                        <div style={{ fontSize:13, color:"#64748B", lineHeight:1.6 }}>{a.message}</div>
                        <div style={{ fontSize:11, color:"#94A3B8", marginTop:8 }}>
                          {a.createdBy?.name || "Admin"} · {fmtDate(a.createdAt)}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, marginLeft:16 }}>
                        <button className="act-btn" onClick={() => handleTogglePin(a._id)}
                          style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background: a.isPinned ? "#FFFBEB" : "white", cursor:"pointer", fontSize:14 }}>
                          📌
                        </button>
                        <button className="act-btn" onClick={() => openEditAnnouncement(a)}
                          style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", fontSize:14 }}>
                          ✏️
                        </button>
                        <button className="act-btn" onClick={() => handleDeleteAnn(a._id)}
                          style={{ width:32, height:32, borderRadius:8, border:"none", background:"#FEF2F2", cursor:"pointer", fontSize:14 }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Circulars Tab */}
      {activeTab === "circulars" && (
        <div style={{ animation:"fadeUp 0.3s ease" }}>
          {circulars.length === 0 ? (
            <div style={{ background:"white", borderRadius:20, padding:"80px 0", textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No circulars yet</div>
              <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Important/Urgent announcements appear here as circulars</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {circulars.map((a, i) => {
                const pcfg = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
                const tcfg = TARGET_CONFIG[a.targetRole] || TARGET_CONFIG.all;
                return (
                  <div key={a._id} className="comm-card"
                    style={{ background:"white", borderRadius:16, padding:"20px 24px", boxShadow:"0 2px 16px rgba(15,23,42,0.06)", border:`2px solid ${pcfg.border}`, animation:`fadeUp 0.3s ease ${i*0.04}s both` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:pcfg.bg, color:pcfg.color, border:`1px solid ${pcfg.border}` }}>{pcfg.label}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:tcfg.bg, color:tcfg.color }}>📣 {tcfg.label}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#F1F5F9", color:"#64748B" }}>CIRCULAR</span>
                        </div>
                        <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:6 }}>{a.title}</div>
                        <div style={{ fontSize:13, color:"#64748B", lineHeight:1.6 }}>{a.message}</div>
                        <div style={{ fontSize:11, color:"#94A3B8", marginTop:8 }}>{fmtDate(a.createdAt)}</div>
                      </div>
                      <button className="act-btn" onClick={() => handleDeleteAnn(a._id)}
                        style={{ width:32, height:32, borderRadius:8, border:"none", background:"#FEF2F2", cursor:"pointer", fontSize:14, marginLeft:16 }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div style={{ animation:"fadeUp 0.3s ease" }}>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <button onClick={openAddNotification}
              style={{ padding:"11px 24px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 4px 14px rgba(99,102,241,0.3)" }}>
              🔔 Send New Notification
            </button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ background:"white", borderRadius:20, padding:"80px 0", textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔔</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No notifications sent yet</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {notifications.map((n, i) => {
                const tcfg = TARGET_CONFIG[n.targetRole] || TARGET_CONFIG.all;
                return (
                  <div key={n._id} className="comm-card"
                    style={{ background:"white", borderRadius:14, padding:"16px 20px", boxShadow:"0 2px 12px rgba(15,23,42,0.06)", border:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center", animation:`fadeUp 0.3s ease ${i*0.03}s both` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🔔</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{n.title}</div>
                        <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>{n.message}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:tcfg.bg, color:tcfg.color }}>{tcfg.label}</span>
                          <span style={{ fontSize:11, color:"#94A3B8" }}>{fmtDate(n.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="act-btn" onClick={() => handleDeleteNotif(n._id)}
                      style={{ width:32, height:32, borderRadius:8, border:"none", background:"#FEF2F2", cursor:"pointer", fontSize:14 }}>
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Announcement Modal */}
      <Modal show={showModal && modalType === "announcement"} onClose={() => setShowModal(false)} title={editItem ? "Edit Announcement" : "New Announcement"}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>TITLE</div>
            <input value={annForm.title} onChange={e => setAnnForm(p=>({...p,title:e.target.value}))} placeholder="Announcement title..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor="#6366F1"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>MESSAGE</div>
            <textarea value={annForm.message} onChange={e => setAnnForm(p=>({...p,message:e.target.value}))} placeholder="Write your announcement..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical", minHeight:100 }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>TARGET</div>
              <select value={annForm.targetRole} onChange={e => setAnnForm(p=>({...p,targetRole:e.target.value}))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
                {[["all","Everyone"],["student","Students"],["teacher","Teachers"],["parent","Parents"],["admin","Admin"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>PRIORITY</div>
              <select value={annForm.priority} onChange={e => setAnnForm(p=>({...p,priority:e.target.value}))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
                {["normal","important","urgent"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={annForm.isPinned} onChange={e => setAnnForm(p=>({...p,isPinned:e.target.checked}))} style={{ accentColor:"#6366F1", width:16, height:16 }} />
            <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>📌 Pin this announcement</span>
          </label>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleSaveAnnouncement} disabled={saving} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Saving..." : editItem ? "Update" : "Post"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal show={showModal && modalType === "notification"} onClose={() => setShowModal(false)} title="Send Notification">
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#EEF2FF", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#6366F1", fontWeight:600 }}>
            This will send a push notification to all selected users
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>TITLE</div>
            <input value={notifForm.title} onChange={e => setNotifForm(p=>({...p,title:e.target.value}))} placeholder="Notification title..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>MESSAGE</div>
            <textarea value={notifForm.message} onChange={e => setNotifForm(p=>({...p,message:e.target.value}))} placeholder="Notification message..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical", minHeight:80 }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>TARGET</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[["all","Everyone"],["student","Students"],["teacher","Teachers"],["parent","Parents"]].map(([v,l]) => (
                <button key={v} onClick={() => setNotifForm(p=>({...p,targetRole:v}))}
                  style={{ padding:"8px 16px", borderRadius:10, border:`2px solid ${notifForm.targetRole===v?"#6366F1":"#E2E8F0"}`, background: notifForm.targetRole===v?"#EEF2FF":"white", color: notifForm.targetRole===v?"#6366F1":"#64748B", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleSendNotification} disabled={saving} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Sending..." : "🔔 Send Now"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

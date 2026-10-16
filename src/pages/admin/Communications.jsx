import { useState, useEffect } from "react";
import axios from "axios";
import { toast, confirmAction, errorMessage } from "../../utils/toast";
import EmptyState from "../../components/ui/EmptyState";

import { Bell, ClipboardList, Megaphone } from "lucide-react";
import Glyph from "../../components/Glyph";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
import Segmented from "../../components/ui/Segmented";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const PRIORITY_CONFIG = {
  urgent:    { bg:"#FEF2F2", color:"#B91C1C", border:"#FECACA", label:"Urgent" },
  important: { bg:"#FFFBEB", color:"var(--ea-on-card-warning)", border:"#FDE68A", label:"Important" },
  normal:    { bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0", label:"Normal" },
};

// The audience is a category: one of the six category colours.
const TARGET_CONFIG = {
  all:     { bg:"var(--ea-cat-1-bg)", color:"var(--ea-cat-1)", label:"Everyone" },
  student: { bg:"var(--ea-cat-5-bg)", color:"var(--ea-cat-5)", label:"Students" },
  teacher: { bg:"var(--ea-cat-3-bg)", color:"var(--ea-cat-3)", label:"Teachers" },
  parent:  { bg:"var(--ea-cat-2-bg)", color:"var(--ea-cat-2)", label:"Parents" },
  admin:   { bg:"var(--ea-cat-6-bg)", color:"var(--ea-cat-6)", label:"Admin" },
};

export default function Communications() {
  const [activeTab, setActiveTab] = useState("announcements");
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("announcement");
  const [editItem, setEditItem] = useState(null);
  const [filterTarget, setFilterTarget] = useState("");
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
    if (!annForm.title || !annForm.message) return toast.error("Title and message required");
    setSaving(true);
    try {
      if (editItem) await axios.put(`${API}/announcements/${editItem._id}`, annForm, auth());
      else await axios.post(`${API}/announcements`, annForm, auth());
      setShowModal(false);
      fetchAll();
    } catch(e) { toast.error(errorMessage(e, "Could not save the announcement")); }
    setSaving(false);
  };

  const handleSendNotification = async () => {
    if (!notifForm.title || !notifForm.message) return toast.error("Title and message required");
    setSaving(true);
    try {
      await axios.post(`${API}/notifications/send`, notifForm, auth());
      setShowModal(false);
      fetchAll();
    } catch(e) { toast.error(errorMessage(e, "Could not send the notification")); }
    setSaving(false);
  };

  const handleTogglePin = async (id) => {
    try { await axios.patch(`${API}/announcements/${id}/pin`, {}, auth()); toast.success("Pin updated"); fetchAll(); }
    catch(e) { toast.error(errorMessage(e, "Could not update the pin")); }
  };

  const handleDeleteAnn = async (id) => {
    if (!(await confirmAction("Delete this announcement?"))) return;
    try { await axios.delete(`${API}/announcements/${id}`, auth()); toast.success("Announcement deleted"); fetchAll(); }
    catch(e) { toast.error(errorMessage(e, "Could not delete the announcement")); }
  };

  const handleDeleteNotif = async (id) => {
    if (!(await confirmAction("Delete this notification?"))) return;
    try { await axios.delete(`${API}/notifications/${id}`, auth()); toast.success("Notification deleted"); fetchAll(); }
    catch(e) { toast.error(errorMessage(e, "Could not delete the notification")); }
  };

  const filteredAnn = announcements.filter(a =>
    (!filterTarget || a.targetRole === filterTarget || a.targetRole === "all") &&
    (!filterPriority || a.priority === filterPriority) &&
    (!search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.message?.toLowerCase().includes(search.toLowerCase()))
  );

  const circulars = announcements.filter(a => a.priority === "important" || a.priority === "urgent");

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";

  const TABS = [
    { id:"announcements", label:"Announcements", count: announcements.length },
    { id:"circulars",     label:"Circulars",     count: circulars.length },
    { id:"notifications", label:"Notifications", count: notifications.length },
  ];

  return (
    <div style={{ fontFamily: "inherit" }}>
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
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Communications" subtitle="Announcements, Circulars & Notifications — all in one place"
          actions={<button type="button" className="ea-btn ea-btn--primary" onClick={openAddNotification}><Bell size={16} aria-hidden="true" /> Send Notification</button>} />
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom:24 }}>
        <StatGrid>
          {[
            { label:"ANNOUNCEMENTS", value: announcements.length,                       icon:<Glyph e="📢" />, border:"var(--brand)" },
            { label:"PINNED",        value: announcements.filter(a=>a.isPinned).length, icon:<Glyph e="📌" />, border:"var(--brand)" },
            { label:"CIRCULARS",     value: circulars.length,                           icon:<Glyph e="📋" />, border:"var(--brand)" },
            { label:"NOTIFICATIONS", value: notifications.length,                       icon:<Glyph e="🔔" />, border:"var(--brand)" },
          ].map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={toneOf(card.border)} />)}
        </StatGrid>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <Segmented label="Communication type" value={activeTab} onChange={setActiveTab}
          options={TABS.map((tab) => ({ value: tab.id, label: <>{tab.label} <span style={{ fontSize: 11, opacity: 0.8 }}>({tab.count})</span></> }))} />
      </div>

      {/* Announcements Tab */}
      {activeTab === "announcements" && (
        <div style={{ animation:"fadeUp 0.3s ease" }}>
          {/* Filters + Add Button */}
          <div className="ea-toolbar" style={{ marginBottom:12 }}>
            <div style={{ flex:"1 1 240px", position:"relative", minWidth:0 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"var(--ea-muted)" }}><Glyph e="🔍" /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search announcements" placeholder="Search announcements..."
                style={{ width:"100%", padding:"11px 14px 11px 38px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" }}
                onFocus={e => e.target.style.borderColor="var(--brand)"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
            </div>
            <button type="button" onClick={openAddAnnouncement} className="ea-btn ea-btn--primary" style={{ whiteSpace:"nowrap" }}>
              + Add
            </button>
          </div>
          <div className="ea-toolbar" style={{ marginBottom:20 }}>
            <div className="ea-chips" role="group" aria-label="Filter by audience" style={{ flex:"1 1 auto", minWidth:0 }}>
              {[["","All"],["student","Students"],["teacher","Teachers"],["parent","Parents"],["admin","Admin"]].map(([val,lbl]) => (
                <button key={val} type="button" className="ea-chip" aria-pressed={filterTarget === val} onClick={() => setFilterTarget(filterTarget===val?"":val)}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:6, background:"#F8FAFC", padding:"4px", borderRadius:12, border:"1px solid #E2E8F0" }}>
              {[
                { val:"", lbl:"All", icon:"▤", active:"var(--brand)", dot:null },
                { val:"normal", lbl:"Normal", icon:"●", active:"#15803D", dot:"#22C55E" },
                { val:"important", lbl:"Important", icon:"●", active:"#D97706", dot:"#F59E0B" },
                { val:"urgent", lbl:"Urgent", icon:"●", active:"#DC2626", dot:"#EF4444" },
              ].map(({val,lbl,dot}) => {
                const isActive = filterPriority===val;
                return (
                  <button key={val} type="button" aria-pressed={filterPriority === val} onClick={() => setFilterPriority(filterPriority===val?"":val)}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 13px", borderRadius:9, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, transition:"all 0.2s",
                      background: isActive ? "white" : "transparent",
                      color: isActive ? (dot ? PRIORITY_CONFIG[val]?.color : "var(--brand)") : "var(--ea-muted)",
                      boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.1)" : "none" }}>
                    {dot && <span style={{ width:7, height:7, borderRadius:"50%", background: isActive ? dot : "#CBD5E1", display:"inline-block", transition:"all 0.2s" }} />}
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div style={{ padding:"60px 0", textAlign:"center" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid var(--brand)", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            </div>
          ) : filteredAnn.length === 0 ? (
            <div style={{ background:"white", borderRadius:20, padding: 16, textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
              <EmptyState plain icon={Megaphone} title="No announcements yet" />
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {filteredAnn.map((a, i) => {
                const pcfg = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
                const tcfg = TARGET_CONFIG[a.targetRole] || TARGET_CONFIG.all;
                return (
                  <div key={a._id} className="comm-card"
                    style={{ background:"white", borderRadius:16, padding:"20px 24px", boxShadow:"0 2px 16px rgba(15,23,42,0.06)", border:"1px solid var(--ea-line)", animation:`fadeUp 0.3s ease ${i*0.04}s both` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          {a.isPinned && <span style={{ fontSize:12 }}><Glyph e="📌" /></span>}
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:pcfg.bg, color:pcfg.color, border:`1px solid ${pcfg.border}` }}>{pcfg.label}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:tcfg.bg, color:tcfg.color }}>{tcfg.label}</span>
                        </div>
                        <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:6 }}>{a.title}</div>
                        <div style={{ fontSize:13, color:"var(--ea-muted)", lineHeight:1.6 }}>{a.message}</div>
                        <div style={{ fontSize:11, color:"var(--ea-muted)", marginTop:8 }}>
                          {a.createdBy?.name || "Admin"} · {fmtDate(a.createdAt)}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, marginLeft:16 }}>
                        <button type="button" className="act-btn" onClick={() => handleTogglePin(a._id)} aria-label={a.isPinned ? "Unpin announcement" : "Pin announcement"} aria-pressed={!!a.isPinned} title={a.isPinned ? "Unpin" : "Pin"}
                          style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background: a.isPinned ? "#FFFBEB" : "white", cursor:"pointer", fontSize:14 }}>
                          <Glyph e="📌" />
                        </button>
                        <button type="button" className="act-btn" onClick={() => openEditAnnouncement(a)} aria-label="Edit announcement" title="Edit"
                          style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", fontSize:14 }}>
                          <Glyph e="✏" />
                        </button>
                        <button type="button" className="act-btn" onClick={() => handleDeleteAnn(a._id)} aria-label="Delete announcement" title="Delete"
                          style={{ width:32, height:32, borderRadius:8, border:"none", background:"#FEF2F2", cursor:"pointer", fontSize:14 }}>
                          <Glyph e="🗑" />
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
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <button onClick={() => { setEditItem(null); setAnnForm({ title:"", message:"", targetRole:"all", priority:"important", isPinned:false }); setModalType("announcement"); setShowModal(true); }}
              className="ea-btn ea-btn--primary">
              + Add Circular
            </button>
          </div>
          {circulars.length === 0 ? (
            <div style={{ background:"white", borderRadius:20, padding: 16, textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
              <EmptyState plain icon={ClipboardList} title="No circulars yet" text="Important/Urgent announcements appear here as circulars" />
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {circulars.map((a, i) => {
                const pcfg = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
                const tcfg = TARGET_CONFIG[a.targetRole] || TARGET_CONFIG.all;
                return (
                  <div key={a._id} className="comm-card"
                    style={{ background:"white", borderRadius:16, padding:"20px 24px", boxShadow:"0 2px 16px rgba(15,23,42,0.06)", border:"1px solid var(--ea-line)", animation:`fadeUp 0.3s ease ${i*0.04}s both` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:pcfg.bg, color:pcfg.color, border:`1px solid ${pcfg.border}` }}>{pcfg.label}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:tcfg.bg, color:tcfg.color }}><Glyph e="📣" /> {tcfg.label}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#F1F5F9", color:"#475569" }}>Circular</span>
                        </div>
                        <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:6 }}>{a.title}</div>
                        <div style={{ fontSize:13, color:"var(--ea-muted)", lineHeight:1.6 }}>{a.message}</div>
                        <div style={{ fontSize:11, color:"var(--ea-muted)", marginTop:8 }}>{fmtDate(a.createdAt)}</div>
                      </div>
                      <button className="act-btn" onClick={() => handleDeleteAnn(a._id)}
                        style={{ width:32, height:32, borderRadius:8, border:"none", background:"#FEF2F2", cursor:"pointer", fontSize:14, marginLeft:16 }}>
                        <Glyph e="🗑" />
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
              className="ea-btn ea-btn--primary">
              <Glyph e="🔔" /> Send New Notification
            </button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ background:"white", borderRadius:20, padding: 16, textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
              <EmptyState plain icon={Bell} title="No notifications sent yet" />
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {notifications.map((n, i) => {
                const tcfg = TARGET_CONFIG[n.targetRole] || TARGET_CONFIG.all;
                return (
                  <div key={n._id} className="comm-card"
                    style={{ background:"white", borderRadius:14, padding:"16px 20px", boxShadow:"0 2px 12px rgba(15,23,42,0.06)", border:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center", animation:`fadeUp 0.3s ease ${i*0.03}s both` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:"var(--brand-soft)", color:"var(--brand-text)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}><Glyph e="🔔" /></div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{n.title}</div>
                        <div style={{ fontSize:12, color:"var(--ea-muted)", marginTop:2 }}>{n.message}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:tcfg.bg, color:tcfg.color }}>{tcfg.label}</span>
                          <span style={{ fontSize:11, color:"var(--ea-muted)" }}>{fmtDate(n.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="act-btn" onClick={() => handleDeleteNotif(n._id)}
                      style={{ width:32, height:32, borderRadius:8, border:"none", background:"#FEF2F2", cursor:"pointer", fontSize:14 }}>
                      <Glyph e="🗑" />
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
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>TITLE</div>
            <input value={annForm.title} onChange={e => setAnnForm(p=>({...p,title:e.target.value}))} placeholder="Announcement title..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor="var(--brand)"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>MESSAGE</div>
            <textarea value={annForm.message} onChange={e => setAnnForm(p=>({...p,message:e.target.value}))} placeholder="Write your announcement..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical", minHeight:100 }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>TARGET</div>
              <select value={annForm.targetRole} onChange={e => setAnnForm(p=>({...p,targetRole:e.target.value}))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
                {[["all","Everyone"],["student","Students"],["teacher","Teachers"],["parent","Parents"],["admin","Admin"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>PRIORITY</div>
              <select value={annForm.priority} onChange={e => setAnnForm(p=>({...p,priority:e.target.value}))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
                {["normal","important","urgent"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={annForm.isPinned} onChange={e => setAnnForm(p=>({...p,isPinned:e.target.checked}))} style={{ accentColor:"var(--brand)", width:16, height:16 }} />
            <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}><Glyph e="📌" /> Pin this announcement</span>
          </label>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"var(--ea-muted)" }}>Cancel</button>
            <button onClick={handleSaveAnnouncement} disabled={saving} className="ea-btn ea-btn--primary">
              {saving ? "Saving..." : editItem ? "Update" : "Post"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal show={showModal && modalType === "notification"} onClose={() => setShowModal(false)} title="Send Notification">
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"var(--brand-soft)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"var(--brand-text)", fontWeight:600 }}>
            This will send a push notification to all selected users
          </div>
          <div>
            <label htmlFor="notif-title" style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>TITLE</label>
            <input id="notif-title" value={notifForm.title} onChange={e => setNotifForm(p=>({...p,title:e.target.value}))} placeholder="Notification title..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
          </div>
          <div>
            <label htmlFor="notif-message" style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>MESSAGE</label>
            <textarea id="notif-message" value={notifForm.message} onChange={e => setNotifForm(p=>({...p,message:e.target.value}))} placeholder="Notification message..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical", minHeight:80 }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>TARGET</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[["all","Everyone"],["student","Students"],["teacher","Teachers"],["parent","Parents"]].map(([v,l]) => (
                <button key={v} type="button" aria-pressed={notifForm.targetRole===v} onClick={() => setNotifForm(p=>({...p,targetRole:v}))}
                  style={{ padding:"8px 16px", borderRadius:10, border:`2px solid ${notifForm.targetRole===v?"var(--brand)":"#E2E8F0"}`, background: notifForm.targetRole===v?"var(--brand-soft)":"white", color: notifForm.targetRole===v?"var(--brand)":"var(--ea-muted)", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"var(--ea-muted)" }}>Cancel</button>
            <button onClick={handleSendNotification} disabled={saving} className="ea-btn ea-btn--primary">
              {saving ? "Sending..." : "Send Now"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

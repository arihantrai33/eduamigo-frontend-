import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const STATUS_CONFIG = {
  Pending:  { bg:"#FFFBEB", color:"#D97706", dot:"#F59E0B", border:"#FDE68A" },
  Approved: { bg:"#F0FDF4", color:"#15803D", dot:"#22C55E", border:"#BBF7D0" },
  Rejected: { bg:"#FEF2F2", color:"#DC2626", dot:"#EF4444", border:"#FECACA" },
};

const LEAVE_TYPES = ["Sick Leave","Casual Leave","Emergency Leave","Maternity Leave","Paternity Leave","Study Leave","Other"];

export default function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/leaves`, auth());
      setLeaves(r.data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const handleAction = async (id, status) => {
    setActionLoading(id + status);
    try {
      await axios.put(`${API}/leaves/${id}`, { status }, auth());
      fetchLeaves();
    } catch(e) {}
    setActionLoading(null);
  };

  const filtered = leaves.filter(l =>
    (!filterStatus || l.status === filterStatus) &&
    (!filterType || l.leaveType === filterType) &&
    (!search || l.teacher?.name?.toLowerCase().includes(search.toLowerCase()) || l.reason?.toLowerCase().includes(search.toLowerCase()))
  );

  const pending  = leaves.filter(l => l.status === "Pending").length;
  const approved = leaves.filter(l => l.status === "Approved").length;
  const rejected = leaves.filter(l => l.status === "Rejected").length;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
  const daysDiff = (from, to) => {
    if (!from || !to) return "—";
    const diff = Math.ceil((new Date(to) - new Date(from)) / (1000*60*60*24)) + 1;
    return `${diff} day${diff !== 1 ? "s" : ""}`;
  };

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .leave-card:hover { box-shadow: 0 8px 32px rgba(15,23,42,0.12) !important; transform: translateY(-2px); }
        .leave-card { transition: all 0.2s ease; }
        .act-btn { transition: all 0.15s ease; }
        .act-btn:hover { transform: translateY(-1px); }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#F59E0B,#F97316,#EF4444)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Leave Management</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Review and manage staff leave requests</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"TOTAL REQUESTS", value: leaves.length, icon:"📋", border:"#6366F1", bg:"#EEF2FF" },
          { label:"PENDING",        value: pending,        icon:"⏳", border:"#F59E0B", bg:"#FFFBEB" },
          { label:"APPROVED",       value: approved,       icon:"✅", border:"#10B981", bg:"#F0FDF4" },
          { label:"REJECTED",       value: rejected,       icon:"❌", border:"#EF4444", bg:"#FEF2F2" },
        ].map((card, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${card.border}`, animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{card.label}</div>
                <div style={{ fontSize:28, fontWeight:900, color:"#0F172A" }}>{card.value}</div>
              </div>
              <div style={{ width:42, height:42, borderRadius:12, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", animation:"fadeUp 0.4s ease 0.1s both" }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94A3B8" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by teacher name or reason..."
            style={{ width:"100%", padding:"11px 14px 11px 38px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" }}
            onFocus={e => e.target.style.borderColor="#F59E0B"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:140 }}>
          <option value="">All Status</option>
          {["Pending","Approved","Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:160 }}>
          <option value="">All Types</option>
          {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600, whiteSpace:"nowrap" }}>{filtered.length} requests</div>
      </div>

      {/* Leave Cards */}
      {loading ? (
        <div style={{ padding:"60px 0", textAlign:"center" }}>
          <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #F59E0B", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading leave requests...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"white", borderRadius:20, padding:"80px 0", textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🌴</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No leave requests found</div>
          <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Leave requests from teachers will appear here</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.map((l, i) => {
            const status = l.status || "Pending";
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
            const isExpanded = expandedId === l._id;
            return (
              <div key={l._id} className="leave-card"
                style={{ background:"white", borderRadius:16, boxShadow:"0 2px 16px rgba(15,23,42,0.06)", border:`1px solid ${isExpanded ? "#F59E0B" : "#E2E8F0"}`, overflow:"hidden", animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                <div style={{ padding:"18px 24px", display:"flex", alignItems:"center", gap:16, cursor:"pointer" }} onClick={() => setExpandedId(isExpanded ? null : l._id)}>
                  {/* Avatar */}
                  <div style={{ width:44, height:44, borderRadius:14, background:"linear-gradient(135deg,#F59E0B,#F97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"white", flexShrink:0 }}>
                    {l.teacher?.name?.[0]?.toUpperCase() || "T"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>{l.teacher?.name || "Teacher"}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#EEF2FF", color:"#6366F1" }}>{l.leaveType || "Leave"}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#94A3B8" }}>
                      {fmtDate(l.fromDate)} → {fmtDate(l.toDate)} · {daysDiff(l.fromDate, l.toDate)}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 14px", borderRadius:20, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot }} />
                      <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{status}</span>
                    </div>
                    {status === "Pending" && (
                      <div style={{ display:"flex", gap:8 }}>
                        <button className="act-btn" onClick={e => { e.stopPropagation(); handleAction(l._id, "Approved"); }}
                          disabled={actionLoading === l._id + "Approved"}
                          style={{ padding:"8px 18px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontSize:12, fontWeight:700, cursor:"pointer", boxShadow:"0 2px 8px rgba(16,185,129,0.3)", opacity: actionLoading === l._id + "Approved" ? 0.7 : 1 }}>
                          {actionLoading === l._id + "Approved" ? "..." : "✓ Approve"}
                        </button>
                        <button className="act-btn" onClick={e => { e.stopPropagation(); handleAction(l._id, "Rejected"); }}
                          disabled={actionLoading === l._id + "Rejected"}
                          style={{ padding:"8px 18px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#EF4444,#DC2626)", color:"white", fontSize:12, fontWeight:700, cursor:"pointer", boxShadow:"0 2px 8px rgba(239,68,68,0.3)", opacity: actionLoading === l._id + "Rejected" ? 0.7 : 1 }}>
                          {actionLoading === l._id + "Rejected" ? "..." : "✗ Reject"}
                        </button>
                      </div>
                    )}
                    <span style={{ fontSize:16, color:"#94A3B8", transition:"transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding:"0 24px 20px", borderTop:"1px solid #F1F5F9" }}>
                    <div style={{ marginTop:16, background:"#F8FAFC", borderRadius:12, padding:"14px 18px" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>REASON</div>
                      <div style={{ fontSize:13, color:"#374151", lineHeight:1.6 }}>{l.reason || "No reason provided"}</div>
                    </div>
                    {l.adminNote && (
                      <div style={{ marginTop:10, background:"#F0FDF4", borderRadius:12, padding:"14px 18px", border:"1px solid #BBF7D0" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#15803D", marginBottom:6 }}>ADMIN NOTE</div>
                        <div style={{ fontSize:13, color:"#374151" }}>{l.adminNote}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

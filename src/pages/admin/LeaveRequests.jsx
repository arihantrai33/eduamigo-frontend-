import { useState, useEffect } from "react";
import axios from "axios";
import { toast, errorMessage } from "../../utils/toast";
import EmptyState from "../../components/ui/EmptyState";

import { Search, CalendarOff } from "lucide-react";
import Glyph from "../../components/Glyph";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
import Skeleton from "../../components/ui/Skeleton";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const STATUS_CONFIG = {
  Pending:  { bg:"#FFFBEB", color:"var(--ea-on-card-warning)", dot:"#F59E0B", border:"#FDE68A" },
  Approved: { bg:"#F0FDF4", color:"#15803D", dot:"#22C55E", border:"#BBF7D0" },
  Rejected: { bg:"#FEF2F2", color:"#B91C1C", dot:"#EF4444", border:"#FECACA" },
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
    } catch (e) { toast.error(errorMessage(e, "Could not load leave requests")); }
    setLoading(false);
  };

  // One review at a time per request (both buttons wait), and the result is always said.
  const handleAction = async (id, status) => {
    if (actionLoading) return;
    setActionLoading(id + status);
    try {
      await axios.patch(`${API}/leaves/${id}/review`, { status }, auth());
      toast.success(status === "Approved" ? "Leave approved" : "Leave rejected");
      fetchLeaves();
    } catch (e) { toast.error(errorMessage(e, "Could not update the leave request")); }
    setActionLoading(null);
  };

  const filtered = leaves.filter(l =>
    (!filterStatus || l.status === filterStatus) &&
    (!filterType || l.leaveType === filterType) &&
    (!search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.reason?.toLowerCase().includes(search.toLowerCase()))
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
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .leave-card:hover { box-shadow: 0 8px 32px rgba(15,23,42,0.12) !important; transform: translateY(-2px); }
        .leave-card { transition: all 0.2s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Leave Management" subtitle="Leave requests from students, parents and teachers" />
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom:24 }}>
        <StatGrid>
          {[
            { label:"TOTAL REQUESTS", value: leaves.length, icon:<Glyph e="📋" />, border:"var(--brand)" },
            { label:"PENDING",        value: pending,        icon:<Glyph e="⏳" />, border:"#F59E0B" },
            { label:"APPROVED",       value: approved,       icon:<Glyph e="✅" />, border:"#10B981" },
            { label:"REJECTED",       value: rejected,       icon:<Glyph e="❌" />, border:"#EF4444" },
          ].map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={toneOf(card.border)} />)}
        </StatGrid>
      </div>

      {/* Filters */}
      <div className="ea-toolbar" style={{ marginBottom:20 }}>
        <div className="ea-search">
          <Search aria-hidden="true" />
          <input className="ea-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or reason..." aria-label="Search leave requests" />
        </div>
        <select className="ea-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Status">
          <option value="">All Status</option>
          {["Pending","Approved","Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="ea-select" value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Leave type">
          <option value="">All Types</option>
          {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="ea-toolbar__count">{filtered.length} requests</span>
      </div>

      {/* Leave Cards */}
      {loading ? (
        <div style={{ padding:"60px 0", textAlign:"center" }}>
          <Skeleton rows={4} label="Loading leave requests" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"white", borderRadius:20, padding: 16, textAlign:"center", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0" }}>
          <EmptyState plain icon={CalendarOff} title="No leave requests found" text="Leave requests from students, parents and teachers will appear here" />
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.map((l, i) => {
            const status = l.status || "Pending";
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
            const isExpanded = expandedId === l._id;
            return (
              <div key={l._id} className="leave-card"
                style={{ background:"white", borderRadius:16, boxShadow:"0 2px 16px rgba(15,23,42,0.06)", border:`1px solid ${isExpanded ? "var(--brand-border)" : "var(--ea-line)"}`, overflow:"hidden", animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                <div className="ea-row-wrap" style={{ padding:"18px 24px", display:"flex", alignItems:"center", gap:16, cursor:"pointer" }} onClick={() => setExpandedId(isExpanded ? null : l._id)}>
                  {/* Avatar */}
                  <div style={{ width:44, height:44, borderRadius:14, background:"var(--brand-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"var(--brand-dark)", flexShrink:0 }}>
                    {l.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:"6px 10px", marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>{l.name || "Unknown"}</span>
                      <span className="ea-badge ea-badge--neutral" style={{ textTransform:"capitalize" }}>{l.role?.charAt(0).toUpperCase() + l.role?.slice(1) || "User"}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"#F1F5F9", color:"#56657A" }}>{l.leaveType || "Leave"}</span>
                    </div>
                    <div style={{ fontSize:12, color:"var(--ea-muted)" }}>
                      {fmtDate(l.fromDate)} → {fmtDate(l.toDate)} · {daysDiff(l.fromDate, l.toDate)}{l.class ? ` · Class ${l.class}${l.section ? `-${l.section}` : ""}` : ""}
                    </div>
                  </div>
                  <div className="ea-row-wrap__end" style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 14px", borderRadius:20, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot }} />
                      <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{status}</span>
                    </div>
                    {status === "Pending" && (
                      <div style={{ display:"flex", gap:8 }}>
                        <button type="button" className="ea-btn ea-btn--primary ea-btn--sm" onClick={e => { e.stopPropagation(); handleAction(l._id, "Approved"); }}
                          disabled={!!actionLoading}>
                          {actionLoading === l._id + "Approved" ? "Approving…" : "✓ Approve"}
                        </button>
                        <button type="button" className="ea-btn ea-btn--danger-ghost ea-btn--sm" onClick={e => { e.stopPropagation(); handleAction(l._id, "Rejected"); }}
                          disabled={!!actionLoading}>
                          {actionLoading === l._id + "Rejected" ? "Rejecting…" : "✗ Reject"}
                        </button>
                      </div>
                    )}
                    <span style={{ fontSize:16, color:"var(--ea-muted)", transition:"transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding:"0 24px 20px", borderTop:"1px solid #F1F5F9" }}>
                    <div style={{ marginTop:16, background:"#F8FAFC", borderRadius:12, padding:"14px 18px" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>REASON</div>
                      <div style={{ fontSize:13, color:"#374151", lineHeight:1.6 }}>{l.reason || "No reason provided"}</div>
                    </div>
                    {l.attachmentUrl && (
                      <a href={l.attachmentUrl} target="_blank" rel="noreferrer" style={{ display:"inline-block", marginTop:10, fontSize:13, fontWeight:600, color:"var(--brand-dark)" }}>
                        View attachment: {l.attachmentName || "document"}
                      </a>
                    )}
                    {l.reviewNote && (
                      <div style={{ marginTop:10, background:"#F0FDF4", borderRadius:12, padding:"14px 18px", border:"1px solid #BBF7D0" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#15803D", marginBottom:6 }}>REVIEW NOTE</div>
                        <div style={{ fontSize:13, color:"#374151" }}>{l.reviewNote}</div>
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

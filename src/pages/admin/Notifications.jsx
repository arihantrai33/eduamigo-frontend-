import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Send, Trash2, RefreshCw, Filter, Bell, Users, GraduationCap, UserCheck, Bus, Globe } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const TYPE_META = {
  General:   { bg: "#E1F5EE", color: "#0F6E56" },
  Fee:       { bg: "#FAEEDA", color: "#854F0B" },
  Exam:      { bg: "#EEEDFE", color: "#534AB7" },
  Alert:     { bg: "#FAECE7", color: "#993C1D" },
  Leave:     { bg: "#FFF3CD", color: "#856404" },
  Timetable: { bg: "#E0F2FE", color: "#0369A1" },
  Result:    { bg: "#FCE7F3", color: "#9D174D" },
  Info:      { bg: "#F0F9FF", color: "#0284C7" },
};

const ROLE_META = {
  all:     { icon: Globe,       label: "Everyone",  color: "#4F46E5", bg: "#EEF2FF" },
  student: { icon: GraduationCap, label: "Students", color: "#16A34A", bg: "#F0FDF4" },
  teacher: { icon: UserCheck,   label: "Teachers",  color: "#D97706", bg: "#FFFBEB" },
  parent:  { icon: Users,       label: "Parents",   color: "#0284C7", bg: "#F0F9FF" },
  driver:  { icon: Bus,         label: "Drivers",   color: "#9333EA", bg: "#FDF4FF" },
};

const inp = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
  fontSize: 13, color: "#1a1a1a", outline: "none", background: "#F8FAFC",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
  transition: "border 0.15s",
};

export default function Notifications() {
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterRole, setFilterRole] = useState("all");
  const [form, setForm] = useState({
    title: "", message: "", type: "General", targetRole: "all",
    targetClass: "", targetSection: "",
  });

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/notifications`, auth());
      setNotifs(res.data.data || []);
    } catch { setNotifs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      const payload = { ...form };
      if (!payload.targetClass) { delete payload.targetClass; delete payload.targetSection; }
      if (!payload.targetSection) delete payload.targetSection;
      await axios.post(`${API}/notifications/send`, payload, auth());
      setShowModal(false);
      setForm({ title: "", message: "", type: "General", targetRole: "all", targetClass: "", targetSection: "" });
      fetchNotifs();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send");
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    await axios.delete(`${API}/notifications/${id}`, auth());
    fetchNotifs();
  };

  const filtered = filterRole === "all" ? notifs : notifs.filter(n => n.targetRole === filterRole || n.targetRole === "all");

  const stats = {
    total: notifs.length,
    today: notifs.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length,
    unread: notifs.filter(n => !n.isRead).length,
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>Notifications</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Broadcast to students, parents, teachers & staff</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchNotifs} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RefreshCw size={14} color="#64748B" />
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px #4F46E540" }}>
            <Send size={13} /> Send Notification
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Sent",  value: stats.total,  color: "#4F46E5", bg: "#EEF2FF", icon: "📢" },
          { label: "Sent Today",  value: stats.today,  color: "#16A34A", bg: "#F0FDF4", icon: "📅" },
          { label: "Unread",      value: stats.unread, color: "#D97706", bg: "#FFFBEB", icon: "🔔" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${s.bg}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(ROLE_META).map(([role, meta]) => {
          const Icon = meta.icon;
          const active = filterRole === role;
          return (
            <button key={role} onClick={() => setFilterRole(role)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 20, border: `1px solid ${active ? meta.color : "#E2E8F0"}`, background: active ? meta.bg : "#fff", color: active ? meta.color : "#64748B", fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
              <Icon size={12} /> {meta.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>No notifications yet</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Send your first notification using the button above</div>
          </div>
        ) : filtered.map(n => {
          const roleMeta = ROLE_META[n.targetRole] || ROLE_META.all;
          const RoleIcon = roleMeta.icon;
          const typeMeta = TYPE_META[n.type] || TYPE_META.General;
          return (
            <div key={n._id} style={{ background: "#fff", border: `1px solid ${n.isRead ? "#F1F5F9" : "#C7D2FE"}`, borderRadius: 14, padding: "14px 18px", transition: "box-shadow 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4F46E5", flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: typeMeta.bg, color: typeMeta.color }}>{n.type}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: roleMeta.bg, color: roleMeta.color }}>
                        <RoleIcon size={9} /> {roleMeta.label}
                      </span>
                      {n.targetClass && (
                        <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "#F1F5F9", color: "#475569", fontWeight: 500 }}>
                          Class {n.targetClass}{n.targetSection ? `-${n.targetSection}` : ""}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: "#94A3B8" }}>
                        {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(n._id)}
                  style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #FEE2E2", background: "#FFF5F5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 10 }}>
                  <Trash2 size={12} color="#EF4444" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px", width: 480, maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>Send Notification</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Reach your audience instantly</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 16, color: "#64748B" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>TITLE *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Exam Schedule Updated" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>MESSAGE *</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Write your notification message..." rows={3} style={{ ...inp, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>TYPE</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inp}>
                    {["General","Fee","Exam","Alert","Leave","Timetable","Result","Info"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>SEND TO</label>
                  <select value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})} style={inp}>
                    {Object.entries(ROLE_META).map(([r, m]) => <option key={r} value={r}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Class/Section targeting */}
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 10 }}>🎯 TARGET SPECIFIC CLASS (Optional)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#94A3B8", display: "block", marginBottom: 4 }}>Class</label>
                    <input value={form.targetClass} onChange={e => setForm({...form, targetClass: e.target.value})} placeholder="e.g. 10" style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#94A3B8", display: "block", marginBottom: 4 }}>Section</label>
                    <input value={form.targetSection} onChange={e => setForm({...form, targetSection: e.target.value})} placeholder="e.g. A" style={inp} />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8 }}>
                  Leave blank to broadcast to all users of selected role
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 13, cursor: "pointer", color: "#64748B" }}>Cancel</button>
              <button onClick={handleSend} disabled={sending}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 24px", borderRadius: 8, border: "none", background: sending ? "#94A3B8" : "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>
                <Send size={13} /> {sending ? "Sending..." : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

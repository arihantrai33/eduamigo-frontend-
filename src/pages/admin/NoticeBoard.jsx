import { useState, useEffect } from "react";
import axios from "axios";
import { Pin, PinOff, Trash2, Plus, X, AlertTriangle, Info, Megaphone, Users, GraduationCap, UserCircle, Shield } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const PRIORITY_CONFIG = {
  normal:    { label: "Normal",    color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", icon: Info },
  important: { label: "Important", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: AlertTriangle },
  urgent:    { label: "Urgent",    color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: Megaphone },
};

const TARGET_CONFIG = {
  all:     { label: "Everyone",  color: "#6366F1", bg: "#EEF2FF", icon: "🌐" },
  student: { label: "Students",  color: "#10B981", bg: "#F0FDF4", icon: "🎒" },
  teacher: { label: "Teachers",  color: "#3B82F6", bg: "#EFF6FF", icon: "👩‍🏫" },
  parent:  { label: "Parents",   color: "#F59E0B", bg: "#FFFBEB", icon: "👨‍👩‍👧" },
  admin:   { label: "Admin",     color: "#8B5CF6", bg: "#F5F3FF", icon: "🛡️" },
};

export default function NoticeBoardPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterTarget, setFilterTarget] = useState("all_filter");
  const [filterPriority, setFilterPriority] = useState("all_filter");
  const [form, setForm] = useState({ title: "", message: "", targetRole: "all", priority: "normal", isPinned: false });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const res = await axios.get(`${API}/announcements`, authHeader());
      setAnnouncements(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await axios.put(`${API}/announcements/${editItem._id}`, form, authHeader());
      } else {
        await axios.post(`${API}/announcements`, form, authHeader());
      }
      setShowForm(false);
      setEditItem(null);
      setForm({ title: "", message: "", targetRole: "all", priority: "normal", isPinned: false });
      fetchAll();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleTogglePin = async (id) => {
    try {
      await axios.patch(`${API}/announcements/${id}/pin`, {}, authHeader());
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/announcements/${id}`, authHeader());
      setDeleteConfirm(null);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const openEdit = (ann) => {
    setEditItem(ann);
    setForm({ title: ann.title, message: ann.message, targetRole: ann.targetRole, priority: ann.priority, isPinned: ann.isPinned });
    setShowForm(true);
  };

  const filtered = announcements.filter(a => {
    const tMatch = filterTarget === "all_filter" || a.targetRole === filterTarget;
    const pMatch = filterPriority === "all_filter" || a.priority === filterPriority;
    return tMatch && pMatch;
  });

  const pinned = filtered.filter(a => a.isPinned);
  const unpinned = filtered.filter(a => !a.isPinned);

  const CARD = { background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(15,23,42,0.06)", border: "1px solid rgba(226,232,240,0.8)", marginBottom: 12 };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>Notice Board</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>{announcements.length} announcements total</div>
        </div>
        <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ title: "", message: "", targetRole: "all", priority: "normal", isPinned: false }); }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, background: "white", borderRadius: 12, padding: 6, border: "1px solid #E2E8F0" }}>
          {["all_filter", "all", "student", "teacher", "parent", "admin"].map(t => (
            <button key={t} onClick={() => setFilterTarget(t)}
              style={{ padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: filterTarget === t ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "transparent",
                color: filterTarget === t ? "white" : "#64748B" }}>
              {t === "all_filter" ? "All Targets" : TARGET_CONFIG[t]?.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, background: "white", borderRadius: 12, padding: 6, border: "1px solid #E2E8F0" }}>
          {["all_filter", "normal", "important", "urgent"].map(p => (
            <button key={p} onClick={() => setFilterPriority(p)}
              style={{ padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: filterPriority === p ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "transparent",
                color: filterPriority === p ? "white" : "#64748B" }}>
              {p === "all_filter" ? "All Priority" : PRIORITY_CONFIG[p]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {[
          { label: "Total", value: announcements.length, color: "#6366F1", bg: "linear-gradient(135deg,#6366F1,#8B5CF6)" },
          { label: "Pinned", value: announcements.filter(a=>a.isPinned).length, color: "#F59E0B", bg: "linear-gradient(135deg,#F59E0B,#EF4444)" },
          { label: "Urgent", value: announcements.filter(a=>a.priority==="urgent").length, color: "#EF4444", bg: "linear-gradient(135deg,#EF4444,#EC4899)" },
          { label: "Important", value: announcements.filter(a=>a.priority==="important").length, color: "#10B981", bg: "linear-gradient(135deg,#10B981,#059669)" },
        ].map((s,i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 14, padding: "16px 20px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "white", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#CBD5E1" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No announcements yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Create your first announcement</div>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 10, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                📌 Pinned Announcements
              </div>
              {pinned.map(ann => <AnnouncementCard key={ann._id} ann={ann} onPin={handleTogglePin} onDelete={setDeleteConfirm} onEdit={openEdit} />)}
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Other Announcements</div>}
              {unpinned.map(ann => <AnnouncementCard key={ann._id} ann={ann} onPin={handleTogglePin} onDelete={setDeleteConfirm} onEdit={openEdit} />)}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: "100%", maxWidth: 520, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{editItem ? "Edit Announcement" : "New Announcement"}</div>
              <div onClick={() => { setShowForm(false); setEditItem(null); }} style={{ cursor: "pointer", color: "#94A3B8", padding: 4 }}><X size={20} /></div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Announcement title..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Message *</label>
              <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                placeholder="Write your announcement..."
                rows={4}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Target Audience</label>
                <select value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", background: "white" }}>
                  <option value="all">Everyone</option>
                  <option value="student">Students Only</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="parent">Parents Only</option>
                  <option value="admin">Admin Only</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Priority Level</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", background: "white" }}>
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "12px 14px", background: "#F8FAFC", borderRadius: 10, cursor: "pointer" }} onClick={() => setForm({...form, isPinned: !form.isPinned})}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${form.isPinned ? "#6366F1" : "#CBD5E1"}`, background: form.isPinned ? "#6366F1" : "white", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {form.isPinned && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Pin this announcement to top</span>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowForm(false); setEditItem(null); }}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748B" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
                {saving ? "Saving..." : editItem ? "Update Announcement" : "Post Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 20, padding: "28px", width: "100%", maxWidth: 380, textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Delete Announcement?</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>This action cannot be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#EF4444,#EC4899)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ ann, onPin, onDelete, onEdit }) {
  const pc = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.normal;
  const tc = TARGET_CONFIG[ann.targetRole] || TARGET_CONFIG.all;
  const PIcon = pc.icon;

  return (
    <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(15,23,42,0.06)", border: `1px solid ${ann.isPinned ? "#C7D2FE" : "rgba(226,232,240,0.8)"}`, marginBottom: 10, borderLeft: `4px solid ${pc.color}`, transition: "all 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(15,23,42,0.06)"}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            {ann.isPinned && <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "#FFFBEB", padding: "3px 8px", borderRadius: 6, border: "1px solid #FDE68A" }}>📌 PINNED</span>}
            <span style={{ fontSize: 10, fontWeight: 700, color: pc.color, background: pc.bg, padding: "3px 8px", borderRadius: 6, border: `1px solid ${pc.border}`, display: "flex", alignItems: "center", gap: 3 }}>
              <PIcon size={10} /> {pc.label.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, background: tc.bg, padding: "3px 8px", borderRadius: 6 }}>
              {tc.icon} {tc.label}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{ann.title}</div>
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{ann.message}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 10 }}>
            {ann.createdBy?.name && <span>{ann.createdBy.name} · </span>}
            {new Date(ann.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onPin(ann._id)} title={ann.isPinned ? "Unpin" : "Pin"}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: ann.isPinned ? "#FFFBEB" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: ann.isPinned ? "#F59E0B" : "#94A3B8" }}>
            {ann.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button onClick={() => onEdit(ann)} title="Edit"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1", fontSize: 13, fontWeight: 700 }}>
            ✏️
          </button>
          <button onClick={() => onDelete(ann._id)} title="Delete"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #FEE2E2", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={14} color="#EF4444" />
          </button>
        </div>
      </div>
    </div>
  );
}

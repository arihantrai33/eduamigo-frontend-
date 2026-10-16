import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast, errorMessage } from "../../utils/toast";

import Glyph from "../../components/Glyph";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import Skeleton from "../../components/ui/Skeleton";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// One avatar colour for everyone (brand tint); the role is told by a neutral badge, not by colour.
const ROLE_BADGE = { bg: "#F1F5F9", color: "#475569" };
const ROLE_CONFIG = {
  student: { bg: "var(--brand-soft)", label: "Student", badge: ROLE_BADGE },
  teacher: { bg: "var(--brand-soft)", label: "Teacher", badge: ROLE_BADGE },
  parent:  { bg: "var(--brand-soft)", label: "Parent",  badge: ROLE_BADGE },
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr), now = new Date(), diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function groupByDate(msgs) {
  const groups = []; let lastDate = null;
  msgs.forEach(m => {
    const d = new Date(m.createdAt).toDateString();
    if (d !== lastDate) {
      const now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
      const label = d === now.toDateString() ? "Today" : d === y.toDateString() ? "Yesterday"
        : new Date(m.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      groups.push({ type: "date", label }); lastDate = d;
    }
    groups.push({ type: "msg", ...m });
  });
  return groups;
}

function Avatar({ name, type, size = 40 }) {
  const cfg = ROLE_CONFIG[type] || ROLE_CONFIG.student;
  return (
    <div aria-hidden="true" style={{ width: size, height: size, borderRadius: "50%", background: cfg.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 700, color: "var(--brand-dark)", flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

function ContactDetailModal({ contact, onClose }) {
  const cfg = ROLE_CONFIG[contact.type] || ROLE_CONFIG.student;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, padding: 32, minWidth: 340, boxShadow: "0 20px 60px rgba(15,23,42,0.2)", animation: "fadeIn 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <Avatar name={contact.name} type={contact.type} size={56} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{contact.name}</div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: cfg.badge.bg, color: cfg.badge.color }}>{cfg.label}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contact.type === "student" && <>
            <InfoRow label="Class" value={contact.studentClass || "—"} />
            <InfoRow label="Section" value={contact.studentSection || "—"} />
            <InfoRow label="Roll Number" value={contact.studentRoll || "—"} />
          </>}
          {contact.type === "parent" && <>
            <InfoRow label="Child" value={contact.childName || "—"} />
            <InfoRow label="Class" value={contact.childClass || "—"} />
            <InfoRow label="Section" value={contact.childSection || "—"} />
            <InfoRow label="Child Roll" value={contact.childRoll || "—"} />
          </>}
          {contact.type === "teacher" && <>
            <InfoRow label="Subject" value={contact.sub || "—"} />
          </>}
        </div>
        <button onClick={onClose} style={{ marginTop: 24, width: "100%", padding: "10px", borderRadius: 12, border: "none", background: "var(--brand)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Close</button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #F1F5F9" }}>
      <span style={{ fontSize: 12, color: "#56657A", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function FileMessage({ msg, isMe }) {
  const isImage = msg.fileType?.startsWith("image/");
  return (
    <div>
      {isImage ? (
        <img src={msg.fileUrl} alt={msg.fileName} style={{ maxWidth: 220, maxHeight: 180, borderRadius: 10, display: "block", cursor: "pointer" }} onClick={() => window.open(msg.fileUrl, "_blank")} />
      ) : (
        <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: isMe ? "rgba(255,255,255,0.15)" : "#F1F5F9", borderRadius: 10, textDecoration: "none", minWidth: 180 }}>
          <div style={{ fontSize: 24 }}><Glyph e="📎" /></div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: isMe ? "white" : "#0F172A", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.fileName}</div>
            <div style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,0.7)" : "#94A3B8" }}>Click to download</div>
          </div>
        </a>
      )}
      {msg.text && <div style={{ marginTop: 6, fontSize: 13 }}>{msg.text}</div>}
    </div>
  );
}

export default function Chat() {
  const [contacts, setContacts]       = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [selected, setSelected]       = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [search, setSearch]           = useState("");
  const [filterRole, setFilterRole]   = useState("");
  const [loading, setLoading]         = useState(true);
  const [msgLoading, setMsgLoading]   = useState(false);
  const [sending, setSending]         = useState(false);
  const [adminId, setAdminId]         = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [uploading, setUploading]     = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);
  const inputRef       = useRef(null);
  const fileInputRef   = useRef(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) { const p = JSON.parse(atob(token.split(".")[1])); setAdminId(p.id || p._id); }
    } catch {}
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/chat/admin-contacts`, auth());
      setContacts(res.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  useEffect(() => {
    let list = [...contacts];
    if (filterRole) list = list.filter(c => c.type === filterRole);
    if (search) list = list.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.sub || "").toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
  }, [contacts, filterRole, search]);

  const fetchMessages = useCallback(async (roomId) => {
    try {
      const res = await axios.get(`${API}/chat/messages/${roomId}`, auth());
      setMessages(res.data.data || []);
      fetchContacts();
    } catch {}
  }, [fetchContacts]);

  const selectContact = async (contact) => {
    setSelected(contact); setMsgLoading(true); setMessages([]);
    clearInterval(pollRef.current);
    await fetchMessages(contact.roomId);
    setMsgLoading(false);
    pollRef.current = setInterval(() => fetchMessages(contact.roomId), 3000);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (fileData = null) => {
    if (!selected || sending) return;
    if (!fileData && !input.trim()) return;
    const text = input.trim();
    setInput(""); setSending(true);
    const opt = { _id: "opt_" + Date.now(), senderId: adminId, text, createdAt: new Date().toISOString(), read: false, ...(fileData || {}) };
    setMessages(prev => [...prev, opt]);
    try {
      await axios.post(`${API}/chat/messages`, { receiverId: selected.userId, roomId: selected.roomId, text, ...(fileData || {}) }, auth());
      await fetchMessages(selected.roomId);
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== opt._id));
      if (!fileData) setInput(text);
      toast.error(errorMessage(err, "Message could not be sent"));
    }
    setSending(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selected) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API}/chat/upload`, formData, {
        headers: { ...auth().headers, "Content-Type": "multipart/form-data" }
      });
      await sendMessage({ fileUrl: res.data.url, fileName: res.data.fileName || file.name, fileType: res.data.fileType || file.type, text: "" });
    } catch (err) {
      toast.error(errorMessage(err, "Could not upload the file"));
    }
    setUploading(false);
    e.target.value = "";
  };

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);
  const cfg = selected ? ROLE_CONFIG[selected.type] || ROLE_CONFIG.student : null;

  function getHeaderSub(c) {
    if (!c) return "";
    if (c.type === "student") {
      const parts = [];
      if (c.studentClass) parts.push(`Class ${c.studentClass}`);
      if (c.studentSection) parts.push(`Section ${c.studentSection}`);
      if (c.studentRoll) parts.push(`Roll ${c.studentRoll}`);
      return parts.join(" · ");
    }
    if (c.type === "parent") {
      const parts = [`Parent of ${c.childName || "Student"}`];
      if (c.childClass) parts.push(`Class ${c.childClass}`);
      if (c.childSection) parts.push(`Section ${c.childSection}`);
      return parts.join(" · ");
    }
    return c.sub || "";
  }

  return (
    <div style={{ fontFamily: "inherit", display: "flex", height: "calc(100vh - 80px)", borderRadius: "var(--ea-radius-lg)", overflow: "hidden", border: "1px solid var(--ea-line)", boxShadow: "var(--ea-shadow)", background: "var(--ea-surface)" }}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .c-row{transition:background 0.12s ease;cursor:pointer;}
        .c-row:hover{background:var(--brand-soft)!important;}
        textarea{outline:none!important;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:4px;}
        .r-scroll::-webkit-scrollbar-thumb{background:#E2E8F0;}
        .file-btn:hover{background:rgba(255,255,255,0.12)!important;}
        .hdr-click{cursor:pointer;transition:opacity 0.15s ease;}
        .hdr-click:hover{opacity:0.8;}
      `}</style>

      {/* ══ DARK LEFT SIDEBAR ══ */}
      <div className={selected ? "ea-chat-list is-hidden-phone" : "ea-chat-list"} style={{ width: 300, background: "#F8FAFC", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        <div style={{ padding: "22px 18px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>Messages</div>
              {totalUnread > 0 && <div style={{ fontSize: 11, color: "var(--brand-dark)", fontWeight: 700, marginTop: 2 }}>{totalUnread} unread</div>}
            </div>
            <button type="button" className="ea-btn ea-btn--ghost" onClick={fetchContacts} aria-label="Refresh contacts" style={{ width: 36, padding: 0 }}>
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="ea-search" style={{ marginBottom: 12 }}>
            <Search aria-hidden="true" />
            <input className="ea-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." aria-label="Search contacts" />
          </div>

          <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 3 }}>
            {[["", "All"], ["student", "Students"], ["teacher", "Teachers"], ["parent", "Parents"]].map(([val, lbl]) => (
              <button key={val} type="button" aria-pressed={filterRole === val} onClick={() => setFilterRole(val)}
                style={{ flex: 1, padding: "6px 2px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 10,
                  background: filterRole === val ? "color-mix(in srgb, var(--brand) 85%, transparent)" : "transparent",
                  color: filterRole === val ? "white" : "#64748B", transition: "all 0.15s ease" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <Skeleton rows={4} label="Loading" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "64px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}><Glyph e="💬" /></div>
              <div style={{ fontSize: 12, color: "#475569" }}>No contacts found</div>
            </div>
          ) : filtered.map((c, i) => {
            const rcfg = ROLE_CONFIG[c.type] || ROLE_CONFIG.student;
            const isActive = selected?.roomId === c.roomId;
            return (
              <div key={c.roomId} className="c-row" onClick={() => selectContact(c)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
                  background: isActive ? "color-mix(in srgb, var(--brand) 18%, transparent)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--brand)" : "3px solid transparent",
                  borderBottom: "1px solid #F8FAFC",
                  animation: `fadeIn 0.25s ease ${i * 0.02}s both` }}>
                <div style={{ position: "relative" }}>
                  <Avatar name={c.name} type={c.type} size={42} />
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: c.lastTime ? "#22C55E" : "#475569", border: "2px solid white" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 800 : 500, color: c.unread > 0 ? "#0F172A" : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: "var(--ea-muted)", flexShrink: 0 }}>{formatTime(c.lastTime)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: rcfg.badge.bg, color: rcfg.badge.color, flexShrink: 0 }}>{rcfg.label}</span>
                      <span style={{ fontSize: 11, color: "var(--ea-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.lastMsg || c.sub}
                      </span>
                    </div>
                    {c.unread > 0 && (
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--brand)", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4 }}>
                        {c.unread > 9 ? "9+" : c.unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "var(--brand-dark)" }}>A</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Admin</div>
            <div style={{ fontSize: 10, color: "var(--ea-on-card-success)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} /> Online
            </div>
          </div>
        </div>
      </div>

      {/* ══ CHAT AREA ══ */}
      <div className={selected ? "ea-chat-pane" : "ea-chat-pane is-hidden-phone"} style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>
        {selected ? (
          <>
            {/* Header — clickable for details */}
            <div className="hdr-click" onClick={() => setShowModal(true)}
              style={{ padding: "0 24px", height: 70, background: "white", borderBottom: `3px solid ${cfg?.badge?.color || "var(--brand)"}`, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 6px rgba(15,23,42,0.05)" }}>
              <button type="button" className="ea-chat-back" aria-label="Back to contacts"
                onClick={(e) => { e.stopPropagation(); setSelected(null); }}>
                <ArrowLeft size={20} aria-hidden="true" />
              </button>
              <Avatar name={selected.name} type={selected.type} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{selected.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: cfg?.badge.bg, color: cfg?.badge.color }}>{cfg?.label}</span>
                </div>
                <span style={{ fontSize: 11, color: "#56657A" }}>{getHeaderSub(selected)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="is-hidden-phone" style={{ fontSize: 10, color: "var(--ea-muted)", fontWeight: 500 }}>Click for details</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 11, color: "#166534", fontWeight: 700 }}>Live</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="r-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4, background: "white" }}>
              {msgLoading ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <Skeleton rows={4} label="Loading messages" />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <div style={{ width: 68, height: 68, borderRadius: 20, background: "white", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 14px", boxShadow: "0 4px 16px rgba(15,23,42,0.06)" }}><Glyph e="💬" /></div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>No messages yet</div>
                  <div style={{ fontSize: 12, color: "var(--ea-muted)" }}>Send the first message to {selected.name}</div>
                </div>
              ) : groupByDate(messages).map((item, i) => {
                if (item.type === "date") return (
                  <div key={"d"+i} style={{ textAlign: "center", margin: "10px 0 6px" }}>
                    <span style={{ fontSize: 11, color: "var(--ea-muted)", fontWeight: 600, background: "white", border: "1px solid #E2E8F0", padding: "3px 14px", borderRadius: 20 }}>{item.label}</span>
                  </div>
                );
                const isMe = item.senderId?.toString() === adminId?.toString() || item.senderId === adminId;
                return (
                  <div key={item._id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 2, animation: "fadeIn 0.2s ease" }}>
                    {!isMe && <Avatar name={selected.name} type={selected.type} size={26} />}
                    <div style={{ maxWidth: "62%" }}>
                      <div style={{ padding: item.fileUrl ? "8px 10px" : "10px 14px",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isMe ? "var(--brand)" : "#F1F5F9",
                        color: isMe ? "white" : "#0F172A",
                        fontSize: 13, lineHeight: 1.55,
                        border: "none",
                        boxShadow: isMe ? "0 2px 12px color-mix(in srgb, var(--brand) 25%, transparent)" : "0 1px 4px rgba(15,23,42,0.06)" }}>
                        {item.fileUrl ? <FileMessage msg={item} isMe={isMe} /> : item.text}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ea-muted)", marginTop: 4, textAlign: isMe ? "right" : "left",
                        paddingRight: isMe ? 4 : 0, paddingLeft: isMe ? 0 : 4,
                        display: "flex", alignItems: "center", gap: 4, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                        {formatTime(item.createdAt)}
                        {isMe && <span style={{ color: item.read ? "var(--brand)" : "var(--ea-muted)" }}>{item.read ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                    {isMe && <div style={{ width: 26 }} />}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "14px 24px", background: "white", borderTop: "1px solid #F1F5F9" }}>
              <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#F8FAFC", borderRadius: 14, padding: "8px 8px 8px 4px", border: "2.5px solid #E2E8F0", transition: "border-color 0.2s" }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.borderWidth = "2.5px"; }}
                onBlurCapture={e => e.currentTarget.style.borderColor = "#E2E8F0"}>
                <button className="file-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ width: 42, height: 42, borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#56657A", transition: "background 0.15s ease" }}>
                  {uploading ? <span style={{ width: 14, height: 14, border: "2px solid #E2E8F0", borderTop: "2px solid var(--brand)", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> : "+"}
                </button>
                <textarea ref={inputRef} value={input} rows={1}
                  onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Message ${selected.name}...`}
                  style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: "#0F172A", resize: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", paddingTop: 5, paddingBottom: 5 }} />
                <button onClick={() => sendMessage()} disabled={!input.trim() || sending}
                  style={{ width: 44, height: 44, borderRadius: 13, border: "none",
                    background: input.trim() ? "var(--brand)" : "#E2E8F0", color: "white",
                    cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 16, transition: "all 0.15s ease",
                    boxShadow: input.trim() ? "0 2px 10px color-mix(in srgb, var(--brand) 35%, transparent)" : "none" }}>
                  {sending ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> : "➤"}
                </button>
              </div>
              <div style={{ fontSize: 10, color: "var(--ea-faint)", marginTop: 7, textAlign: "center" }}>Enter to send · Shift+Enter for new line · + to attach files</div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 88, height: 88, borderRadius: 26, background: "white", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}><Glyph e="💬" /></div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Welcome to Messages</div>
              <div style={{ fontSize: 13, color: "var(--ea-muted)" }}>Select a contact from the sidebar to start a conversation</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {[[<Glyph e="🎓" />,"Students"],[<Glyph e="👨‍🏫" />,"Teachers"],[<Glyph e="👨‍👩‍👧" />,"Parents"]].map(([icon,label,color = "var(--ea-body)",bg = "var(--ea-hover)"]) => (
                <div key={label} style={{ padding: "12px 18px", borderRadius: 14, background: bg, border: `1px solid color-mix(in srgb, ${color} 13%, transparent)`, textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && selected && <ContactDetailModal contact={selected} onClose={() => setShowModal(false)} />}
    </div>
  );
}

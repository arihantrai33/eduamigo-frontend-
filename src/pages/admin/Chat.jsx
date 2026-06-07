import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const ROLE_CONFIG = {
  student: { bg: "#EEF2FF", color: "#6366F1", label: "Student" },
  teacher: { bg: "#F0FDF4", color: "#16A34A", label: "Teacher" },
  parent:  { bg: "#FFFBEB", color: "#D97706", label: "Parent"  },
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function Avatar({ name, type, size = 40 }) {
  const cfg = ROLE_CONFIG[type] || ROLE_CONFIG.student;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: cfg.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 600, color: cfg.color, flexShrink: 0,
      border: `1px solid ${cfg.color}22` }}>
      {getInitials(name)}
    </div>
  );
}

function groupByDate(msgs) {
  const groups = [];
  let lastDate = null;
  msgs.forEach(m => {
    const d = new Date(m.createdAt).toDateString();
    if (d !== lastDate) {
      const label = d === new Date().toDateString() ? "Today" :
        d === new Date(Date.now() - 86400000).toDateString() ? "Yesterday" :
        new Date(m.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      groups.push({ type: "date", label });
      lastDate = d;
    }
    groups.push({ type: "msg", ...m });
  });
  return groups;
}

export default function Chat() {
  const [contacts, setContacts]     = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [loading, setLoading]       = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending]       = useState(false);
  const [adminId, setAdminId]       = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAdminId(payload.id || payload._id);
      }
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
      c.sub.toLowerCase().includes(search.toLowerCase())
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
    setSelected(contact);
    setMsgLoading(true);
    setMessages([]);
    clearInterval(pollRef.current);
    await fetchMessages(contact.roomId);
    setMsgLoading(false);
    pollRef.current = setInterval(() => fetchMessages(contact.roomId), 3000);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const opt = { _id: "opt_" + Date.now(), senderId: adminId, text, createdAt: new Date().toISOString(), read: false };
    setMessages(prev => [...prev, opt]);
    try {
      await axios.post(`${API}/chat/messages`, { receiverId: selected.userId, roomId: selected.roomId, text }, auth());
      await fetchMessages(selected.roomId);
    } catch {
      setMessages(prev => prev.filter(m => m._id !== opt._id));
      setInput(text);
    }
    setSending(false);
  };

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);
  const cfg = selected ? ROLE_CONFIG[selected.type] || ROLE_CONFIG.student : null;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", display: "flex", height: "calc(100vh - 80px)", borderRadius: 20, overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(15,23,42,0.08)" }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .c-row { transition: background 0.12s ease; cursor: pointer; }
        .c-row:hover { background: #F8FAFC !important; }
        .c-row.active { background: #EEF2FF !important; border-left: 2.5px solid #6366F1 !important; }
        textarea { outline: none !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: 300, background: "white", borderRight: "1px solid #F1F5F9", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Messages</div>
              {totalUnread > 0 && (
                <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, marginTop: 2 }}>{totalUnread} unread</div>
              )}
            </div>
            <button onClick={fetchContacts} title="Refresh"
              style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ↺
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>��</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
              style={{ width: "100%", padding: "9px 12px 9px 32px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 12, color: "#0F172A", background: "#F8FAFC", boxSizing: "border-box", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#6366F1"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          </div>

          {/* Role Chips */}
          <div style={{ display: "flex", gap: 6 }}>
            {[["", "All"], ["student", "Students"], ["teacher", "Teachers"], ["parent", "Parents"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilterRole(val)}
                style={{ flex: 1, padding: "5px 4px", borderRadius: 20, border: "1px solid " + (filterRole === val ? "#6366F1" : "#E2E8F0"),
                  background: filterRole === val ? "#6366F1" : "white",
                  color: filterRole === val ? "white" : "#64748B",
                  fontWeight: 600, fontSize: 10, cursor: "pointer", transition: "all 0.15s ease" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid #E2E8F0", borderTop: "2.5px solid #6366F1", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 12, color: "#94A3B8" }}>Loading contacts...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "64px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>No contacts found</div>
            </div>
          ) : filtered.map((c, i) => {
            const rcfg = ROLE_CONFIG[c.type] || ROLE_CONFIG.student;
            const isActive = selected?.roomId === c.roomId;
            return (
              <div key={c.roomId} className={`c-row${isActive ? " active" : ""}`}
                onClick={() => selectContact(c)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
                  borderLeft: isActive ? "2.5px solid #6366F1" : "2.5px solid transparent",
                  borderBottom: "1px solid #F8FAFC",
                  animation: `fadeIn 0.25s ease ${i * 0.02}s both` }}>

                <div style={{ position: "relative" }}>
                  <Avatar name={c.name} type={c.type} size={42} />
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%",
                    background: c.lastTime ? "#22C55E" : "#94A3B8", border: "2px solid white" }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 700 : 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0 }}>{formatTime(c.lastTime)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20,
                        background: rcfg.bg, color: rcfg.color, flexShrink: 0 }}>{rcfg.label}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.lastMsg || c.sub}
                      </span>
                    </div>
                    {c.unread > 0 && (
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#6366F1", color: "white",
                        fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4 }}>
                        {c.unread > 9 ? "9+" : c.unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin tag */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>A</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Admin</div>
            <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} /> Online
            </div>
          </div>
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: "0 24px", height: 68, background: "white", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 6px rgba(15,23,42,0.05)" }}>
              <Avatar name={selected.name} type={selected.type} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{selected.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: cfg?.bg, color: cfg?.color }}>
                    {cfg?.label}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{selected.sub}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>Live</span>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
              {msgLoading ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #E2E8F0", borderTop: "3px solid #6366F1", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <div style={{ width: 68, height: 68, borderRadius: 20, background: "white", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 14px", boxShadow: "0 4px 16px rgba(15,23,42,0.06)" }}>💬</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>No messages yet</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>Send the first message to {selected.name}</div>
                </div>
              ) : groupByDate(messages).map((item, i) => {
                if (item.type === "date") return (
                  <div key={"d" + i} style={{ textAlign: "center", margin: "10px 0 6px" }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, background: "white", border: "1px solid #E2E8F0", padding: "3px 14px", borderRadius: 20 }}>{item.label}</span>
                  </div>
                );
                const isMe = item.senderId?.toString() === adminId?.toString() || item.senderId === adminId;
                return (
                  <div key={item._id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 2, animation: "fadeIn 0.2s ease" }}>
                    {!isMe && <Avatar name={selected.name} type={selected.type} size={26} />}
                    <div style={{ maxWidth: "62%" }}>
                      <div style={{
                        padding: "10px 14px",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isMe ? "#6366F1" : "white",
                        color: isMe ? "white" : "#0F172A",
                        fontSize: 13, lineHeight: 1.55,
                        border: isMe ? "none" : "1px solid #E2E8F0",
                        boxShadow: isMe ? "0 2px 12px rgba(99,102,241,0.25)" : "0 1px 4px rgba(15,23,42,0.06)"
                      }}>
                        {item.text}
                      </div>
                      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4,
                        textAlign: isMe ? "right" : "left",
                        paddingRight: isMe ? 4 : 0, paddingLeft: isMe ? 0 : 4,
                        display: "flex", alignItems: "center", gap: 4,
                        justifyContent: isMe ? "flex-end" : "flex-start" }}>
                        {formatTime(item.createdAt)}
                        {isMe && <span style={{ color: item.read ? "#6366F1" : "#94A3B8" }}>{item.read ? "✓✓" : "✓"}</span>}
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
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#F8FAFC", borderRadius: 14, padding: "8px 8px 8px 16px", border: "1.5px solid #E2E8F0", transition: "border-color 0.2s" }}
                onFocusCapture={e => e.currentTarget.style.borderColor = "#6366F1"}
                onBlurCapture={e => e.currentTarget.style.borderColor = "#E2E8F0"}>
                <textarea ref={inputRef} value={input} rows={1}
                  onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Message ${selected.name}...`}
                  style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: "#0F172A", resize: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", paddingTop: 5, paddingBottom: 5 }} />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  style={{ width: 38, height: 38, borderRadius: 11, border: "none",
                    background: input.trim() ? "#6366F1" : "#E2E8F0",
                    color: "white", cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    fontSize: 16, transition: "all 0.15s ease",
                    boxShadow: input.trim() ? "0 2px 10px rgba(99,102,241,0.35)" : "none" }}>
                  {sending
                    ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    : "➤"}
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 7, textAlign: "center" }}>Enter to send · Shift+Enter for new line</div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 88, height: 88, borderRadius: 26, background: "white", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: "0 4px 24px rgba(15,23,42,0.07)" }}>💬</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Welcome to Messages</div>
              <div style={{ fontSize: 13, color: "#94A3B8" }}>Select a contact from the sidebar to start a conversation</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {[["🎓", "Students", "#6366F1", "#EEF2FF"], ["👨‍🏫", "Teachers", "#16A34A", "#F0FDF4"], ["👨‍👩‍👧", "Parents", "#D97706", "#FFFBEB"]].map(([icon, label, color, bg]) => (
                <div key={label} style={{ padding: "12px 18px", borderRadius: 14, background: bg, border: `1px solid ${color}22`, textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

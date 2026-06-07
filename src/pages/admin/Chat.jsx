import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const ROLE_CONFIG = {
  student: { bg: "linear-gradient(135deg,#6366F1,#8B5CF6)", label: "Student",  dot: "#818CF8" },
  teacher: { bg: "linear-gradient(135deg,#10B981,#059669)", label: "Teacher",  dot: "#34D399" },
  parent:  { bg: "linear-gradient(135deg,#F59E0B,#D97706)", label: "Parent",   dot: "#FCD34D" },
};

const ROLE_BADGE = {
  student: { bg: "#EEF2FF", color: "#6366F1" },
  teacher: { bg: "#F0FDF4", color: "#16A34A" },
  parent:  { bg: "#FFFBEB", color: "#D97706" },
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

function Avatar({ name, type, size = 40, showStatus = false }) {
  const cfg = ROLE_CONFIG[type] || ROLE_CONFIG.student;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.3,
        background: cfg.bg, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: size * 0.33, fontWeight: 800, color: "white",
        letterSpacing: "-0.5px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        {getInitials(name)}
      </div>
      {showStatus && (
        <div style={{
          position: "absolute", bottom: -1, right: -1,
          width: size * 0.28, height: size * 0.28, borderRadius: "50%",
          background: cfg.dot, border: "2px solid #1E293B"
        }} />
      )}
    </div>
  );
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const optimistic = { _id: "opt_" + Date.now(), senderId: adminId, text, createdAt: new Date().toISOString(), read: false };
    setMessages(prev => [...prev, optimistic]);
    try {
      await axios.post(`${API}/chat/messages`, { receiverId: selected.userId, roomId: selected.roomId, text }, auth());
      await fetchMessages(selected.roomId);
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setInput(text);
    }
    setSending(false);
  };

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  // Group messages by date
  function groupByDate(msgs) {
    const groups = [];
    let lastDate = null;
    msgs.forEach(m => {
      const d = new Date(m.createdAt).toDateString();
      if (d !== lastDate) { groups.push({ type: "date", label: d === new Date().toDateString() ? "Today" : d }); lastDate = d; }
      groups.push({ type: "msg", ...m });
    });
    return groups;
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", display: "flex", height: "calc(100vh - 80px)", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px rgba(15,23,42,0.15)" }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes blink   { 0%,80%,100% { opacity:0; } 40% { opacity:1; } }
        .c-row:hover { background: rgba(255,255,255,0.07) !important; }
        .c-row { transition: all 0.15s ease; cursor: pointer; }
        .msg-bubble { transition: transform 0.1s ease; }
        .msg-bubble:hover { transform: scale(1.01); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .right-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; }
        textarea:focus { outline: none !important; }
      `}</style>

      {/* ═══ LEFT SIDEBAR ═══ */}
      <div style={{ width: 300, background: "linear-gradient(180deg,#0F172A 0%,#1E293B 100%)", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Sidebar Header */}
        <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "white", letterSpacing: "-0.3px" }}>Messages</div>
              {totalUnread > 0 && (
                <div style={{ fontSize: 11, color: "#818CF8", fontWeight: 700, marginTop: 2 }}>
                  {totalUnread} unread
                </div>
              )}
            </div>
            <button onClick={fetchContacts}
              style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.08)", cursor: "pointer", fontSize: 14, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ��
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 12, marginTop: 14 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#64748B" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)", fontSize: 12, color: "white", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          {/* Role Filter Tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3 }}>
            {[["", "All"], ["student", "Students"], ["teacher", "Teachers"], ["parent", "Parents"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilterRole(val)}
                style={{ flex: 1, padding: "6px 2px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 10,
                  background: filterRole === val ? "rgba(99,102,241,0.9)" : "transparent",
                  color: filterRole === val ? "white" : "#64748B",
                  transition: "all 0.2s ease" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #6366F1", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 11, color: "#475569" }}>Loading...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>💬</div>
              <div style={{ fontSize: 12, color: "#475569" }}>No contacts found</div>
            </div>
          ) : filtered.map((c, i) => {
            const isActive = selected?.roomId === c.roomId;
            const cfg = ROLE_CONFIG[c.type] || ROLE_CONFIG.student;
            return (
              <div key={c.roomId} className="c-row" onClick={() => selectContact(c)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                  background: isActive ? "rgba(99,102,241,0.18)" : "transparent",
                  borderLeft: isActive ? "3px solid #6366F1" : "3px solid transparent",
                  animation: `slideIn 0.3s ease ${i * 0.02}s both` }}>

                <Avatar name={c.name} type={c.type} size={44} showStatus={true} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 800 : 600, color: c.unread > 0 ? "white" : "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: "#475569", flexShrink: 0 }}>{formatTime(c.lastTime)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                      {c.lastMsg || c.sub}
                    </span>
                    {c.unread > 0 && (
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#6366F1", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: "pulse 2s infinite" }}>
                        {c.unread > 9 ? "9+" : c.unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>A</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>Admin</div>
            <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 600 }}>● Online</div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CHAT AREA ═══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: "0 28px", height: 70, background: "white", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 8px rgba(15,23,42,0.06)" }}>
              <Avatar name={selected.name} type={selected.type} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{selected.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ROLE_BADGE[selected.type]?.bg, color: ROLE_BADGE[selected.type]?.color }}>
                    {ROLE_CONFIG[selected.type]?.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{selected.sub}</div>
              </div>

              {/* Header Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700 }}>Live</span>
                </div>
                <button onClick={() => fetchMessages(selected.roomId)}
                  style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  🔄
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="right-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 4,
              backgroundImage: "radial-gradient(circle at 20px 20px, rgba(99,102,241,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }}>
              {msgLoading ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #E2E8F0", borderTop: "3px solid #6366F1", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>💬</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Start the conversation</div>
                  <div style={{ fontSize: 13, color: "#94A3B8" }}>Send a message to {selected.name}</div>
                </div>
              ) : (
                groupByDate(messages).map((item, i) => {
                  if (item.type === "date") return (
                    <div key={i} style={{ textAlign: "center", margin: "12px 0 8px" }}>
                      <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, background: "rgba(148,163,184,0.12)", padding: "4px 14px", borderRadius: 20 }}>{item.label}</span>
                    </div>
                  );
                  const isMe = item.senderId?.toString() === adminId?.toString() || item.senderId === adminId;
                  const prevItem = groupByDate(messages)[i - 1];
                  const prevIsMe = prevItem?.type === "msg" && (prevItem.senderId?.toString() === adminId?.toString());
                  const showAvatar = !isMe && prevIsMe !== false;
                  return (
                    <div key={item._id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 2, animation: "fadeIn 0.2s ease" }}>
                      {!isMe && <Avatar name={selected.name} type={selected.type} size={28} />}
                      <div className="msg-bubble" style={{ maxWidth: "60%" }}>
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          background: isMe ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "white",
                          color: isMe ? "white" : "#0F172A",
                          boxShadow: isMe ? "0 4px 16px rgba(99,102,241,0.35)" : "0 2px 10px rgba(15,23,42,0.08)",
                          fontSize: 13, lineHeight: 1.55
                        }}>
                          {item.text}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, textAlign: isMe ? "right" : "left", paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0, display: "flex", alignItems: "center", justifyContent: isMe ? "flex-end" : "flex-start", gap: 4 }}>
                          {formatTime(item.createdAt)}
                          {isMe && <span style={{ color: item.read ? "#6366F1" : "#94A3B8", fontSize: 11 }}>{item.read ? "✓✓" : "✓"}</span>}
                        </div>
                      </div>
                      {isMe && <div style={{ width: 28 }} />}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: "16px 28px", background: "white", borderTop: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", background: "#F8FAFC", borderRadius: 16, padding: "8px 8px 8px 16px", border: "1.5px solid #E2E8F0", transition: "border-color 0.2s" }}
                onFocusCapture={e => e.currentTarget.style.borderColor = "#6366F1"}
                onBlurCapture={e => e.currentTarget.style.borderColor = "#E2E8F0"}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Message ${selected.name}...`}
                  rows={1}
                  style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: "#0F172A", resize: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", paddingTop: 6, paddingBottom: 6 }}
                />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  style={{ width: 42, height: 42, borderRadius: 12, border: "none",
                    background: input.trim() ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "#E2E8F0",
                    color: "white", cursor: input.trim() ? "pointer" : "default", fontSize: 16,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    boxShadow: input.trim() ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
                    transition: "all 0.2s ease" }}>
                  {sending
                    ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    : "➤"}
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 8, textAlign: "center" }}>
                Enter to send · Shift+Enter for new line
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 100, height: 100, borderRadius: 28, background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "0 8px 32px rgba(99,102,241,0.15)" }}>💬</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Welcome to Messages</div>
              <div style={{ fontSize: 13, color: "#94A3B8" }}>Select a contact from the sidebar to start a conversation</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {[["🎓", "Students", "#6366F1", "#EEF2FF"], ["👨‍🏫", "Teachers", "#16A34A", "#F0FDF4"], ["👨‍👩‍👧", "Parents", "#D97706", "#FFFBEB"]].map(([icon, label, color, bg]) => (
                <div key={label} style={{ padding: "12px 20px", borderRadius: 14, background: bg, border: `1px solid ${color}22`, textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

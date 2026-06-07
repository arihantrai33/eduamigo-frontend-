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
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
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

  // Get admin userId from token
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
      const data = res.data.data || [];
      setContacts(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Filter contacts
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
      // Mark as read — refresh contacts unread count
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
    // Poll every 3 seconds
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
    // Optimistic update
    const optimistic = { _id: "opt_" + Date.now(), senderId: adminId, text, createdAt: new Date().toISOString(), read: false };
    setMessages(prev => [...prev, optimistic]);
    try {
      await axios.post(`${API}/chat/messages`, {
        receiverId: selected.userId,
        roomId: selected.roomId,
        text,
      }, auth());
      await fetchMessages(selected.roomId);
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setInput(text);
    }
    setSending(false);
  };

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", display: "flex", height: "calc(100vh - 80px)", gap: 0, background: "#F8FAFC", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 32px rgba(15,23,42,0.10)", border: "1px solid #E2E8F0" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .contact-row:hover { background: #F1F5F9 !important; }
        .contact-row { transition: background 0.15s ease; cursor: pointer; }
        .send-btn:hover { transform: scale(1.05); }
        .send-btn { transition: transform 0.15s ease; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
      `}</style>

      {/* LEFT PANEL — Contacts */}
      <div style={{ width: 320, background: "white", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Messages</div>
              {totalUnread > 0 && (
                <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 700, marginTop: 2 }}>{totalUnread} unread message{totalUnread > 1 ? "s" : ""}</div>
              )}
            </div>
            <button onClick={fetchContacts} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F1F5F9", cursor: "pointer", fontSize: 14 }}>🔄</button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
              style={{ width: "100%", padding: "9px 12px 9px 32px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#F8FAFC" }}
              onFocus={e => e.target.style.borderColor = "#6366F1"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          </div>

          {/* Role Filter */}
          <div style={{ display: "flex", gap: 6 }}>
            {[["", "All"], ["student", "Students"], ["teacher", "Teachers"], ["parent", "Parents"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilterRole(val)}
                style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 10,
                  background: filterRole === val ? "#6366F1" : "#F1F5F9",
                  color: filterRole === val ? "white" : "#64748B" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #E2E8F0", borderTop: "3px solid #6366F1", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 12, color: "#94A3B8" }}>Loading contacts...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>No contacts found</div>
            </div>
          ) : filtered.map((c, i) => {
            const cfg = ROLE_CONFIG[c.type] || ROLE_CONFIG.student;
            const isActive = selected?.roomId === c.roomId;
            return (
              <div key={c.roomId} className="contact-row" onClick={() => selectContact(c)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  background: isActive ? "#EEF2FF" : "white",
                  borderLeft: isActive ? "3px solid #6366F1" : "3px solid transparent",
                  borderBottom: "1px solid #F8FAFC",
                  animation: `fadeUp 0.3s ease ${i * 0.03}s both` }}>

                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: 13, background: cfg.bg, color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0, position: "relative" }}>
                  {getInitials(c.name)}
                  {c.unread > 0 && (
                    <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "#EF4444", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                      {c.unread > 9 ? "9+" : c.unread}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 800 : 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0, marginLeft: 4 }}>{formatTime(c.lastTime)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastMsg || c.sub}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL — Messages */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: "16px 24px", background: "white", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: ROLE_CONFIG[selected.type]?.bg, color: ROLE_CONFIG[selected.type]?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                {getInitials(selected.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{selected.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 20, background: ROLE_CONFIG[selected.type]?.bg, color: ROLE_CONFIG[selected.type]?.color }}>
                    {ROLE_CONFIG[selected.type]?.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{selected.sub}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: "#22C55E", fontWeight: 700 }}>Live</span>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              {msgLoading ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #E2E8F0", borderTop: "3px solid #6366F1", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8" }}>No messages yet</div>
                  <div style={{ fontSize: 12, color: "#CBD5E1", marginTop: 4 }}>Send the first message to {selected.name}</div>
                </div>
              ) : messages.map((m, i) => {
                const isMe = m.senderId?.toString() === adminId?.toString() || m.senderId === adminId;
                const showTime = i === 0 || (new Date(m.createdAt) - new Date(messages[i-1]?.createdAt)) > 300000;
                return (
                  <div key={m._id || i} style={{ animation: `fadeUp 0.2s ease` }}>
                    {showTime && (
                      <div style={{ textAlign: "center", fontSize: 10, color: "#CBD5E1", fontWeight: 600, margin: "8px 0" }}>
                        {formatTime(m.createdAt)}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      {!isMe && (
                        <div style={{ width: 28, height: 28, borderRadius: 9, background: ROLE_CONFIG[selected.type]?.bg, color: ROLE_CONFIG[selected.type]?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>
                          {getInitials(selected.name)}
                        </div>
                      )}
                      <div style={{ maxWidth: "65%", padding: "10px 14px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isMe ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "white",
                        color: isMe ? "white" : "#0F172A",
                        boxShadow: isMe ? "0 4px 12px rgba(99,102,241,0.3)" : "0 2px 8px rgba(15,23,42,0.08)",
                        fontSize: 13, lineHeight: 1.5 }}>
                        <div>{m.text}</div>
                        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: isMe ? "right" : "left", display: "flex", alignItems: "center", justifyContent: isMe ? "flex-end" : "flex-start", gap: 4 }}>
                          {formatTime(m.createdAt)}
                          {isMe && <span>{m.read ? "✓✓" : "✓"}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: "16px 24px", background: "white", borderTop: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={`Message ${selected.name}...`}
                    rows={1}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", background: "#F8FAFC", maxHeight: 120, overflowY: "auto" }}
                    onFocus={e => e.target.style.borderColor = "#6366F1"}
                    onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                  />
                </div>
                <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || sending}
                  style={{ width: 46, height: 46, borderRadius: 14, border: "none", background: input.trim() ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "#E2E8F0", color: "white", cursor: input.trim() ? "pointer" : "default", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: input.trim() ? "0 4px 14px rgba(99,102,241,0.4)" : "none", transition: "all 0.2s ease" }}>
                  {sending ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> : "➤"}
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 6, textAlign: "center" }}>Press Enter to send · Shift+Enter for new line</div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Select a conversation</div>
            <div style={{ fontSize: 13, color: "#94A3B8" }}>Choose a contact from the left to start messaging</div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const ROLE = {
  student: { gradient: "linear-gradient(135deg,#6366F1,#8B5CF6)", badge_bg: "#EEF2FF", badge_color: "#6366F1", label: "Student",  dot: "#818CF8" },
  teacher: { gradient: "linear-gradient(135deg,#10B981,#059669)", badge_bg: "#F0FDF4", badge_color: "#16A34A", label: "Teacher",  dot: "#34D399" },
  parent:  { gradient: "linear-gradient(135deg,#F59E0B,#D97706)", badge_bg: "#FFFBEB", badge_color: "#D97706", label: "Parent",   dot: "#FCD34D" },
};

function initials(name) {
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

function formatDateLabel(dateStr) {
  const d = new Date(dateStr), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function Avatar({ name, type, size = 40 }) {
  const r = ROLE[type] || ROLE.student;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: r.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color: "white", flexShrink: 0, letterSpacing: "-0.5px" }}>
      {initials(name)}
    </div>
  );
}

function RoleBadge({ type }) {
  const r = ROLE[type] || ROLE.student;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: r.badge_bg, color: r.badge_color, letterSpacing: "0.02em" }}>
      {r.label}
    </span>
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
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const inputRef   = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    try {
      const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
      setAdminId(p.id || p._id);
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

  const selectContact = async (c) => {
    setSelected(c);
    setMsgLoading(true);
    setMessages([]);
    clearInterval(pollRef.current);
    await fetchMessages(c.roomId);
    setMsgLoading(false);
    pollRef.current = setInterval(() => fetchMessages(c.roomId), 3000);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return;
    const text = input.trim();
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    setSending(true);
    const opt = { _id: "opt_" + Date.now(), senderId: adminId, text, createdAt: new Date().toISOString(), read: false };
    setMessages(p => [...p, opt]);
    try {
      await axios.post(`${API}/chat/messages`, { receiverId: selected.userId, roomId: selected.roomId, text }, auth());
      await fetchMessages(selected.roomId);
    } catch {
      setMessages(p => p.filter(m => m._id !== opt._id));
      setInput(text);
    }
    setSending(false);
  };

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  messages.forEach(m => {
    const d = new Date(m.createdAt).toDateString();
    if (d !== lastDate) { grouped.push({ _type: "date", label: formatDateLabel(m.createdAt), key: d }); lastDate = d; }
    grouped.push({ _type: "msg", ...m });
  });

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div style={{ fontFamily: "Inter,sans-serif", display: "flex", height: "calc(100vh - 80px)", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 32px rgba(15,23,42,0.10)", border: "1px solid #E2E8F0", background: "white" }}>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(6px);  } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn  { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin     { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        .c-item { transition: background 0.15s ease; cursor: pointer; border-left: 3px solid transparent; }
        .c-item:hover { background: #F8FAFC !important; }
        .c-item.active { background: #EEF2FF !important; border-left-color: #6366F1 !important; }
        .bubble { transition: transform 0.1s ease; }
        .bubble:hover { transform: scale(1.01); }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 6px 20px rgba(99,102,241,0.45) !important; }
        .send-btn { transition: all 0.2s ease; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        input::placeholder, textarea::placeholder { color: #94A3B8; }
        textarea { outline: none !important; border: none !important; }
      `}</style>

      {/* ══════════════════════════════
          LEFT PANEL
      ══════════════════════════════ */}
      <div style={{ width: 320, borderRight: "1px solid #F1F5F9", display: "flex", flexDirection: "column", background: "white" }}>

        {/* Header */}
        <div style={{ padding: "22px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#0F172A" }}>Messages</div>
              {totalUnread > 0 && (
                <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 700, marginTop: 1 }}>{totalUnread} unread</div>
              )}
            </div>
            <button onClick={fetchContacts}
              style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}
              title="Refresh">
              ↻
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8", pointerEvents: "none" }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..."
              style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#0F172A", boxSizing: "border-box", fontFamily: "inherit", outline: "none", background: "#F8FAFC", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#6366F1"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[["", "All"], ["student", "Students"], ["teacher", "Teachers"], ["parent", "Parents"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilterRole(val)}
                style={{ flex: 1, padding: "7px 4px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 10,
                  background: filterRole === val ? "#6366F1" : "#F1F5F9",
                  color: filterRole === val ? "white" : "#64748B",
                  transition: "all 0.2s" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#F1F5F9", margin: "8px 0 0" }} />

        {/* Contacts */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid #E2E8F0", borderTop: "2.5px solid #6366F1", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
              <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>Loading contacts...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>No contacts found</div>
            </div>
          ) : filtered.map((c, i) => (
            <div key={c.roomId}
              className={`c-item${selected?.roomId === c.roomId ? " active" : ""}`}
              onClick={() => selectContact(c)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", animation: `slideIn 0.25s ease ${i * 0.02}s both` }}>

              <div style={{ position: "relative" }}>
                <Avatar name={c.name} type={c.type} size={46} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: ROLE[c.type]?.dot || "#94A3B8", border: "2px solid white" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 800 : 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{c.name}</span>
                  <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0, fontWeight: 500 }}>{formatTime(c.lastTime)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    <RoleBadge type={c.type} />
                    <span style={{ fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.lastMsg || c.sub}
                    </span>
                  </div>
                  {c.unread > 0 && (
                    <div style={{ minWidth: 18, height: 18, borderRadius: 9, background: "#6366F1", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0 }}>
                      {c.unread > 9 ? "9+" : c.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>A</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Admin</div>
            <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} /> Online
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          RIGHT — CHAT AREA
      ══════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F8FAFC", minWidth: 0 }}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div style={{ height: 68, padding: "0 24px", background: "white", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 6px rgba(15,23,42,0.05)", flexShrink: 0 }}>
              <Avatar name={selected.name} type={selected.type} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{selected.name}</span>
                  <RoleBadge type={selected.type} />
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>{selected.sub}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700 }}>Live</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px", display: "flex", flexDirection: "column", gap: 2 }}>
              {msgLoading ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #E2E8F0", borderTop: "3px solid #6366F1", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
                  <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>Loading messages...</div>
                </div>
              ) : grouped.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 24, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px", boxShadow: "0 4px 20px rgba(15,23,42,0.08)" }}>💬</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>No messages yet</div>
                  <div style={{ fontSize: 13, color: "#94A3B8" }}>Start the conversation with {selected.name}</div>
                </div>
              ) : grouped.map((item, i) => {
                if (item._type === "date") return (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 10px" }}>
                    <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, whiteSpace: "nowrap", padding: "3px 12px", background: "white", borderRadius: 20, border: "1px solid #E2E8F0" }}>{item.label}</span>
                    <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                  </div>
                );

                const isMe = item.senderId?.toString() === adminId?.toString() || item.senderId === adminId;

                return (
                  <div key={item._id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 3, animation: "fadeUp 0.2s ease" }}>
                    {!isMe && <Avatar name={selected.name} type={selected.type} size={30} />}
                    <div className="bubble" style={{ maxWidth: "58%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{
                        padding: "11px 15px",
                        borderRadius: isMe ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
                        background: isMe ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "white",
                        color: isMe ? "white" : "#0F172A",
                        boxShadow: isMe ? "0 4px 16px rgba(99,102,241,0.3)" : "0 2px 8px rgba(15,23,42,0.07)",
                        fontSize: 13, lineHeight: 1.55, wordBreak: "break-word"
                      }}>
                        {item.text}
                      </div>
                      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, display: "flex", alignItems: "center", gap: 3, paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0 }}>
                        {formatTime(item.createdAt)}
                        {isMe && <span style={{ color: item.read ? "#6366F1" : "#CBD5E1", fontSize: 12 }}>{item.read ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                    {isMe && <Avatar name="Admin" type="student" size={30} />}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "14px 24px 18px", background: "white", borderTop: "1px solid #F1F5F9", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "#F8FAFC", borderRadius: 16, padding: "8px 8px 8px 18px", border: "1.5px solid #E2E8F0", transition: "border-color 0.2s, box-shadow 0.2s" }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)"; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}>
                <textarea ref={el => { inputRef.current = el; textareaRef.current = el; }}
                  value={input}
                  onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Message ${selected.name}...`}
                  rows={1}
                  style={{ flex: 1, background: "transparent", fontSize: 13, color: "#0F172A", resize: "none", fontFamily: "inherit", lineHeight: 1.55, maxHeight: 100, overflowY: "auto", padding: "5px 0" }}
                />
                <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || sending}
                  style={{ width: 40, height: 40, borderRadius: 12, border: "none", flexShrink: 0,
                    background: input.trim() ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "#E2E8F0",
                    color: input.trim() ? "white" : "#94A3B8",
                    cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                    boxShadow: input.trim() ? "0 4px 14px rgba(99,102,241,0.35)" : "none" }}>
                  {sending
                    ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    : "➤"}
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 7, textAlign: "center", fontWeight: 500 }}>
                Enter to send · Shift + Enter for new line
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
            <div style={{ width: 96, height: 96, borderRadius: 28, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "0 8px 32px rgba(99,102,241,0.12)", border: "1px solid #E2E8F0" }}>💬</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>Your Messages</div>
              <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>Select a contact from the left panel<br/>to view or start a conversation.</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {[["🎓","Students","#6366F1","#EEF2FF"],["👨‍🏫","Teachers","#16A34A","#F0FDF4"],["👨‍👩‍👧","Parents","#D97706","#FFFBEB"]].map(([icon,label,color,bg]) => (
                <div key={label} onClick={() => setFilterRole(label.toLowerCase().slice(0,-1))}
                  style={{ padding: "14px 22px", borderRadius: 16, background: bg, border: `1.5px solid ${color}22`, textAlign: "center", cursor: "pointer", transition: "transform 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ fontSize: 24, marginBottom: 5 }}>{icon}</div>
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

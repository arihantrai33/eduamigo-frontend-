import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const mockTeachers = [
  { id: "TCH001", name: "Mr. Sharma",  subject: "Mathematics"       },
  { id: "TCH002", name: "Ms. Verma",   subject: "Physics"            },
  { id: "TCH003", name: "Mr. Joshi",   subject: "Chemistry"          },
  { id: "TCH004", name: "Mrs. Gupta",  subject: "English Literature" },
  { id: "TCH005", name: "Mrs. Singh",  subject: "Hindi"              },
  { id: "TCH006", name: "Mr. Kapoor",  subject: "Computer Science"   },
];

const subjectColors = ["#4f46e5","#7c3aed","#0891b2","#059669","#d97706","#dc2626"];

const initialMessages = {
  TCH001: [
    { id: "1", text: "Hello Rahul! Any doubts in Mathematics?", senderId: "TCH001", createdAt: new Date(Date.now() - 300000) },
    { id: "2", text: "Yes sir, I have a doubt in Chapter 8 Trigonometry.", senderId: "student", createdAt: new Date(Date.now() - 240000) },
    { id: "3", text: "Sure! Come to my desk after class tomorrow.", senderId: "TCH001", createdAt: new Date(Date.now() - 180000) },
  ],
  TCH002: [
    { id: "1", text: "Rahul, your Physics practical file is due tomorrow!", senderId: "TCH002", createdAt: new Date(Date.now() - 600000) },
  ],
  TCH003: [], TCH004: [], TCH005: [], TCH006: [],
};

export default function Chat() {
  const [teachers]              = useState(mockTeachers);
  const [activeChat, setActiveChat] = useState(null);
  const [allMessages, setAllMessages] = useState(initialMessages);
  const [input, setInput]       = useState("");
  const { user }                = useAuth();
  const navigate                = useNavigate();
  const messagesEndRef          = useRef(null);

  const messages = activeChat ? (allMessages[activeChat.teacherId] || []) : [];

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;
    const newMsg = {
      id: Date.now().toString(),
      text: input.trim(),
      senderId: user?.id || "student",
      createdAt: new Date(),
    };
    setAllMessages(prev => ({
      ...prev,
      [activeChat.teacherId]: [...(prev[activeChat.teacherId] || []), newMsg],
    }));
    setInput("");
  };

  const formatTime = (date) => {
    try {
      return date instanceof Date
        ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : date?.toDate?.().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) || "";
    } catch { return ""; }
  };

  const getUnread = (teacherId) => (allMessages[teacherId] || []).filter(m => m.senderId !== (user?.id || "student")).length;
  const getLastMsg = (teacherId) => {
    const msgs = allMessages[teacherId] || [];
    return msgs.length ? msgs[msgs.length - 1].text : "Tap to start chatting";
  };

  // ── Chat window ──
  if (activeChat) return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "#f5f6fa", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 16px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={() => setActiveChat(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "18px" }}>←</button>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "18px", flexShrink: 0 }}>
          {activeChat.teacherName[0]}
        </div>
        <div>
          <div style={{ fontWeight: "700", fontSize: "15px" }}>{activeChat.teacherName}</div>
          <div style={{ fontSize: "11px", opacity: 0.8 }}>{activeChat.subject} • Online</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: "13px" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>💬</div>
            Start a conversation with {activeChat.teacherName}
          </div>
        )}
        {messages.map(m => {
          const isMe = m.senderId === (user?.id || "student");
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              {!isMe && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "12px", marginRight: "8px", flexShrink: 0, alignSelf: "flex-end" }}>
                  {activeChat.teacherName[0]}
                </div>
              )}
              <div style={{
                maxWidth: "75%", padding: "10px 14px",
                borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: isMe ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "white",
                color: isMe ? "white" : "#111",
                fontSize: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}>
                {m.text}
                <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px", textAlign: "right" }}>
                  {formatTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", background: "white", display: "flex", gap: "10px", alignItems: "center", boxShadow: "0 -2px 8px rgba(0,0,0,0.06)", flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={`Message ${activeChat.teacherName}...`}
          style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: "24px", padding: "10px 16px", fontSize: "14px", outline: "none", fontFamily: "sans-serif" }}
        />
        <button onClick={sendMessage} style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: "50%", width: "44px", height: "44px", fontSize: "18px", cursor: "pointer", flexShrink: 0 }}>
          ➤
        </button>
      </div>
    </div>
  );

  // ── Teacher list ──
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "#f5f6fa", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "48px 16px 40px", color: "white", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "18px" }}>←</button>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>💬 Chat with Teachers</h2>
        </div>
        <p style={{ margin: "8px 0 0 50px", fontSize: "13px", opacity: 0.8 }}>Your subject teachers — Class X-A</p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", marginTop: "-20px" }}>
        {teachers.map((t, i) => {
          const unread  = getUnread(t.id);
          const lastMsg = getLastMsg(t.id);
          return (
            <div key={t.id} onClick={() => setActiveChat({ teacherId: t.id, teacherName: t.name, subject: t.subject })}
              style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: subjectColors[i % subjectColors.length], display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "20px", flexShrink: 0 }}>
                {t.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", fontSize: "14px", color: "#111" }}>{t.name}</div>
                <div style={{ fontSize: "12px", color: "#4f46e5", fontWeight: "600", marginBottom: "2px" }}>{t.subject}</div>
                <div style={{ fontSize: "12px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastMsg}</div>
              </div>
              {unread > 0 && (
                <div style={{ background: "#4f46e5", color: "white", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
                  {unread}
                </div>
              )}
              <div style={{ fontSize: "20px", color: "#ccc" }}>›</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
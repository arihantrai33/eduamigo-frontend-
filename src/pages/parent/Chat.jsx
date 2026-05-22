// src/pages/parent/Chat.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import { useAuth } from "../../context/AuthContext";

function BottomNav({ active }) {
  const navigate = useNavigate();
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"white", borderTop:"1px solid #eee", display:"flex", padding:"8px 0 16px", boxShadow:"0 -4px 12px rgba(0,0,0,0.06)" }}>
      {[
        { icon:"🏠", label:"Home", path:"/parent/home" },
        { icon:"💬", label:"Teachers", path:"/parent/chat" },
        { icon:"💳", label:"Fees", path:"/parent/fee" },
        { icon:"🔔", label:"Alerts", path:"/parent/notifications" },
        { icon:"👤", label:"Me", path:"/parent/profile" },
      ].map(tab => (
        <button key={tab.label} onClick={() => navigate(tab.path)}
          style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, color: active===tab.label.toLowerCase() ? "#4f46e5" : "#999" }}>
          <span style={{ fontSize:22 }}>{tab.icon}</span>
          <span style={{ fontSize:10, fontWeight: active===tab.label.toLowerCase() ? "700" : "500" }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function ParentChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teachers, setTeachers]     = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user?.childClass) return;
    const unsub = onValue(ref(db, `classes/${user.childClass}/teachers`), (snap) => {
      if (snap.exists()) setTeachers(Object.values(snap.val()));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!activeChat || !user?.uid) return;
    const chatId = [user.uid, activeChat.teacherId].sort().join("_");
    const unsub  = onValue(ref(db, `chats/${chatId}/messages`), (snap) => {
      if (snap.exists()) {
        setMessages(Object.values(snap.val()).sort((a,b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [activeChat, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activeChat || !user?.uid) return;
    const chatId = [user.uid, activeChat.teacherId].sort().join("_");
    await push(ref(db, `chats/${chatId}/messages`), {
      text,
      senderId:   user.uid,
      senderName: user.name,
      senderRole: "parent",
      timestamp:  serverTimestamp(),
    });
    setInput("");
  };

  if (!activeChat) {
    return (
      <div style={s.wrap}>
        <div style={s.topBar}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
          <h2 style={s.title}>💬 Chat with Teachers</h2>
        </div>
        <div style={s.scroll}>
          {teachers.length === 0 ? (
            <p style={s.emptyText}>No teachers found</p>
          ) : (
            teachers.map((t) => (
              <button key={t.teacherId} style={s.teacherCard} onClick={() => setActiveChat(t)}>
                <div style={{ ...s.avatar, background:t.avatarBg||"#E3F2FD", color:t.avatarColor||"#1565C0" }}>
                  {t.initials || t.teacherName?.substring(0,2).toUpperCase()}
                </div>
                <div style={s.teacherInfo}>
                  <div style={s.teacherName}>{t.teacherName}</div>
                  <div style={s.teacherSub}>{t.subject}</div>
                </div>
                <span style={s.chevron}>›</span>
              </button>
            ))
          )}
        </div>
        <BottomNav active="teachers" />
      </div>
    );
  }

  return (
    <div style={{ ...s.wrap, display:"flex", flexDirection:"column" }}>
      <div style={{ ...s.topBar, justifyContent:"flex-start", gap:10 }}>
        <button style={s.backBtn} onClick={() => setActiveChat(null)}>←</button>
        <div style={{ ...s.avatar, width:34, height:34, fontSize:11, background:"#E3F2FD", color:"#1565C0" }}>
          {activeChat.initials}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700 }}>{activeChat.teacherName}</div>
          <div style={{ fontSize:10.5, color:"#00BFA5", fontWeight:700 }}>🟢 Online</div>
        </div>
        <button style={s.iconBtn}>📞</button>
      </div>
      <div style={s.msgArea}>
        {messages.length === 0 && (
          <div style={s.emptyChat}>Send a message to {activeChat.teacherName}</div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderRole === "parent";
          return (
            <div key={i} style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
              {msg.text}
              <div style={s.bubbleTime}>
                {msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})
                  : "..."}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={s.inputBar}>
        <span style={{ fontSize:20, cursor:"pointer" }}>📎</span>
        <input
          style={s.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendMessage(); }}}
          placeholder="Message teacher..."
        />
        <button style={s.sendBtn} onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}

const s = {
  wrap:        { minHeight:"100vh", background:"#F4F6FB", fontFamily:"'Poppins',sans-serif", maxWidth:430, margin:"0 auto" },
  topBar:      { background:"#fff", padding:"48px 20px 14px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid #E8EAF0" },
  backBtn:     { background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#1C2033", fontWeight:700 },
  title:       { fontSize:17, fontWeight:700, color:"#1C2033" },
  scroll:      { flex:1, overflowY:"auto", padding:"14px 16px 80px", display:"flex", flexDirection:"column", gap:10 },
  teacherCard: { background:"#fff", border:"none", borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", boxShadow:"0 2px 10px rgba(92,107,192,0.08)", textAlign:"left" },
  avatar:      { width:42, height:42, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, flexShrink:0 },
  teacherInfo: { flex:1 },
  teacherName: { fontSize:14, fontWeight:700, color:"#1C2033" },
  teacherSub:  { fontSize:12, color:"#7B8099", marginTop:2 },
  chevron:     { fontSize:20, color:"#7B8099" },
  iconBtn:     { background:"none", border:"none", fontSize:20, cursor:"pointer" },
  msgArea:     { flex:1, overflowY:"auto", padding:"14px 16px 80px", display:"flex", flexDirection:"column", gap:8 },
  emptyChat:   { textAlign:"center", fontSize:13, color:"#7B8099", marginTop:40 },
  emptyText:   { textAlign:"center", fontSize:13, color:"#7B8099", marginTop:40, padding:20 },
  bubble:      { maxWidth:"78%", padding:"10px 14px", borderRadius:16, fontSize:13.5, lineHeight:1.5, wordBreak:"break-word" },
  bubbleMe:    { background:"#5C6BC0", color:"#fff", alignSelf:"flex-end", borderBottomRightRadius:4 },
  bubbleThem:  { background:"#fff", color:"#1C2033", alignSelf:"flex-start", borderBottomLeftRadius:4, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" },
  bubbleTime:  { fontSize:9.5, opacity:0.65, marginTop:4, textAlign:"right" },
  inputBar:    { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#fff", borderTop:"1px solid #E8EAF0", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, zIndex:100 },
  input:       { flex:1, border:"1px solid #E8EAF0", borderRadius:24, padding:"10px 16px", fontSize:14, outline:"none", fontFamily:"'Poppins',sans-serif" },
  sendBtn:     { background:"#5C6BC0", color:"#fff", border:"none", borderRadius:"50%", width:40, height:40, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
};
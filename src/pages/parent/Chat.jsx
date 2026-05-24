import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const avatarColor = (name = '') => {
  const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#0284c7'];
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatTime = (d) => {
  try {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const formatDate = (d) => {
  try {
    const date = d instanceof Date ? d : new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
};

export default function ParentChat() {
  const navigate = useNavigate();
  const [data, setData]           = useState({ child: null, teachers: [], admin: null });
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);

  useEffect(() => {
    fetchInitial();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.roomId);
      clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMessages(activeChat.roomId), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeChat]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages]);

  const fetchInitial = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id || payload._id);
      }
      const res  = await fetch(`${API}/chat/parent-teachers`, authHeader());
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const res  = await fetch(`${API}/chat/messages/${roomId}`, authHeader());
      const json = await res.json();
      if (json.success) setMessages(json.data || []);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat || sending) return;
    setSending(true);
    try {
      const res  = await fetch(`${API}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader().headers },
        body: JSON.stringify({ receiverId: activeChat.receiverId, text: input.trim(), roomId: activeChat.roomId }),
      });
      const json = await res.json();
      if (json.success) { setMessages(prev => [...prev, json.data]); setInput(''); }
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  // ─── Chat Window ────────────────────────────────────────────────────────────
  if (activeChat) return (
    <div style={S.screen}>
      <div style={S.chatHeader}>
        <button style={S.backBtn} onClick={() => { setActiveChat(null); clearInterval(pollRef.current); }}>←</button>
        <div style={{ ...S.avatar, background: avatarColor(activeChat.name) }}>{activeChat.name[0]}</div>
        <div>
          <div style={S.chatName}>{activeChat.name}</div>
          <div style={S.chatSub}>{activeChat.sub}</div>
        </div>
      </div>

      <div style={S.msgList}>
        {messages.length === 0 && (
          <div style={S.emptyChat}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <div style={{ color: '#999', fontSize: 13 }}>Start a conversation</div>
          </div>
        )}
        {messages.map((m, i) => {
          const isMe     = m.senderId?.toString() === currentUserId?.toString();
          const showDate = i === 0 || formatDate(messages[i - 1].createdAt) !== formatDate(m.createdAt);
          return (
            <div key={m._id || i}>
              {showDate && <div style={S.dateDivider}>{formatDate(m.createdAt)}</div>}
              <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                {!isMe && (
                  <div style={{ ...S.miniAvatar, background: avatarColor(activeChat.name) }}>
                    {activeChat.name[0]}
                  </div>
                )}
                <div style={{ ...S.bubble, ...(isMe ? S.bubbleMe : S.bubbleThem) }}>
                  <div style={{ fontSize: 14 }}>{m.text}</div>
                  <div style={S.timeRow}>
                    <span style={S.timeText}>{formatTime(m.createdAt)}</span>
                    {isMe && (
                      <span style={{ fontSize: 11, color: m.read ? '#7c3aed' : 'rgba(255,255,255,0.5)' }}>
                        {m.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={S.inputRow}>
        <input
          style={S.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={`Message ${activeChat.name}...`}
        />
        <button style={{ ...S.sendBtn, opacity: sending ? 0.6 : 1 }} onClick={sendMessage} disabled={sending}>➤</button>
      </div>
    </div>
  );

  // ─── Main List Screen ────────────────────────────────────────────────────────
  return (
    <div style={S.screen}>
      <div style={S.header}>
        <button style={S.headerBack} onClick={() => navigate('/parent/home')}>←</button>
        <div>
          <h2 style={S.headerTitle}>💬 Messages</h2>
          {data.child && (
            <div style={S.childBadge}>
              👦 {data.child.name} · Class {data.child.class}
              {data.child.section ? `-${data.child.section}` : ''}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={S.center}><div style={{ color: '#4f46e5', fontWeight: 600 }}>Loading...</div></div>
      ) : (
        <div style={S.list}>

          {/* Admin Section */}
          <div style={S.sectionLabel}>🏫 SCHOOL ADMINISTRATION</div>
          {data.admin ? (
            <div style={S.chatRow} onClick={() => setActiveChat({
              name:       data.admin.name,
              sub:        'Admin · Complaints & Queries',
              receiverId: data.admin.userId,
              roomId:     data.admin.roomId,
            })}>
              <div style={{ ...S.avatar, background: '#dc2626' }}>A</div>
              <div style={{ flex: 1 }}>
                <div style={S.rowName}>{data.admin.name}</div>
                <div style={S.rowSub}>Complaints · Queries · Updates</div>
              </div>
              <div style={S.chevron}>›</div>
            </div>
          ) : (
            <div style={S.emptyBox}>Admin contact not available</div>
          )}

          {/* Teachers Section */}
          <div style={{ ...S.sectionLabel, marginTop: 20 }}>👨‍🏫 YOUR CHILD'S TEACHERS</div>
          {data.teachers.length === 0 ? (
            <div style={S.emptyBox}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
              <div>No teachers assigned yet</div>
              <div style={{ fontSize: 11, marginTop: 4, color: '#bbb' }}>Timetable mein teacher assign hone ke baad yahan dikhenge</div>
            </div>
          ) : data.teachers.map((t) => (
            <div key={t._id} style={S.chatRow} onClick={() => setActiveChat({
              name:       t.name,
              sub:        t.subject,
              receiverId: t.userId,
              roomId:     t.roomId,
            })}>
              <div style={{ ...S.avatar, background: avatarColor(t.name) }}>{t.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={S.rowName}>{t.name}</div>
                <div style={S.rowSub}>{t.subject}</div>
              </div>
              <div style={S.chevron}>›</div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}

const S = {
  screen:      { maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: '#f5f6fa', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' },
  header:      { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  headerBack:  { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '8px 12px', color: 'white', cursor: 'pointer', fontSize: 18 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 800, margin: 0 },
  childBadge:  { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  list:        { flex: 1, overflowY: 'auto', padding: '16px 16px 80px' },
  sectionLabel:{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, marginBottom: 8 },
  chatRow:     { background: 'white', borderRadius: 14, padding: '14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', cursor: 'pointer' },
  avatar:      { width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0 },
  rowName:     { fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 3 },
  rowSub:      { fontSize: 12, color: '#888' },
  chevron:     { fontSize: 22, color: '#ccc' },
  emptyBox:    { textAlign: 'center', padding: '32px 0', color: '#999', fontSize: 13 },
  center:      { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chatHeader:  { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '48px 16px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  backBtn:     { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '8px 12px', color: 'white', cursor: 'pointer', fontSize: 18 },
  chatName:    { color: 'white', fontSize: 16, fontWeight: 700 },
  chatSub:     { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  msgList:     { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' },
  emptyChat:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' },
  dateDivider: { textAlign: 'center', fontSize: 11, color: '#aaa', background: '#eee', borderRadius: 20, padding: '3px 12px', margin: '10px auto', width: 'fit-content' },
  miniAvatar:  { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' },
  bubble:      { maxWidth: '75%', padding: '10px 14px', borderRadius: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  bubbleMe:    { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', borderBottomRightRadius: 4 },
  bubbleThem:  { background: 'white', color: '#111', borderBottomLeftRadius: 4 },
  timeRow:     { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  timeText:    { fontSize: 10, opacity: 0.7 },
  inputRow:    { padding: '12px 16px', background: 'white', display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 -2px 8px rgba(0,0,0,0.06)', flexShrink: 0 },
  input:       { flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 24, padding: '10px 16px', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' },
  sendBtn:     { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: 18, cursor: 'pointer', flexShrink: 0 },
};
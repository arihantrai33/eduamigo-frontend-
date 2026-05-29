import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const getUser = () => JSON.parse(localStorage.getItem('eduamigo_user'));

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function TeacherChat() {
  const navigate = useNavigate();
  const [tab, setTab]             = useState('contacts');
  const [contacts, setContacts]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeChat, setActiveChat] = useState(null); // { name, roomId, userId, type }
  const [messages, setMessages]   = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef(null);
  const pollRef                   = useRef(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const user = getUser();
      const res  = await fetch(`${API}/chat/teacher-contacts`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setContacts(data.data);
      setFiltered(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? contacts.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.childName && c.childName.toLowerCase().includes(q))
          )
        : contacts
    );
  }, [search, contacts]);

  const openChat = async (contact) => {
    setActiveChat(contact);
    setTab('chat');
    await fetchMessages(contact.roomId);
    startPolling(contact.roomId);
  };

  const fetchMessages = async (roomId) => {
    try {
      setMsgLoading(true);
      const user = getUser();
      const res  = await fetch(`${API}/chat/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMessages(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMsgLoading(false);
    }
  };

  const startPolling = (roomId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const user = getUser();
      const res  = await fetch(`${API}/chat/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) setMessages(data.data);
    }, 4000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;
    try {
      setSending(true);
      const user = getUser();
      const res  = await fetch(`${API}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          receiverId: activeChat.userId,
          roomId:     activeChat.roomId,
          text:       text.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMessages(prev => [...prev, data.data]);
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const goBack = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setActiveChat(null);
    setMessages([]);
    setTab('contacts');
  };

  const myId = getUser()?._id;

  const students = filtered.filter(c => c.type === 'student');
  const parents  = filtered.filter(c => c.type === 'parent');

  return (
    <div style={styles.container}>
      {/* CHAT WINDOW */}
      {tab === 'chat' && activeChat ? (
        <>
          <div style={styles.chatHeader}>
            <button onClick={goBack} style={styles.backBtn}>←</button>
            <div style={styles.chatAvatar}>
              <span style={styles.chatAvatarText}>
                {activeChat.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.chatName}>{activeChat.name}</p>
              <p style={styles.chatSub}>
                {activeChat.type === 'parent'
                  ? `Parent of ${activeChat.childName} • Class ${activeChat.class}${activeChat.section ? ` ${activeChat.section}` : ''}`
                  : `Student • Class ${activeChat.class}${activeChat.section ? ` ${activeChat.section}` : ''}`
                }
              </p>
            </div>
          </div>

          <div style={styles.msgArea}>
            {msgLoading ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
              </div>
            ) : messages.length === 0 ? (
              <div style={styles.emptyChat}>
                <p style={styles.emptyChatIcon}>💬</p>
                <p style={styles.emptyChatText}>No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map(m => {
                const isMine = m.senderId?.toString() === myId?.toString();
                return (
                  <div
                    key={m._id}
                    style={{ ...styles.msgRow, justifyContent: isMine ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{ ...styles.bubble, ...(isMine ? styles.bubbleMine : styles.bubbleTheirs) }}>
                      <p style={{ ...styles.bubbleText, color: isMine ? '#fff' : '#1A1A2E' }}>{m.text}</p>
                      <p style={{ ...styles.bubbleTime, textAlign: isMine ? 'right' : 'left' }}>
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div style={styles.inputRow}>
            <textarea
              style={styles.textInput}
              placeholder="Type a message..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              style={{ ...styles.sendBtn, opacity: sending || !text.trim() ? 0.5 : 1 }}
              onClick={handleSend}
              disabled={sending || !text.trim()}
            >
              ➤
            </button>
          </div>
        </>
      ) : (
        <>
          {/* CONTACTS LIST */}
          <div style={styles.header}>
            <button onClick={() => navigate('/teacher/home')} style={styles.backBtn}>←</button>
            <div style={{ flex: 1 }}>
              <p style={styles.portalLabel}>TEACHER PORTAL</p>
              <h1 style={styles.headerTitle}>Messages</h1>
            </div>
            {contacts.length > 0 && (
              <div style={styles.countBadge}>{contacts.length}</div>
            )}
          </div>

          <div style={styles.content}>
            {/* Search */}
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                style={styles.searchInput}
                placeholder="Search students or parents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Loading contacts...</p>
              </div>
            ) : error ? (
              <div style={styles.errorBox}>⚠️ {error}</div>
            ) : contacts.length === 0 ? (
              <div style={styles.emptyBox}>
                <p style={styles.emptyIcon}>💬</p>
                <p style={styles.emptyText}>No contacts found</p>
                <p style={styles.emptySubText}>Contacts appear when students are assigned to your classes.</p>
              </div>
            ) : (
              <>
                {students.length > 0 && (
                  <>
                    <p style={styles.sectionLabel}>STUDENTS ({students.length})</p>
                    {students.map(c => (
                      <ContactCard key={c._id} contact={c} onOpen={openChat} />
                    ))}
                  </>
                )}
                {parents.length > 0 && (
                  <>
                    <p style={styles.sectionLabel}>PARENTS ({parents.length})</p>
                    {parents.map(c => (
                      <ContactCard key={c._id} contact={c} onOpen={openChat} />
                    ))}
                  </>
                )}
              </>
            )}
            <div style={{ height: 100 }} />
          </div>

          {/* Bottom Nav */}
          <div style={styles.bottomNav}>
            <NavItem icon="🏠" label="Home"       onClick={() => navigate('/teacher/home')} />
            <NavItem icon="✅" label="Attendance" onClick={() => navigate('/teacher/attendance')} />
            <NavItem icon="📤" label="Upload"     onClick={() => navigate('/teacher/upload')} />
            <NavItem icon="💬" label="Messages"   onClick={() => navigate('/teacher/chat')} active />
            <NavItem icon="👤" label="Me"         onClick={() => navigate('/teacher/profile')} />
          </div>
        </>
      )}
    </div>
  );
}

function ContactCard({ contact, onOpen }) {
  return (
    <button onClick={() => onOpen(contact)} style={styles.contactCard}>
      <div style={{
        ...styles.contactAvatar,
        background: contact.type === 'parent' ? '#FFF8E1' : '#EEF0FF',
      }}>
        <span style={{
          fontSize: 18,
          color: contact.type === 'parent' ? '#F9A825' : '#3949AB',
        }}>
          {contact.type === 'parent' ? '👨‍👩‍👧' : '🎓'}
        </span>
      </div>
      <div style={styles.contactInfo}>
        <p style={styles.contactName}>{contact.name}</p>
        <p style={styles.contactSub}>
          {contact.type === 'parent'
            ? `Parent of ${contact.childName} • Class ${contact.class}${contact.section ? ` ${contact.section}` : ''}`
            : `Class ${contact.class}${contact.section ? ` ${contact.section}` : ''}`
          }
        </p>
      </div>
      <span style={styles.chevron}>›</span>
    </button>
  );
}

function NavItem({ icon, label, onClick, active }) {
  return (
    <button onClick={onClick} style={styles.navItem}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ ...styles.navLabel, color: active ? '#5C6BC0' : '#9E9E9E' }}>{label}</span>
    </button>
  );
}

const styles = {
  container: {
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: '#F5F6FA',
    minHeight: '100vh',
    maxWidth: 420,
    margin: '0 auto',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'linear-gradient(135deg, #5C6BC0, #3949AB)',
    padding: '20px 16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  chatHeader: {
    background: 'linear-gradient(135deg, #5C6BC0, #3949AB)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    fontSize: 20,
    borderRadius: 10,
    width: 36,
    height: 36,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: 'rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chatAvatarText: { color: '#fff', fontSize: 18, fontWeight: 700 },
  chatName: { color: '#fff', fontSize: 15, fontWeight: 700, margin: 0 },
  chatSub:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: 0 },
  portalLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.5,
    margin: 0,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 },
  countBadge: {
    background: '#FF5252',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 99,
    minWidth: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
  },
  content: { padding: '16px', flex: 1 },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: '#fff',
    borderRadius: 12,
    padding: '10px 14px',
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    border: 'none',
    outline: 'none',
    flex: 1,
    fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    color: '#1A1A2E',
    background: 'transparent',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#9E9E9E',
    letterSpacing: 1,
    margin: '8px 0 8px 4px',
  },
  contactCard: {
    width: '100%',
    background: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '12px 14px',
    marginBottom: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Poppins', sans-serif",
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactInfo: { flex: 1, minWidth: 0 },
  contactName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1A1A2E',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  contactSub: {
    fontSize: 12,
    color: '#9E9E9E',
    margin: '2px 0 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chevron: { fontSize: 20, color: '#BDBDBD', flexShrink: 0 },
  msgArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingBottom: 80,
  },
  msgRow: { display: 'flex' },
  bubble: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: 16,
  },
  bubbleMine: {
    background: '#5C6BC0',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    background: '#fff',
    borderBottomLeftRadius: 4,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  bubbleText: {
    fontSize: 14,
    margin: 0,
    lineHeight: 1.5,
    color: 'inherit',
    wordBreak: 'break-word',
  },
  bubbleTime: {
    fontSize: 10,
    margin: '4px 0 0',
    opacity: 0.65,
  },
  inputRow: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderTop: '1px solid #EEEEEE',
    padding: '10px 12px',
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
    boxSizing: 'border-box',
    zIndex: 100,
  },
  textInput: {
    flex: 1,
    border: '1.5px solid #E0E0E0',
    borderRadius: 12,
    padding: '10px 12px',
    fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    resize: 'none',
    outline: 'none',
    color: '#1A1A2E',
    maxHeight: 100,
    overflowY: 'auto',
  },
  sendBtn: {
    width: 44,
    height: 44,
    background: 'linear-gradient(135deg, #5C6BC0, #3949AB)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emptyChat: { textAlign: 'center', padding: '60px 20px', flex: 1 },
  emptyChatIcon: { fontSize: 48, margin: '0 0 8px' },
  emptyChatText: { fontSize: 14, color: '#9E9E9E', fontWeight: 500 },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 0',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #EEF0FF',
    borderTop: '3px solid #5C6BC0',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#5C6BC0', fontSize: 13, marginTop: 10 },
  errorBox: {
    background: '#FFEBEE',
    color: '#C62828',
    padding: '12px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
  },
  emptyBox: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: 52, margin: '0 0 8px' },
  emptyText: { fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: '0 0 6px' },
  emptySubText: { fontSize: 13, color: '#9E9E9E', margin: 0 },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderTop: '1px solid #EEEEEE',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0 12px',
    zIndex: 100,
  },
  navItem: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    cursor: 'pointer',
    padding: '4px 12px',
  },
  navLabel: { fontSize: 10, fontWeight: 600 },
};
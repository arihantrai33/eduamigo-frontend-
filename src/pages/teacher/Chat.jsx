import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import { errorMessage } from "../../utils/toast";
import Skeleton from "../../components/ui/Skeleton";
import SearchField from "../../components/ui/SearchField";
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
      setError(errorMessage(err, 'Could not load your contacts'));
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
          <PortalHeader detail title={activeChat.name} backLabel="Back to contacts" onBack={goBack}
            subtitle={activeChat.type === 'parent'
              ? `Parent of ${activeChat.childName} • Class ${activeChat.class}${activeChat.section ? ` ${activeChat.section}` : ''}`
              : `Student • Class ${activeChat.class}${activeChat.section ? ` ${activeChat.section}` : ''}`} />

          <div style={styles.msgArea}>
            {msgLoading ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
              </div>
            ) : messages.length === 0 ? (
              <div style={styles.emptyChat}>
                <p style={styles.emptyChatIcon}><Glyph e="💬" /></p>
                <p style={styles.emptyChatText}>No messages yet. Write the first message below.</p>
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
              aria-label="Message"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              type="button"
              aria-label="Send message"
              style={{ ...styles.sendBtn, opacity: sending || !text.trim() ? 0.5 : 1 }}
              onClick={handleSend}
              disabled={sending || !text.trim()}
            >
              <Glyph e="➤" />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* CONTACTS LIST */}
          <PortalHeader title="Messages" onBack={() => navigate('/teacher/home')}
            actions={contacts.length > 0 && <span className="ea-badge ea-badge--brand">{contacts.length}</span>} />

          <div className="ea-pd-body" style={styles.content}>
            {/* Search */}
            <SearchField value={search} onChange={setSearch} label="Search conversations" placeholder="Search students or parents..." style={{ marginBottom: 16 }} />

            {loading ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
                <Skeleton rows={3} label="Loading contacts" />
              </div>
            ) : error ? (
              <div style={styles.errorBox}><Glyph e="⚠" /> {error}</div>
            ) : contacts.length === 0 ? (
              <div style={styles.emptyBox}>
                <p style={styles.emptyIcon}><Glyph e="💬" /></p>
                <p style={styles.emptyText}>No contacts found</p>
                <p style={styles.emptySubText}>Contacts appear when students are assigned to your classes.</p>
              </div>
            ) : (
              <>
                {students.length > 0 && (
                  <>
                    <p className="ea-overline" style={styles.sectionLabel}>STUDENTS ({students.length})</p>
                    {students.map(c => (
                      <ContactCard key={`${c.type}-${c.userId}`} contact={c} onOpen={openChat} />
                    ))}
                  </>
                )}
                {parents.length > 0 && (
                  <>
                    <p className="ea-overline" style={styles.sectionLabel}>PARENTS ({parents.length})</p>
                    {parents.map(c => (
                      <ContactCard key={`${c.type}-${c.userId}`} contact={c} onOpen={openChat} />
                    ))}
                  </>
                )}
              </>
            )}
            <div style={{ height: 100 }} />
          </div>

          <BottomNav role="teacher" />
        </>
      )}
    </div>
  );
}

function ContactCard({ contact, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(contact)} style={styles.contactCard}>
      <div style={{
        ...styles.contactAvatar,
        background: contact.type === 'parent' ? '#FFF8E1' : '#EEF0FF',
      }}>
        <span style={{
          fontSize: 18,
          color: contact.type === 'parent' ? 'var(--ea-on-card-warning)' : 'var(--brand-dark)',
        }}>
          {contact.type === 'parent' ? <Glyph e="👨‍👩‍👧" /> : <Glyph e="🎓" />}
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


const styles = {
  container: {
    fontFamily: "inherit",
    backgroundColor: '#F5F6FA',
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  content: { padding: '16px', flex: 1 },
  sectionLabel: {
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
    fontFamily: "inherit",
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
    color: 'var(--ea-muted)',
    margin: '2px 0 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chevron: { fontSize: 20, color: 'var(--ea-muted)', flexShrink: 0 },
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
    background: 'var(--brand)',
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
    left: 0,
    right: 0,
    background: '#fff',
    borderTop: '1px solid #EEEEEE',
    padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
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
    fontFamily: "inherit",
    resize: 'none',
    outline: 'none',
    color: '#1A1A2E',
    maxHeight: 100,
    overflowY: 'auto',
  },
  sendBtn: {
    width: 44,
    height: 44,
    background: 'var(--brand)',
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
  emptyChatText: { fontSize: 14, color: 'var(--ea-muted)', fontWeight: 500 },
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
    borderTop: '3px solid var(--brand)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: 'var(--brand-text)', fontSize: 13, marginTop: 10 },
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
  emptySubText: { fontSize: 13, color: 'var(--ea-muted)', margin: 0 },
};
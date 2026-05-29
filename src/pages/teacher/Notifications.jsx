import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const TYPE_STYLES = {
  General:     { bg: '#EEF0FF', color: '#3949AB', icon: '📢' },
  Exam:        { bg: '#FFF8E1', color: '#F9A825', icon: '📝' },
  Fee:         { bg: '#E8F5E9', color: '#2E7D32', icon: '💰' },
  Holiday:     { bg: '#FCE4EC', color: '#C2185B', icon: '🎉' },
  Attendance:  { bg: '#E3F2FD', color: '#1565C0', icon: '✅' },
  Emergency:   { bg: '#FFEBEE', color: '#C62828', icon: '🚨' },
};

const getTypeStyle = (type) => TYPE_STYLES[type] || TYPE_STYLES.General;

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return 'Just now';
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days < 7)    return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function TeacherNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [filter, setFilter]               = useState('All');

  const FILTERS = ['All', 'General', 'Exam', 'Fee', 'Holiday', 'Attendance', 'Emergency'];

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('eduamigo_user'));
        const res  = await fetch(`${API}/notifications/my`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load notifications');
        setNotifications(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const filtered = filter === 'All'
    ? notifications
    : notifications.filter(n => n.type === filter);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/teacher/home')} style={styles.backBtn}>←</button>
        <div>
          <p style={styles.portalLabel}>TEACHER PORTAL</p>
          <h1 style={styles.headerTitle}>Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <div style={styles.countBadge}>{notifications.length}</div>
        )}
      </div>

      <div style={styles.content}>
        {/* Filter Chips */}
        <div style={styles.filterRow}>
          {FILTERS.map(f => (
            <button
              key={f}
              style={{ ...styles.chip, ...(filter === f ? styles.chipActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* States */}
        {loading ? (
          <div style={styles.centered}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading notifications...</p>
          </div>
        ) : error ? (
          <div style={styles.errorBox}>⚠️ {error}</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyIcon}>🔔</p>
            <p style={styles.emptyText}>No notifications found</p>
            <p style={styles.emptySubText}>
              {filter === 'All'
                ? 'You have no notifications at this time.'
                : `No "${filter}" notifications found.`}
            </p>
          </div>
        ) : (
          <>
            <p style={styles.resultCount}>
              {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.map(n => {
              const ts = getTypeStyle(n.type);
              return (
                <div key={n._id} style={styles.card}>
                  <div style={styles.cardLeft}>
                    <div style={{ ...styles.iconBox, background: ts.bg }}>
                      <span style={styles.iconText}>{ts.icon}</span>
                    </div>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.cardTop}>
                      <p style={styles.cardTitle}>{n.title}</p>
                      <span style={{ ...styles.typeBadge, background: ts.bg, color: ts.color }}>
                        {n.type || 'General'}
                      </span>
                    </div>
                    <p style={styles.cardMessage}>{n.message}</p>
                    <div style={styles.cardFooter}>
                      <span style={styles.timeText}>{timeAgo(n.createdAt)}</span>
                      {n.targetRole && n.targetRole !== 'all' && (
                        <span style={styles.targetBadge}>For: {n.targetRole}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        <NavItem icon="🏠" label="Home"       onClick={() => navigate('/teacher/home')} />
        <NavItem icon="✅" label="Attendance" onClick={() => navigate('/teacher/attendance')} />
        <NavItem icon="📤" label="Upload"     onClick={() => navigate('/teacher/upload')} />
        <NavItem icon="💬" label="Messages"   onClick={() => navigate('/teacher/chat')} />
        <NavItem icon="👤" label="Me"         onClick={() => navigate('/teacher/profile')} />
      </div>
    </div>
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
  },
  header: {
    background: 'linear-gradient(135deg, #5C6BC0, #3949AB)',
    padding: '20px 16px 24px',
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
  portalLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.5,
    margin: 0,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  countBadge: {
    marginLeft: 'auto',
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
  content: {
    padding: '16px',
    marginTop: -12,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 8,
    marginBottom: 12,
    scrollbarWidth: 'none',
  },
  chip: {
    background: '#fff',
    border: '1.5px solid #E0E0E0',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: '#9E9E9E',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: "'Poppins', sans-serif",
  },
  chipActive: {
    background: '#5C6BC0',
    borderColor: '#5C6BC0',
    color: '#fff',
  },
  resultCount: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: 500,
    margin: '0 0 10px 2px',
  },
  card: {
    background: '#fff',
    borderRadius: 14,
    padding: '14px',
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexShrink: 0,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1A1A2E',
    margin: 0,
    flex: 1,
    lineHeight: 1.3,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  cardMessage: {
    fontSize: 13,
    color: '#555',
    margin: '0 0 8px',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#BDBDBD',
    fontWeight: 500,
  },
  targetBadge: {
    fontSize: 10,
    color: '#5C6BC0',
    background: '#EEF0FF',
    padding: '2px 8px',
    borderRadius: 20,
    fontWeight: 600,
  },
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
  emptyBox: {
    textAlign: 'center',
    padding: '60px 20px',
  },
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
  navLabel: {
    fontSize: 10,
    fontWeight: 600,
  },
};
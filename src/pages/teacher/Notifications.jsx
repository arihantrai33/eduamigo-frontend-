import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import { errorMessage } from "../../utils/toast";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { AlertCircle, Bell } from "lucide-react";
const API = import.meta.env.VITE_API_URL;

const TYPE_STYLES = {
  General:     { bg: '#EEF0FF', color: '#3949AB', icon: <Glyph e="📢" /> },
  Exam:        { bg: '#FFF8E1', color: 'var(--ea-on-card-warning)', icon: <Glyph e="📝" /> },
  Fee:         { bg: '#E8F5E9', color: '#2E7D32', icon: <Glyph e="💰" /> },
  Holiday:     { bg: '#FCE4EC', color: '#C2185B', icon: '' },
  Attendance:  { bg: '#E3F2FD', color: '#1565C0', icon: <Glyph e="✅" /> },
  Emergency:   { bg: '#FFEBEE', color: '#C62828', icon: <Glyph e="🚨" /> },
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
        setError(errorMessage(err, 'Could not load notifications'));
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
    // Refresh every 60 seconds while the page is open and visible.
    const timer = setInterval(() => { if (!document.hidden) fetchNotifications(); }, 60000);
    return () => clearInterval(timer);
  }, []);

  const filtered = filter === 'All'
    ? notifications
    : notifications.filter(n => n.type === filter);

  return (
    <div style={styles.container}>
      {/* Header */}
      <PortalHeader title="Notifications" onBack={() => navigate('/teacher/home')} actions={notifications.length > 0 && <span className="ea-badge ea-badge--brand">{notifications.length}</span>} />

      <div className="ea-pd-body" style={styles.content}>
        {/* Filter Chips */}
        <div style={styles.filterRow}>
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
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
            <Skeleton rows={3} label="Loading notifications" />
          </div>
        ) : error ? (
          <EmptyState tone="danger" role="alert" icon={AlertCircle} title="Notifications could not be loaded" text={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications found"
            text={filter === 'All' ? 'You have no notifications at this time.' : `No "${filter}" notifications found.`} />
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

      <BottomNav role="teacher" />
    </div>
  );
}


const styles = {
  container: {
    fontFamily: "inherit",
    backgroundColor: '#F5F6FA',
    minHeight: '100vh',
    position: 'relative',
  },
  content: {
    padding: '16px',
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
    color: 'var(--ea-muted)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: "inherit",
  },
  chipActive: {
    background: 'var(--brand)',
    borderColor: 'var(--brand)',
    color: '#fff',
  },
  resultCount: {
    fontSize: 12,
    color: 'var(--ea-muted)',
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
    color: 'var(--ea-muted)',
    fontWeight: 500,
  },
  targetBadge: {
    fontSize: 10,
    color: 'var(--brand-dark)',
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
    borderTop: '3px solid var(--brand)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: 'var(--brand-dark)', fontSize: 13, marginTop: 10 },
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
  emptySubText: { fontSize: 13, color: 'var(--ea-muted)', margin: 0 },
};
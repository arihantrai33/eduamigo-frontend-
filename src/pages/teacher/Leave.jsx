import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Personal Leave', 'Other'];

const STATUS_STYLES = {
  Pending:  { bg: '#FFF8E1', color: '#F9A825', label: 'Pending' },
  Approved: { bg: '#E8F5E9', color: '#2E7D32', label: 'Approved' },
  Rejected: { bg: '#FFEBEE', color: '#C62828', label: 'Rejected' },
};

export default function TeacherLeave() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('history');
  const [leaves, setLeaves] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [formError, setFormError] = useState('');

  const getUser = () => JSON.parse(localStorage.getItem('eduamigo_user'));

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = getUser();
      const headers = { Authorization: `Bearer ${user.token}` };

      const [leavesRes, quotaRes] = await Promise.all([
        fetch(`${API}/leaves/my`, { headers }),
        fetch(`${API}/leaves/quota`, { headers }),
      ]);

      const leavesData = await leavesRes.json();
      const quotaData = await quotaRes.json();

      if (!leavesData.success) throw new Error(leavesData.message);
      if (!quotaData.success) throw new Error(quotaData.message);

      setLeaves(leavesData.data);
      setQuota(quotaData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    setFormError('');
    const { leaveType, fromDate, toDate, reason } = form;
    if (!leaveType || !fromDate || !toDate || !reason.trim()) {
      setFormError('All fields are required.');
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setFormError('End date cannot be before start date.');
      return;
    }

    try {
      setSubmitting(true);
      const user = getUser();
      const res = await fetch(`${API}/leaves/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccessMsg('Leave request submitted successfully!');
      setForm({ leaveType: '', fromDate: '', toDate: '', reason: '' });
      setTab('history');
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const dayCount = (from, to) => {
    const diff = new Date(to) - new Date(from);
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/teacher/home')} style={styles.backBtn}>←</button>
        <div>
          <p style={styles.portalLabel}>TEACHER PORTAL</p>
          <h1 style={styles.headerTitle}>Leave Management</h1>
        </div>
      </div>

      <div style={styles.content}>
        {/* Success Message */}
        {successMsg && (
          <div style={styles.successBanner}>✅ {successMsg}</div>
        )}

        {/* Quota Card */}
        {quota && (
          <div style={styles.quotaCard}>
            <p style={styles.quotaTitle}>Annual Leave Balance</p>
            <div style={styles.quotaRow}>
              <QuotaBox label="Total" value={quota.total} color="#5C6BC0" />
              <QuotaBox label="Used" value={quota.used} color="#E53935" />
              <QuotaBox label="Available" value={quota.available} color="#2E7D32" />
            </div>
            <div style={styles.progressBarBg}>
              <div style={{
                ...styles.progressBarFill,
                width: `${(quota.used / quota.total) * 100}%`,
              }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tab, ...(tab === 'history' ? styles.tabActive : {}) }}
            onClick={() => setTab('history')}
          >
            Leave History
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'apply' ? styles.tabActive : {}) }}
            onClick={() => setTab('apply')}
          >
            + Apply Leave
          </button>
        </div>

        {/* History Tab */}
        {tab === 'history' && (
          <>
            {loading ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Loading leave history...</p>
              </div>
            ) : error ? (
              <div style={styles.errorBox}>⚠️ {error}</div>
            ) : leaves.length === 0 ? (
              <div style={styles.emptyBox}>
                <p style={styles.emptyIcon}>📋</p>
                <p style={styles.emptyText}>No leave requests found.</p>
                <p style={styles.emptySubText}>Tap "Apply Leave" to submit a new request.</p>
              </div>
            ) : (
              leaves.map(leave => {
                const s = STATUS_STYLES[leave.status] || STATUS_STYLES.Pending;
                return (
                  <div key={leave._id} style={styles.leaveCard}>
                    <div style={styles.leaveCardTop}>
                      <div>
                        <p style={styles.leaveType}>{leave.leaveType}</p>
                        <p style={styles.leaveDates}>
                          {formatDate(leave.fromDate)} — {formatDate(leave.toDate)}
                          <span style={styles.leaveDays}>
                            {' '}({dayCount(leave.fromDate, leave.toDate)} day{dayCount(leave.fromDate, leave.toDate) > 1 ? 's' : ''})
                          </span>
                        </p>
                      </div>
                      <span style={{ ...styles.statusBadge, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                    <p style={styles.leaveReason}>{leave.reason}</p>
                    {leave.reviewNote && (
                      <p style={styles.reviewNote}>📝 Admin Note: {leave.reviewNote}</p>
                    )}
                    <p style={styles.leaveApplied}>Applied: {formatDate(leave.createdAt)}</p>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Apply Tab */}
        {tab === 'apply' && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>New Leave Request</h3>

            {formError && <div style={styles.errorBox}>⚠️ {formError}</div>}

            <label style={styles.label}>Leave Type</label>
            <select
              style={styles.select}
              value={form.leaveType}
              onChange={e => setForm({ ...form, leaveType: e.target.value })}
            >
              <option value="">Select leave type</option>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label style={styles.label}>From Date</label>
            <input
              type="date"
              style={styles.input}
              value={form.fromDate}
              onChange={e => setForm({ ...form, fromDate: e.target.value })}
            />

            <label style={styles.label}>To Date</label>
            <input
              type="date"
              style={styles.input}
              value={form.toDate}
              onChange={e => setForm({ ...form, toDate: e.target.value })}
            />

            <label style={styles.label}>Reason</label>
            <textarea
              style={styles.textarea}
              placeholder="Describe the reason for your leave..."
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              rows={4}
            />

            {form.fromDate && form.toDate && new Date(form.toDate) >= new Date(form.fromDate) && (
              <div style={styles.durationPreview}>
                📅 Duration: {dayCount(form.fromDate, form.toDate)} day{dayCount(form.fromDate, form.toDate) > 1 ? 's' : ''}
              </div>
            )}

            <button
              style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        <NavItem icon="🏠" label="Home" onClick={() => navigate('/teacher/home')} />
        <NavItem icon="✅" label="Attendance" onClick={() => navigate('/teacher/attendance')} />
        <NavItem icon="📤" label="Upload" onClick={() => navigate('/teacher/upload')} />
        <NavItem icon="💬" label="Messages" onClick={() => navigate('/teacher/chat')} />
        <NavItem icon="👤" label="Me" onClick={() => navigate('/teacher/profile')} />
      </div>
    </div>
  );
}

function QuotaBox({ label, value, color }) {
  return (
    <div style={styles.quotaBox}>
      <p style={{ ...styles.quotaValue, color }}>{value}</p>
      <p style={styles.quotaLabel}>{label}</p>
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
  content: {
    padding: '16px',
    marginTop: -12,
  },
  successBanner: {
    background: '#E8F5E9',
    color: '#2E7D32',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 16,
  },
  quotaCard: {
    background: 'linear-gradient(135deg, #5C6BC0, #3949AB)',
    borderRadius: 16,
    padding: '16px',
    marginBottom: 16,
  },
  quotaTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: '0 0 12px',
  },
  quotaRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  quotaBox: {
    textAlign: 'center',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: '10px 20px',
  },
  quotaValue: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    color: '#fff',
  },
  quotaLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    margin: 0,
    fontWeight: 600,
  },
  progressBarBg: {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    height: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    background: '#fff',
    height: '100%',
    borderRadius: 99,
    transition: 'width 0.4s ease',
  },
  tabRow: {
    display: 'flex',
    background: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    background: 'none',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#9E9E9E',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
  tabActive: {
    background: '#5C6BC0',
    color: '#fff',
  },
  leaveCard: {
    background: '#fff',
    borderRadius: 14,
    padding: '16px',
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  leaveCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leaveType: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1A1A2E',
    margin: '0 0 4px',
  },
  leaveDates: {
    fontSize: 12,
    color: '#5C6BC0',
    fontWeight: 500,
    margin: 0,
  },
  leaveDays: {
    color: '#9E9E9E',
    fontWeight: 400,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
  },
  leaveReason: {
    fontSize: 13,
    color: '#555',
    margin: '0 0 6px',
    lineHeight: 1.5,
  },
  reviewNote: {
    fontSize: 12,
    color: '#3949AB',
    background: '#EEF0FF',
    padding: '6px 10px',
    borderRadius: 8,
    margin: '6px 0',
  },
  leaveApplied: {
    fontSize: 11,
    color: '#BDBDBD',
    margin: 0,
  },
  formCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1A1A2E',
    margin: '0 0 16px',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#5C6BC0',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    display: 'block',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1.5px solid #E0E0E0',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    marginBottom: 14,
    boxSizing: 'border-box',
    color: '#1A1A2E',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1.5px solid #E0E0E0',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    marginBottom: 14,
    boxSizing: 'border-box',
    color: '#1A1A2E',
    outline: 'none',
    background: '#fff',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1.5px solid #E0E0E0',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    marginBottom: 14,
    boxSizing: 'border-box',
    color: '#1A1A2E',
    outline: 'none',
    resize: 'vertical',
  },
  durationPreview: {
    background: '#EEF0FF',
    color: '#3949AB',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 14px',
    borderRadius: 10,
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #5C6BC0, #3949AB)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 0',
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
    marginBottom: 14,
  },
  emptyBox: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: { fontSize: 48, margin: '0 0 8px' },
  emptyText: { fontSize: 15, fontWeight: 600, color: '#1A1A2E', margin: '0 0 4px' },
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
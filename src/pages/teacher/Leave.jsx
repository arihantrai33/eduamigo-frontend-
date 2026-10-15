import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from "../../components/ui/EmptyState";
import { ClipboardList } from "lucide-react";

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import SummaryCard from "../../components/ui/SummaryCard";
import Segmented from "../../components/ui/Segmented";
import { errorMessage } from "../../utils/toast";
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
      setError(errorMessage(err, 'Could not load your leave details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Leave requests from students of this teacher's classes.
  const [studentLeaves, setStudentLeaves] = useState([]);
  const [reviewing, setReviewing] = useState('');
  const fetchStudentLeaves = async () => {
    try {
      const res = await fetch(`${API}/leaves/pending`, { headers: { Authorization: `Bearer ${getUser().token}` } });
      const data = await res.json();
      if (data.success) setStudentLeaves(data.data || []);
    } catch { /* shown as empty list */ }
  };
  useEffect(() => { fetchStudentLeaves(); }, []);

  const review = async (id, status) => {
    setReviewing(id + status);
    try {
      const res = await fetch(`${API}/leaves/${id}/review`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getUser().token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccessMsg(`Leave ${status.toLowerCase()}. The student and parent have been notified.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchStudentLeaves();
    } catch (err) {
      setError(errorMessage(err, 'Could not update the request'));
    } finally {
      setReviewing('');
    }
  };
  const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short' });

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
      setFormError(errorMessage(err, 'Could not submit the leave request'));
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
    <div className="ea-pd-narrow" style={styles.container}>
      {/* Header */}
      <PortalHeader title="Leave Management" onBack={() => navigate('/teacher/home')} />

      <div className="ea-pd-body" style={styles.content}>
        {/* Success Message */}
        {successMsg && (
          <div style={styles.successBanner}><Glyph e="✅" /> {successMsg}</div>
        )}

        {/* Quota Card */}
        {quota && (
          <div style={{ marginBottom: 16 }}>
            <SummaryCard title="Annual Leave Balance" items={[
              { label: 'Total', value: quota.total },
              { label: 'Used', value: quota.used },
              { label: 'Available', value: quota.available, tone: 'success' },
            ]}>
              <div style={styles.progressBarBg} role="progressbar" aria-label="Leave used" aria-valuenow={quota.used} aria-valuemin={0} aria-valuemax={quota.total}>
                <div style={{
                  ...styles.progressBarFill,
                  width: `${(quota.used / quota.total) * 100}%`,
                }} />
              </div>
            </SummaryCard>
          </div>
        )}

        {/* Tabs */}
        <div style={{ marginBottom: 16 }}>
          <Segmented label="Leave view" value={tab} onChange={setTab} options={[
            { value: 'history', label: 'Leave History' },
            { value: 'apply', label: '+ Apply Leave' },
            { value: 'students', label: `Students${studentLeaves.length ? ` (${studentLeaves.length})` : ''}` },
          ]} />
        </div>

        {tab === 'students' && (
          studentLeaves.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, padding: '32px 0' }}>No pending leave requests from your students.</p>
          ) : studentLeaves.map((l) => (
            <div key={l._id} style={styles.leaveCard}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1F2937' }}>{l.name} <span style={{ fontWeight: 500, color: '#6B7280', fontSize: 13 }}>· Class {l.class}-{l.section}</span></div>
              <div style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 8px' }}>{l.leaveType} · {fmtDay(l.fromDate)} to {fmtDay(l.toDate)} · {l.days} day{l.days > 1 ? 's' : ''}</div>
              <p style={styles.leaveReason}>{l.reason}</p>
              {l.attachmentUrl && <a href={l.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>View attachment</a>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button disabled={!!reviewing} onClick={() => review(l._id, 'Approved')} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{reviewing === l._id + 'Approved' ? 'Saving...' : 'Approve'}</button>
                <button disabled={!!reviewing} onClick={() => review(l._id, 'Rejected')} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{reviewing === l._id + 'Rejected' ? 'Saving...' : 'Reject'}</button>
              </div>
            </div>
          ))
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <>
            {loading ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Loading leave history...</p>
              </div>
            ) : error ? (
              <div style={styles.errorBox}><Glyph e="⚠" /> {error}</div>
            ) : leaves.length === 0 ? (
              <EmptyState plain icon={ClipboardList} title="No leave requests yet" text={'Use "Apply Leave" to submit a new request.'} />
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
                      <p style={styles.reviewNote}><Glyph e="📝" /> Admin Note: {leave.reviewNote}</p>
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
          <div className="ea-card" style={styles.formCard}>
            <h3 className="ea-form-section__title">New Leave Request</h3>

            {formError && <div style={styles.errorBox}><Glyph e="⚠" /> {formError}</div>}

            <label className="ea-label" style={styles.label}>Leave Type</label>
            <select
              className="ea-select" style={styles.select}
              value={form.leaveType}
              onChange={e => setForm({ ...form, leaveType: e.target.value })}
            >
              <option value="">Select leave type</option>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="ea-label" style={styles.label}>From Date</label>
            <input
              type="date"
              className="ea-input" style={styles.input}
              value={form.fromDate}
              onChange={e => setForm({ ...form, fromDate: e.target.value })}
            />

            <label className="ea-label" style={styles.label}>To Date</label>
            <input
              type="date"
              className="ea-input" style={styles.input}
              value={form.toDate}
              onChange={e => setForm({ ...form, toDate: e.target.value })}
            />

            <label className="ea-label" style={styles.label}>Reason</label>
            <textarea
              className="ea-input" style={styles.textarea}
              placeholder="Describe the reason for your leave..."
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              rows={4}
            />

            {form.fromDate && form.toDate && new Date(form.toDate) >= new Date(form.fromDate) && (
              <div style={styles.durationPreview}>
                <Glyph e="📅" /> Duration: {dayCount(form.fromDate, form.toDate)} day{dayCount(form.fromDate, form.toDate) > 1 ? 's' : ''}
              </div>
            )}

            <button
              className="ea-btn ea-btn--primary" style={{ width: '100%', minHeight: 48, fontSize: 15 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      <BottomNav role="teacher" />
    </div>
  );
}

// White numbers on the brand card (coloured numbers were unreadable on it); the label says what each is.


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
  successBanner: {
    background: '#E8F5E9',
    color: '#2E7D32',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 16,
  },
  progressBarBg: {
    background: 'var(--ea-hover)',
    borderRadius: 99,
    height: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    background: 'var(--brand)',
    height: '100%',
    borderRadius: 99,
    transition: 'width 0.4s ease',
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
    color: 'var(--brand)',
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
    color: 'var(--brand-dark)',
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
  formCard: { padding: '20px 16px' },
  label: { display: 'block', marginBottom: 6 },
  input: { width: '100%', marginBottom: 14 },
  select: { width: '100%', marginBottom: 14 },
  textarea: { width: '100%', marginBottom: 14 },
  durationPreview: {
    background: '#EEF0FF',
    color: 'var(--brand-dark)',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 14px',
    borderRadius: 10,
    marginBottom: 16,
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
    borderTop: '3px solid var(--brand)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: 'var(--brand)', fontSize: 13, marginTop: 10 },
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
};
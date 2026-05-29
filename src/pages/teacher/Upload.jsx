import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const NOTE_TYPES = ['Notes', 'Assignment', 'Resource', 'Question Paper'];

const TYPE_STYLES = {
  Notes:           { bg: '#EEF0FF', color: '#3949AB', icon: '📄' },
  Assignment:      { bg: '#FFF8E1', color: '#F9A825', icon: '📝' },
  Resource:        { bg: '#E8F5E9', color: '#2E7D32', icon: '📚' },
  'Question Paper':{ bg: '#FCE4EC', color: '#C2185B', icon: '📋' },
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function TeacherUpload() {
  const navigate = useNavigate();
  const [tab, setTab]               = useState('uploads');
  const [teacher, setTeacher]       = useState(null);
  const [uploads, setUploads]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [formError, setFormError]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    title: '', subject: '', type: 'Notes',
    class: '', section: '', fileUrl: '', fileName: '', dueDate: '',
  });

  const getUser = () => JSON.parse(localStorage.getItem('eduamigo_user'));

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = getUser();
      const headers = { Authorization: `Bearer ${user.token}` };
      const [teacherRes, uploadsRes] = await Promise.all([
        fetch(`${API}/teachers/me`, { headers }),
        fetch(`${API}/notes/teacher`, { headers }),
      ]);
      const teacherData = await teacherRes.json();
      const uploadsData = await uploadsRes.json();
      if (!teacherData.success) throw new Error(teacherData.message);
      if (!uploadsData.success) throw new Error(uploadsData.message);
      setTeacher(teacherData.data);
      setUploads(uploadsData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    setFormError('');
    const { title, subject, type, class: cls, fileUrl, fileName } = form;
    if (!title.trim())    return setFormError('Title is required.');
    if (!subject.trim())  return setFormError('Subject is required.');
    if (!cls.trim())      return setFormError('Class is required.');
    if (!fileUrl.trim())  return setFormError('File URL is required.');
    if (!fileName.trim()) return setFormError('File name is required.');
    if (type === 'Assignment' && !form.dueDate)
      return setFormError('Due date is required for assignments.');
    try {
      setSubmitting(true);
      const user = getUser();
      const res = await fetch(`${API}/notes/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          title:    form.title,
          subject:  form.subject,
          type:     form.type,
          class:    form.class,
          section:  form.section,
          fileUrl:  form.fileUrl,
          fileName: form.fileName,
          dueDate:  form.dueDate || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccessMsg('Upload successful!');
      setForm({ title: '', subject: '', type: 'Notes', class: '', section: '', fileUrl: '', fileName: '', dueDate: '' });
      setTab('uploads');
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const classes  = teacher?.assignedClasses || [];
  const subjects = teacher?.subjects || [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/teacher/home')} style={styles.backBtn}>←</button>
        <div style={{ flex: 1 }}>
          <p style={styles.portalLabel}>TEACHER PORTAL</p>
          <h1 style={styles.headerTitle}>Upload Materials</h1>
        </div>
        {uploads.length > 0 && (
          <div style={styles.countBadge}>{uploads.length}</div>
        )}
      </div>

      <div style={styles.content}>
        {successMsg && <div style={styles.successBanner}>✅ {successMsg}</div>}

        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tab, ...(tab === 'uploads' ? styles.tabActive : {}) }}
            onClick={() => setTab('uploads')}
          >
            My Uploads
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'upload' ? styles.tabActive : {}) }}
            onClick={() => setTab('upload')}
          >
            + New Upload
          </button>
        </div>

        {tab === 'uploads' && (
          <>
            {loading ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Loading uploads...</p>
              </div>
            ) : error ? (
              <div style={styles.errorBox}>⚠️ {error}</div>
            ) : uploads.length === 0 ? (
              <div style={styles.emptyBox}>
                <p style={styles.emptyIcon}>📤</p>
                <p style={styles.emptyText}>No uploads yet</p>
                <p style={styles.emptySubText}>Tap "New Upload" to share materials with students.</p>
              </div>
            ) : (
              uploads.map(u => {
                const ts = TYPE_STYLES[u.type] || TYPE_STYLES.Notes;
                return (
                  <div key={u._id} style={styles.card}>
                    <div style={styles.cardLeft}>
                      <div style={{ ...styles.iconBox, background: ts.bg }}>
                        <span style={styles.iconText}>{ts.icon}</span>
                      </div>
                    </div>
                    <div style={styles.cardBody}>
                      <div style={styles.cardTop}>
                        <p style={styles.cardTitle}>{u.title}</p>
                        <span style={{ ...styles.typeBadge, background: ts.bg, color: ts.color }}>
                          {u.type}
                        </span>
                      </div>
                      <p style={styles.cardMeta}>
                        {u.subject} • Class {u.class}{u.section ? ` ${u.section}` : ''}
                      </p>
                      {u.dueDate && (
                        <p style={styles.dueDateText}>📅 Due: {formatDate(u.dueDate)}</p>
                      )}
                      <div style={styles.cardFooter}>
                        <span style={styles.timeText}>{formatDate(u.createdAt)}</span>
                        {u.fileUrl && (
                          <a
                            href={u.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.viewLink}
                          >
                            View File ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {tab === 'upload' && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>New Material Upload</h3>
            {formError && <div style={styles.errorBox}>⚠️ {formError}</div>}

            <label style={styles.label}>Title</label>
            <input
              style={styles.input}
              placeholder="e.g. Chapter 5 Notes"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <label style={styles.label}>Type</label>
            <select
              style={styles.select}
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label style={styles.label}>Subject</label>
            <select
              style={styles.select}
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
            >
              <option value="">Select subject</option>
              {subjects.length > 0
                ? subjects.map(s => <option key={s} value={s}>{s}</option>)
                : <option disabled>No subjects assigned</option>
              }
            </select>

            <label style={styles.label}>Class</label>
            <select
              style={styles.select}
              value={form.class}
              onChange={e => setForm({ ...form, class: e.target.value })}
            >
              <option value="">Select class</option>
              {classes.length > 0
                ? classes.map(c => <option key={c} value={c}>{c}</option>)
                : <option disabled>No classes assigned</option>
              }
            </select>

            <label style={styles.label}>Section (Optional)</label>
            <input
              style={styles.input}
              placeholder="e.g. A, B, C"
              value={form.section}
              onChange={e => setForm({ ...form, section: e.target.value })}
            />

            <label style={styles.label}>File Name</label>
            <input
              style={styles.input}
              placeholder="e.g. Chapter5_Notes.pdf"
              value={form.fileName}
              onChange={e => setForm({ ...form, fileName: e.target.value })}
            />

            <label style={styles.label}>File URL</label>
            <input
              style={styles.input}
              placeholder="Paste Google Drive / any file link"
              value={form.fileUrl}
              onChange={e => setForm({ ...form, fileUrl: e.target.value })}
            />
            <p style={styles.hintText}>
              Upload your file to Google Drive, set sharing to "Anyone with link", then paste the link above.
            </p>

            {form.type === 'Assignment' && (
              <>
                <label style={styles.label}>Due Date</label>
                <input
                  type="date"
                  style={styles.input}
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              </>
            )}

            <button
              style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Uploading...' : 'Upload Material'}
            </button>
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      <div style={styles.bottomNav}>
        <NavItem icon="🏠" label="Home"       onClick={() => navigate('/teacher/home')} />
        <NavItem icon="✅" label="Attendance" onClick={() => navigate('/teacher/attendance')} />
        <NavItem icon="📤" label="Upload"     onClick={() => navigate('/teacher/upload')} active />
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
  content: { padding: '16px', marginTop: -12 },
  successBanner: {
    background: '#E8F5E9',
    color: '#2E7D32',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 16,
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
  tabActive: { background: '#5C6BC0', color: '#fff' },
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
  cardLeft: { flexShrink: 0 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  cardBody: { flex: 1, minWidth: 0 },
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
  cardMeta: { fontSize: 12, color: '#5C6BC0', fontWeight: 500, margin: '0 0 4px' },
  dueDateText: { fontSize: 12, color: '#F9A825', fontWeight: 600, margin: '0 0 6px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 11, color: '#BDBDBD', fontWeight: 500 },
  viewLink: { fontSize: 12, color: '#5C6BC0', fontWeight: 700, textDecoration: 'none' },
  formCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  formTitle: { fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: '0 0 16px' },
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
  hintText: { fontSize: 11, color: '#9E9E9E', margin: '-10px 0 14px', lineHeight: 1.5 },
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
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' },
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
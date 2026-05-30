import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const subjectIcon = (subject = '') => {
  const s = subject.toLowerCase();
  if (s.includes('math'))    return { icon: '📐', color: '#E8F0FE' };
  if (s.includes('phys'))    return { icon: '⚡', color: '#FEF9E7' };
  if (s.includes('chem'))    return { icon: '⚗️', color: '#E6F4EA' };
  if (s.includes('eng'))     return { icon: '📖', color: '#F3E8FF' };
  if (s.includes('bio'))     return { icon: '🔬', color: '#E8F5E9' };
  if (s.includes('hist'))    return { icon: '🌍', color: '#FBE9E7' };
  if (s.includes('hindi'))   return { icon: '📝', color: '#FFF8E1' };
  return                            { icon: '📚', color: '#F0F4FF' };
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const tabs = [
  { key: 'Notes',     label: '📝 Notes' },
  { key: 'Tasks',     label: '📌 Tasks' },
  { key: 'Resources', label: '📂 Resources' },
];

export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef();

  const [activeTab,    setActiveTab]    = useState('Notes');
  const [search,       setSearch]       = useState('');
  const [notes,        setNotes]        = useState([]);
  const [assignments,  setAssignments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploaded,     setUploaded]     = useState(false);

  // Upload form state
  const [form, setForm] = useState({
    title: '', subject: 'Mathematics', type: 'Notes', class: user?.class || '', section: user?.section || '',
    fileUrl: '', fileName: '', fileSize: '', dueDate: '',
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [notesRes, assignRes] = await Promise.allSettled([
        axios.get(`${API}/notes/my`,          authHeader()),
        axios.get(`${API}/notes/assignments`, authHeader()),
      ]);
      if (notesRes.status === 'fulfilled' && notesRes.value.data.success)
        setNotes(notesRes.value.data.data || []);
      if (assignRes.status === 'fulfilled' && assignRes.value.data.success)
        setAssignments(assignRes.value.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Urgent assignment — nearest due within 24hrs
  const urgentTask = assignments.find(a =>
    a.status === 'Urgent' ||
    (a.dueDate && new Date(a.dueDate) - new Date() < 86400000 && new Date(a.dueDate) > new Date())
  );

  const resources = notes.filter(n => n.type === 'Resource' || n.type === 'Question Paper');
  const onlyNotes = notes.filter(n => n.type === 'Notes');

  const filtered = (activeTab === 'Notes' ? onlyNotes : resources).filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = async () => {
    if (!form.title || !form.subject) return;
    setUploading(true);
    try {
      await axios.post(`${API}/notes/upload`, form, authHeader());
      setUploaded(true);
      setTimeout(() => {
        setUploaded(false);
        setShowModal(false);
        setForm({ title: '', subject: 'Mathematics', type: 'Notes', class: user?.class || '', section: user?.section || '', fileUrl: '', fileName: '', fileSize: '', dueDate: '' });
        fetchAll();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#4361EE' }}>
      Loading...
    </div>
  );

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/student/home')}>←</button>
        <h1 style={styles.headerTitle}>📚 Notes & Assignments</h1>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>+</button>
      </div>

      {/* Search */}
      <div style={styles.searchBox}>
        <span style={styles.searchIcon}>🔍</span>
        <input style={styles.searchInput} placeholder="Search notes, subjects..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Tabs */}
      <div style={styles.tabRow}>
        {tabs.map(tab => (
          <button key={tab.key}
            style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>

        {/* Urgent Alert */}
        {activeTab === 'Notes' && urgentTask && (
          <div style={styles.alertBanner}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={styles.alertTitle}>{urgentTask.title} — Due Soon!</div>
              <div style={styles.alertSub}>Submit before {formatDate(urgentTask.dueDate)}</div>
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'Notes' && (
          <>
            <div style={styles.sectionLabel}>RECENT NOTES</div>
            {filtered.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, color: '#999' }}>No notes available yet</div>
                <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>
                  Notes will appear here once uploaded by your teacher.
                </div>
              </div>
            ) : (
              filtered.map(note => {
                const { icon, color } = subjectIcon(note.subject);
                return (
                  <div key={note._id} style={styles.noteCard}>
                    <div style={{ ...styles.noteIcon, background: color }}>{icon}</div>
                    <div style={styles.noteInfo}>
                      <div style={styles.noteTitle}>{note.title}</div>
                      <div style={styles.noteMeta}>
                        {note.teacherName} • {note.subject} • {note.fileSize || '—'} • {formatDate(note.createdAt)}
                      </div>
                    </div>
                    {note.fileUrl ? (
                      <a href={note.fileUrl} target="_blank" rel="noreferrer" style={styles.downloadBtn}>↓</a>
                    ) : (
                      <button style={{ ...styles.downloadBtn, opacity: 0.4 }} disabled>↓</button>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* TASKS TAB */}
        {activeTab === 'Tasks' && (
          <>
            <div style={styles.sectionLabel}>MY ASSIGNMENTS</div>
            {assignments.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, color: '#999' }}>No assignments yet</div>
                <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>
                  Assignments will appear here once assigned by your teacher.
                </div>
              </div>
            ) : (
              assignments.map(task => {
                const isUrgent = task.status === 'Urgent' ||
                  (task.dueDate && new Date(task.dueDate) - new Date() < 86400000);
                const isDone = task.status === 'Submitted';
                const accentColor = isDone ? '#2E7D32' : isUrgent ? '#FF6B00' : '#1565C0';
                const { icon, color } = subjectIcon(task.subject);
                return (
                  <div key={task._id} style={styles.taskCard}>
                    <div style={styles.taskLeft}>
                      <div style={{ ...styles.taskAccent, background: accentColor }} />
                      <div style={{ ...styles.noteIcon, background: color }}>{icon}</div>
                      <div style={styles.noteInfo}>
                        <div style={styles.noteTitle}>{task.title}</div>
                        <div style={styles.noteMeta}>
                          Due: {formatDate(task.dueDate)} •{' '}
                          <span style={{ color: accentColor, fontWeight: 600 }}>
                            {isDone ? 'Submitted ✅' : isUrgent ? 'Urgent' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isDone
                      ? <button style={styles.doneBtn}>Done</button>
                      : <button style={styles.submitBtn}>Submit</button>
                    }
                  </div>
                );
              })
            )}
          </>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'Resources' && (
          <>
            <div style={styles.sectionLabel}>STUDY RESOURCES</div>
            {filtered.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, color: '#999' }}>No resources available yet</div>
                <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>
                  Study resources will appear here once uploaded by your teacher.
                </div>
              </div>
            ) : (
              filtered.map(res => {
                const { icon, color } = subjectIcon(res.subject);
                return (
                  <div key={res._id} style={styles.noteCard}>
                    <div style={{ ...styles.noteIcon, background: color }}>{icon}</div>
                    <div style={styles.noteInfo}>
                      <div style={styles.noteTitle}>{res.title}</div>
                      <div style={styles.noteMeta}>{res.type} • {res.fileSize || '—'}</div>
                    </div>
                    {res.fileUrl ? (
                      <a href={res.fileUrl} target="_blank" rel="noreferrer" style={styles.downloadBtn}>↓</a>
                    ) : (
                      <button style={{ ...styles.downloadBtn, opacity: 0.4 }} disabled>↓</button>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        {[
          { icon: '🏠', label: 'HOME',  path: '/student/home' },
          { icon: '🚌', label: 'BUS',   path: '/student/bus' },
          { icon: '📚', label: 'LEARN', path: '/student/notes', active: true },
          { icon: '💬', label: 'CHAT',  path: '/student/chat' },
          { icon: '👤', label: 'ME',    path: '/student/profile' },
        ].map(item => (
          <button key={item.label} style={styles.navItem} onClick={() => navigate(item.path)}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ ...styles.navLabel, ...(item.active ? { color: '#4361EE' } : {}) }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.dragHandle} />
            <h2 style={styles.modalTitle}>🗂️ Upload File</h2>

            {[
              { label: 'SUBJECT', key: 'subject', options: ['Mathematics','Physics','Chemistry','English','Biology','History','Hindi'] },
              { label: 'TYPE',    key: 'type',    options: ['Notes','Assignment','Resource','Question Paper'] },
            ].map(f => (
              <div key={f.key}>
                <div style={styles.fieldLabel}>{f.label}</div>
                <select style={styles.select} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}

            <div style={styles.fieldLabel}>TITLE</div>
            <input style={styles.input} placeholder="e.g. Trigonometry Chapter 8"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

            <div style={styles.fieldLabel}>FILE URL (Google Drive / S3 link)</div>
            <input style={styles.input} placeholder="https://..."
              value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} />

            {form.type === 'Assignment' && (
              <>
                <div style={styles.fieldLabel}>DUE DATE</div>
                <input style={styles.input} type="date"
                  value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </>
            )}

            <button style={{ ...styles.uploadBtn, opacity: uploading ? 0.7 : 1 }}
              onClick={handleUpload} disabled={uploading}>
              {uploaded ? '✅ Uploaded successfully!' : uploading ? 'Uploading...' : '⬆️ Upload Now'}
            </button>
            <button style={styles.cancelBtn}
              onClick={() => { setShowModal(false); setForm({ ...form, title: '', fileUrl: '' }); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  screen: { maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: '#F8F9FB',
    fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column',
    position: 'relative', paddingBottom: 80 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '48px 20px 12px', background: '#fff', borderBottom: '1px solid #F0F0F0' },
  backBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#333', padding: '4px 8px' },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 },
  addBtn: { background: '#F0F4FF', border: 'none', borderRadius: 10, width: 36, height: 36,
    fontSize: 22, cursor: 'pointer', color: '#4361EE', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', background: '#F0F2F5',
    borderRadius: 12, margin: '12px 16px', padding: '10px 14px', gap: 8 },
  searchIcon: { fontSize: 16, opacity: 0.5 },
  searchInput: { border: 'none', background: 'transparent', fontSize: 14,
    color: '#333', outline: 'none', width: '100%' },
  tabRow: { display: 'flex', gap: 8, padding: '0 16px 12px' },
  tab: { padding: '8px 16px', borderRadius: 20, border: '1.5px solid #E0E0E0',
    background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#666' },
  tabActive: { border: '1.5px solid #4361EE', color: '#4361EE', fontWeight: 700, background: '#F0F4FF' },
  content: { flex: 1, padding: '0 16px', overflowY: 'auto' },
  alertBanner: { background: 'linear-gradient(135deg, #FF6B00, #FF8C00)', borderRadius: 14,
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  alertTitle: { color: '#fff', fontWeight: 700, fontSize: 14 },
  alertSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  noteCard: { background: '#fff', borderRadius: 14, padding: '12px 14px',
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)' },
  noteIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  noteInfo: { flex: 1 },
  noteTitle: { fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 3 },
  noteMeta: { fontSize: 12, color: '#888' },
  downloadBtn: { background: '#F0F2F5', border: 'none', borderRadius: 10, width: 34, height: 34,
    fontSize: 16, cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, textDecoration: 'none' },
  emptyBox: { background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center',
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginTop: 8 },
  taskCard: { background: '#fff', borderRadius: 14, padding: '12px 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', gap: 8 },
  taskLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  taskAccent: { width: 4, height: 40, borderRadius: 4, flexShrink: 0 },
  submitBtn: { background: 'linear-gradient(135deg, #FF6B00, #FF8C00)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13,
    fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  doneBtn: { background: '#E8F5E9', color: '#2E7D32', border: '1.5px solid #A5D6A7',
    borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700,
    cursor: 'default', flexShrink: 0 },
  bottomNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 420, background: '#fff', borderTop: '1px solid #F0F0F0',
    display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px', zIndex: 100 },
  navItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px' },
  navLabel: { fontSize: 10, fontWeight: 600, color: '#999' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: '24px 24px 0 0', padding: '12px 24px 36px',
    width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' },
  dragHandle: { width: 40, height: 4, background: '#E0E0E0', borderRadius: 4,
    alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: '0 0 20px' },
  fieldLabel: { fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  select: { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E8E8F0',
    background: '#F8F8FF', fontSize: 14, color: '#1A1A2E', outline: 'none', cursor: 'pointer' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E8E8F0',
    background: '#fff', fontSize: 14, color: '#1A1A2E', outline: 'none', boxSizing: 'border-box' },
  uploadBtn: { marginTop: 20, width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #4361EE, #3A0CA3)', color: '#fff',
    border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { marginTop: 12, background: 'none', border: 'none', color: '#4361EE',
    fontSize: 15, fontWeight: 600, cursor: 'pointer', alignSelf: 'center' },
};
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
const subjectIcon = (subject = '') => {
  const s = subject.toLowerCase();
  if (s.includes('math'))  return { icon: '📐', color: '#E8F0FE' };
  if (s.includes('phys'))  return { icon: '⚡', color: '#FEF9E7' };
  if (s.includes('chem'))  return { icon: '⚗️', color: '#E6F4EA' };
  if (s.includes('eng'))   return { icon: '📖', color: '#F3E8FF' };
  if (s.includes('bio'))   return { icon: '🔬', color: '#E8F5E9' };
  if (s.includes('hist'))  return { icon: '🌍', color: '#FBE9E7' };
  if (s.includes('hindi')) return { icon: '📝', color: '#FFF8E1' };
  return                          { icon: '📚', color: '#F0F4FF' };
};
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const tabs = [
  { key: 'Notes',     label: '📝 Notes' },
  { key: 'Tasks',     label: '📌 Tasks' },
  { key: 'Resources', label: '📂 Resources' },
];
export default function Notes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode: dm } = useTheme();
  const [activeTab,   setActiveTab]   = useState('Notes');
  const [search,      setSearch]      = useState('');
  const [notes,       setNotes]       = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploaded,    setUploaded]    = useState(false);
  const [form, setForm] = useState({
    title: '', subject: 'Mathematics', type: 'Notes',
    class: user?.class || '', section: user?.section || '',
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
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: dm ? '#0f172a' : '#F8F9FB', fontFamily: 'Inter, sans-serif', color: '#4361EE' }}>
      Loading...
    </div>
  );
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: dm ? '#0f172a' : '#F8F9FB', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', position: 'relative', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '48px 20px 12px', background: dm ? '#1e293b' : '#fff', borderBottom: `1px solid ${dm ? '#334155' : '#F0F0F0'}` }}>
        <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: dm ? '#ffffff' : '#333', padding: '4px 8px' }} onClick={() => navigate('/student/home')}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: dm ? '#f1f5f9' : '#1A1A2E', margin: 0 }}>📚 Notes & Assignments</h1>
        <button style={{ background: dm ? '#1e3a5f' : '#F0F4FF', border: 'none', borderRadius: 10, width: 36, height: 36, fontSize: 22, cursor: 'pointer', color: '#4361EE', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(true)}>+</button>
      </div>
      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', background: dm ? '#0f172a' : '#F0F2F5', borderRadius: 12, margin: '12px 16px', padding: '10px 14px', gap: 8 }}>
        <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
        <input style={{ border: 'none', background: 'transparent', fontSize: 14, color: dm ? '#f1f5f9' : '#333', outline: 'none', width: '100%' }} placeholder="Search notes, subjects..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        {tabs.map(tab => (
          <button key={tab.key}
            style={{ padding: '8px 16px', borderRadius: 20, border: activeTab === tab.key ? '1.5px solid #4361EE' : `1.5px solid ${dm ? '#334155' : '#E0E0E0'}`, background: activeTab === tab.key ? (dm ? '#1e3a5f' : '#F0F4FF') : (dm ? '#1e293b' : '#fff'), fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, cursor: 'pointer', color: activeTab === tab.key ? '#4361EE' : (dm ? '#94a3b8' : '#666') }}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
        {activeTab === 'Notes' && urgentTask && (
          <div style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C00)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{urgentTask.title} — Due Soon!</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>Submit before {formatDate(urgentTask.dueDate)}</div>
            </div>
          </div>
        )}
        {/* NOTES TAB */}
        {activeTab === 'Notes' && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: dm ? '#64748b' : '#999', letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>RECENT NOTES</div>
            {filtered.length === 0 ? (
              <div style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginTop: 8 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, color: dm ? '#94a3b8' : '#999' }}>No notes available yet</div>
                <div style={{ fontSize: 12, color: dm ? '#64748b' : '#bbb', marginTop: 4 }}>Notes will appear here once uploaded by your teacher.</div>
              </div>
            ) : filtered.map(note => {
              const { icon, color } = subjectIcon(note.subject);
              return (
                <div key={note._id} style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: color }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: dm ? '#f1f5f9' : '#1A1A2E', marginBottom: 3 }}>{note.title}</div>
                    <div style={{ fontSize: 12, color: dm ? '#94a3b8' : '#888' }}>{note.teacherName} • {note.subject} • {formatDate(note.createdAt)}</div>
                  </div>
                  {note.fileUrl
                    ? <a href={note.fileUrl} target="_blank" rel="noreferrer" style={{ background: dm ? '#0f172a' : '#F0F2F5', border: 'none', borderRadius: 10, width: 34, height: 34, fontSize: 16, cursor: 'pointer', color: dm ? '#94a3b8' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>↓</a>
                    : <button style={{ background: dm ? '#0f172a' : '#F0F2F5', border: 'none', borderRadius: 10, width: 34, height: 34, fontSize: 16, color: dm ? '#94a3b8' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.4 }} disabled>↓</button>
                  }
                </div>
              );
            })}
          </>
        )}
        {/* TASKS TAB */}
        {activeTab === 'Tasks' && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: dm ? '#64748b' : '#999', letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>MY ASSIGNMENTS</div>
            {assignments.length === 0 ? (
              <div style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginTop: 8 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, color: dm ? '#94a3b8' : '#999' }}>No assignments yet</div>
                <div style={{ fontSize: 12, color: dm ? '#64748b' : '#bbb', marginTop: 4 }}>Assignments will appear here once assigned by your teacher.</div>
              </div>
            ) : assignments.map(task => {
              const isUrgent = task.status === 'Urgent' || (task.dueDate && new Date(task.dueDate) - new Date() < 86400000);
              const isDone = task.status === 'Submitted';
              const accentColor = isDone ? '#2E7D32' : isUrgent ? '#FF6B00' : '#1565C0';
              const { icon, color } = subjectIcon(task.subject);
              return (
                <div key={task._id} style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{ width: 4, height: 40, borderRadius: 4, flexShrink: 0, background: accentColor }} />
                    <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: color }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: dm ? '#f1f5f9' : '#1A1A2E', marginBottom: 3 }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: dm ? '#94a3b8' : '#888' }}>Due: {formatDate(task.dueDate)} • <span style={{ color: accentColor, fontWeight: 600 }}>{isDone ? 'Submitted ✅' : isUrgent ? 'Urgent' : 'Pending'}</span></div>
                    </div>
                  </div>
                  {isDone
                    ? <button style={{ background: '#E8F5E9', color: '#2E7D32', border: '1.5px solid #A5D6A7', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'default', flexShrink: 0 }}>Done</button>
                    : <button style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C00)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Submit</button>
                  }
                </div>
              );
            })}
          </>
        )}
        {/* RESOURCES TAB */}
        {activeTab === 'Resources' && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: dm ? '#64748b' : '#999', letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>STUDY RESOURCES</div>
            {filtered.length === 0 ? (
              <div style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginTop: 8 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, color: dm ? '#94a3b8' : '#999' }}>No resources available yet</div>
                <div style={{ fontSize: 12, color: dm ? '#64748b' : '#bbb', marginTop: 4 }}>Study resources will appear here once uploaded by your teacher.</div>
              </div>
            ) : filtered.map(res => {
              const { icon, color } = subjectIcon(res.subject);
              return (
                <div key={res._id} style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: color }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: dm ? '#f1f5f9' : '#1A1A2E', marginBottom: 3 }}>{res.title}</div>
                    <div style={{ fontSize: 12, color: dm ? '#94a3b8' : '#888' }}>{res.type} • {res.fileSize || '—'}</div>
                  </div>
                  {res.fileUrl
                    ? <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{ background: dm ? '#0f172a' : '#F0F2F5', border: 'none', borderRadius: 10, width: 34, height: 34, fontSize: 16, cursor: 'pointer', color: dm ? '#94a3b8' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>↓</a>
                    : <button style={{ background: dm ? '#0f172a' : '#F0F2F5', border: 'none', borderRadius: 10, width: 34, height: 34, fontSize: 16, color: dm ? '#94a3b8' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.4 }} disabled>↓</button>
                  }
                </div>
              );
            })}
          </>
        )}
      </div>
      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: dm ? '#1e293b' : '#fff', borderTop: `1px solid ${dm ? '#334155' : '#F0F0F0'}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px', zIndex: 100 }}>
        {[
          { icon: '🏠', label: 'HOME',  path: '/student/home' },
          { icon: '🚌', label: 'BUS',   path: '/student/bus' },
          { icon: '📚', label: 'LEARN', path: '/student/notes', active: true },
          { icon: '💬', label: 'CHAT',  path: '/student/chat' },
          { icon: '👤', label: 'ME',    path: '/student/profile' },
        ].map(item => (
          <button key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px' }} onClick={() => navigate(item.path)}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: item.active ? '#4361EE' : (dm ? '#64748b' : '#999') }}>{item.label}</span>
          </button>
        ))}
      </div>
      {/* Upload Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: dm ? '#1e293b' : '#fff', borderRadius: '24px 24px 0 0', padding: '12px 24px 36px', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 40, height: 4, background: dm ? '#334155' : '#E0E0E0', borderRadius: 4, alignSelf: 'center', marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: dm ? '#f1f5f9' : '#1A1A2E', margin: '0 0 20px' }}>🗂️ Upload File</h2>
            {[
              { label: 'SUBJECT', key: 'subject', options: ['Mathematics','Physics','Chemistry','English','Biology','History','Hindi'] },
              { label: 'TYPE',    key: 'type',    options: ['Notes','Assignment','Resource','Question Paper'] },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 11, fontWeight: 700, color: dm ? '#94a3b8' : '#999', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>{f.label}</div>
                <select style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${dm ? '#334155' : '#E8E8F0'}`, background: dm ? '#0f172a' : '#F8F8FF', fontSize: 14, color: dm ? '#f1f5f9' : '#1A1A2E', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', colorScheme: dm ? 'dark' : 'light' }} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, color: dm ? '#94a3b8' : '#999', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>TITLE</div>
            <input style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${dm ? '#334155' : '#E8E8F0'}`, background: dm ? '#0f172a' : '#fff', fontSize: 14, color: dm ? '#f1f5f9' : '#1A1A2E', outline: 'none', boxSizing: 'border-box' }} placeholder="e.g. Trigonometry Chapter 8" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div style={{ fontSize: 11, fontWeight: 700, color: dm ? '#94a3b8' : '#999', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>FILE URL</div>
            <input style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${dm ? '#334155' : '#E8E8F0'}`, background: dm ? '#0f172a' : '#fff', fontSize: 14, color: dm ? '#f1f5f9' : '#1A1A2E', outline: 'none', boxSizing: 'border-box' }} placeholder="https://..." value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} />
            {form.type === 'Assignment' && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: dm ? '#94a3b8' : '#999', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>DUE DATE</div>
                <input style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${dm ? '#334155' : '#E8E8F0'}`, background: dm ? '#0f172a' : '#fff', fontSize: 14, color: dm ? '#f1f5f9' : '#1A1A2E', outline: 'none', boxSizing: 'border-box', colorScheme: dm ? 'dark' : 'light' }} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </>
            )}
            <button style={{ marginTop: 20, width: '100%', padding: '14px', background: 'linear-gradient(135deg, #4361EE, #3A0CA3)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: uploading ? 0.7 : 1 }} onClick={handleUpload} disabled={uploading}>
              {uploaded ? '✅ Uploaded successfully!' : uploading ? 'Uploading...' : '⬆️ Upload Now'}
            </button>
            <button style={{ marginTop: 12, background: 'none', border: 'none', color: '#4361EE', fontSize: 15, fontWeight: 600, cursor: 'pointer', alignSelf: 'center' }} onClick={() => { setShowModal(false); setForm({ ...form, title: '', fileUrl: '' }); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

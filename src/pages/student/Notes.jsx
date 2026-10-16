import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import { Inbox, Plus, SearchX, Sparkles } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import Badge from "../../components/ui/Badge";
import { catOf } from "../../components/ui/tone";
import Segmented from "../../components/ui/Segmented";
import SearchField from "../../components/ui/SearchField";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
// The icon by subject; its colours are the shared category tints for that subject (they also work in dark mode).
const subjectIcon = (subject = '') => {
  const s = subject.toLowerCase();
  const cat = catOf(subject);
  if (s.includes('math'))  return { icon: <Glyph e="📐" />, cat };
  if (s.includes('phys'))  return { icon: <Glyph e="⚡" />, cat };
  if (s.includes('chem'))  return { icon: <Glyph e="⚗" />, cat };
  if (s.includes('eng'))   return { icon: <Glyph e="📖" />, cat };
  if (s.includes('bio'))   return { icon: <Glyph e="🔬" />, cat };
  if (s.includes('hist'))  return { icon: <Glyph e="🌍" />, cat };
  if (s.includes('hindi')) return { icon: <Glyph e="📝" />, cat };
  return                          { icon: <Glyph e="📚" />, cat };
};
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const tabs = [
  { key: 'Notes',     label: 'Notes' },
  { key: 'Tasks',     label: 'Tasks' },
  { key: 'Resources', label: 'Resources' },
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
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: dm ? '#0f172a' : '#F8F9FB', fontFamily: 'inherit' }}>
      <div className="ea-card" style={{ width: 'calc(100% - 32px)', maxWidth: 520, padding: 16, margin: '0 auto' }}><Skeleton rows={5} label="Loading notes" /></div>
    </div>
  );
  return (
    <div style={{ minHeight: '100vh', background: dm ? '#0f172a' : '#F8F9FB', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', position: 'relative', paddingBottom: 80 }}>
      {/* Header */}
      <PortalHeader title="Notes & Assignments" onBack={() => navigate('/student/home')}
        actions={<>
          <button type="button" className="ea-portal-head__btn" onClick={() => navigate('/student/learn')}><Sparkles size={16} aria-hidden="true" /> Revise</button>
          <button type="button" className="ea-portal-head__btn" aria-label="Add a note" onClick={() => setShowModal(true)}><Plus size={18} aria-hidden="true" /></button>
        </>} />
      {/* Search */}
      <div className="ea-pd-bar" style={{ margin: '12px 16px' }}>
        <SearchField value={search} onChange={setSearch} label="Search notes" placeholder="Search notes, subjects..." />
      </div>
      {/* Tabs */}
      <div className="ea-pd-row" style={{ padding: '0 16px 12px' }}>
        <Segmented label="Notes view" value={activeTab} onChange={setActiveTab} options={tabs.map((t) => ({ value: t.key, label: t.label }))} />
      </div>
      {/* Content */}
      <div className="ea-pd-body" style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
        {activeTab === 'Notes' && urgentTask && (
          <div className="ea-note ea-note--warning ea-note--row" style={{ marginBottom: 20 }}>
            <span className="ea-note__icon"><Glyph e="⚠" /></span>
            <div>
              <div className="ea-note__title">{urgentTask.title}: due soon</div>
              <div>Submit before {formatDate(urgentTask.dueDate)}</div>
            </div>
          </div>
        )}
        {/* NOTES TAB */}
        {activeTab === 'Notes' && (
          <>
            <div className="ea-overline" style={{ marginBottom: 10, marginTop: 4 }}>RECENT NOTES</div>
            {filtered.length === 0 ? (
              search
                ? <EmptyState icon={SearchX} title="Nothing matches your search" text="Try a different word, or clear the search." />
                : <EmptyState icon={Inbox} title="No notes available yet" text="Notes will appear here once uploaded by your teacher." />
            ) : filtered.map(note => {
              const { icon, cat } = subjectIcon(note.subject);
              return (
                <div key={note._id} style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: `var(--ea-cat-${cat}-bg)`, color: `var(--ea-cat-${cat})` }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: dm ? '#f1f5f9' : '#1A1A2E', marginBottom: 3 }}>{note.title}</div>
                    <div style={{ fontSize: 12, color: dm ? 'var(--ea-muted)' : 'var(--ea-muted)' }}>{note.teacherName} • {note.subject} • {formatDate(note.createdAt)}</div>
                  </div>
                  {note.fileUrl
                    ? <a href={note.fileUrl} target="_blank" rel="noreferrer" style={{ background: dm ? '#0f172a' : '#F0F2F5', border: '1px solid var(--ea-control-border-soft)', borderRadius: 10, width: 34, height: 34, fontSize: 16, cursor: 'pointer', color: dm ? 'var(--ea-muted)' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>↓</a>
                    : <button style={{ background: dm ? '#0f172a' : '#F0F2F5', border: '1px solid var(--ea-control-border-soft)', borderRadius: 10, width: 34, height: 34, fontSize: 16, color: dm ? 'var(--ea-muted)' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.4 }} disabled>↓</button>
                  }
                </div>
              );
            })}
          </>
        )}
        {/* TASKS TAB */}
        {activeTab === 'Tasks' && (
          <>
            <div className="ea-overline" style={{ marginBottom: 10, marginTop: 4 }}>MY ASSIGNMENTS</div>
            {assignments.length === 0 ? (
              <EmptyState icon={Inbox} title="No assignments yet" text="Assignments will appear here once assigned by your teacher." />
            ) : assignments.map(task => {
              const isUrgent = task.status === 'Urgent' || (task.dueDate && new Date(task.dueDate) - new Date() < 86400000);
              const isDone = task.status === 'Submitted';
              const accentColor = isDone ? '#2E7D32' : isUrgent ? '#C2410C' : 'var(--brand-dark)';
              const { icon, cat } = subjectIcon(task.subject);
              return (
                <div key={task._id} style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{ width: 4, height: 40, borderRadius: 4, flexShrink: 0, background: accentColor }} />
                    <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: `var(--ea-cat-${cat}-bg)`, color: `var(--ea-cat-${cat})` }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: dm ? '#f1f5f9' : '#1A1A2E', marginBottom: 3 }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: dm ? 'var(--ea-muted)' : 'var(--ea-muted)' }}>Due: {formatDate(task.dueDate)} • <span style={{ color: accentColor, fontWeight: 600 }}>{isDone ? 'Submitted' : isUrgent ? 'Urgent' : 'Pending'}</span></div>
                    </div>
                  </div>
                  {/* No in-app submission yet (there is no submission record on the server), so no Submit button that does
                      nothing: a done task shows its status, an open one links to the teacher's file when there is one. */}
                  {isDone
                    ? <Badge tone="success">Done</Badge>
                    : task.fileUrl && <a href={task.fileUrl} target="_blank" rel="noreferrer" className="ea-btn ea-btn--ghost ea-btn--sm" style={{ flexShrink: 0, textDecoration: 'none' }} aria-label={`Open ${task.title}`}>Open</a>
                  }
                </div>
              );
            })}
          </>
        )}
        {/* RESOURCES TAB */}
        {activeTab === 'Resources' && (
          <>
            <div className="ea-overline" style={{ marginBottom: 10, marginTop: 4 }}>STUDY RESOURCES</div>
            {filtered.length === 0 ? (
              search
                ? <EmptyState icon={SearchX} title="Nothing matches your search" text="Try a different word, or clear the search." />
                : <EmptyState icon={Inbox} title="No resources available yet" text="Study resources will appear here once uploaded by your teacher." />
            ) : filtered.map(res => {
              const { icon, cat } = subjectIcon(res.subject);
              return (
                <div key={res._id} style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: `var(--ea-cat-${cat}-bg)`, color: `var(--ea-cat-${cat})` }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: dm ? '#f1f5f9' : '#1A1A2E', marginBottom: 3 }}>{res.title}</div>
                    <div style={{ fontSize: 12, color: dm ? 'var(--ea-muted)' : 'var(--ea-muted)' }}>{res.type} • {res.fileSize || '—'}</div>
                  </div>
                  {res.fileUrl
                    ? <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{ background: dm ? '#0f172a' : '#F0F2F5', border: '1px solid var(--ea-control-border-soft)', borderRadius: 10, width: 34, height: 34, fontSize: 16, cursor: 'pointer', color: dm ? 'var(--ea-muted)' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>↓</a>
                    : <button style={{ background: dm ? '#0f172a' : '#F0F2F5', border: '1px solid var(--ea-control-border-soft)', borderRadius: 10, width: 34, height: 34, fontSize: 16, color: dm ? 'var(--ea-muted)' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.4 }} disabled>↓</button>
                  }
                </div>
              );
            })}
          </>
        )}
      </div>
      <BottomNav role="student" />
      {/* Upload Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: dm ? '#1e293b' : '#fff', borderRadius: '24px 24px 0 0', padding: '12px 24px 36px', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 40, height: 4, background: dm ? '#334155' : '#E0E0E0', borderRadius: 4, alignSelf: 'center', marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: dm ? '#f1f5f9' : '#1A1A2E', margin: '0 0 20px' }}><Glyph e="🗂" /> Upload File</h2>
            {[
              { label: 'SUBJECT', key: 'subject', options: ['Mathematics','Physics','Chemistry','English','Biology','History','Hindi'] },
              { label: 'TYPE',    key: 'type',    options: ['Notes','Assignment','Resource','Question Paper'] },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 11, fontWeight: 700, color: dm ? 'var(--ea-muted)' : 'var(--ea-muted)', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>{f.label}</div>
                <select style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${dm ? '#334155' : 'var(--ea-edge)'}`, background: dm ? '#0f172a' : '#F8F8FF', fontSize: 14, color: dm ? '#f1f5f9' : '#1A1A2E', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', colorScheme: dm ? 'dark' : 'light' }} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, color: dm ? 'var(--ea-muted)' : 'var(--ea-muted)', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>TITLE</div>
            <input style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${dm ? '#334155' : 'var(--ea-edge)'}`, background: dm ? '#0f172a' : '#fff', fontSize: 14, color: dm ? '#f1f5f9' : '#1A1A2E', outline: 'none', boxSizing: 'border-box' }} placeholder="e.g. Trigonometry Chapter 8" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div style={{ fontSize: 11, fontWeight: 700, color: dm ? 'var(--ea-muted)' : 'var(--ea-muted)', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>FILE URL</div>
            <input style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${dm ? '#334155' : 'var(--ea-edge)'}`, background: dm ? '#0f172a' : '#fff', fontSize: 14, color: dm ? '#f1f5f9' : '#1A1A2E', outline: 'none', boxSizing: 'border-box' }} placeholder="https://..." value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} />
            {form.type === 'Assignment' && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: dm ? 'var(--ea-muted)' : 'var(--ea-muted)', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>DUE DATE</div>
                <input style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${dm ? '#334155' : 'var(--ea-edge)'}`, background: dm ? '#0f172a' : '#fff', fontSize: 14, color: dm ? '#f1f5f9' : '#1A1A2E', outline: 'none', boxSizing: 'border-box', colorScheme: dm ? 'dark' : 'light' }} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </>
            )}
            <button type="button" className="ea-btn ea-btn--primary" style={{ marginTop: 20, width: '100%', minHeight: 48, fontSize: 15 }} onClick={handleUpload} disabled={uploading}>
              {uploaded ? 'Uploaded successfully!' : uploading ? 'Uploading...' : 'Upload Now'}
            </button>
            <button style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--brand-text)', fontSize: 15, fontWeight: 600, cursor: 'pointer', alignSelf: 'center' }} onClick={() => { setShowModal(false); setForm({ ...form, title: '', fileUrl: '' }); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

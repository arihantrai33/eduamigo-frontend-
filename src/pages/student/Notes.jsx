import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const notesData = [
  { id: 1, title: 'Trigonometry — Chapter 8', teacher: 'Mr. Sharma', subject: 'Math', size: '2.4 MB', date: '28 Mar', color: '#E8F0FE', icon: '📐' },
  { id: 2, title: 'Electrochemistry Notes', teacher: 'Ms. Verma', subject: 'Chemistry', size: '1.8 MB', date: '26 Mar', color: '#E6F4EA', icon: '⚗️' },
  { id: 3, title: 'Electricity & Magnetism', teacher: 'Mr. Patel', subject: 'Physics', size: '3.1 MB', date: '24 Mar', color: '#FEF9E7', icon: '⚡' },
  { id: 4, title: 'The Last Lesson — English', teacher: 'Mrs. Gupta', subject: 'English', size: '980 KB', date: '22 Mar', color: '#F3E8FF', icon: '📖' },
]

const tasksData = [
  { id: 1, title: 'Physics Practical File', due: '29 Mar 2026', status: 'Urgent', icon: '🔬' },
  { id: 2, title: 'English Essay — Climate', due: '2 Apr 2026', status: 'Pending', daysLeft: '5 days left', icon: '✏️' },
  { id: 3, title: 'Math Practice Paper Set', due: '5 Apr 2026', status: 'Done', icon: '📊' },
]

const resourcesData = [
  { id: 1, title: 'NCERT Physics Part 1', type: 'PDF', size: '12 MB', icon: '📚' },
  { id: 2, title: 'Chemistry Formula Sheet', type: 'PDF', size: '2.1 MB', icon: '🧪' },
  { id: 3, title: 'Math Practice Papers', type: 'ZIP', size: '8.4 MB', icon: '📐' },
]

const tabs = [
  { key: 'Notes', label: '📝 Notes' },
  { key: 'Tasks', label: '📌 Tasks' },
  { key: 'Resources', label: '📂 Resources' },
]

export default function Notes() {
  const [activeTab, setActiveTab] = useState('Notes')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [subject, setSubject] = useState('Mathematics')
  const [type, setType] = useState('Notes')
  const [title, setTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploaded, setUploaded] = useState(false)
  const fileInputRef = useRef()
  const navigate = useNavigate()

  const filteredNotes = notesData.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.toLowerCase().includes(search.toLowerCase())
  )

  const handleUpload = () => {
    setUploaded(true)
    setTimeout(() => {
      setUploaded(false)
      setShowModal(false)
      setTitle('')
      setSelectedFile(null)
    }, 2000)
  }

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
        <input
          style={styles.searchInput}
          placeholder="Search notes, subjects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div style={styles.tabRow}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>

        {/* NOTES TAB */}
        {activeTab === 'Notes' && (
          <>
            <div style={styles.alertBanner}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={styles.alertTitle}>Physics Practical File Due Tomorrow!</div>
                <div style={styles.alertSub}>Submit before 29 March 2026, 11:59 PM</div>
              </div>
            </div>
            <div style={styles.sectionLabel}>RECENT NOTES</div>
            {filteredNotes.length === 0 ? (
              <div style={styles.emptyText}>No notes found.</div>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} style={styles.noteCard}>
                  <div style={{ ...styles.noteIcon, background: note.color }}>{note.icon}</div>
                  <div style={styles.noteInfo}>
                    <div style={styles.noteTitle}>{note.title}</div>
                    <div style={styles.noteMeta}>{note.teacher} • {note.subject} • {note.size} • {note.date}</div>
                  </div>
                  <button style={styles.downloadBtn}>↓</button>
                </div>
              ))
            )}
          </>
        )}

        {/* TASKS TAB */}
        {activeTab === 'Tasks' && (
          <>
            <div style={styles.sectionLabel}>MY ASSIGNMENTS</div>
            {tasksData.map((task) => (
              <div key={task.id} style={styles.taskCard}>
                <div style={styles.taskLeft}>
                  <div style={{
                    ...styles.taskAccent,
                    background: task.status === 'Urgent' ? '#FF6B00'
                      : task.status === 'Done' ? '#2E7D32'
                      : '#1565C0'
                  }} />
                  <div style={{ ...styles.noteIcon, background: '#FEF9E7' }}>{task.icon}</div>
                  <div style={styles.noteInfo}>
                    <div style={styles.noteTitle}>{task.title}</div>
                    <div style={styles.noteMeta}>
                      Due: {task.due} •{' '}
                      <span style={{
                        color: task.status === 'Urgent' ? '#E65100'
                          : task.status === 'Done' ? '#2E7D32'
                          : '#1565C0',
                        fontWeight: 600
                      }}>
                        {task.status === 'Done' ? 'Submitted ✅'
                          : task.daysLeft ? task.daysLeft
                          : task.status}
                      </span>
                    </div>
                  </div>
                </div>
                {task.status === 'Done' ? (
                  <button style={styles.doneBtn}>Done</button>
                ) : (
                  <button style={styles.submitBtn}>Submit</button>
                )}
              </div>
            ))}
          </>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'Resources' && (
          <>
            <div style={styles.sectionLabel}>STUDY RESOURCES</div>
            {resourcesData.map((res) => (
              <div key={res.id} style={styles.noteCard}>
                <div style={{ ...styles.noteIcon, background: '#E8F0FE' }}>{res.icon}</div>
                <div style={styles.noteInfo}>
                  <div style={styles.noteTitle}>{res.title}</div>
                  <div style={styles.noteMeta}>{res.type} • {res.size}</div>
                </div>
                <button style={styles.downloadBtn}>↓</button>
              </div>
            ))}
          </>
        )}

      </div>

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        {[
          { icon: '🏠', label: 'HOME', path: '/student/home' },
          { icon: '🚌', label: 'BUS', path: '/student/bus' },
          { icon: '📚', label: 'LEARN', path: '/student/notes', active: true },
          { icon: '💬', label: 'CHAT', path: '#' },
          { icon: '👤', label: 'ME', path: '#' },
        ].map((item) => (
          <button
            key={item.label}
            style={styles.navItem}
            onClick={() => item.path !== '#' && navigate(item.path)}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ ...styles.navLabel, ...(item.active ? { color: '#4361EE' } : {}) }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.dragHandle} />
            <h2 style={styles.modalTitle}>🗂️ Upload File</h2>

            <div style={styles.fieldLabel}>SUBJECT</div>
            <select style={styles.select} value={subject} onChange={(e) => setSubject(e.target.value)}>
              {['Mathematics', 'Physics', 'Chemistry', 'English', 'Biology', 'History'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <div style={styles.fieldLabel}>TYPE</div>
            <select style={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
              {['Notes', 'Assignment', 'Resource', 'Question Paper'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <div style={styles.fieldLabel}>TITLE</div>
            <input
              style={styles.input}
              placeholder="e.g. Trigonometry Chapter 8"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
              style={{ display: 'none' }}
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />

            <div style={styles.dropZone} onClick={() => fileInputRef.current.click()}>
              <span style={{ fontSize: 36 }}>🗂️</span>
              {selectedFile ? (
                <div style={{ color: '#4361EE', fontWeight: 600, fontSize: 14 }}>{selectedFile.name}</div>
              ) : (
                <>
                  <div style={{ color: '#4361EE', fontWeight: 600, fontSize: 14 }}>Tap to choose file</div>
                  <div style={{ color: '#999', fontSize: 12 }}>PDF, DOC, PPT, Images</div>
                </>
              )}
            </div>

            <button style={styles.uploadBtn} onClick={handleUpload}>
              {uploaded ? '✅ File uploaded & students notified!' : '⬆️ Upload Now'}
            </button>
            <button style={styles.cancelBtn} onClick={() => { setShowModal(false); setSelectedFile(null); setTitle('') }}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

const styles = {
  screen: {
    maxWidth: 420, margin: '0 auto', minHeight: '100vh',
    background: '#F8F9FB', fontFamily: "'Segoe UI', sans-serif",
    display: 'flex', flexDirection: 'column', position: 'relative', paddingBottom: 80,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px 12px', background: '#fff', borderBottom: '1px solid #F0F0F0',
  },
  backBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#333', padding: '4px 8px' },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 },
  addBtn: {
    background: '#F0F4FF', border: 'none', borderRadius: 10,
    width: 36, height: 36, fontSize: 22, cursor: 'pointer', color: '#4361EE', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', background: '#F0F2F5',
    borderRadius: 12, margin: '12px 16px', padding: '10px 14px', gap: 8,
  },
  searchIcon: { fontSize: 16, opacity: 0.5 },
  searchInput: { border: 'none', background: 'transparent', fontSize: 14, color: '#333', outline: 'none', width: '100%' },
  tabRow: { display: 'flex', gap: 8, padding: '0 16px 12px' },
  tab: {
    padding: '8px 16px', borderRadius: 20, border: '1.5px solid #E0E0E0',
    background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#666',
  },
  tabActive: { border: '1.5px solid #4361EE', color: '#4361EE', fontWeight: 700, background: '#F0F4FF' },
  content: { flex: 1, padding: '0 16px', overflowY: 'auto' },
  alertBanner: {
    background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
    borderRadius: 14, padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  alertTitle: { color: '#fff', fontWeight: 700, fontSize: 14 },
  alertSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  noteCard: {
    background: '#fff', borderRadius: 14, padding: '12px 14px',
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  noteIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  noteInfo: { flex: 1 },
  noteTitle: { fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 3 },
  noteMeta: { fontSize: 12, color: '#888' },
  downloadBtn: {
    background: '#F0F2F5', border: 'none', borderRadius: 10,
    width: 34, height: 34, fontSize: 16, cursor: 'pointer', color: '#555',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  taskCard: {
    background: '#fff', borderRadius: 14, padding: '12px 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', gap: 8,
  },
  taskLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  taskAccent: { width: 4, height: 40, borderRadius: 4, flexShrink: 0 },
  submitBtn: {
    background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
  },
  doneBtn: {
    background: '#E8F5E9', color: '#2E7D32',
    border: '1.5px solid #A5D6A7', borderRadius: 10,
    padding: '8px 16px', fontSize: 13, fontWeight: 700,
    cursor: 'default', flexShrink: 0,
  },
  emptyText: { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 40 },
  bottomNav: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 420, background: '#fff',
    borderTop: '1px solid #F0F0F0',
    display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px', zIndex: 100,
  },
  navItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px' },
  navLabel: { fontSize: 10, fontWeight: 600, color: '#999' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: '#fff', borderRadius: '24px 24px 0 0',
    padding: '12px 24px 36px', width: '100%', maxWidth: 420,
    display: 'flex', flexDirection: 'column',
  },
  dragHandle: { width: 40, height: 4, background: '#E0E0E0', borderRadius: 4, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: '0 0 20px' },
  fieldLabel: { fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  select: {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid #E8E8F0', background: '#F8F8FF',
    fontSize: 14, color: '#1A1A2E', outline: 'none', cursor: 'pointer',
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid #E8E8F0', background: '#fff',
    fontSize: 14, color: '#1A1A2E', outline: 'none', boxSizing: 'border-box',
  },
  dropZone: {
    border: '2px dashed #4361EE', borderRadius: 14, padding: '28px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, cursor: 'pointer', background: '#F6F8FF', marginTop: 16,
  },
  uploadBtn: {
    marginTop: 20, width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #4361EE, #3A0CA3)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  cancelBtn: {
    marginTop: 12, background: 'none', border: 'none',
    color: '#4361EE', fontSize: 15, fontWeight: 600, cursor: 'pointer', alignSelf: 'center',
  },
}
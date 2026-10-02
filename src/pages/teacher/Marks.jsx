import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast, confirmAction, errorMessage } from '../../utils/toast'

const API = import.meta.env.VITE_API_URL
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

const STATUS_STYLE = {
  'Not started': { bg: '#F1F5F9', color: '#64748B' },
  Draft:         { bg: '#FEF3C7', color: '#B45309' },
  Published:     { bg: '#DCFCE7', color: '#15803D' },
}
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

// Marks are entered against an exam the admin has scheduled. The exam fixes the subject,
// name, term and maximum marks, so the teacher only picks it and types each student's score.
export default function TeacherMarks() {
  const navigate = useNavigate()
  const location = useLocation()

  const [classes, setClasses] = useState([])
  const [classKey, setClassKey] = useState('')
  const [exams, setExams] = useState([])
  const [exam, setExam] = useState(null)        // exam picked for entry
  const [sheet, setSheet] = useState(null)      // { exam, status, data }
  const [rows, setRows] = useState({})          // studentId -> { marks, absent }

  const [loading, setLoading] = useState(true)
  const [loadingExams, setLoadingExams] = useState(false)
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [cls, section] = classKey.split('-')

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/marks/classes`, auth())
        const list = res.data.classes || []
        setClasses(list)
        if (list.length) setClassKey(list[0])
      } catch (err) {
        setError(errorMessage(err, 'Could not load your classes'))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const loadExams = useCallback(async () => {
    if (!cls || !section) return
    setLoadingExams(true)
    try {
      const res = await axios.get(`${API}/marks/exams?class=${cls}&section=${section}`, auth())
      setExams(res.data.data || [])
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load exams'))
      setExams([])
    } finally {
      setLoadingExams(false)
    }
  }, [cls, section])

  useEffect(() => { setExam(null); setSheet(null); loadExams() }, [loadExams])

  const openExam = async (e) => {
    setExam(e)
    setLoadingSheet(true)
    try {
      const res = await axios.get(`${API}/marks?examId=${e._id}&section=${section}`, auth())
      setSheet(res.data)
      const next = {}
      for (const r of res.data.data) next[r.studentId] = { marks: r.marksObtained ?? '', absent: r.absent }
      setRows(next)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load the class list'))
      setExam(null)
    } finally {
      setLoadingSheet(false)
    }
  }

  const closeExam = () => { setExam(null); setSheet(null); loadExams() }

  const max = sheet?.exam?.maxMarks || 0
  const locked = sheet?.status === 'Published'
  const invalid = Object.values(rows).some(r => !r.absent && r.marks !== '' && (Number(r.marks) < 0 || Number(r.marks) > max || Number.isNaN(Number(r.marks))))
  const filled = Object.values(rows).filter(r => r.absent || r.marks !== '').length
  const total = sheet?.data?.length || 0

  const setRow = (id, patch) => setRows(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const save = async ({ silent = false } = {}) => {
    if (invalid) return toast.error(`Marks must be between 0 and ${max}`)
    const marksData = Object.entries(rows)
      .filter(([, r]) => r.absent || r.marks !== '')
      .map(([studentId, r]) => (r.absent ? { studentId, absent: true } : { studentId, marksObtained: Number(r.marks) }))
    if (!marksData.length) return toast.error('Enter marks for at least one student')
    setBusy(true)
    try {
      await axios.post(`${API}/marks/save`, { examId: exam._id, section, marksData }, auth())
      if (!silent) toast.success('Marks saved as draft')
      setSheet(s => ({ ...s, status: 'Draft' }))
      return true
    } catch (err) {
      toast.error(errorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    const missing = total - filled
    const note = missing > 0 ? ` ${missing} student(s) have no marks and will not get a result.` : ''
    if (!(await confirmAction(`Publish ${sheet.exam.subject} marks for Class ${classKey}? Students and parents are notified and the marks are locked.${note}`, { confirmLabel: 'Publish', danger: false }))) return
    if (!(await save({ silent: true }))) return
    setBusy(true)
    try {
      const res = await axios.patch(`${API}/marks/publish`, { examId: exam._id, section }, auth())
      toast.success(`Published results for ${res.data.count} student(s)`)
      setSheet(s => ({ ...s, status: 'Published' }))
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Shell navigate={navigate} location={location}><div style={styles.empty}>Loading...</div></Shell>
  if (error) return <Shell navigate={navigate} location={location}><div style={{ ...styles.empty, color: '#B91C1C' }}>{error}</div></Shell>
  if (!classes.length) return <Shell navigate={navigate} location={location}><div style={styles.empty}>No classes are assigned to you yet. Contact the school admin.</div></Shell>

  // ---- Marks sheet for one exam ----
  if (exam) {
    return (
      <Shell navigate={navigate} location={location} title="Enter Marks" onBack={closeExam}>
        {loadingSheet || !sheet ? <div style={styles.empty}>Loading class list...</div> : (
          <>
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{sheet.exam.subject}</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{sheet.exam.examName} · Class {classKey}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{sheet.exam.term} · {fmtDate(sheet.exam.date)} · Out of {max}</div>
                </div>
                <Badge status={sheet.status} />
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#64748B' }}>{filled} of {total} students entered</div>
              <div style={{ height: 6, background: '#EEF2FF', borderRadius: 3, marginTop: 6 }}>
                <div style={{ height: 6, width: `${total ? (filled / total) * 100 : 0}%`, background: '#5C6BC0', borderRadius: 3 }} />
              </div>
              {locked && <div style={{ marginTop: 10, fontSize: 12, color: '#15803D' }}>These marks are published and locked. Ask the admin to reopen them if a correction is needed.</div>}
            </div>

            {total === 0 ? <div style={styles.empty}>No students in Class {classKey}.</div> : (
              <div style={styles.card}>
                {sheet.data.map((s, i) => {
                  const r = rows[s.studentId] || { marks: '', absent: false }
                  const bad = !r.absent && r.marks !== '' && (Number(r.marks) < 0 || Number(r.marks) > max)
                  return (
                    <div key={s.studentId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ width: 28, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{s.rollNumber || '—'}</div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1A1A2E', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <input
                        type="number" inputMode="decimal" min="0" max={max} step="0.5"
                        aria-label={`Marks for ${s.name}`}
                        disabled={locked || r.absent}
                        value={r.absent ? '' : r.marks}
                        placeholder={r.absent ? 'AB' : `/${max}`}
                        onChange={e => setRow(s.studentId, { marks: e.target.value })}
                        style={{ ...styles.markInput, borderColor: bad ? '#EF4444' : '#E2E8F0', background: locked || r.absent ? '#F8FAFC' : '#fff' }}
                      />
                      <button
                        disabled={locked}
                        onClick={() => setRow(s.studentId, { absent: !r.absent, marks: '' })}
                        aria-pressed={r.absent}
                        style={{ ...styles.absentBtn, background: r.absent ? '#FEE2E2' : '#F1F5F9', color: r.absent ? '#B91C1C' : '#64748B' }}
                      >AB</button>
                    </div>
                  )
                })}
              </div>
            )}

            {!locked && total > 0 && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 90 }}>
                <button onClick={() => save()} disabled={busy} style={{ ...styles.btn, background: '#EEF2FF', color: '#3949AB' }}>{busy ? 'Saving...' : 'Save Draft'}</button>
                <button onClick={publish} disabled={busy || invalid} style={{ ...styles.btn, background: 'linear-gradient(135deg,#3949AB,#5C6BC0)', color: '#fff' }}>Publish</button>
              </div>
            )}
          </>
        )}
      </Shell>
    )
  }

  // ---- Exam list for the chosen class ----
  return (
    <Shell navigate={navigate} location={location} title="Enter Marks">
      <div style={styles.card}>
        <div style={styles.label}>Class</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {classes.map(c => (
            <button key={c} onClick={() => setClassKey(c)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: classKey === c ? '#5C6BC0' : '#EEF2FF', color: classKey === c ? '#fff' : '#5C6BC0',
            }}>Class {c}</button>
          ))}
        </div>
        <button onClick={() => navigate(`/report-card?class=${cls}&section=${section}`)}
          style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #C7D2FE', background: '#EEF2FF', color: '#3949AB', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Report cards for Class {classKey}
        </button>
      </div>

      <div style={styles.label}>Scheduled exams</div>
      {loadingExams ? <div style={styles.empty}>Loading exams...</div> : exams.length === 0 ? (
        <div style={styles.card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>No exams scheduled for your subjects in Class {classKey}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Exams are created by the school admin in Exam Schedule. Once an exam is scheduled, it appears here for marks entry.</div>
        </div>
      ) : exams.map(e => {
        const disabledReason = !e.canEnter ? 'Total marks not set by the admin' : !e.held ? `Opens after ${fmtDate(e.date)}` : ''
        return (
          <button key={e._id} onClick={() => !disabledReason && openExam(e)} disabled={!!disabledReason}
            style={{ ...styles.card, width: '100%', textAlign: 'left', border: 'none', cursor: disabledReason ? 'default' : 'pointer', opacity: disabledReason ? 0.7 : 1, display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>{e.subject} · {e.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{e.examType} · {e.term} · {fmtDate(e.date)}{e.totalMarks ? ` · Out of ${e.totalMarks}` : ''}</div>
              </div>
              <Badge status={e.status} />
            </div>
            <div style={{ fontSize: 12, marginTop: 8, color: disabledReason ? '#B45309' : '#5C6BC0', fontWeight: 600 }}>
              {disabledReason || (e.status === 'Published' ? 'View marks' : e.entered ? `Continue · ${e.entered} entered` : 'Enter marks')}
            </div>
          </button>
        )
      })}
      <div style={{ height: 80 }} />
    </Shell>
  )
}

function Badge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['Not started']
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: s.bg, color: s.color, whiteSpace: 'nowrap', height: 'fit-content' }}>{status}</span>
}

function Shell({ children, navigate, location, title = 'Enter Marks', onBack }) {
  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <button style={styles.backBtn} aria-label="Back" onClick={onBack || (() => navigate('/teacher/home'))}>←</button>
        <h1 style={styles.headerTitle}>{title}</h1>
        <div style={{ width: 36 }} />
      </div>
      <div style={styles.scroll}>{children}</div>
      <div style={styles.nav}>
        {[
          { icon: '🏠', label: 'Home', path: '/teacher/home' },
          { icon: '✅', label: 'Attendance', path: '/teacher/attendance' },
          { icon: '📤', label: 'Upload', path: '/teacher/upload' },
          { icon: '💬', label: 'Messages', path: '/teacher/chat' },
          { icon: '👤', label: 'Me', path: '/teacher/profile' },
        ].map(t => {
          const active = location.pathname === t.path
          return (
            <button key={t.path} onClick={() => navigate(t.path)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              cursor: 'pointer', fontSize: '9.5px', fontWeight: 700, letterSpacing: '.3px', textTransform: 'uppercase',
              border: 'none', background: 'none', color: active ? '#5C6BC0' : '#7B8099',
              borderTop: active ? '3px solid #5C6BC0' : '3px solid transparent',
            }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  screen: { maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: 'var(--bg, #F8F9FB)', fontFamily: "'Poppins', sans-serif", display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', background: 'var(--card, #fff)', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10 },
  backBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text, #333)', padding: '4px 8px' },
  headerTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text, #1A1A2E)', margin: 0 },
  scroll: { flex: 1, overflowY: 'auto', padding: 16 },
  card: { background: 'var(--card, #fff)', borderRadius: 16, padding: 16, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', fontFamily: 'inherit' },
  label: { fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, margin: '4px 0 8px', textTransform: 'uppercase' },
  empty: { textAlign: 'center', padding: 40, color: '#7B8099', fontSize: 14 },
  markInput: { width: 72, padding: '9px 10px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 15, fontWeight: 600, textAlign: 'center', outline: 'none', fontFamily: 'inherit' },
  absentBtn: { border: 'none', borderRadius: 10, padding: '9px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btn: { flex: 1, padding: '14px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  nav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: 'var(--card, #fff)', display: 'flex', borderTop: '1px solid #E8EAF0', boxShadow: '0 -4px 24px rgba(92,107,192,.08)', zIndex: 200, height: 66 },
}

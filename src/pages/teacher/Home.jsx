import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function getTodayName() {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TeacherHome() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [teacher, setTeacher]           = useState(null)
  const [todayPeriods, setTodayPeriods] = useState([])
  const [unreadCount, setUnreadCount]   = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  const today = getTodayName()

  useEffect(() => {
    if (!user?.token) return
    fetchDashboard()
  }, [user])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)

      // Logged-in teacher ka profile — JWT se directly
      const tRes = await fetch(`${API}/teachers/me`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      const tData = await tRes.json()
      if (!tRes.ok) throw new Error(tData.message || 'Failed to load teacher profile')
      const me = tData.data
      setTeacher(me)

      // Today's timetable
      const ttRes = await fetch(`${API}/timetable/teacher/${me._id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      const ttData = await ttRes.json()
      if (ttRes.ok && ttData.data) {
        const todayData = ttData.data.find(d => d.day === today)
        setTodayPeriods(todayData?.periods || [])
      }

      // Unread messages count
      const chatRes = await fetch(`${API}/chat/unread-count`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      if (chatRes.ok) {
        const chatData = await chatRes.json()
        setUnreadCount(chatData.count || 0)
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodStatus = (period, idx) => {
    const now = new Date()
    const [startH, startM] = (period.startTime || '00:00').split(':').map(Number)
    const [endH, endM]     = (period.endTime   || '00:00').split(':').map(Number)
    const start = startH * 60 + startM
    const end   = endH   * 60 + endM
    const cur   = now.getHours() * 60 + now.getMinutes()
    if (cur > end) return 'done'
    if (cur >= start && cur <= end) return 'now'
    if (idx === todayPeriods.findIndex(p => {
      const [sh, sm] = (p.startTime || '00:00').split(':').map(Number)
      return (sh * 60 + sm) > cur
    })) return 'next'
    return 'upcoming'
  }

  const statusColor = { done: '#ccc', now: '#5C6BC0', next: '#00BFA5', upcoming: '#7B8099' }

  const statusBadge = (status) => {
    const map = {
      done:     { bg: '#E8EAF6', color: '#5C6BC0', label: 'Done' },
      now:      { bg: '#5C6BC0', color: '#fff',    label: 'Now' },
      next:     { bg: '#FFF9C4', color: '#F57F17', label: 'Next' },
      upcoming: { bg: '#F4F6FB', color: '#7B8099', label: 'Upcoming' },
    }
    const s = map[status] || map.upcoming
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: '3px 10px', borderRadius: 20,
        fontSize: 10.5, fontWeight: 700,
      }}>{s.label}</span>
    )
  }

  const quickTiles = teacher ? [
    { icon: '✅', label: 'Take Attendance', sub: `${teacher.assignedClasses?.length || 0} classes`, path: '/teacher/attendance' },
    { icon: '📤', label: 'Upload Notes',    sub: 'Share with class',                                path: '/teacher/upload' },
    { icon: '📊', label: 'Enter Marks',     sub: 'Publish results',                                 path: '/teacher/marks' },
    { icon: '💬', label: 'Parent Messages', sub: unreadCount > 0 ? `${unreadCount} unread` : 'No new messages', path: '/teacher/chat' },
    { icon: '📅', label: 'My Timetable',    sub: `Today: ${todayPeriods.length} periods`,           path: '/teacher/timetable' },
    { icon: '🗓️', label: 'Leave Request',  sub: 'Apply for leave',                                 path: '/teacher/leave' },
  ] : []

  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={{ color: '#7B8099', fontSize: 13, marginTop: 12 }}>Loading dashboard...</p>
    </div>
  )

  if (error) return (
    <div style={styles.centered}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: '#EF5350', fontWeight: 600, textAlign: 'center', padding: '0 20px' }}>{error}</p>
      <button style={styles.retryBtn} onClick={fetchDashboard}>Retry</button>
      <button style={{ ...styles.retryBtn, background: '#EF5350', marginTop: 8 }} onClick={logout}>Logout</button>
    </div>
  )

  return (
    <div style={styles.screen}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerSub}>TEACHER PORTAL</div>
          <div style={styles.headerName}>{teacher?.name || '—'}</div>
        </div>
        <button onClick={() => navigate('/teacher/notifications')} style={styles.bellBtn}>
          🔔
          {unreadCount > 0 && <div style={styles.bellDot} />}
        </button>
      </div>

      <div style={styles.scroll}>

        {/* Hero Card */}
        <div style={styles.heroCard}>
          <div style={styles.heroSub}>
            {teacher?.subjects?.join(', ') || 'No subjects assigned'}
          </div>
          <div style={styles.heroGreeting}>{getGreeting()} 👋</div>
          <div style={styles.heroDate}>
            {formatDate()} • {todayPeriods.length} periods today
          </div>
          <div style={styles.statsRow}>
            {[
              { val: teacher?.assignedClasses?.length || 0, lbl: 'Classes' },
              { val: teacher?.subjects?.length || 0,        lbl: 'Subjects' },
              { val: teacher?.experience || 0,              lbl: 'Yrs Exp' },
            ].map(s => (
              <div key={s.lbl} style={styles.statBox}>
                <div style={styles.statVal}>{s.val}</div>
                <div style={styles.statLbl}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tiles */}
        <div style={styles.tilesGrid}>
          {quickTiles.map(t => (
            <button key={t.path} onClick={() => navigate(t.path)} style={styles.tile}>
              <div style={styles.tileIcon}>{t.icon}</div>
              <div style={styles.tileLabel}>{t.label}</div>
              <div style={styles.tileSub}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* Today's Schedule */}
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Today's Schedule</span>
          <span style={styles.sectionDay}>{today}</span>
        </div>

        {todayPeriods.length === 0 ? (
          <div style={styles.emptySchedule}>No classes scheduled for today.</div>
        ) : (
          todayPeriods.map((p, i) => {
            const status = getPeriodStatus(p, i)
            return (
              <div key={i} onClick={() => navigate('/teacher/attendance')} style={{
                ...styles.periodCard,
                border: status === 'now' ? '2px solid #5C6BC0' : '2px solid transparent',
                opacity: status === 'done' ? 0.55 : 1,
              }}>
                <div style={{ ...styles.periodDot, background: statusColor[status] }} />
                <div style={styles.periodInfo}>
                  <div style={styles.periodSubject}>
                    {p.subject} — {p.class}{p.section ? ` ${p.section}` : ''}
                  </div>
                  <div style={styles.periodMeta}>
                    {p.startTime} – {p.endTime}
                    {p.room ? ` • Room ${p.room}` : ''}
                  </div>
                </div>
                {statusBadge(status)}
              </div>
            )
          })
        )}

        <div style={{ height: 90 }} />
      </div>

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        {[
          { icon: '🏠', label: 'Home',       path: '/teacher/home' },
          { icon: '✅', label: 'Attendance', path: '/teacher/attendance' },
          { icon: '📤', label: 'Upload',     path: '/teacher/upload' },
          { icon: '💬', label: 'Messages',   path: '/teacher/chat' },
          { icon: '👤', label: 'Me',         path: '/teacher/profile' },
        ].map(t => {
          const active = location.pathname === t.path
          return (
            <button key={t.path} onClick={() => navigate(t.path)} style={{
              ...styles.navBtn,
              color:     active ? '#5C6BC0' : '#7B8099',
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
  screen: {
    maxWidth: 420, margin: '0 auto', minHeight: '100vh',
    background: '#F4F6FB', fontFamily: "'Poppins', sans-serif",
    display: 'flex', flexDirection: 'column', position: 'relative',
  },
  header: {
    background: 'linear-gradient(160deg,#3949AB,#5C6BC0)',
    padding: '48px 18px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  },
  headerSub:  { fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 700, letterSpacing: 1 },
  headerName: { fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'Baloo 2', cursive" },
  bellBtn: {
    width: 38, height: 38, borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,.15)', fontSize: 18, position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute', top: 6, right: 6, width: 9, height: 9,
    borderRadius: '50%', background: '#EF5350',
  },
  scroll: { flex: 1, overflowY: 'auto', padding: '16px 16px 0' },
  heroCard: {
    background: 'linear-gradient(135deg,#3949AB,#5C6BC0)',
    borderRadius: 20, padding: '20px', marginBottom: 16, color: '#fff',
  },
  heroSub:      { fontSize: 11, opacity: .75, marginBottom: 4 },
  heroGreeting: { fontSize: 22, fontWeight: 800, fontFamily: "'Baloo 2', cursive" },
  heroDate:     { fontSize: 12, opacity: .8, marginTop: 2, marginBottom: 14 },
  statsRow:     { display: 'flex', gap: 10 },
  statBox: {
    background: 'rgba(255,255,255,.15)', borderRadius: 10,
    padding: '9px 13px', textAlign: 'center', flex: 1,
  },
  statVal: { fontSize: 19, fontWeight: 800 },
  statLbl: { fontSize: 9, opacity: .8, textTransform: 'uppercase' },
  tilesGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 12, marginBottom: 18,
  },
  tile: {
    background: '#fff', borderRadius: 20, padding: '16px 14px',
    cursor: 'pointer', border: 'none', textAlign: 'left',
    boxShadow: '0 2px 16px rgba(92,107,192,.10)',
  },
  tileIcon:  { fontSize: 28, marginBottom: 10 },
  tileLabel: { fontSize: 13, fontWeight: 700, color: '#1C2033' },
  tileSub:   { fontSize: 10.5, color: '#7B8099', fontWeight: 500, marginTop: 2 },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: 800, color: '#1C2033', fontFamily: "'Baloo 2', cursive" },
  sectionDay:   { fontSize: 12, color: '#5C6BC0', fontWeight: 700 },
  periodCard: {
    background: '#fff', borderRadius: 20, padding: '13px 15px',
    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
    boxShadow: '0 2px 16px rgba(92,107,192,.10)', marginBottom: 8,
  },
  periodDot:     { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  periodInfo:    { flex: 1 },
  periodSubject: { fontSize: 13.5, fontWeight: 700, color: '#1C2033' },
  periodMeta:    { fontSize: 11.5, color: '#7B8099', fontWeight: 500, marginTop: 1 },
  emptySchedule: {
    textAlign: 'center', padding: '30px 20px',
    color: '#999', fontSize: 14, fontWeight: 500,
  },
  bottomNav: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 420, background: '#fff',
    display: 'flex', borderTop: '1px solid #E8EAF0',
    boxShadow: '0 -4px 24px rgba(92,107,192,.08)', zIndex: 200, height: 66,
  },
  navBtn: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 3,
    cursor: 'pointer', fontSize: '9.5px', fontWeight: 700,
    letterSpacing: '.3px', textTransform: 'uppercase',
    border: 'none', background: 'none',
  },
  centered: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100vh', gap: 12,
  },
  spinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid #E8EAF6', borderTop: '3px solid #5C6BC0',
    animation: 'spin 0.8s linear infinite',
  },
  retryBtn: {
    padding: '10px 24px', background: '#5C6BC0', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
}
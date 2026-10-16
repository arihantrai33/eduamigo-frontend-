import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userTheme, brandLook } from '../../utils/theme'
import SchoolStrip from '../../components/SchoolStrip'

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import { plural } from "../../utils/plural";
import { errorMessage } from "../../utils/toast";
import Skeleton from "../../components/ui/Skeleton";
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
  // School branding, in the same style (light or bold) as the school's sign-in page.
  const theme = userTheme(user)
  const look = brandLook(theme)

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

      // Logged-in teacher's profile (resolved from the JWT)
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
      setError(errorMessage(err, 'Could not load your dashboard'))
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

  const statusColor = { done: '#ccc', now: theme.primary, next: '#00BFA5', upcoming: '#7B8099' }

  const statusBadge = (status) => {
    const map = {
      done:     { bg: theme.soft, color: theme.primary, label: 'Done' },
      now:      { bg: theme.primary, color: '#fff',    label: 'Now' },
      next:     { bg: '#FFF9C4', color: 'var(--ea-on-card-warning)', label: 'Next' },
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
    { icon: <Glyph e="✅" />, label: 'Take Attendance', sub: plural(teacher.assignedClasses?.length || 0, 'class', 'classes'), path: '/teacher/attendance' },
    { icon: <Glyph e="📤" />, label: 'Upload Notes',    sub: 'Share with class',                                path: '/teacher/upload' },
    { icon: <Glyph e="📊" />, label: 'Enter Marks',     sub: 'Publish results',                                 path: '/teacher/marks' },
    { icon: <Glyph e="💬" />, label: 'Parent Messages', sub: unreadCount > 0 ? `${unreadCount} unread` : 'No new messages', path: '/teacher/chat' },
    { icon: <Glyph e="📅" />, label: 'My Timetable',    sub: `Today: ${todayPeriods.length} ${todayPeriods.length === 1 ? 'period' : 'periods'}`,           path: '/teacher/timetable' },
    { icon: <Glyph e="🗓" />, label: 'Leave Request',  sub: 'Apply for leave',                                 path: '/teacher/leave' },
    { icon: <Glyph e="🧑‍🎓" />, label: 'My Students',     sub: 'Login IDs and password reset',                    path: '/teacher/students' },
  ] : []

  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <Skeleton rows={3} label="Loading dashboard" />
    </div>
  )

  if (error) return (
    <div style={styles.centered}>
      <div style={{ fontSize: 40 }}><Glyph e="⚠" /></div>
      <p style={{ color: 'var(--ea-on-card-danger)', fontWeight: 600, textAlign: 'center', padding: '0 20px' }}>{error}</p>
      <button style={styles.retryBtn} onClick={fetchDashboard}>Retry</button>
      <button style={{ ...styles.retryBtn, background: '#EF5350', marginTop: 8 }} onClick={logout}>Logout</button>
    </div>
  )

  return (
    <div style={styles.screen}>

      {/* Header */}
      <div className="ea-pd-band" style={{ ...styles.header, background: look.header, flexDirection: 'column', alignItems: 'stretch', paddingTop: 20 }}>
        <SchoolStrip user={user} theme={theme} look={look} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...styles.headerName, color: look.text }}>{teacher?.name || '—'}</div>
        <button type="button" aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'} onClick={() => navigate('/teacher/notifications')} style={{ ...styles.bellBtn, background: look.glass, border: look.border }}>
          <Glyph e="🔔" />
          {unreadCount > 0 && <div style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, background: '#EF5350', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', padding: '0 4px' }}>{unreadCount}</div>}
        </button>
        </div>
      </div>

      <div className="ea-pd-body ea-pd-dash" style={styles.scroll}>

        {/* Today card (desktop: the side column). A plain card: the header above is the page's one brand block. */}
        <div className="ea-pd-side" style={styles.heroCard}>
          <div style={styles.heroSub}>
            {teacher?.subjects?.join(', ') || 'No subjects assigned'}
          </div>
          <div style={styles.heroGreeting}>{getGreeting()} </div>
          <div style={styles.heroDate}>
            {formatDate()} • {todayPeriods.length} {todayPeriods.length === 1 ? 'period' : 'periods'} today
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
        <div className="ea-tile-grid" style={styles.tilesGrid}>
          {quickTiles.map(t => (
            <button key={t.path} onClick={() => navigate(t.path)} style={styles.tile}>
              <div style={styles.tileIcon}>{t.icon}</div>
              <div style={styles.tileLabel}>{t.label}</div>
              <div style={styles.tileSub}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* Today's Schedule (desktop: the main column) */}
        <section className="ea-pd-main">
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Today's Schedule</span>
          <span style={{ ...styles.sectionDay, color: theme.primary }}>{today}</span>
        </div>

        {todayPeriods.length === 0 ? (
          <div style={styles.emptySchedule}>No classes scheduled for today.</div>
        ) : (
          todayPeriods.map((p, i) => {
            const status = getPeriodStatus(p, i)
            return (
              <div key={i} onClick={() => navigate('/teacher/attendance')} style={{
                ...styles.periodCard,
                border: status === 'now' ? `2px solid ${theme.primary}` : '2px solid transparent',
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
        </section>

        <div className="ea-pd-hide" style={{ height: 90 }} />
      </div>

      <BottomNav role="teacher" />
    </div>
  )
}

const styles = {
  screen: {
    minHeight: '100vh',
    background: '#F4F6FB', fontFamily: "inherit",
    display: 'flex', flexDirection: 'column', position: 'relative',
  },
  header: {
    background: 'var(--brand-gradient)',
    padding: '48px 18px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  },
  headerName: { fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "inherit" },
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
    background: 'var(--ea-surface)', border: '1px solid var(--ea-line)', boxShadow: 'var(--ea-shadow)',
    borderRadius: 16, padding: '20px', marginBottom: 16, color: 'var(--ea-ink)',
  },
  heroSub:      { fontSize: 12, color: 'var(--ea-muted)', marginBottom: 4 },
  heroGreeting: { fontSize: 22, fontWeight: 800, fontFamily: "inherit" },
  heroDate:     { fontSize: 13, color: 'var(--ea-muted)', marginTop: 2, marginBottom: 14 },
  statsRow:     { display: 'flex', gap: 10 },
  statBox: {
    background: 'var(--ea-hover)', borderRadius: 10,
    padding: '9px 13px', flex: 1,
  },
  statVal: { fontSize: 19, fontWeight: 800, color: 'var(--ea-ink)' },
  statLbl: { fontSize: 12, fontWeight: 600, color: 'var(--ea-muted)' },
  tilesGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 12, marginBottom: 18,
  },
  tile: {
    background: '#fff', borderRadius: 20, padding: '16px 14px',
    cursor: 'pointer', border: 'none', textAlign: 'left',
    boxShadow: '0 2px 16px color-mix(in srgb, var(--brand) 10%, transparent)',
  },
  tileIcon:  { width: 40, height: 40, borderRadius: 12, background: "var(--brand-soft)", color: "var(--brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 10 },
  tileLabel: { fontSize: 13, fontWeight: 700, color: '#1C2033' },
  tileSub:   { fontSize: 10.5, color: '#7B8099', fontWeight: 500, marginTop: 2 },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: 800, color: '#1C2033', fontFamily: "inherit" },
  sectionDay:   { fontSize: 12, color: 'var(--brand)', fontWeight: 700 },
  periodCard: {
    background: '#fff', borderRadius: 20, padding: '13px 15px',
    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
    boxShadow: '0 2px 16px color-mix(in srgb, var(--brand) 10%, transparent)', marginBottom: 8,
  },
  periodDot:     { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  periodInfo:    { flex: 1 },
  periodSubject: { fontSize: 13.5, fontWeight: 700, color: '#1C2033' },
  periodMeta:    { fontSize: 11.5, color: '#7B8099', fontWeight: 500, marginTop: 1 },
  emptySchedule: {
    textAlign: 'center', padding: '30px 20px',
    color: 'var(--ea-muted)', fontSize: 14, fontWeight: 500,
  },
  centered: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100vh', gap: 12,
  },
  spinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid var(--brand-soft)', borderTop: '3px solid var(--brand)',
    animation: 'spin 0.8s linear infinite',
  },
  retryBtn: {
    padding: '10px 24px', background: 'var(--brand)', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
}
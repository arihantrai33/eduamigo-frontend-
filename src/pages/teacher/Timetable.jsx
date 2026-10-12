import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
const API = import.meta.env.VITE_API_URL

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getTodayName() {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
}

export default function TeacherTimetable() {
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [teacher,     setTeacher]     = useState(null)
  const [timetable,   setTimetable]   = useState([])
  const [selectedDay, setSelectedDay] = useState(getTodayName())
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const headers = { Authorization: `Bearer ${user.token}` }
  const today   = getTodayName()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const tRes  = await fetch(`${API}/teachers/me`, { headers })
      const tData = await tRes.json()
      if (!tRes.ok) throw new Error(tData.message || 'Failed to load profile')
      const me = tData.data
      setTeacher(me)

      const ttRes  = await fetch(`${API}/timetable/teacher/${me._id}`, { headers })
      const ttData = await ttRes.json()
      if (ttRes.ok && ttData.data) {
        setTimetable(ttData.data)
      } else {
        setTimetable([])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodsForDay = (day) => {
    const dayData = timetable.find(d => d.day === day)
    return dayData?.periods || []
  }

  const getPeriodStatus = (period) => {
    if (selectedDay !== today) return 'other'
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    const [sh, sm] = (period.startTime || '00:00').split(':').map(Number)
    const [eh, em] = (period.endTime   || '00:00').split(':').map(Number)
    const start = sh * 60 + sm
    const end   = eh * 60 + em
    if (cur > end)               return 'done'
    if (cur >= start && cur <= end) return 'now'
    return 'upcoming'
  }

  const statusStyle = {
    done:     { bg: '#F3F4F6', color: '#9CA3AF', label: 'Done',     dot: '#D1D5DB' },
    now:      { bg: 'var(--brand-soft)', color: 'var(--brand-dark)', label: 'Now',      dot: 'var(--brand)' },
    upcoming: { bg: '#F0FDF4', color: '#15803D', label: 'Upcoming', dot: '#22C55E' },
    other:    { bg: '#F9FAFB', color: '#6B7280', label: '',         dot: '#9CA3AF' },
  }

  const selectedPeriods = getPeriodsForDay(selectedDay)
  const totalPeriods    = DAYS.reduce((acc, d) => acc + getPeriodsForDay(d).length, 0)

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F4F6FB', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--brand-soft)', borderTop: '3px solid var(--brand)', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#7B8099', fontSize: 13 }}>Loading timetable...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F4F6FB', gap: 12, padding: 24 }}>
      <div style={{ fontSize: 40 }}><Glyph e="⚠" /></div>
      <p style={{ color: '#EF5350', fontWeight: 600, textAlign: 'center' }}>{error}</p>
      <button onClick={fetchData} style={{ padding: '10px 24px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Retry</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FB', fontFamily: "inherit", paddingBottom: 90 }}>

      {/* Header */}
      <div style={{ background: 'var(--brand-gradient)', padding: '48px 18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/teacher/home')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 36, height: 36, fontSize: 18, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1 }}>TEACHER PORTAL</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "inherit" }}>My Timetable</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* Summary Card */}
        <div style={{ background: 'var(--brand-gradient)', borderRadius: 20, padding: 18, marginBottom: 16, color: '#fff' }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>{teacher?.subjects?.join(', ') || 'No subjects'}</div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "inherit", marginBottom: 12 }}>{teacher?.name || '—'}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { val: totalPeriods,                              lbl: 'Total Periods' },
              { val: getPeriodsForDay(today).length,           lbl: 'Today' },
              { val: teacher?.assignedClasses?.length || 0,    lbl: 'Classes' },
            ].map(s => (
              <div key={s.lbl} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{s.val}</div>
                <div style={{ fontSize: 9, opacity: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Day Tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
          {DAYS.map(day => {
            const isActive  = selectedDay === day
            const isToday   = day === today
            const count     = getPeriodsForDay(day).length
            return (
              <button key={day} onClick={() => setSelectedDay(day)} style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: isActive ? 'var(--brand)' : '#fff',
                color: isActive ? '#fff' : isToday ? 'var(--brand)' : '#7B8099',
                fontWeight: isActive || isToday ? 700 : 500,
                fontSize: 12, fontFamily: "inherit",
                boxShadow: isActive ? '0 4px 12px color-mix(in srgb, var(--brand) 30%, transparent)' : '0 2px 8px rgba(0,0,0,0.06)',
                outline: isToday && !isActive ? '2px solid var(--brand)' : 'none',
              }}>
                {day.slice(0, 3)}
                {count > 0 && (
                  <span style={{ marginLeft: 5, background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--brand-soft)', color: isActive ? '#fff' : 'var(--brand)', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Periods */}
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1C2033', marginBottom: 12, fontFamily: "inherit" }}>
          {selectedDay} {selectedDay === today && <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>• Today</span>}
        </div>

        {selectedPeriods.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 20px', textAlign: 'center', boxShadow: '0 2px 16px color-mix(in srgb, var(--brand) 8%, transparent)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}><Glyph e="📭" /></div>
            <div style={{ fontSize: 14, color: '#7B8099', fontWeight: 500 }}>No classes scheduled for {selectedDay}</div>
          </div>
        ) : (
          selectedPeriods.map((period, i) => {
            const status = getPeriodStatus(period)
            const st     = statusStyle[status]
            return (
              <div key={i} style={{
                background: '#fff', borderRadius: 20, padding: '16px', marginBottom: 10,
                boxShadow: '0 2px 16px color-mix(in srgb, var(--brand) 8%, transparent)',
                border: status === 'now' ? '2px solid var(--brand)' : '2px solid transparent',
                opacity: status === 'done' ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Time column */}
                  <div style={{ background: 'var(--brand-soft)', borderRadius: 12, padding: '10px 12px', textAlign: 'center', flexShrink: 0, minWidth: 64 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-dark)' }}>{period.startTime || '—'}</div>
                    <div style={{ width: 1, height: 8, background: 'var(--brand-border)', margin: '3px auto' }} />
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand)' }}>{period.endTime || '—'}</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1C2033', marginBottom: 4 }}>{period.subject || '—'}</div>
                    <div style={{ fontSize: 12, color: '#7B8099', fontWeight: 500 }}>
                      Class {period.class}{period.section ? ` - ${period.section}` : ''}
                      {period.room ? ` • Room ${period.room}` : ''}
                    </div>
                  </div>

                  {/* Status badge */}
                  {status !== 'other' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: st.bg, padding: '4px 10px', borderRadius: 20 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {timetable.length === 0 && !loading && (
          <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 16, padding: '14px 16px', marginTop: 8, fontSize: 13, color: '#CA8A04', fontWeight: 500 }}>
            No timetable assigned yet. Ask admin to set up your schedule.
          </div>
        )}
      </div>

      <BottomNav role="teacher" />
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import SummaryCard from "../../components/ui/SummaryCard";
import { errorMessage } from "../../utils/toast";
import { useMediaQuery } from "../../utils/useMediaQuery";
import Skeleton from "../../components/ui/Skeleton";
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
  const isDesktop = useMediaQuery("(min-width: 1024px)")

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
      setError(errorMessage(err, 'Could not load your timetable'))
    } finally {
      setLoading(false)
    }
  }

  const getPeriodsForDay = (day) => {
    const dayData = timetable.find(d => d.day === day)
    return dayData?.periods || []
  }

  const getPeriodStatus = (period, day = selectedDay) => {
    if (day !== today) return 'other'
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
    done:     { bg: '#F3F4F6', color: 'var(--ea-muted)', label: 'Done',     dot: '#D1D5DB' },
    now:      { bg: 'var(--brand-soft)', color: 'var(--brand-text)', label: 'Now',      dot: 'var(--brand)' },
    upcoming: { bg: '#F0FDF4', color: '#15803D', label: 'Upcoming', dot: '#22C55E' },
    other:    { bg: '#F9FAFB', color: '#6B7280', label: '',         dot: '#9CA3AF' },
  }

  const selectedPeriods = getPeriodsForDay(selectedDay)
  const totalPeriods    = DAYS.reduce((acc, d) => acc + getPeriodsForDay(d).length, 0)

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F4F6FB', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--brand-soft)', borderTop: '3px solid var(--brand)', animation: 'spin 0.8s linear infinite' }} />
      <Skeleton rows={3} label="Loading timetable" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F4F6FB', gap: 12, padding: 24 }}>
      <div style={{ fontSize: 40 }}><Glyph e="⚠" /></div>
      <p style={{ color: 'var(--ea-on-card-danger)', fontWeight: 600, textAlign: 'center' }}>{error}</p>
      <button onClick={fetchData} style={{ padding: '10px 24px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Retry</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FB', fontFamily: "inherit", paddingBottom: 90 }}>

      {/* Header */}
      <PortalHeader title="My Timetable" onBack={() => navigate('/teacher/home')} />

      <div className="ea-pd-body" style={{ padding: 16 }}>

        {/* Summary Card */}
        <div style={{ marginBottom: 16 }}>
          <SummaryCard title={teacher?.name || '—'} subtitle={teacher?.subjects?.join(', ') || 'No subjects'} items={[
            { label: 'Total Periods', value: totalPeriods },
            { label: 'Today',         value: getPeriodsForDay(today).length },
            { label: 'Classes',       value: teacher?.assignedClasses?.length || 0 },
          ]} />
        </div>

        {/* Desktop: the whole week side by side (same view as the student timetable). */}
        {isDesktop ? (
          <div className="ea-week">
            {DAYS.map((day) => {
              const periods = getPeriodsForDay(day)
              const isToday = day === today
              return (
                <section key={day} className={isToday ? 'ea-week__day is-today' : 'ea-week__day'} aria-label={`${day}${isToday ? ', today' : ''}`}>
                  <h2 className="ea-week__head">
                    <span>{day}</span>
                    <small>{periods.length} {periods.length === 1 ? 'period' : 'periods'}{isToday ? ' · Today' : ''}</small>
                  </h2>
                  {periods.length === 0 ? <p className="ea-week__empty">No classes</p> : periods.map((period, i) => {
                    const status = getPeriodStatus(period, day)
                    return (
                      <div key={i} className={`ea-week__slot${status === 'now' ? ' is-now' : ''}${status === 'done' ? ' is-done' : ''}`}>
                        <span className="ea-week__time">{period.startTime || '—'} – {period.endTime || '—'}</span>
                        <strong className="ea-week__subject">{period.subject || '—'}</strong>
                        <span className="ea-week__meta">Class {period.class}{period.section ? ` - ${period.section}` : ''}{period.room ? ` · Room ${period.room}` : ''}</span>
                        {status === 'now' && <span className="ea-week__now">Now</span>}
                      </div>
                    )
                  })}
                </section>
              )
            })}
          </div>
        ) : <>
        {/* Day Tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
          {DAYS.map(day => {
            const isActive  = selectedDay === day
            const isToday   = day === today
            const count     = getPeriodsForDay(day).length
            return (
              <button key={day} type="button" aria-pressed={selectedDay === day} onClick={() => setSelectedDay(day)} style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: isActive ? 'var(--brand)' : '#fff',
                color: isActive ? '#fff' : isToday ? 'var(--brand)' : 'var(--ea-muted)',
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
          {selectedDay} {selectedDay === today && <span style={{ fontSize: 11, color: 'var(--brand-text)', fontWeight: 600 }}>• Today</span>}
        </div>

        {selectedPeriods.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 20px', textAlign: 'center', boxShadow: '0 2px 16px color-mix(in srgb, var(--brand) 8%, transparent)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}><Glyph e="📭" /></div>
            <div style={{ fontSize: 14, color: 'var(--ea-muted)', fontWeight: 500 }}>No classes scheduled for {selectedDay}</div>
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
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-text)' }}>{period.startTime || '—'}</div>
                    <div style={{ width: 1, height: 8, background: 'var(--brand-border)', margin: '3px auto' }} />
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-text)' }}>{period.endTime || '—'}</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1C2033', marginBottom: 4 }}>{period.subject || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--ea-muted)', fontWeight: 500 }}>
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
        </>}

        {timetable.length === 0 && !loading && (
          <div className="ea-note ea-note--warning" style={{ marginTop: 8 }}>
            No timetable assigned yet. Ask admin to set up your schedule.
          </div>
        )}
      </div>

      <BottomNav role="teacher" />
    </div>
  )
}
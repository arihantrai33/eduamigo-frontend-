import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { todayLocal } from "../../utils/dates";

import Glyph from "../../components/Glyph";
import Avatar from "../../components/ui/Avatar";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import { plural } from "../../utils/plural";
import { errorMessage } from "../../utils/toast";
import Skeleton from "../../components/ui/Skeleton";
const API = import.meta.env.VITE_API_URL

export default function TeacherAttendance() {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [teacher,    setTeacher]    = useState(null)
  const [sections,   setSections]   = useState([])
  const [students,   setStudents]   = useState([])
  const [attendance, setAttendance] = useState({})
  const [filters,    setFilters]    = useState({ class: "", section: "", date: todayLocal() })
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState(null)
  const [existing,   setExisting]   = useState(false)

  const headers = { Authorization: `Bearer ${user.token}` }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Load teacher profile. A teacher with a single class starts on that class (no extra tap).
  useEffect(() => {
    fetch(`${API}/teachers/me`, { headers })
      .then(r => r.json())
      .then(d => {
        if (!d.success) return
        setTeacher(d.data)
        const only = d.data?.assignedClasses?.length === 1 ? d.data.assignedClasses[0] : null
        if (only) { const [c, sec = ""] = only.split("-"); setFilters(f => (f.class ? f : { ...f, class: c, section: sec })) }
      })
  }, [])

  // Load sections when class changes
  useEffect(() => {
    if (!filters.class) { setSections([]); setStudents([]); setAttendance({}); return }
    fetch(`${API}/students?class=${filters.class}`, { headers })
      .then(r => r.json())
      .then(d => {
        const sec = [...new Set((d.data || []).map(s => s.section))].sort()
        setSections(sec)
      })
  }, [filters.class])

  // Load students when class+section+date set
  useEffect(() => {
    if (!filters.class || !filters.section) { setStudents([]); setAttendance({}); return }
    loadStudents()
  }, [filters.class, filters.section, filters.date])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const [stuRes, attRes] = await Promise.all([
        fetch(`${API}/students?class=${filters.class}&section=${filters.section}`, { headers }),
        fetch(`${API}/attendance/class/${filters.class}?date=${filters.date}&section=${filters.section}`, { headers }),
      ])
      const stuData = await stuRes.json()
      const attData = await attRes.json()

      const stu = stuData.data || []
      setStudents(stu)

      const existingRecords = (attData.data || []).filter(r => {
        const d = new Date(r.date).toISOString().split("T")[0]
        return d === filters.date && r.section === filters.section
      })
      setExisting(existingRecords.length > 0)

      const att = {}
      stu.forEach(s => {
        const rec = existingRecords.find(r => r.studentId?._id === s._id || r.studentId === s._id)
        att[s._id] = { status: rec?.status || "Present", remarks: rec?.remarks || "" }
      })
      setAttendance(att)
    } catch (err) {
      showToast(errorMessage(err, "Could not load the students"), "error")
    } finally {
      setLoading(false)
    }
  }

  const setAll = (status) => {
    const att = {}
    students.forEach(s => { att[s._id] = { ...attendance[s._id], status } })
    setAttendance(att)
  }

  const handleSave = async () => {
    if (!filters.class || !filters.section || !filters.date) {
      showToast("Please select class, section and date", "error"); return
    }
    if (students.length === 0) { showToast("No students to save", "error"); return }
    setSaving(true)
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status:    attendance[s._id]?.status || "Present",
        remarks:   attendance[s._id]?.remarks || "",
      }))
      const res = await fetch(`${API}/attendance/bulk`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ records, date: filters.date, class: filters.class, section: filters.section }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save")
      showToast(`Attendance saved for ${plural(data.count, "student")}`)
      setExisting(true)
    } catch (err) {
      showToast(errorMessage(err, "Could not save the attendance"), "error")
    } finally {
      setSaving(false)
    }
  }

  const present = students.filter(s => attendance[s._id]?.status === "Present").length
  const absent  = students.filter(s => attendance[s._id]?.status === "Absent").length
  const late    = students.filter(s => attendance[s._id]?.status === "Late").length

  return (
    <div style={{ height: "100vh", overflowY: "auto", background: "#F4F6FB", fontFamily: "inherit", paddingBottom: 90 }}>

      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600,
          background: toast.type === "error" ? "#FEE2E2" : "#DCFCE7",
          color: toast.type === "error" ? "#DC2626" : "#15803D",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", whiteSpace: "nowrap",
        }}>
          {toast.type === "error" ? <Glyph e="⚠" /> : <Glyph e="✅" />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <PortalHeader title="Attendance" onBack={() => navigate('/teacher/home')} />

      <div className="ea-pd-body" style={{ padding: 16 }}>

        {/* Filters */}
        <div style={{ background: "var(--card)", borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: "0 2px 16px color-mix(in srgb, var(--brand) 8%, transparent)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2033", marginBottom: 12 }}>Select Class</div>

          {/* Class Chips — only teacher's assigned classes */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {teacher?.assignedClasses?.length > 0 ? teacher.assignedClasses.map(cls => (
              // Assigned classes are stored as "7-A", so one tap selects both class and section.
              <button key={cls} type="button" aria-pressed={`${filters.class}-${filters.section}` === cls} onClick={() => { const [c, sec = ""] = cls.split("-"); setFilters(f => ({ ...f, class: c, section: sec })); }}
                style={{
                  padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                  background: `${filters.class}-${filters.section}` === cls ? "var(--brand)" : "var(--brand-soft)",
                  color: `${filters.class}-${filters.section}` === cls ? "#fff" : "var(--brand)",
                }}>Class {cls}</button>
            )) : (
              <div style={{ fontSize: 13, color: "var(--ea-muted)" }}>No classes assigned. Contact admin.</div>
            )}
          </div>

          {/* Section */}
          {sections.length > 0 && !filters.section && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2033", marginBottom: 8 }}>Section</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {sections.map(sec => (
                  <button key={sec} type="button" aria-pressed={filters.section === sec} onClick={() => setFilters(f => ({ ...f, section: sec }))}
                    style={{
                      padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                      background: filters.section === sec ? "var(--brand)" : "var(--brand-soft)",
                      color: filters.section === sec ? "#fff" : "var(--brand)",
                    }}>Section {sec}</button>
                ))}
              </div>
            </>
          )}

          {/* Date */}
          <label htmlFor="attendance-date" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1C2033", marginBottom: 8 }}>Date</label>
          <input id="attendance-date" type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--ea-edge)", fontSize: 13, outline: "none", background: "#F9FAFB", width: "100%", boxSizing: "border-box" }} />
        </div>

        {/* Stats */}
        {students.length > 0 && (
          <StatGrid columns={3} label="Today's count" style={{ marginBottom: 16 }}>
            <StatCard label="Present" value={present} icon={<CheckCircle2 />} tone="success" />
            <StatCard label="Absent" value={absent} icon={<XCircle />} tone="danger" />
            <StatCard label="Late" value={late} icon={<Clock />} tone="warning" />
          </StatGrid>
        )}

        {/* Mark All */}
        {students.length > 0 && (
          <div className="ea-roster__all" role="group" aria-label="Mark all students">
            <span className="ea-roster__all-label">Mark All:</span>
            {["Present", "Absent", "Late", "Holiday"].map(st => (
              <button key={st} type="button" className="ea-btn ea-btn--ghost ea-btn--sm" onClick={() => setAll(st)}>{st}</button>
            ))}
          </div>
        )}

        {/* Student List */}
        {loading ? (
          <Skeleton rows={3} label="Loading students" />
        ) : students.length > 0 ? (
          <>
            {existing && (
              <div className="ea-note ea-note--warning" style={{ marginBottom: 12 }}>
                Attendance already marked — saving will update existing records
              </div>
            )}
            <section className="ea-card ea-roster" aria-label="Class roster">
              {students.map((s) => {
                const status = attendance[s._id]?.status || "Present"
                return (
                  <div key={s._id} className={`ea-roster__row${status === "Absent" ? " is-absent" : ""}`}>
                    <div className="ea-roster__who">
                      <Avatar name={s.name} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div className="ea-roster__name">{s.name}</div>
                        <div className="ea-roster__roll">Roll {s.rollNumber || "—"}</div>
                      </div>
                    </div>
                    {/* Status: one choice per student; each button keeps its name ("Present: Riya Sharma") and pressed state. */}
                    <div className="ea-roster__status" role="group" aria-label={`Attendance for ${s.name}`}>
                      {["Present", "Absent", "Late", "Holiday"].map(st => (
                        <button key={st} type="button" data-st={st} aria-label={`${st}: ${s.name}`} aria-pressed={attendance[s._id]?.status === st}
                          onClick={() => setAttendance(a => ({ ...a, [s._id]: { ...a[s._id], status: st } }))}>{st}</button>
                      ))}
                    </div>
                    <input type="text" className="ea-input ea-roster__remark" placeholder="Add remark (optional)" aria-label={`Remark for ${s.name}`}
                      value={attendance[s._id]?.remarks || ""}
                      onChange={e => setAttendance(a => ({ ...a, [s._id]: { ...a[s._id], remarks: e.target.value } }))} />
                  </div>
                )
              })}
            </section>

            {/* Save Button */}
            <button type="button" onClick={handleSave} disabled={saving} className="ea-btn ea-btn--primary ea-roster__save">
              {saving ? "Saving..." : existing ? "Update Attendance" : "Save Attendance"}
            </button>
          </>
        ) : filters.class && filters.section ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--ea-muted)", fontSize: 14 }}>
            No students found in Class {filters.class} - Section {filters.section}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 48, color: "var(--ea-muted)", fontSize: 14 }}>
            Select a class to get started
          </div>
        )}
      </div>

      <BottomNav role="teacher" />
    </div>
  )
}
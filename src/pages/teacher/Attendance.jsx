import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL

const STATUS_COLORS = {
  Present: { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  Absent:  { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
  Late:    { bg: "#FEF9C3", color: "#CA8A04", border: "#FDE047" },
  Holiday: { bg: "#EEF2FF", color: "#4338CA", border: "#A5B4FC" },
}

export default function TeacherAttendance() {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [teacher,    setTeacher]    = useState(null)
  const [sections,   setSections]   = useState([])
  const [students,   setStudents]   = useState([])
  const [attendance, setAttendance] = useState({})
  const [filters,    setFilters]    = useState({ class: "", section: "", date: new Date().toISOString().split("T")[0] })
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState(null)
  const [existing,   setExisting]   = useState(false)

  const headers = { Authorization: `Bearer ${user.token}` }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Load teacher profile
  useEffect(() => {
    fetch(`${API}/teachers/me`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setTeacher(d.data) })
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
      showToast("Failed to load students", "error")
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
      showToast(`Attendance saved for ${data.count} students`)
      setExisting(true)
    } catch (err) {
      showToast(err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  const present = students.filter(s => attendance[s._id]?.status === "Present").length
  const absent  = students.filter(s => attendance[s._id]?.status === "Absent").length
  const late    = students.filter(s => attendance[s._id]?.status === "Late").length

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: "#F4F6FB", fontFamily: "'Poppins', sans-serif", paddingBottom: 90 }}>

      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600,
          background: toast.type === "error" ? "#FEE2E2" : "#DCFCE7",
          color: toast.type === "error" ? "#DC2626" : "#15803D",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", whiteSpace: "nowrap",
        }}>
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#3949AB,#5C6BC0)", padding: "48px 18px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate('/teacher/home')} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, width: 36, height: 36, fontSize: 18, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: 1 }}>TEACHER PORTAL</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Baloo 2', cursive" }}>Attendance</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* Filters */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: "0 2px 16px rgba(92,107,192,0.08)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2033", marginBottom: 12 }}>Select Class</div>

          {/* Class Chips — only teacher's assigned classes */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {teacher?.assignedClasses?.length > 0 ? teacher.assignedClasses.map(cls => (
              <button key={cls} onClick={() => setFilters(f => ({ ...f, class: cls, section: "" }))}
                style={{
                  padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                  background: filters.class === cls ? "#5C6BC0" : "#EEF2FF",
                  color: filters.class === cls ? "#fff" : "#5C6BC0",
                }}>Class {cls}</button>
            )) : (
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>No classes assigned. Contact admin.</div>
            )}
          </div>

          {/* Section */}
          {sections.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2033", marginBottom: 8 }}>Section</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {sections.map(sec => (
                  <button key={sec} onClick={() => setFilters(f => ({ ...f, section: sec }))}
                    style={{
                      padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                      background: filters.section === sec ? "#5C6BC0" : "#EEF2FF",
                      color: filters.section === sec ? "#fff" : "#5C6BC0",
                    }}>Section {sec}</button>
                ))}
              </div>
            </>
          )}

          {/* Date */}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2033", marginBottom: 8 }}>Date</div>
          <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", width: "100%", boxSizing: "border-box" }} />
        </div>

        {/* Stats */}
        {students.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Present", val: present, color: "#15803D", bg: "#DCFCE7" },
              { label: "Absent",  val: absent,  color: "#DC2626", bg: "#FEE2E2" },
              { label: "Late",    val: late,    color: "#CA8A04", bg: "#FEF9C3" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Mark All */}
        {students.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "12px 16px", marginBottom: 12, boxShadow: "0 2px 16px rgba(92,107,192,0.08)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7B8099" }}>Mark All:</span>
            {["Present", "Absent", "Late", "Holiday"].map(st => (
              <button key={st} onClick={() => setAll(st)} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer",
                background: STATUS_COLORS[st].bg, color: STATUS_COLORS[st].color,
                border: `1px solid ${STATUS_COLORS[st].border}`,
              }}>{st}</button>
            ))}
          </div>
        )}

        {/* Student List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#7B8099", fontSize: 14 }}>Loading students...</div>
        ) : students.length > 0 ? (
          <>
            {existing && (
              <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#CA8A04", fontWeight: 600 }}>
                ⚠️ Attendance already marked — saving will update existing records
              </div>
            )}
            {students.map((s, i) => (
              <div key={s._id} style={{
                background: "#fff", borderRadius: 20, padding: "14px 16px", marginBottom: 10,
                boxShadow: "0 2px 16px rgba(92,107,192,0.08)",
                border: attendance[s._id]?.status === "Absent" ? "2px solid #FECACA" : "2px solid transparent",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12, background: "#EEF2FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, color: "#5C6BC0", flexShrink: 0,
                  }}>{s.name?.[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1C2033" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#7B8099" }}>Roll: {s.rollNumber || "—"}</div>
                  </div>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: STATUS_COLORS[attendance[s._id]?.status]?.bg || "#F3F4F6",
                    color: STATUS_COLORS[attendance[s._id]?.status]?.color || "#6B7280",
                  }}>{attendance[s._id]?.status || "Present"}</span>
                </div>

                {/* Status buttons */}
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {["Present", "Absent", "Late", "Holiday"].map(st => {
                    const active = attendance[s._id]?.status === st
                    return (
                      <button key={st} onClick={() => setAttendance(a => ({ ...a, [s._id]: { ...a[s._id], status: st } }))}
                        style={{
                          flex: 1, padding: "6px 0", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer",
                          background: active ? STATUS_COLORS[st].bg : "#F4F6FB",
                          color: active ? STATUS_COLORS[st].color : "#9CA3AF",
                          border: active ? `1.5px solid ${STATUS_COLORS[st].border}` : "1.5px solid transparent",
                        }}>{st}</button>
                    )
                  })}
                </div>

                {/* Remarks */}
                <input type="text" placeholder="Add remark (optional)..."
                  value={attendance[s._id]?.remarks || ""}
                  onChange={e => setAttendance(a => ({ ...a, [s._id]: { ...a[s._id], remarks: e.target.value } }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12, outline: "none", background: "#F9FAFB", boxSizing: "border-box" }}
                />
              </div>
            ))}

            {/* Save Button */}
            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", padding: "14px", borderRadius: 16, border: "none",
              background: saving ? "#A5B4FC" : "linear-gradient(135deg,#3949AB,#5C6BC0)",
              color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer",
              marginTop: 8, boxShadow: "0 4px 16px rgba(92,107,192,0.3)",
            }}>
              {saving ? "Saving..." : existing ? "Update Attendance" : "Save Attendance"}
            </button>
          </>
        ) : filters.class && filters.section ? (
          <div style={{ textAlign: "center", padding: 48, color: "#7B8099", fontSize: 14 }}>
            No students found in Class {filters.class} - Section {filters.section}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 48, color: "#7B8099", fontSize: 14 }}>
            Select a class to get started
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "#fff", display: "flex", borderTop: "1px solid #E8EAF0", overflowY: "auto", boxShadow: "0 -4px 24px rgba(92,107,192,.08)", zIndex: 200, height: 66 }}>
        {[
          { icon: "🏠", label: "Home",       path: "/teacher/home" },
          { icon: "✅", label: "Attendance", path: "/teacher/attendance" },
          { icon: "📤", label: "Upload",     path: "/teacher/upload" },
          { icon: "💬", label: "Messages",   path: "/teacher/chat" },
          { icon: "👤", label: "Me",         path: "/teacher/profile" },
        ].map(t => {
          const active = location.pathname === t.path
          return (
            <button key={t.path} onClick={() => navigate(t.path)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 3, cursor: "pointer", fontSize: "9.5px", fontWeight: 700,
              letterSpacing: ".3px", textTransform: "uppercase", border: "none", background: "none",
              color: active ? "#5C6BC0" : "#7B8099",
              borderTop: active ? "3px solid #5C6BC0" : "3px solid transparent",
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
import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SUBJECTS = ["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer", "Physics", "Chemistry", "Biology", "History", "Geography", "Art", "PE", "Break", "Free"];

const DEFAULT_PERIODS = [
  { no: 1, time: "09:00 - 09:45", subject: "", teacher: "" },
  { no: 2, time: "09:45 - 10:30", subject: "", teacher: "" },
  { no: 3, time: "10:30 - 10:45", subject: "Break", teacher: "" },
  { no: 4, time: "10:45 - 11:30", subject: "", teacher: "" },
  { no: 5, time: "11:30 - 12:15", subject: "", teacher: "" },
  { no: 6, time: "12:15 - 01:00", subject: "", teacher: "" },
  { no: 7, time: "01:00 - 01:45", subject: "", teacher: "" },
  { no: 8, time: "01:45 - 02:30", subject: "", teacher: "" },
];

export default function Timetable() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [classTeacher, setClassTeacher] = useState("");
  const [schedule, setSchedule] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [existingTimetables, setExistingTimetables] = useState([]);
  const [viewMode, setViewMode] = useState("edit"); // edit | view

  // Fetch all unique classes from students
  useEffect(() => {
    axios.get(`${API}/students/classes`, authHeader())
      .then(r => {
        const cls = r.data?.data || [];
        setClasses(cls.sort((a, b) => parseInt(a) - parseInt(b)));
      })
      .catch(() => {
        // fallback hardcoded
        setClasses(["1","2","3","4","5","6","7","8","9","10","11","12"]);
      });

    axios.get(`${API}/teachers`, authHeader())
      .then(r => setTeachers(r.data?.data || r.data?.teachers || []))
      .catch(() => {});
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    if (!selectedClass) return;
    setSections([]);
    setSelectedSection("");
    setClassTeacher("");

    axios.get(`${API}/students/sections?class=${selectedClass}`, authHeader())
      .then(r => {
        const secs = r.data?.data || ["A"];
        setSections(secs);
        setSelectedSection(secs[0] || "A");
      })
      .catch(() => setSections(["A", "B", "C"]));
  }, [selectedClass]);

  // Fetch existing timetable when class+section changes
  useEffect(() => {
    if (!selectedClass || !selectedSection) return;
    setSchedule({});

    axios.get(`${API}/timetable/class/${selectedClass}`, authHeader())
      .then(r => {
        const data = r.data?.data || [];
        const filtered = data.filter(t => t.section === selectedSection);
        setExistingTimetables(filtered);

        // Build schedule map: { Monday: [...periods], Tuesday: [...] }
        const map = {};
        filtered.forEach(t => {
          map[t.day] = t.periods?.map(p => ({
            no: p.no || p.period,
            time: p.time || "",
            subject: p.subject || "",
            teacher: p.teacher?._id || p.teacher || "",
          })) || DEFAULT_PERIODS.map(d => ({ ...d }));
        });
        setSchedule(map);

        // Set class teacher from first entry
        if (filtered[0]?.classTeacher) setClassTeacher(filtered[0].classTeacher);
      })
      .catch(() => {});
  }, [selectedClass, selectedSection]);

  const currentPeriods = schedule[selectedDay] || DEFAULT_PERIODS.map(d => ({ ...d }));

  const updatePeriod = (idx, field, value) => {
    const updated = [...currentPeriods];
    updated[idx] = { ...updated[idx], [field]: value };
    setSchedule(prev => ({ ...prev, [selectedDay]: updated }));
  };

  const saveDay = async () => {
    if (!selectedClass || !selectedSection) return showToast("Please select class and section", "error");
    setSaving(true);
    try {
      const existing = existingTimetables.find(t => t.day === selectedDay);
      const payload = {
        class: selectedClass,
        section: selectedSection,
        day: selectedDay,
        periods: currentPeriods,
        classTeacher: classTeacher || undefined,
      };

      if (existing) {
        await axios.put(`${API}/timetable/${existing._id}`, payload, authHeader());
      } else {
        await axios.post(`${API}/timetable`, payload, authHeader());
      }

      // Refresh
      const r = await axios.get(`${API}/timetable/class/${selectedClass}`, authHeader());
      const filtered = (r.data?.data || []).filter(t => t.section === selectedSection);
      setExistingTimetables(filtered);
      showToast(`${selectedDay} timetable saved!`, "success");
    } catch (e) {
      showToast(e.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveAllDays = async () => {
    setSaving(true);
    let errors = 0;
    for (const day of DAYS) {
      const periods = schedule[day];
      if (!periods) continue;
      try {
        const existing = existingTimetables.find(t => t.day === day);
        const payload = { class: selectedClass, section: selectedSection, day, periods, classTeacher: classTeacher || undefined };
        if (existing) await axios.put(`${API}/timetable/${existing._id}`, payload, authHeader());
        else await axios.post(`${API}/timetable`, payload, authHeader());
      } catch { errors++; }
    }
    setSaving(false);
    if (errors) showToast(`Saved with ${errors} error(s)`, "error");
    else showToast("Full week timetable saved!", "success");
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToAllDays = () => {
    const copy = {};
    DAYS.forEach(d => { copy[d] = currentPeriods.map(p => ({ ...p })); });
    setSchedule(copy);
    showToast("Copied to all days!", "success");
  };

  const daysWithData = DAYS.filter(d => schedule[d]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a2e" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "white", padding: "10px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>Timetable Manager</div>
        <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Create and manage weekly class schedules</div>
      </div>

      {/* Selectors */}
      <div style={{ background: "#fff", border: "1px solid #E8EAF0", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Class */}
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#666", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>CLASS</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E8EAF0", borderRadius: 8, fontSize: 14, color: "#1a1a2e", background: "#F8F9FF", cursor: "pointer" }}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>

          {/* Section */}
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#666", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>SECTION</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E8EAF0", borderRadius: 8, fontSize: 14, color: "#1a1a2e", background: selectedClass ? "#F8F9FF" : "#f5f5f5", cursor: selectedClass ? "pointer" : "not-allowed" }}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>

          {/* Class Teacher */}
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#666", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>CLASS TEACHER</label>
            <select
              value={classTeacher}
              onChange={e => setClassTeacher(e.target.value)}
              disabled={!selectedClass}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E8EAF0", borderRadius: 8, fontSize: 14, color: "#1a1a2e", background: selectedClass ? "#F8F9FF" : "#f5f5f5", cursor: selectedClass ? "pointer" : "not-allowed" }}
            >
              <option value="">Assign Class Teacher</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name} — {t.subjects?.[0] || t.subject || ""}</option>)}
            </select>
          </div>
        </div>

        {/* Status chips */}
        {selectedClass && selectedSection && (
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DAYS.map(d => (
              <span key={d} style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: daysWithData.includes(d) ? "#e8f5e9" : "#fafafa",
                color: daysWithData.includes(d) ? "#2e7d32" : "#999",
                border: `1px solid ${daysWithData.includes(d) ? "#a5d6a7" : "#E8EAF0"}`
              }}>{d.slice(0, 3)} {daysWithData.includes(d) ? "✓" : "—"}</span>
            ))}
          </div>
        )}
      </div>

      {/* Day tabs + actions */}
      {selectedClass && selectedSection && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
              {DAYS.map(d => (
                <button key={d} onClick={() => setSelectedDay(d)} style={{
                  padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: selectedDay === d ? "none" : "1.5px solid #E8EAF0",
                  background: selectedDay === d ? "linear-gradient(135deg, #1a3a8f, #4f8ef7)" : "white",
                  color: selectedDay === d ? "white" : "#666",
                  position: "relative"
                }}>
                  {d.slice(0, 3)}
                  {schedule[d] && <span style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, background: "#10b981", borderRadius: "50%" }} />}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyToAllDays} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1.5px solid #E8EAF0", background: "white", color: "#666" }}>
                📋 Copy to All Days
              </button>
              <button onClick={saveDay} disabled={saving} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #1a3a8f, #4f8ef7)", color: "white", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : `💾 Save ${selectedDay}`}
              </button>
              <button onClick={saveAllDays} disabled={saving} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", opacity: saving ? 0.7 : 1 }}>
                {saving ? "..." : "✅ Save All Days"}
              </button>
            </div>
          </div>

          {/* Periods Table */}
          <div style={{ background: "#fff", border: "1px solid #E8EAF0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "#F8F9FF", padding: "12px 20px", borderBottom: "1px solid #E8EAF0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{selectedDay} — Class {selectedClass}-{selectedSection}</div>
              <div style={{ fontSize: 12, color: "#999" }}>{currentPeriods.length} periods</div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F5F5F3" }}>
                  {["Period", "Time", "Subject", "Teacher"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#666", textAlign: "left", borderBottom: "1px solid #E8EAF0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentPeriods.map((p, i) => {
                  const isBreak = p.subject === "Break" || p.subject === "Free";
                  return (
                    <tr key={i} style={{ background: isBreak ? "#fafafa" : "white", borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>Period {p.no}</div>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <input
                          value={p.time}
                          onChange={e => updatePeriod(i, "time", e.target.value)}
                          placeholder="09:00 - 09:45"
                          style={{ padding: "6px 10px", border: "1.5px solid #E8EAF0", borderRadius: 6, fontSize: 13, width: 130, color: "#1a1a2e", background: "#F8F9FF" }}
                        />
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <select
                          value={p.subject}
                          onChange={e => updatePeriod(i, "subject", e.target.value)}
                          style={{ padding: "6px 10px", border: "1.5px solid #E8EAF0", borderRadius: 6, fontSize: 13, color: "#1a1a2e", background: isBreak ? "#fafafa" : "#F8F9FF", minWidth: 150 }}
                        >
                          <option value="">Select Subject</option>
                          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {isBreak ? (
                          <span style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>—</span>
                        ) : (
                          <select
                            value={p.teacher}
                            onChange={e => updatePeriod(i, "teacher", e.target.value)}
                            style={{ padding: "6px 10px", border: "1.5px solid #E8EAF0", borderRadius: 6, fontSize: 13, color: "#1a1a2e", background: "#F8F9FF", minWidth: 180 }}
                          >
                            <option value="">Assign Teacher</option>
                            {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Add period button */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #E8EAF0" }}>
              <button
                onClick={() => {
                  const last = currentPeriods[currentPeriods.length - 1];
                  const newPeriod = { no: last.no + 1, time: "", subject: "", teacher: "" };
                  setSchedule(prev => ({ ...prev, [selectedDay]: [...currentPeriods, newPeriod] }));
                }}
                style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1.5px dashed #E8EAF0", background: "white", color: "#666" }}
              >
                + Add Period
              </button>
            </div>
          </div>

          {/* Weekly overview */}
          {daysWithData.length > 0 && (
            <div style={{ marginTop: 20, background: "#fff", border: "1px solid #E8EAF0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ background: "#F8F9FF", padding: "12px 20px", borderBottom: "1px solid #E8EAF0" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>Weekly Overview — Class {selectedClass}-{selectedSection}</div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F5F5F3" }}>
                      <th style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#666", textAlign: "left", borderBottom: "1px solid #E8EAF0", minWidth: 80 }}>Period</th>
                      {daysWithData.map(d => (
                        <th key={d} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#666", textAlign: "center", borderBottom: "1px solid #E8EAF0", minWidth: 110 }}>{d.slice(0, 3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEFAULT_PERIODS.map((_, pi) => (
                      <tr key={pi} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#666" }}>P{pi + 1}</td>
                        {daysWithData.map(d => {
                          const p = schedule[d]?.[pi];
                          const isBreak = p?.subject === "Break" || p?.subject === "Free";
                          return (
                            <td key={d} style={{ padding: "8px 12px", textAlign: "center" }}>
                              <span style={{
                                display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                background: isBreak ? "#F5F5F3" : p?.subject ? "#EFF4FF" : "#fafafa",
                                color: isBreak ? "#999" : p?.subject ? "#1a3a8f" : "#ccc"
                              }}>
                                {p?.subject || "—"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!selectedClass && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#666" }}>Select a Class to Start</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Choose class and section to create or edit timetable</div>
        </div>
      )}
    </div>
  );
}

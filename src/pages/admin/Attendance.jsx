import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const STATUS_COLORS = {
  Present: { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  Absent:  { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
  Late:    { bg: "#FEF9C3", color: "#CA8A04", border: "#FDE047" },
  Holiday: { bg: "#EEF2FF", color: "#4338CA", border: "#A5B4FC" },
};

export default function AdminAttendance() {
  const { user } = useAuth();

  const [classes,   setClasses]   = useState([]);
  const [sections,  setSections]  = useState([]);
  const [students,  setStudents]  = useState([]);
  const [attendance, setAttendance] = useState({});
  const [filters,   setFilters]   = useState({ class: "", section: "", date: new Date().toISOString().split("T")[0] });
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [existing,  setExisting]  = useState(false);

  const headers = { Authorization: `Bearer ${user.token}` };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load distinct classes from students
  useEffect(() => {
    fetch(`${API}/students`, { headers })
      .then(r => r.json())
      .then(d => {
        const cls = [...new Set((d.data || []).map(s => s.class))].sort((a, b) => Number(a) - Number(b));
        setClasses(cls);
      });
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!filters.class) { setSections([]); setStudents([]); setAttendance({}); return; }
    fetch(`${API}/students?class=${filters.class}`, { headers })
      .then(r => r.json())
      .then(d => {
        const sec = [...new Set((d.data || []).map(s => s.section))].sort();
        setSections(sec);
      });
  }, [filters.class]);

  // Load students when class+section selected
  useEffect(() => {
    if (!filters.class || !filters.section) { setStudents([]); setAttendance({}); return; }
    loadStudents();
  }, [filters.class, filters.section, filters.date]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const [stuRes, attRes] = await Promise.all([
        fetch(`${API}/students?class=${filters.class}&section=${filters.section}`, { headers }),
        fetch(`${API}/attendance/class/${filters.class}?date=${filters.date}&section=${filters.section}`, { headers }),
      ]);
      const stuData = await stuRes.json();
      const attData = await attRes.json();

      const stu = stuData.data || [];
      setStudents(stu);

      // Check if attendance already marked today
      const existingRecords = attData.data || [];
      const todayRecords = existingRecords.filter(r => {
        const d = new Date(r.date).toISOString().split("T")[0];
        return d === filters.date && r.section === filters.section;
      });
      setExisting(todayRecords.length > 0);

      // Pre-fill attendance from existing or default Present
      const att = {};
      stu.forEach(s => {
        const rec = todayRecords.find(r => r.studentId?._id === s._id || r.studentId === s._id);
        att[s._id] = { status: rec?.status || "Present", remarks: rec?.remarks || "" };
      });
      setAttendance(att);
    } catch (err) {
      showToast("Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  };

  const setAll = (status) => {
    const att = {};
    students.forEach(s => { att[s._id] = { ...attendance[s._id], status }; });
    setAttendance(att);
  };

  const handleSave = async () => {
    if (!filters.class || !filters.section || !filters.date) {
      showToast("Please select class, section and date", "error"); return;
    }
    if (students.length === 0) { showToast("No students to save", "error"); return; }
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status:    attendance[s._id]?.status || "Present",
        remarks:   attendance[s._id]?.remarks || "",
      }));
      const res = await fetch(`${API}/attendance/bulk`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ records, date: filters.date, class: filters.class, section: filters.section }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      showToast(`Attendance saved for ${data.count} students`);
      setExisting(true);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const present = students.filter(s => attendance[s._id]?.status === "Present").length;
  const absent  = students.filter(s => attendance[s._id]?.status === "Absent").length;
  const late    = students.filter(s => attendance[s._id]?.status === "Late").length;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: 24, background: "#F8F9FC", minHeight: "100vh" }}>

      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? "#FEF2F2" : "#F0FDF4",
          border: `1px solid ${toast.type === "error" ? "#FECACA" : "#BBF7D0"}`,
          color: toast.type === "error" ? "#DC2626" : "#15803D",
          padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}>
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Attendance</div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Mark and manage daily class attendance</div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* Class */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Class</label>
            <select value={filters.class} onChange={e => setFilters(f => ({ ...f, class: e.target.value, section: "" }))}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB" }}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          {/* Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Section</label>
            <select value={filters.section} onChange={e => setFilters(f => ({ ...f, section: e.target.value }))}
              disabled={!filters.class}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", background: !filters.class ? "#F3F4F6" : "#F9FAFB" }}>
              <option value="">Select Section</option>
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          {/* Date */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</label>
            <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB" }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      {students.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total",   val: students.length, color: "#534AB7" },
            { label: "Present", val: present,          color: "#15803D" },
            { label: "Absent",  val: absent,           color: "#DC2626" },
            { label: "Late",    val: late,             color: "#CA8A04" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF", fontSize: 14 }}>Loading students...</div>
      ) : students.length > 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

          {/* Bulk Actions */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginRight: 8 }}>Mark All:</span>
            {["Present", "Absent", "Late", "Holiday"].map(st => (
              <button key={st} onClick={() => setAll(st)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: STATUS_COLORS[st].bg, color: STATUS_COLORS[st].color,
                border: `1px solid ${STATUS_COLORS[st].border}`,
              }}>{st}</button>
            ))}
            {existing && (
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>
                ⚠️ Attendance already marked — saving will update existing records
              </span>
            )}
          </div>

          {/* Table Header */}
          <div style={{ display: "grid", gridTemplateColumns: "40px 2fr 1fr 2fr 2fr", padding: "10px 20px", background: "#F9FAFB", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E5E7EB" }}>
            <span>#</span>
            <span>Student</span>
            <span>Roll No.</span>
            <span>Status</span>
            <span>Remarks</span>
          </div>

          {students.map((s, i) => (
            <div key={s._id} style={{
              display: "grid", gridTemplateColumns: "40px 2fr 1fr 2fr 2fr",
              padding: "12px 20px", alignItems: "center",
              borderBottom: i < students.length - 1 ? "1px solid #F3F4F6" : "none",
              background: attendance[s._id]?.status === "Absent" ? "#FFF9F9" : "transparent",
            }}>
              <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{i + 1}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, background: "#EEF2FF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#534AB7", flexShrink: 0,
                }}>
                  {s.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.parentName || ""}</div>
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{s.rollNumber || "—"}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Present", "Absent", "Late", "Holiday"].map(st => {
                  const active = attendance[s._id]?.status === st;
                  return (
                    <span key={st} onClick={() => setAttendance(a => ({ ...a, [s._id]: { ...a[s._id], status: st } }))}
                      style={{
                        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        background: active ? STATUS_COLORS[st].bg : "#F3F4F6",
                        color: active ? STATUS_COLORS[st].color : "#9CA3AF",
                        border: active ? `1px solid ${STATUS_COLORS[st].border}` : "1px solid transparent",
                      }}>{st}</span>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="Add remark..."
                value={attendance[s._id]?.remarks || ""}
                onChange={e => setAttendance(a => ({ ...a, [s._id]: { ...a[s._id], remarks: e.target.value } }))}
                style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, outline: "none", background: "#F9FAFB", width: "100%", boxSizing: "border-box" }}
              />
            </div>
          ))}

          {/* Save Button */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button onClick={loadStudents}
              style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 13, color: "#374151", cursor: "pointer" }}>
              Reset
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: "10px 28px", borderRadius: 9, border: "none", background: saving ? "#A5B4FC" : "#534AB7", fontSize: 13, color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : existing ? "Update Attendance" : "Save Attendance"}
            </button>
          </div>
        </div>
      ) : filters.class && filters.section ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF", fontSize: 14 }}>
          No students found in Class {filters.class} - Section {filters.section}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF", fontSize: 14 }}>
          Select class and section to load students
        </div>
      )}
    </div>
  );
}
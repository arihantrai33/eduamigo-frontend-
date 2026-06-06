import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const SCHOOL_NAME = "EduAmigo School";

function generateBarcode(text) {
  const bars = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bars.push((code % 3) + 1, ((code >> 2) % 3) + 1, ((code >> 4) % 3) + 1);
  }
  return bars;
}

function BarcodeStrip({ value }) {
  const bars = generateBarcode(value.slice(0, 12));
  const total = bars.reduce((a, b) => a + b, 0);
  const scale = 60 / total;
  let x = 0;
  return (
    <svg width="100" height="32" viewBox="0 0 100 32">
      {bars.map((w, i) => {
        const barW = w * scale * (100 / 60);
        const rect = i % 2 === 0 ? <rect key={i} x={x} y={0} width={barW} height={28} fill="#1E293B" rx={0.5} /> : null;
        x += barW;
        return rect;
      })}
      <text x="50" y="31" textAnchor="middle" fontSize="5" fill="#64748B" fontFamily="monospace">{value.slice(0, 12).toUpperCase()}</text>
    </svg>
  );
}

function Avatar({ name, photo, size = 56 }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  if (photo) return <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "3px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 800, color: "white", border: "3px solid white", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
      {initials}
    </div>
  );
}

function StudentCard({ student, animPhase }) {
  return (
    <div style={{ width: 340, borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", fontFamily: "'Inter',sans-serif", position: "relative", background: "white", transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)", transform: animPhase === 2 ? "scale(1) translateY(0)" : "scale(0.85) translateY(30px)", opacity: animPhase === 2 ? 1 : 0 }}>
      <div style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6,#EC4899)", height: 80, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", top: -40, left: 80, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ padding: "12px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "white", letterSpacing: "0.06em" }}>{SCHOOL_NAME.toUpperCase()}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 2, letterSpacing: "0.04em" }}>STUDENT IDENTITY CARD</div>
        </div>
        <div style={{ position: "absolute", right: 18, top: 16, width: 32, height: 22, borderRadius: 5, background: "linear-gradient(135deg,#FCD34D,#F59E0B)", boxShadow: "0 2px 8px rgba(245,158,11,0.5)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(3,1fr)", gap: 1.5, padding: 3, boxSizing: "border-box" }}>
          {Array(9).fill(0).map((_,i) => <div key={i} style={{ background: "rgba(0,0,0,0.15)", borderRadius: 1 }} />)}
        </div>
      </div>
      <div style={{ padding: "0 18px 16px", position: "relative" }}>
        <div style={{ position: "absolute", top: -30, left: 18 }}>
          <Avatar name={student.name} photo={student.photo} size={60} />
        </div>
        <div style={{ paddingLeft: 76, paddingTop: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>{student.name}</div>
          <div style={{ fontSize: 10, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Student</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
          {[{ label: "ROLL NO", value: student.rollNumber }, { label: "CLASS", value: `${student.class}-${student.section}` }, { label: "GENDER", value: student.gender || "—" }].map((item, i) => (
            <div key={i} style={{ background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", borderRadius: 10, padding: "6px 10px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 7, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em" }}>{item.label}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px dashed #E2E8F0" }}>
          <div>
            <div style={{ fontSize: 8, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.06em" }}>PARENT / GUARDIAN</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginTop: 2 }}>{student.parentName || "—"}</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>{student.parentPhone || student.phone}</div>
          </div>
          <BarcodeStrip value={student.rollNumber + student._id} />
        </div>
      </div>
      <div style={{ height: 4, background: "linear-gradient(90deg,#6366F1,#8B5CF6,#EC4899)" }} />
    </div>
  );
}

function TeacherCard({ teacher, animPhase }) {
  return (
    <div style={{ width: 340, borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", fontFamily: "'Inter',sans-serif", position: "relative", background: "white", transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)", transform: animPhase === 2 ? "scale(1) translateY(0)" : "scale(0.85) translateY(30px)", opacity: animPhase === 2 ? 1 : 0 }}>
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E3A5F,#1E40AF)", height: 80, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ padding: "12px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "white", letterSpacing: "0.06em" }}>{SCHOOL_NAME.toUpperCase()}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginTop: 2, letterSpacing: "0.04em" }}>FACULTY IDENTITY CARD</div>
        </div>
        <div style={{ position: "absolute", right: 18, top: 16, width: 32, height: 22, borderRadius: 5, background: "linear-gradient(135deg,#FCD34D,#F59E0B)", boxShadow: "0 2px 8px rgba(245,158,11,0.5)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(3,1fr)", gap: 1.5, padding: 3, boxSizing: "border-box" }}>
          {Array(9).fill(0).map((_,i) => <div key={i} style={{ background: "rgba(0,0,0,0.15)", borderRadius: 1 }} />)}
        </div>
      </div>
      <div style={{ padding: "0 18px 16px", position: "relative" }}>
        <div style={{ position: "absolute", top: -30, left: 18 }}>
          <Avatar name={teacher.name} photo={teacher.photo} size={60} />
        </div>
        <div style={{ paddingLeft: 76, paddingTop: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>{teacher.name}</div>
          <div style={{ fontSize: 10, color: "#1E40AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Faculty</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
          {[{ label: "EMP ID", value: teacher.employeeId }, { label: "SUBJECT", value: teacher.subjects?.[0] || "—" }, { label: "EXP", value: teacher.experience ? `${teacher.experience}y` : "—" }].map((item, i) => (
            <div key={i} style={{ background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", borderRadius: 10, padding: "6px 10px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 7, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em" }}>{item.label}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0F172A", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px dashed #E2E8F0" }}>
          <div>
            <div style={{ fontSize: 8, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.06em" }}>CONTACT</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginTop: 2 }}>{teacher.phone}</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>{teacher.qualification || "—"}</div>
          </div>
          <BarcodeStrip value={teacher.employeeId + teacher._id} />
        </div>
      </div>
      <div style={{ height: 4, background: "linear-gradient(90deg,#0F172A,#1E40AF,#3B82F6)" }} />
    </div>
  );
}

function BuildingAnimation() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "40px 0" }}>
      <div style={{ width: 340, height: 220, borderRadius: 20, border: "2px dashed #C7D2FE", background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))", borderBottom: "2px dashed #C7D2FE" }} />
        <div style={{ position: "absolute", top: 55, left: 18, width: 60, height: 60, borderRadius: "50%", border: "3px dashed #A5B4FC", background: "rgba(99,102,241,0.08)" }} />
        <div style={{ position: "absolute", top: 28, left: 18, right: 18, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 8, width: 120, borderRadius: 4, background: "rgba(99,102,241,0.2)" }} />
          <div style={{ height: 6, width: 80, borderRadius: 4, background: "rgba(99,102,241,0.12)" }} />
        </div>
        <div style={{ position: "absolute", bottom: 40, left: 18, right: 18, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 32, borderRadius: 8, background: "rgba(99,102,241,0.08)", border: "1px dashed #C7D2FE" }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ height: 8, width: 80, borderRadius: 4, background: "rgba(99,102,241,0.1)" }} />
            <div style={{ width: 70, height: 28, borderRadius: 4, background: "rgba(99,102,241,0.08)", border: "1px dashed #C7D2FE" }} />
          </div>
        </div>
        <div style={{ textAlign: "center", zIndex: 10 }}>
          <div style={{ fontSize: 36, marginBottom: 8, animation: "spin 1.5s linear infinite", display: "inline-block" }}>⚙️</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6366F1" }}>Building ID Card...</div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366F1", animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { from { transform: translateY(0); opacity: 0.4; } to { transform: translateY(-8px); opacity: 1; } }`}</style>
    </div>
  );
}

export default function IDCardGenerator() {
  const [tab, setTab] = useState("student");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [animPhase, setAnimPhase] = useState(0);
  const [printing, setPrinting] = useState(false);

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    setSelected(null); setSelectedId(""); setSelectedClass(""); setSelectedSection(""); setSearch("");
    try {
      if (tab === "student") {
        const res = await axios.get(`${API}/students`, authHeader());
        setStudents(res.data.data || []);
      } else {
        const res = await axios.get(`${API}/teachers`, authHeader());
        setTeachers(res.data.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSelect = (person) => {
    setSelected(null);
    setSelectedId(person._id);
    setAnimPhase(1);
    setTimeout(() => { setSelected(person); setAnimPhase(2); }, 1200);
  };

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  };

  const classes = [...new Set(students.map(s => s.class))].sort();
  const sections = [...new Set(students.filter(s => !selectedClass || s.class === selectedClass).map(s => s.section))].sort();
  const filtered = tab === "student"
    ? students.filter(s =>
        (!selectedClass || s.class === selectedClass) &&
        (!selectedSection || s.section === selectedSection) &&
        (!search || s.name.toLowerCase().includes(search.toLowerCase()))
      )
    : teachers.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  const steps = tab === "student"
    ? [
        { num: 1, label: "Select Tab", done: true },
        { num: 2, label: "Filter Class", done: !!selectedClass },
        { num: 3, label: "Choose Student", done: !!selectedId },
        { num: 4, label: "ID Card Ready", done: animPhase === 2 },
      ]
    : [
        { num: 1, label: "Select Tab", done: true },
        { num: 2, label: "Choose Faculty", done: !!selectedId },
        { num: 3, label: "ID Card Ready", done: animPhase === 2 },
      ];

  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #id-card-print, #id-card-print * { visibility: visible !important; }
          #id-card-print { position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%,-50%) !important; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>ID Card Generator</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Generate and print professional identity cards</div>
        </div>
        {animPhase === 2 && (
          <button onClick={handlePrint} disabled={printing}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#0F172A,#1E3A5F)", color: "white", border: "none", borderRadius: 14, padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(15,23,42,0.3)", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            🖨️ {printing ? "Preparing..." : "Print ID Card"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, background: "white", borderRadius: 14, padding: 5, border: "1px solid #E2E8F0", width: "fit-content", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {["student","teacher"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "9px 28px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: tab === t ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "transparent", color: tab === t ? "white" : "#94A3B8", boxShadow: tab === t ? "0 4px 12px rgba(99,102,241,0.3)" : "none" }}>
            {t === "student" ? "🎒 Students" : "👩‍🏫 Faculty"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: step.done ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "white", border: step.done ? "none" : "1.5px solid #E2E8F0", boxShadow: step.done ? "0 4px 12px rgba(99,102,241,0.25)" : "none", transition: "all 0.3s" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: step.done ? "rgba(255,255,255,0.25)" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: step.done ? "white" : "#94A3B8" }}>{step.done ? "✓" : step.num}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: step.done ? "white" : "#94A3B8" }}>{step.label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 20, height: 1, background: "#E2E8F0" }} />}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "20px", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", border: "1px solid rgba(226,232,240,0.8)", maxHeight: 600, display: "flex", flexDirection: "column", gap: 10 }}>
          {tab === "student" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(""); setSelected(null); setAnimPhase(0); }}
                style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 12, fontWeight: 600, outline: "none", background: "white", cursor: "pointer" }}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
              <select value={selectedSection} onChange={e => { setSelectedSection(e.target.value); setSelected(null); setAnimPhase(0); }}
                style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 12, fontWeight: 600, outline: "none", background: "white", cursor: "pointer" }}>
                <option value="">All Sections</option>
                {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          )}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab === "student" ? "students" : "faculty"}...`}
            style={{ padding: "10px 14px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border 0.2s" }}
            onFocus={e => e.target.style.borderColor = "#6366F1"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{filtered.length} {tab === "student" ? "students" : "faculty members"}</div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8" }}>Loading...</div>
              : filtered.length === 0 ? <div style={{ textAlign: "center", padding: "30px 0", color: "#CBD5E1" }}>No results found</div>
              : filtered.map((person, i) => {
                const isActive = selectedId === person._id;
                return (
                  <div key={i} onClick={() => handleSelect(person)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, cursor: "pointer", marginBottom: 4, transition: "all 0.15s", background: isActive ? "linear-gradient(135deg,#EEF2FF,#E0E7FF)" : "transparent", border: isActive ? "1.5px solid #C7D2FE" : "1.5px solid transparent" }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                    <Avatar name={person.name} photo={person.photo} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.name}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
                        {tab === "student" ? `Class ${person.class}-${person.section} · Roll ${person.rollNumber}` : `${person.employeeId} · ${person.subjects?.[0] || "Faculty"}`}
                      </div>
                    </div>
                    {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366F1", flexShrink: 0 }} />}
                  </div>
                );
              })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 500 }}>
          {animPhase === 0 && (
            <div style={{ textAlign: "center", padding: "60px 40px", background: "white", borderRadius: 24, border: "2px dashed #E2E8F0", width: "100%" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🪪</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#94A3B8", marginBottom: 8 }}>
                {tab === "student" ? "Select a Student" : "Select a Faculty Member"}
              </div>
              <div style={{ fontSize: 13, color: "#CBD5E1", maxWidth: 300, margin: "0 auto", lineHeight: 1.6 }}>
                {tab === "student"
                  ? "Filter by class and section, then click on a student to generate their ID card"
                  : "Click on a faculty member from the list to generate their identity card"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 24 }}>
                {(tab === "student" ? ["Filter by Class →", "Select Section →", "Click Student →", "Print Card ✓"] : ["Click Faculty →", "Preview Card →", "Print Card ✓"]).map((s, i) => (
                  <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", padding: "6px 12px", borderRadius: 8 }}>{s}</div>
                ))}
              </div>
            </div>
          )}
          {animPhase === 1 && <BuildingAnimation />}
          {animPhase === 2 && selected && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ height: 1, width: 60, background: "#E2E8F0" }} />
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>ID Card Preview</span>
                <div style={{ height: 1, width: 60, background: "#E2E8F0" }} />
              </div>
              <div id="id-card-print">
                {tab === "student" ? <StudentCard student={selected} animPhase={animPhase} /> : <TeacherCard teacher={selected} animPhase={animPhase} />}
              </div>
              <div style={{ background: "white", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", border: "1px solid rgba(226,232,240,0.8)", width: 340 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>Card Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {(tab === "student" ? [
                    { label: "Full Name", value: selected.name },
                    { label: "Roll Number", value: selected.rollNumber },
                    { label: "Class", value: `${selected.class} - ${selected.section}` },
                    { label: "Gender", value: selected.gender || "—" },
                    { label: "Contact", value: selected.phone },
                    { label: "Parent", value: selected.parentName || "—" },
                  ] : [
                    { label: "Full Name", value: selected.name },
                    { label: "Employee ID", value: selected.employeeId },
                    { label: "Subjects", value: selected.subjects?.join(", ") || "—" },
                    { label: "Experience", value: selected.experience ? `${selected.experience} years` : "—" },
                    { label: "Contact", value: selected.phone },
                    { label: "Qualification", value: selected.qualification || "—" },
                  ]).map((item, i) => (
                    <div key={i} style={{ background: "#F8FAFC", borderRadius: 10, padding: "8px 12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={handlePrint}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.4)", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  🖨️ Print Card
                </button>
                <button onClick={() => { setSelected(null); setSelectedId(""); setAnimPhase(0); }}
                  style={{ background: "white", color: "#64748B", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

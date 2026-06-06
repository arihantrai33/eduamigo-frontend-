import { useState, useEffect, useRef } from "react";
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

function Avatar({ name, photo, size = 72 }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  if (photo) return <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "3px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.28, fontWeight: 800, color: "white", border: "3px solid white", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
      {initials}
    </div>
  );
}

function StudentCard({ student }) {
  return (
    <div style={{ width: 320, height: 200, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", fontFamily: "'Inter', sans-serif", position: "relative", background: "white" }}>
      <div style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", height: 72, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ padding: "10px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "white", letterSpacing: "0.05em" }}>{SCHOOL_NAME.toUpperCase()}</div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>STUDENT IDENTITY CARD</div>
        </div>
        <div style={{ position: "absolute", right: 16, top: 14, width: 28, height: 20, borderRadius: 4, background: "linear-gradient(135deg,#FCD34D,#F59E0B)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 4, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(3,1fr)", gap: 1, padding: 2, boxSizing: "border-box" }}>
            {Array(9).fill(0).map((_,i) => <div key={i} style={{ background: "rgba(0,0,0,0.1)", borderRadius: 1 }} />)}
          </div>
        </div>
      </div>
      <div style={{ padding: "0 16px 12px", position: "relative" }}>
        <div style={{ position: "absolute", top: -28, left: 16 }}>
          <Avatar name={student.name} photo={student.photo} size={56} />
        </div>
        <div style={{ paddingLeft: 72, paddingTop: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px", lineHeight: 1.2 }}>{student.name}</div>
          <div style={{ fontSize: 9, color: "#6366F1", fontWeight: 700, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>Student</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
          {[{ label: "ROLL NO", value: student.rollNumber }, { label: "CLASS", value: `${student.class}-${student.section}` }, { label: "GENDER", value: student.gender || "—" }].map((item, i) => (
            <div key={i} style={{ background: "#F8FAFC", borderRadius: 8, padding: "5px 8px" }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em" }}>{item.label}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", marginTop: 1 }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 7, color: "#94A3B8", fontWeight: 600 }}>PARENT</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#374151" }}>{student.parentName || "—"}</div>
            <div style={{ fontSize: 8, color: "#64748B" }}>{student.parentPhone || student.phone}</div>
          </div>
          <BarcodeStrip value={student.rollNumber + student._id} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#6366F1,#8B5CF6,#EC4899)" }} />
    </div>
  );
}

function TeacherCard({ teacher }) {
  return (
    <div style={{ width: 320, height: 200, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", fontFamily: "'Inter', sans-serif", position: "relative", background: "white" }}>
      <div style={{ background: "linear-gradient(135deg,#0F172A,#1E3A5F)", height: 72, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ padding: "10px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "white", letterSpacing: "0.05em" }}>{SCHOOL_NAME.toUpperCase()}</div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>FACULTY IDENTITY CARD</div>
        </div>
        <div style={{ position: "absolute", right: 16, top: 14, width: 28, height: 20, borderRadius: 4, background: "linear-gradient(135deg,#FCD34D,#F59E0B)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 4, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(3,1fr)", gap: 1, padding: 2, boxSizing: "border-box" }}>
            {Array(9).fill(0).map((_,i) => <div key={i} style={{ background: "rgba(0,0,0,0.1)", borderRadius: 1 }} />)}
          </div>
        </div>
      </div>
      <div style={{ padding: "0 16px 12px", position: "relative" }}>
        <div style={{ position: "absolute", top: -28, left: 16 }}>
          <Avatar name={teacher.name} photo={teacher.photo} size={56} />
        </div>
        <div style={{ paddingLeft: 72, paddingTop: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px", lineHeight: 1.2 }}>{teacher.name}</div>
          <div style={{ fontSize: 9, color: "#1E3A5F", fontWeight: 700, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>Faculty</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
          {[{ label: "EMP ID", value: teacher.employeeId }, { label: "SUBJECT", value: teacher.subjects?.[0] || "—" }, { label: "EXP", value: teacher.experience ? `${teacher.experience}y` : "—" }].map((item, i) => (
            <div key={i} style={{ background: "#F8FAFC", borderRadius: 8, padding: "5px 8px" }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em" }}>{item.label}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 7, color: "#94A3B8", fontWeight: 600 }}>CONTACT</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#374151" }}>{teacher.phone}</div>
            <div style={{ fontSize: 8, color: "#64748B" }}>{teacher.qualification || "—"}</div>
          </div>
          <BarcodeStrip value={teacher.employeeId + teacher._id} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#0F172A,#1E3A5F,#3B82F6)" }} />
    </div>
  );
}

export default function IDCardGenerator() {
  const [tab, setTab] = useState("student");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [printing, setPrinting] = useState(false);

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    setSelected(null);
    setSelectedId("");
    setSearch("");
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

  const list = tab === "student" ? students : teachers;
  const filtered = list.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@media print { body * { visibility: hidden !important; } #id-card-print, #id-card-print * { visibility: visible !important; } #id-card-print { position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%,-50%) !important; } }`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>ID Card Generator</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Generate and print identity cards for students and faculty</div>
        </div>
        {selected && (
          <button onClick={handlePrint} disabled={printing}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#0F172A,#1E3A5F)", color: "white", border: "none", borderRadius: 14, padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(15,23,42,0.3)" }}>
            🖨️ {printing ? "Preparing..." : "Print ID Card"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, background: "white", borderRadius: 14, padding: 5, border: "1px solid #E2E8F0", width: "fit-content", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {["student", "teacher"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "9px 28px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: tab === t ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "transparent", color: tab === t ? "white" : "#94A3B8", boxShadow: tab === t ? "0 4px 12px rgba(99,102,241,0.3)" : "none" }}>
            {t === "student" ? "🎒 Students" : "👩‍🏫 Faculty"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "20px", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", border: "1px solid rgba(226,232,240,0.8)", maxHeight: 580, display: "flex", flexDirection: "column" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab === "student" ? "students" : "faculty"}...`}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 }}
            onFocus={e => e.target.style.borderColor = "#6366F1"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 10 }}>{filtered.length} {tab === "student" ? "students" : "faculty members"}</div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8" }}>Loading...</div>
              : filtered.length === 0 ? <div style={{ textAlign: "center", padding: "30px 0", color: "#CBD5E1" }}>No results found</div>
              : filtered.map((person, i) => {
                const isActive = selectedId === person._id;
                return (
                  <div key={i} onClick={() => { setSelected(person); setSelectedId(person._id); }}
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

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {!selected ? (
            <div style={{ textAlign: "center", padding: "60px 40px", background: "white", borderRadius: 24, border: "2px dashed #E2E8F0", width: "100%" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🪪</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#94A3B8", marginBottom: 8 }}>Select a Person</div>
              <div style={{ fontSize: 13, color: "#CBD5E1" }}>Choose a student or faculty member to preview their ID card</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ height: 1, width: 60, background: "#E2E8F0" }} />
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>ID Card Preview</span>
                <div style={{ height: 1, width: 60, background: "#E2E8F0" }} />
              </div>
              <div id="id-card-print">
                {tab === "student" ? <StudentCard student={selected} /> : <TeacherCard teacher={selected} />}
              </div>
              <div style={{ background: "white", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", border: "1px solid rgba(226,232,240,0.8)", width: 320 }}>
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
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
                  🖨️ Print Card
                </button>
                <button onClick={() => { setSelected(null); setSelectedId(""); }}
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

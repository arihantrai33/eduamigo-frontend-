import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Tab({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:12, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, transition:"all 0.2s", background: active ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "white", color: active ? "white" : "#94A3B8", boxShadow: active ? "0 4px 12px rgba(99,102,241,0.3)" : "none" }}>
      <span>{icon}</span>{label}
    </button>
  );
}

function ResultBanner({ result, onClose }) {
  if (!result) return null;
  const ok = result.success;
  return (
    <div style={{ padding:"14px 20px", borderRadius:14, background: ok ? "#F0FDF4" : "#FEF2F2", border:`1.5px solid ${ok?"#86EFAC":"#FCA5A5"}`, display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
      <div>
        <div style={{ fontWeight:700, fontSize:14, color: ok?"#15803D":"#DC2626" }}>{ok?"✅":"❌"} {result.message}</div>
        {result.errors?.length > 0 && <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>{result.errors.length} errors — check console</div>}
      </div>
      <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", fontSize:18, color:"#94A3B8" }}>×</button>
    </div>
  );
}

export default function BulkOperations() {
  const [tab, setTab] = useState("attendance");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Attendance state
  const [attClass, setAttClass] = useState("");
  const [attSection, setAttSection] = useState("");
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [attStatus, setAttStatus] = useState("Present");

  // Promote state
  const [fromClass, setFromClass] = useState("");
  const [fromSection, setFromSection] = useState("");
  const [toClass, setToClass] = useState("");
  const [toSection, setToSection] = useState("");

  // Fee reminder state
  const [feeStudents, setFeeStudents] = useState([]);

  // CSV state
  const [csvTab, setCsvTab] = useState("students");
  const [csvData, setCsvData] = useState(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvPreview, setCsvPreview] = useState([]);

  useEffect(() => {
    axios.get(`${API}/students`, auth()).then(r => setStudents(r.data.data || []));
    axios.get(`${API}/teachers`, auth()).then(r => setTeachers(r.data.data || []));
  }, []);

  const classes = [...new Set(students.map(s => s.class))].sort();
  const sections = (cls) => [...new Set(students.filter(s => s.class === cls).map(s => s.section))].sort();

  const countStudents = (cls, sec) => students.filter(s => (!cls || s.class === cls) && (!sec || s.section === sec)).length;

  const handleAttendance = async () => {
    if (!attClass || !attDate) return alert("Class aur date select karo");
    setLoading(true);
    try {
      const r = await axios.post(`${API}/bulk/attendance`, { className: attClass, section: attSection, date: attDate, status: attStatus }, auth());
      setResult({ success: true, message: r.data.message });
    } catch(e) { setResult({ success: false, message: e.response?.data?.message || "Error" }); }
    setLoading(false);
  };

  const handlePromote = async () => {
    if (!fromClass || !fromSection || !toClass || !toSection) return alert("Sab fields fill karo");
    if (!window.confirm(`${countStudents(fromClass, fromSection)} students ko ${fromClass}-${fromSection} se ${toClass}-${toSection} promote karein?`)) return;
    setLoading(true);
    try {
      const r = await axios.post(`${API}/bulk/promote`, { fromClass, fromSection, toClass, toSection }, auth());
      setResult({ success: true, message: r.data.message });
    } catch(e) { setResult({ success: false, message: e.response?.data?.message || "Error" }); }
    setLoading(false);
  };

  const handleFeeReminder = async () => {
    setLoading(true);
    try {
      const r = await axios.post(`${API}/bulk/fee-reminder`, {}, auth());
      setFeeStudents(r.data.data || []);
      setResult({ success: true, message: r.data.message });
    } catch(e) { setResult({ success: false, message: e.response?.data?.message || "Error" }); }
    setLoading(false);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => obj[h] = vals[i] || "");
        return obj;
      });
      setCsvData(rows);
      setCsvPreview(rows.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleCSVSubmit = async () => {
    if (!csvData?.length) return alert("CSV file select karo pehle");
    setLoading(true);
    try {
      const endpoint = csvTab === "students" ? "upload/students" : "upload/teachers";
      const key = csvTab === "students" ? "students" : "teachers";
      const r = await axios.post(`${API}/bulk/${endpoint}`, { [key]: csvData }, auth());
      const d = r.data.data;
      setResult({ success: true, message: `${d.success} records uploaded, ${d.failed} failed`, errors: d.errors });
    } catch(e) { setResult({ success: false, message: e.response?.data?.message || "Error" }); }
    setLoading(false);
  };

  const card = (children) => (
    <div style={{ background:"white", borderRadius:20, padding:24, boxShadow:"0 4px 24px rgba(15,23,42,0.08)", border:"1px solid rgba(226,232,240,0.8)" }}>
      {children}
    </div>
  );

  const label = (text) => <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{text}</div>;

  const select = (value, onChange, options, placeholder) => (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer" }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const btn = (text, onClick, color="#6366F1") => (
    <button onClick={onClick} disabled={loading} style={{ padding:"11px 28px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${color},${color}DD)`, color:"white", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:`0 4px 16px ${color}44`, opacity: loading ? 0.7 : 1 }}>
      {loading ? "Processing..." : text}
    </button>
  );

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, color:"#0F172A", letterSpacing:"-0.3px" }}>Bulk Operations</div>
        <div style={{ fontSize:12, color:"#94A3B8", marginTop:3 }}>Perform mass actions across students and staff</div>
      </div>

      <ResultBanner result={result} onClose={() => setResult(null)} />

      <div style={{ display:"flex", gap:6, background:"white", borderRadius:14, padding:5, border:"1px solid #E2E8F0", width:"fit-content", marginBottom:24, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", flexWrap:"wrap" }}>
        {[
          { key:"attendance", icon:"📋", label:"Bulk Attendance" },
          { key:"promote",    icon:"🎓", label:"Promote Students" },
          { key:"fee",        icon:"💰", label:"Fee Reminder" },
          { key:"csv",        icon:"📂", label:"CSV Upload" },
        ].map(t => <Tab key={t.key} label={t.label} icon={t.icon} active={tab===t.key} onClick={() => { setTab(t.key); setResult(null); }} />)}
      </div>

      {tab === "attendance" && card(
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}>📋 Bulk Attendance Mark</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12 }}>
            <div>{label("CLASS")}{select(attClass, v => { setAttClass(v); setAttSection(""); }, classes, "Select Class")}</div>
            <div>{label("SECTION")}{select(attSection, setAttSection, sections(attClass), "All Sections")}</div>
            <div>{label("DATE")}<input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", boxSizing:"border-box" }} /></div>
            <div>{label("STATUS")}{select(attStatus, setAttStatus, ["Present","Absent","Late"], "Status")}</div>
          </div>
          {attClass && (
            <div style={{ padding:"12px 16px", borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE" }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#6366F1" }}>
                {countStudents(attClass, attSection)} students will be marked <b>{attStatus}</b>
                {attSection ? ` in Class ${attClass}-${attSection}` : ` in all sections of Class ${attClass}`} on {attDate}
              </span>
            </div>
          )}
          {btn("Mark Attendance", handleAttendance)}
        </div>
      )}

      {tab === "promote" && card(
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}>🎓 Promote Students</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto 1fr 1fr", gap:12, alignItems:"end" }}>
            <div>{label("FROM CLASS")}{select(fromClass, v => { setFromClass(v); setFromSection(""); }, classes, "From Class")}</div>
            <div>{label("FROM SECTION")}{select(fromSection, setFromSection, sections(fromClass), "Section")}</div>
            <div style={{ display:"flex", alignItems:"center", paddingBottom:4, fontSize:22 }}>→</div>
            <div>{label("TO CLASS")}<input value={toClass} onChange={e => setToClass(e.target.value)} placeholder="e.g. 9" style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", boxSizing:"border-box" }} /></div>
            <div>{label("TO SECTION")}<input value={toSection} onChange={e => setToSection(e.target.value)} placeholder="e.g. A" style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", boxSizing:"border-box" }} /></div>
          </div>
          {fromClass && fromSection && (
            <div style={{ padding:"12px 16px", borderRadius:12, background:"#FFF7ED", border:"1px solid #FED7AA" }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#EA580C" }}>
                ⚠️ {countStudents(fromClass, fromSection)} students will be moved from Class {fromClass}-{fromSection} to {toClass||"?"}-{toSection||"?"}
              </span>
            </div>
          )}
          {btn("Promote Students", handlePromote, "#F59E0B")}
        </div>
      )}

      {tab === "fee" && card(
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}>💰 Fee Reminder</div>
          <div style={{ fontSize:13, color:"#64748B", lineHeight:1.6 }}>
            Fetch all students with pending or partial fee status. You can then download the list or send reminders via SMS/Email (integration coming soon).
          </div>
          {btn("Fetch Pending Students", handleFeeReminder, "#EF4444")}
          {feeStudents.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", marginBottom:8 }}>{feeStudents.length} STUDENTS WITH PENDING FEES</div>
              <div style={{ maxHeight:300, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
                {feeStudents.map((s,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FECACA" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{s.name}</div>
                      <div style={{ fontSize:11, color:"#94A3B8" }}>{s.phone || s.parentPhone}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background:"#FEE2E2", color:"#DC2626" }}>{s.feeStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "csv" && card(
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}>📂 CSV Bulk Upload</div>
          <div style={{ display:"flex", gap:6, background:"#F8FAFC", borderRadius:10, padding:4, width:"fit-content" }}>
            {["students","teachers"].map(t => (
              <button key={t} onClick={() => { setCsvTab(t); setCsvData(null); setCsvPreview([]); setCsvFileName(""); }}
                style={{ padding:"7px 20px", borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", background: csvTab===t ? "white" : "transparent", color: csvTab===t ? "#6366F1" : "#94A3B8", boxShadow: csvTab===t ? "0 2px 8px rgba(0,0,0,0.06)" : "none" }}>
                {t === "students" ? "🎒 Students" : "👩‍🏫 Teachers"}
              </button>
            ))}
          </div>

          <div style={{ padding:16, borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748B", marginBottom:8 }}>REQUIRED CSV COLUMNS:</div>
            <div style={{ fontSize:12, color:"#94A3B8", fontFamily:"monospace", lineHeight:2 }}>
              {csvTab === "students"
                ? "name, email, rollNumber, class, section, phone, gender, parentName, parentPhone"
                : "name, email, employeeId, phone, subjects, qualification, experience"}
            </div>
          </div>

          <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:"32px 20px", borderRadius:14, border:"2px dashed #C7D2FE", background:"#EEF2FF", cursor:"pointer" }}>
            <span style={{ fontSize:32 }}>📁</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#6366F1" }}>{csvFileName || "Click to select CSV file"}</span>
            <span style={{ fontSize:11, color:"#94A3B8" }}>Only .csv files supported</span>
            <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display:"none" }} />
          </label>

          {csvPreview.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", marginBottom:8 }}>PREVIEW (first 5 rows) — {csvData.length} total rows</div>
              <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid #E2E8F0" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:"#F8FAFC" }}>
                      {Object.keys(csvPreview[0]).map(h => <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:"#64748B", borderBottom:"1px solid #E2E8F0" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row,i) => (
                      <tr key={i} style={{ borderBottom:"1px solid #F1F5F9" }}>
                        {Object.values(row).map((v,j) => <td key={j} style={{ padding:"8px 12px", color:"#0F172A" }}>{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {csvData && btn(`Upload ${csvData.length} ${csvTab}`, handleCSVSubmit, "#10B981")}
        </div>
      )}
    </div>
  );
}

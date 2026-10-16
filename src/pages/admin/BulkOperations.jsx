import { useState, useEffect } from "react";
import axios from "axios";
import { toast, confirmAction, errorMessage } from "../../utils/toast";
import { todayLocal } from "../../utils/dates";

import Glyph from "../../components/Glyph";
import PageHeader from "../../components/ui/PageHeader";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";

const FIELDS = Object.fromEntries(["attClass", "attDate", "fromClass", "fromSection", "toClass", "toSection"].map((k) => [k, `bulk-${k}`]));
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Tab({ label, icon, active, onClick }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} style={{ display:"flex", flexShrink:0, alignItems:"center", gap:8, padding:"8px 16px", borderRadius:9, border:"none", cursor:"pointer", fontWeight:650, fontSize:13, whiteSpace:"nowrap", transition:"all 0.2s", background: active ? "var(--ea-surface)" : "transparent", color: active ? "var(--ea-ink)" : "var(--ea-body)", boxShadow: active ? "var(--ea-shadow)" : "none" }}>
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
        <div style={{ fontWeight:700, fontSize:14, color: ok?"#15803D":"#DC2626" }}>{ok?<Glyph e="✅" />:<Glyph e="❌" />} {result.message}</div>
        {result.errors?.length > 0 && <div style={{ fontSize:12, color:"var(--ea-muted)", marginTop:4 }}>{result.errors.length} errors — check console</div>}
      </div>
      <button type="button" aria-label="Close" onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", fontSize:18, color:"var(--ea-muted)" }}><Glyph e="×" /></button>
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
  const [attDate, setAttDate] = useState(todayLocal());
  const [attStatus, setAttStatus] = useState("Present");

  // Promote state
  const [fromClass, setFromClass] = useState("");
  const [fromSection, setFromSection] = useState("");
  const [toClass, setToClass] = useState("");
  const [toSection, setToSection] = useState("");
  const fe = useFieldErrors(FIELDS);
  const err = (key) => <FieldError id={`bulk-${key}-error`}>{fe.errors[key]}</FieldError>;

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
    if (!fe.check({ attClass: !attClass && "Choose the class", attDate: !attDate && "Choose the date" })) return;
    setLoading(true);
    try {
      const r = await axios.post(`${API}/bulk/attendance`, { className: attClass, section: attSection, date: attDate, status: attStatus }, auth());
      setResult({ success: true, message: r.data.message });
    } catch(e) { setResult({ success: false, message: errorMessage(e, "Could not mark the attendance") }); }
    setLoading(false);
  };

  const handlePromote = async () => {
    if (!fe.check({
      fromClass: !fromClass && "Choose the class to move from",
      fromSection: !fromSection && "Choose the section",
      toClass: !toClass.trim() && "Enter the class to move to",
      toSection: !toSection.trim() && "Enter the section to move to",
    })) return;
    if (!(await confirmAction(`${countStudents(fromClass, fromSection)} student(s) will be moved from ${fromClass}-${fromSection} to ${toClass}-${toSection}. Continue?`, { confirmLabel: 'Promote', danger: false }))) return;
    setLoading(true);
    try {
      const r = await axios.post(`${API}/bulk/promote`, { fromClass, fromSection, toClass, toSection }, auth());
      setResult({ success: true, message: r.data.message });
    } catch(e) { setResult({ success: false, message: errorMessage(e, "Could not promote the students") }); }
    setLoading(false);
  };

  const handleFeeReminder = async () => {
    setLoading(true);
    try {
      const r = await axios.post(`${API}/bulk/fee-reminder`, {}, auth());
      setFeeStudents(r.data.data || []);
      setResult({ success: true, message: r.data.message });
    } catch(e) { setResult({ success: false, message: errorMessage(e, "Could not load the students with pending fees") }); }
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

  // New accounts get temporary passwords; they are downloaded once as a CSV for the admin to distribute.
  const downloadCredentials = (list, kind) => {
    const rows = [["Role", "School code", "Login ID", "Email", "Temporary password"]];
    const row = (role, c) => [role, c.schoolCode || "", c.loginId || c.email || "", c.email || "", c.password];
    list.forEach((c) => {
      if (c?.student) rows.push(row("Student", c.student));
      if (c?.parent) rows.push(row("Parent", c.parent));
      if (c?.email && c?.password) rows.push(row("Teacher", c));
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kind}-login-details-${todayLocal()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info("Login details downloaded. Share them securely and delete the file afterwards.");
  };

  const handleCSVSubmit = async () => {
    if (!csvData?.length) return toast.error("Please select a CSV file first");
    setLoading(true);
    try {
      const endpoint = csvTab === "students" ? "upload/students" : "upload/teachers";
      const key = csvTab === "students" ? "students" : "teachers";
      const r = await axios.post(`${API}/bulk/${endpoint}`, { [key]: csvData }, auth());
      const d = r.data.data;
      setResult({ success: true, message: `${d.success} records uploaded, ${d.failed} failed`, errors: d.errors });
      if (d.credentials?.length) downloadCredentials(d.credentials, key);
    } catch(e) { setResult({ success: false, message: errorMessage(e, "Could not upload the file") }); }
    setLoading(false);
  };

  const card = (children) => (
    <div style={{ background:"white", borderRadius:20, padding:24, boxShadow:"0 4px 24px rgba(15,23,42,0.08)", border:"1px solid rgba(226,232,240,0.8)" }}>
      {children}
    </div>
  );

  // A field is a <label> wrapping this caption and its control, so the control takes the caption as its name.
  const label = (text) => <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>{text}</span>;
  const fieldStyle = { display:"block" };

  // `key`: the field's name for its message under it (and its id, "bulk-<key>").
  const select = (value, onChange, options, placeholder, key) => (
    <select id={key ? `bulk-${key}` : undefined} value={value} onChange={e => { onChange(e.target.value); if (key) fe.clear(key); }} {...(key ? fe.invalid(key) : {})} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer" }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const btn = (text, onClick) => (
    <button type="button" onClick={onClick} disabled={loading} className="ea-btn ea-btn--primary">
      {loading ? "Processing..." : text}
    </button>
  );

  return (
    <div style={{ fontFamily: "inherit" }}>
      <div style={{ marginBottom:24 }}>
        <PageHeader title="Bulk Operations" subtitle="Perform mass actions across students and staff" />
      </div>

      <ResultBanner result={result} onClose={() => setResult(null)} />

      <div style={{ display:"flex", flexWrap:"nowrap", gap:4, background:"var(--ea-hover)", borderRadius:12, padding:4, border:"1px solid var(--ea-line)", width:"fit-content", maxWidth:"100%", marginBottom:24, overflowX:"auto", scrollbarWidth:"none" }}>
        {[
          { key:"attendance", icon:<Glyph e="📋" />, label:"Bulk Attendance" },
          { key:"promote",    icon:<Glyph e="🎓" />, label:"Promote Students" },
          { key:"fee",        icon:<Glyph e="💰" />, label:"Fee Reminder" },
          { key:"csv",        icon:<Glyph e="📂" />, label:"CSV Upload" },
        ].map(t => <Tab key={t.key} label={t.label} icon={t.icon} active={tab===t.key} onClick={() => { setTab(t.key); setResult(null); }} />)}
      </div>

      {tab === "attendance" && card(
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}><Glyph e="📋" /> Bulk Attendance Mark</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12 }}>
            <label style={fieldStyle}>{label("CLASS")}{select(attClass, v => { setAttClass(v); setAttSection(""); }, classes, "Select Class", "attClass")}{err("attClass")}</label>
            <label style={fieldStyle}>{label("SECTION")}{select(attSection, setAttSection, sections(attClass), "All Sections")}</label>
            <label style={fieldStyle}>{label("DATE")}<input id="bulk-attDate" type="date" value={attDate} onChange={e => { setAttDate(e.target.value); fe.clear("attDate"); }} {...fe.invalid("attDate")} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", boxSizing:"border-box" }} />{err("attDate")}</label>
            <label style={fieldStyle}>{label("STATUS")}{select(attStatus, setAttStatus, ["Present","Absent","Late"], "Status")}</label>
          </div>
          {attClass && (
            <div style={{ padding:"12px 16px", borderRadius:12, background:"var(--brand-soft)", border:"1px solid var(--brand-border)" }}>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--brand)" }}>
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
          <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}><Glyph e="🎓" /> Promote Students</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto 1fr 1fr", gap:12, alignItems:"end" }}>
            <label style={fieldStyle}>{label("FROM CLASS")}{select(fromClass, v => { setFromClass(v); setFromSection(""); }, classes, "From Class", "fromClass")}{err("fromClass")}</label>
            <label style={fieldStyle}>{label("FROM SECTION")}{select(fromSection, setFromSection, sections(fromClass), "Section", "fromSection")}{err("fromSection")}</label>
            <div aria-hidden="true" style={{ display:"flex", alignItems:"center", paddingBottom:4, fontSize:22 }}>→</div>
            <label style={fieldStyle}>{label("TO CLASS")}<input id="bulk-toClass" value={toClass} onChange={e => { setToClass(e.target.value); fe.clear("toClass"); }} {...fe.invalid("toClass")} placeholder="e.g. 9" style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", boxSizing:"border-box" }} />{err("toClass")}</label>
            <label style={fieldStyle}>{label("TO SECTION")}<input id="bulk-toSection" value={toSection} onChange={e => { setToSection(e.target.value); fe.clear("toSection"); }} {...fe.invalid("toSection")} placeholder="e.g. A" style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", boxSizing:"border-box" }} />{err("toSection")}</label>
          </div>
          {fromClass && fromSection && (
            <div style={{ padding:"12px 16px", borderRadius:12, background:"#FFF7ED", border:"1px solid #FED7AA" }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#EA580C" }}>
                <Glyph e="⚠" /> {countStudents(fromClass, fromSection)} students will be moved from Class {fromClass}-{fromSection} to {toClass||"?"}-{toSection||"?"}
              </span>
            </div>
          )}
          {btn("Promote Students", handlePromote, "#F59E0B")}
        </div>
      )}

      {tab === "fee" && card(
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}><Glyph e="💰" /> Fee Reminder</div>
          <div style={{ fontSize:13, color:"#64748B", lineHeight:1.6 }}>
            Lists every student whose fee is pending or partly paid, with the parent's phone and email, so the office can follow up.
          </div>
          {btn("Fetch Pending Students", handleFeeReminder, "#EF4444")}
          {feeStudents.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--ea-muted)", marginBottom:8 }}>{feeStudents.length} students with pending fees</div>
              <div style={{ maxHeight:300, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
                {feeStudents.map((s,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FECACA" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{s.name}</div>
                      <div style={{ fontSize:11, color:"var(--ea-muted)" }}>{s.phone || s.parentPhone}</div>
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
          <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}><Glyph e="📂" /> CSV Bulk Upload</div>
          <div style={{ display:"flex", gap:6, background:"#F8FAFC", borderRadius:10, padding:4, width:"fit-content" }}>
            {["students","teachers"].map(t => (
              <button key={t} onClick={() => { setCsvTab(t); setCsvData(null); setCsvPreview([]); setCsvFileName(""); }}
                style={{ padding:"7px 20px", borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", background: csvTab===t ? "white" : "transparent", color: csvTab===t ? "var(--brand)" : "var(--ea-muted)", boxShadow: csvTab===t ? "0 2px 8px rgba(0,0,0,0.06)" : "none" }}>
                {t === "students" ? "Students" : "Teachers"}
              </button>
            ))}
          </div>

          <div style={{ padding:16, borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748B", marginBottom:8 }}>REQUIRED CSV COLUMNS:</div>
            <div style={{ fontSize:12, color:"var(--ea-muted)", fontFamily:"monospace", lineHeight:2 }}>
              {csvTab === "students"
                ? "name, email, rollNumber, class, section, phone, gender, parentName, parentPhone"
                : "name, email, employeeId, phone, subjects, qualification, experience"}
            </div>
            {csvTab === "students" && (
              <div style={{ fontSize:12, color:"#64748B", marginTop:6, lineHeight:1.6 }}>
                Optional: <span style={{ fontFamily:"monospace" }}>admissionDate</span> (YYYY-MM-DD), the real date of admission. Leave it out when not known; it is never filled in automatically.
              </div>
            )}
          </div>

          <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:"32px 20px", borderRadius:14, border:"2px dashed var(--brand-border)", background:"var(--brand-soft)", cursor:"pointer" }}>
            <span style={{ fontSize:32 }}><Glyph e="📁" /></span>
            <span style={{ fontSize:13, fontWeight:700, color:"var(--brand)" }}>{csvFileName || "Click to select CSV file"}</span>
            <span style={{ fontSize:11, color:"var(--ea-muted)" }}>Only .csv files supported</span>
            <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display:"none" }} />
          </label>

          {csvPreview.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--ea-muted)", marginBottom:8 }}>PREVIEW (first 5 rows) — {csvData.length} total rows</div>
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

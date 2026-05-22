// src/pages/parent/Result.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RESULTS = [
  { subject: "Mathematics",  marks: 92, total: 100, grade: "A+", teacher: "Mr. Sharma" },
  { subject: "Physics",      marks: 88, total: 100, grade: "A",  teacher: "Ms. Verma" },
  { subject: "Chemistry",    marks: 85, total: 100, grade: "A",  teacher: "Mr. Joshi" },
  { subject: "English",      marks: 90, total: 100, grade: "A+", teacher: "Mrs. Gupta" },
  { subject: "Hindi",        marks: 82, total: 100, grade: "B+", teacher: "Mr. Sharma" },
  { subject: "Computer Sc.", marks: 95, total: 100, grade: "A+", teacher: "Ms. Priya" },
];

export default function ParentResult() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const total = RESULTS.reduce((s, r) => s + r.marks, 0);
  const max   = RESULTS.reduce((s, r) => s + r.total, 0);
  const pct   = Math.round((total / max) * 100);

  return (
    <div style={{ minHeight:"100vh", background:"#F4F6FB", fontFamily:"'Poppins',sans-serif", paddingBottom:40 }}>
      <div style={{ background:"linear-gradient(135deg,#4f46e5,#7c3aed)", padding:"48px 20px 32px", color:"white" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button onClick={() => navigate(-1)} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"8px 12px", color:"white", cursor:"pointer", fontSize:16 }}>←</button>
          <div>
            <div style={{ fontWeight:800, fontSize:18 }}>📊 Results</div>
            <div style={{ fontSize:12, opacity:0.8 }}>{user?.childName||"Rahul Kumar"} • Term 2</div>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:20, padding:20, backdropFilter:"blur(10px)", textAlign:"center" }}>
          <div style={{ fontSize:48, fontWeight:900 }}>{pct}%</div>
          <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>{total}/{max} marks • Grade A+</div>
          <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:16 }}>
            {[{ label:"Rank", val:"4th" }, { label:"Subjects", val:RESULTS.length }, { label:"Grade", val:"A+" }].map(s => (
              <div key={s.label} style={{ background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 20px", textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:800 }}>{s.val}</div>
                <div style={{ fontSize:10, opacity:0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding:"16px", marginTop:"-16px", display:"flex", flexDirection:"column", gap:12 }}>
        {RESULTS.map((r, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"14px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:14, background: r.grade==="A+"?"#dcfce7": r.grade==="A"?"#dbeafe":"#fef9c3", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color: r.grade==="A+"?"#16a34a": r.grade==="A"?"#1d4ed8":"#ca8a04", flexShrink:0 }}>
              {r.grade}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#1C2033" }}>{r.subject}</div>
              <div style={{ fontSize:11, color:"#7B8099", marginTop:2 }}>{r.teacher}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:800, fontSize:16, color:"#1C2033" }}>{r.marks}<span style={{ fontSize:11, color:"#999" }}>/{r.total}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
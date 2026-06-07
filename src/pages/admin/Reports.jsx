import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const fmt = (n) => n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n}`;
const pct = (a, b) => b > 0 ? Math.round((a/b)*100) : 0;

function StatCard({ label, value, icon, border, bg, sub, delay=0 }) {
  return (
    <div style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${border}`, animation:`fadeUp 0.5s ease ${delay}s both` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{label}</div>
          <div style={{ fontSize:26, fontWeight:900, color:"#0F172A" }}>{value}</div>
          {sub && <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{sub}</div>}
        </div>
        <div style={{ width:44, height:44, borderRadius:12, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{icon}</div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color, bg }) {
  const p = pct(value, total);
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:800, color }}>{value} <span style={{ fontSize:11, color:"#94A3B8", fontWeight:500 }}>({p}%)</span></span>
      </div>
      <div style={{ height:8, borderRadius:8, background:"#F1F5F9", overflow:"hidden" }}>
        <div style={{ width:`${p}%`, height:"100%", borderRadius:8, background:color, transition:"width 1s ease" }} />
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children, delay=0 }) {
  return (
    <div style={{ background:"white", borderRadius:20, padding:"24px 28px", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", animation:`fadeUp 0.5s ease ${delay}s both` }}>
      <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:20 }}>{icon}</span>{title}
      </div>
      {children}
    </div>
  );
}

export default function Reports() {
  const [overview, setOverview] = useState({ students:0, teachers:0, parents:0, buses:0, books:0 });
  const [fees, setFees]         = useState({ total:0, paid:0, pending:0, count:0, paidCount:0 });
  const [attendance, setAtt]    = useState({ present:0, absent:0, total:0 });
  const [leaves, setLeaves]     = useState({ pending:0, approved:0, rejected:0, total:0 });
  const [salary, setSalary]     = useState({ paid:0, pending:0, totalAmt:0, paidAmt:0 });
  const [marks, setMarks]       = useState({ total:0, passed:0, avgScore:0 });
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stuRes, tchRes, parRes, busRes, feeRes, attRes, leaveRes, salRes, markRes, libRes] = await Promise.allSettled([
        axios.get(`${API}/students`, auth()),
        axios.get(`${API}/teachers`, auth()),
        axios.get(`${API}/parents`, auth()),
        axios.get(`${API}/transport`, auth()),
        axios.get(`${API}/fees`, auth()),
        axios.get(`${API}/attendance/report`, auth()),
        axios.get(`${API}/leaves`, auth()),
        axios.get(`${API}/hr/salaries`, auth()),
        axios.get(`${API}/marks`, auth()),
        axios.get(`${API}/library`, auth()),
      ]);

      setOverview({
        students: stuRes.value?.data?.data?.length || 0,
        teachers: tchRes.value?.data?.data?.length || 0,
        parents:  parRes.value?.data?.data?.length || 0,
        buses:    busRes.value?.data?.data?.length || 0,
        books:    libRes.value?.data?.count || 0,
      });

      const feeList = feeRes.value?.data?.data || [];
      const paidFees = feeList.filter(f => f.status === "Paid");
      const pendFees = feeList.filter(f => f.status !== "Paid");
      setFees({
        total:     feeList.reduce((s,f) => s+(f.amount||0), 0),
        paid:      paidFees.reduce((s,f) => s+(f.amount||0), 0),
        pending:   pendFees.reduce((s,f) => s+(f.amount||0), 0),
        count:     feeList.length,
        paidCount: paidFees.length,
      });

      const attData = attRes.value?.data?.data || [];
      const present = attData.filter(a => a.status === "Present").length;
      const absent  = attData.filter(a => a.status === "Absent").length;
      setAtt({ present, absent, total: attData.length });

      const leaveList = leaveRes.value?.data?.data || [];
      setLeaves({
        pending:  leaveList.filter(l => l.status === "Pending").length,
        approved: leaveList.filter(l => l.status === "Approved").length,
        rejected: leaveList.filter(l => l.status === "Rejected").length,
        total:    leaveList.length,
      });

      const salList = salRes.value?.data?.data || [];
      const paidSal = salList.filter(s => s.status === "Paid");
      const pendSal = salList.filter(s => s.status === "Pending");
      setSalary({
        paid:     paidSal.length,
        pending:  pendSal.length,
        totalAmt: salList.reduce((s,x) => s+(x.netSalary||0), 0),
        paidAmt:  paidSal.reduce((s,x) => s+(x.netSalary||0), 0),
      });

      const markList = markRes.value?.data?.data || [];
      const passed = markList.filter(m => (m.percentage||0) >= 33).length;
      const avgScore = markList.length > 0 ? Math.round(markList.reduce((s,m) => s+(m.percentage||0), 0) / markList.length) : 0;
      setMarks({ total: markList.length, passed, avgScore });

      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const collectionPct = pct(fees.paid, fees.total);

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1E3A8A,#3B82F6,#06B6D4)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:60, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>📊 Reports & Analytics</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>
              School-wide performance overview
              {lastUpdated && <span style={{ marginLeft:12, fontSize:11, background:"rgba(255,255,255,0.15)", padding:"2px 10px", borderRadius:20 }}>Updated {lastUpdated}</span>}
            </div>
          </div>
          <button onClick={fetchAll} disabled={loading}
            style={{ padding:"11px 22px", borderRadius:12, border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.15)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ display:"inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>🔄</span>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"STUDENTS",  value:overview.students, icon:"🎓", border:"#6366F1", bg:"#EEF2FF", sub:"Enrolled" },
          { label:"TEACHERS",  value:overview.teachers, icon:"👨‍🏫", border:"#10B981", bg:"#F0FDF4", sub:"Active Staff" },
          { label:"PARENTS",   value:overview.parents,  icon:"👨‍👩‍👧", border:"#F59E0B", bg:"#FFFBEB", sub:"Registered" },
          { label:"BUSES",     value:overview.buses,    icon:"🚌", border:"#EF4444", bg:"#FEF2F2", sub:"Fleet" },
          { label:"BOOKS",     value:overview.books,    icon:"📚", border:"#8B5CF6", bg:"#F5F3FF", sub:"In Library" },
        ].map((c,i) => <StatCard key={i} {...c} delay={i*0.06} />)}
      </div>

      {/* Row 1: Fee + Attendance */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>

        {/* Fee Analytics */}
        <SectionCard title="Fee Collection" icon="💰" delay={0.2}>
          {/* Big number */}
          <div style={{ display:"flex", gap:16, marginBottom:20 }}>
            {[
              { label:"Total Expected", value:fmt(fees.total),   color:"#0F172A", bg:"#F8FAFC" },
              { label:"Collected",      value:fmt(fees.paid),    color:"#15803D", bg:"#F0FDF4" },
              { label:"Pending",        value:fmt(fees.pending), color:"#DC2626", bg:"#FEF2F2" },
            ].map((f,i) => (
              <div key={i} style={{ flex:1, background:f.bg, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>{f.label}</div>
                <div style={{ fontSize:18, fontWeight:900, color:f.color }}>{f.value}</div>
              </div>
            ))}
          </div>
          {/* Progress */}
          <div style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Collection Progress</span>
              <span style={{ fontSize:13, fontWeight:800, color:"#15803D" }}>{collectionPct}%</span>
            </div>
            <div style={{ height:12, borderRadius:8, background:"#F1F5F9", overflow:"hidden" }}>
              <div style={{ width:`${collectionPct}%`, height:"100%", borderRadius:8, background:`linear-gradient(90deg,#10B981,#059669)`, transition:"width 1s ease" }} />
            </div>
          </div>
          <div style={{ fontSize:12, color:"#94A3B8", marginTop:8 }}>{fees.paidCount} of {fees.count} fee records paid</div>
        </SectionCard>

        {/* Attendance */}
        <SectionCard title="Attendance Overview" icon="📋" delay={0.25}>
          <div style={{ display:"flex", gap:16, marginBottom:20 }}>
            {[
              { label:"Total Records", value:attendance.total,   color:"#0F172A", bg:"#F8FAFC" },
              { label:"Present",       value:attendance.present, color:"#15803D", bg:"#F0FDF4" },
              { label:"Absent",        value:attendance.absent,  color:"#DC2626", bg:"#FEF2F2" },
            ].map((a,i) => (
              <div key={i} style={{ flex:1, background:a.bg, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>{a.label}</div>
                <div style={{ fontSize:18, fontWeight:900, color:a.color }}>{a.value}</div>
              </div>
            ))}
          </div>
          <ProgressBar label="Present Rate" value={attendance.present} total={attendance.total} color="#10B981" />
          <ProgressBar label="Absent Rate"  value={attendance.absent}  total={attendance.total} color="#EF4444" />
        </SectionCard>
      </div>

      {/* Row 2: Salary + Leaves + Marks */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:20 }}>

        {/* Salary */}
        <SectionCard title="Salary Overview" icon="💵" delay={0.3}>
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            {[
              { label:"Paid",    value:salary.paid,    color:"#15803D", bg:"#F0FDF4" },
              { label:"Pending", value:salary.pending, color:"#D97706", bg:"#FFFBEB" },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, background:s.bg, borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:"#94A3B8" }}>teachers</div>
              </div>
            ))}
          </div>
          <div style={{ background:"#F8FAFC", borderRadius:12, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, fontWeight:600, color:"#64748B" }}>Total Payroll</span>
            <span style={{ fontSize:16, fontWeight:900, color:"#059669" }}>{fmt(salary.totalAmt)}</span>
          </div>
          <ProgressBar label="Paid" value={salary.paid} total={salary.paid+salary.pending} color="#10B981" />
        </SectionCard>

        {/* Leaves */}
        <SectionCard title="Leave Requests" icon="📅" delay={0.35}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Pending",  value:leaves.pending,  color:"#D97706", bg:"#FFFBEB", dot:"#F59E0B" },
              { label:"Approved", value:leaves.approved, color:"#15803D", bg:"#F0FDF4", dot:"#22C55E" },
              { label:"Rejected", value:leaves.rejected, color:"#DC2626", bg:"#FEF2F2", dot:"#EF4444" },
            ].map((l,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:l.bg, borderRadius:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:l.dot }} />
                  <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{l.label}</span>
                </div>
                <span style={{ fontSize:16, fontWeight:900, color:l.color }}>{l.value}</span>
              </div>
            ))}
            <div style={{ fontSize:12, color:"#94A3B8", textAlign:"center", marginTop:4 }}>Total {leaves.total} requests</div>
          </div>
        </SectionCard>

        {/* Marks/Results */}
        <SectionCard title="Exam Results" icon="📝" delay={0.4}>
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            {[
              { label:"Total Records", value:marks.total,   color:"#0F172A", bg:"#F8FAFC" },
              { label:"Passed",        value:marks.passed,  color:"#15803D", bg:"#F0FDF4" },
            ].map((m,i) => (
              <div key={i} style={{ flex:1, background:m.bg, borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:4 }}>{m.label}</div>
                <div style={{ fontSize:20, fontWeight:900, color:m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)", borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:4 }}>AVERAGE SCORE</div>
            <div style={{ fontSize:32, fontWeight:900, color:"#6366F1" }}>{marks.avgScore}%</div>
          </div>
          <ProgressBar label="Pass Rate" value={marks.passed} total={marks.total} color="#6366F1" />
        </SectionCard>
      </div>

      {/* Quick Stats Row */}
      <div style={{ background:"white", borderRadius:20, padding:"20px 28px", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", animation:"fadeUp 0.5s ease 0.45s both" }}>
        <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
          <span>⚡</span> Quick Snapshot
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
          {[
            { label:"Students/Teacher", value: overview.teachers > 0 ? (overview.students/overview.teachers).toFixed(1) : "—", icon:"📊" },
            { label:"Bus Capacity Used", value: `${pct(overview.students, overview.buses*40)}%`, icon:"🚌" },
            { label:"Fee Collection",   value: `${collectionPct}%`, icon:"💰" },
            { label:"Attendance Rate",  value: `${pct(attendance.present, attendance.total)}%`, icon:"✅" },
            { label:"Pass Rate",        value: `${pct(marks.passed, marks.total)}%`, icon:"��" },
            { label:"Leave Approval",   value: `${pct(leaves.approved, leaves.total)}%`, icon:"📅" },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:"center", padding:"14px 10px", background:"#F8FAFC", borderRadius:12 }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:17, fontWeight:900, color:"#0F172A" }}>{s.value}</div>
              <div style={{ fontSize:10, color:"#94A3B8", fontWeight:600, marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

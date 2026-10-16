import { useState, useEffect, useCallback } from "react";
import axios from "axios";

import { RefreshCw } from "lucide-react";
import Glyph from "../../components/Glyph";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard as SharedStat, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const fmt = (n) => n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n}`;
const pct = (a, b) => b > 0 ? Math.round((a/b)*100) : 0;

// The shared stat card; the border colour this screen passes becomes the card's status tone.
const StatCard = ({ label, value, icon, border, sub }) => <SharedStat label={label} value={value} icon={icon} sub={sub} tone={toneOf(border)} />;

function ProgressBar({ label, value, total, color, bg }) {
  const p = pct(value, total);
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:800, color }}>{value} <span style={{ fontSize:11, color:"var(--ea-muted)", fontWeight:500 }}>({p}%)</span></span>
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
        axios.get(`${API}/exams/results`, auth()),
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
      const totalBilled = feeList.reduce((s,f) => s+(f.amount||0), 0);
      const totalPaid   = feeList.reduce((s,f) => s+(f.paidAmount||0), 0);
      setFees({
        total:     totalBilled,
        paid:      totalPaid,
        pending:   totalBilled - totalPaid,
        count:     feeList.length,
        paidCount: paidFees.length,
      });

      // Class-wise rows: { present, late, absent, total, ... }
      const attRows = attRes.value?.data?.data || [];
      const present = attRows.reduce((s, r) => s + (r.present || 0) + (r.late || 0), 0);
      const absent  = attRows.reduce((s, r) => s + (r.absent || 0), 0);
      setAtt({ present, absent, total: attRows.reduce((s, r) => s + (r.total || 0), 0) });

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
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Reports & Analytics"
          subtitle={`School-wide performance overview${lastUpdated ? ` · Updated ${lastUpdated}` : ""}`}
          actions={<button type="button" className="ea-btn ea-btn--ghost" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Loading..." : "Refresh"}
          </button>} />
      </div>

      {/* Overview Cards */}
      <StatGrid label="School overview" style={{ marginBottom:24 }}>
        {[
          { label:"STUDENTS",  value:overview.students, icon:<Glyph e="🎓" />, border:"var(--brand)", sub:"Enrolled" },
          { label:"TEACHERS",  value:overview.teachers, icon:<Glyph e="👨‍🏫" />, border:"var(--brand)", sub:"Active Staff" },
          { label:"PARENTS",   value:overview.parents,  icon:<Glyph e="👨‍👩‍👧" />, border:"var(--brand)", sub:"Registered" },
          { label:"BUSES",     value:overview.buses,    icon:<Glyph e="🚌" />, border:"var(--brand)", sub:"Fleet" },
          { label:"BOOKS",     value:overview.books,    icon:<Glyph e="📚" />, border:"var(--brand)", sub:"In Library" },
        ].map((c) => <StatCard key={c.label} {...c} />)}
      </StatGrid>

      {/* Row 1: Fee + Attendance */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>

        {/* Fee Analytics */}
        <SectionCard title="Fee Collection" icon={<Glyph e="💰" />} delay={0.2}>
          {/* Big number */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginBottom:20 }}>
            {[
              { label:"Total Expected", value:fmt(fees.total),   color:"#0F172A", bg:"#F8FAFC" },
              { label:"Collected",      value:fmt(fees.paid),    color:"#15803D", bg:"#F0FDF4" },
              { label:"Pending",        value:fmt(fees.pending), color:"#B91C1C", bg:"#FEF2F2" },
            ].map((f,i) => (
              <div key={i} style={{ flex:"1 1 96px", minWidth:0, background:f.bg, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6 }}>{f.label}</div>
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
              <div style={{ width:`${collectionPct}%`, height:"100%", borderRadius:8, background:"var(--ea-success)", transition:"width 1s ease" }} />
            </div>
          </div>
          <div style={{ fontSize:12, color:"var(--ea-muted)", marginTop:8 }}>{fees.paidCount} of {fees.count} fee records paid</div>
        </SectionCard>

        {/* Attendance */}
        <SectionCard title="Attendance Overview" icon={<Glyph e="📋" />} delay={0.25}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginBottom:20 }}>
            {[
              { label:"Total Records", value:attendance.total,   color:"#0F172A", bg:"#F8FAFC" },
              { label:"Present",       value:attendance.present, color:"#15803D", bg:"#F0FDF4" },
              { label:"Absent",        value:attendance.absent,  color:"#B91C1C", bg:"#FEF2F2" },
            ].map((a,i) => (
              <div key={i} style={{ flex:"1 1 96px", minWidth:0, background:a.bg, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6 }}>{a.label}</div>
                <div style={{ fontSize:18, fontWeight:900, color:a.color }}>{a.value}</div>
              </div>
            ))}
          </div>
          <ProgressBar label="Present Rate" value={attendance.present} total={attendance.total} color="var(--ea-on-card-success)" />
          <ProgressBar label="Absent Rate"  value={attendance.absent}  total={attendance.total} color="var(--ea-on-card-danger)" />
        </SectionCard>
      </div>

      {/* Row 2: Salary + Leaves + Marks */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:20 }}>

        {/* Salary */}
        <SectionCard title="Salary Overview" icon={<Glyph e="💵" />} delay={0.3}>
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            {[
              { label:"Paid",    value:salary.paid,    color:"#15803D", bg:"#F0FDF4" },
              { label:"Pending", value:salary.pending, color:"var(--ea-on-card-warning)", bg:"#FFFBEB" },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, background:s.bg, borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:"var(--ea-muted)" }}>teachers</div>
              </div>
            ))}
          </div>
          <div style={{ background:"#F8FAFC", borderRadius:12, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, fontWeight:600, color:"#56657A" }}>Total Payroll</span>
            <span style={{ fontSize:16, fontWeight:900, color:"#047857" }}>{fmt(salary.totalAmt)}</span>
          </div>
          <ProgressBar label="Paid" value={salary.paid} total={salary.paid+salary.pending} color="var(--ea-on-card-success)" />
        </SectionCard>

        {/* Leaves */}
        <SectionCard title="Leave Requests" icon={<Glyph e="📅" />} delay={0.35}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Pending",  value:leaves.pending,  color:"var(--ea-on-card-warning)", bg:"#FFFBEB", dot:"#F59E0B" },
              { label:"Approved", value:leaves.approved, color:"#15803D", bg:"#F0FDF4", dot:"#22C55E" },
              { label:"Rejected", value:leaves.rejected, color:"#B91C1C", bg:"#FEF2F2", dot:"#EF4444" },
            ].map((l,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:l.bg, borderRadius:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:l.dot }} />
                  <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{l.label}</span>
                </div>
                <span style={{ fontSize:16, fontWeight:900, color:l.color }}>{l.value}</span>
              </div>
            ))}
            <div style={{ fontSize:12, color:"var(--ea-muted)", textAlign:"center", marginTop:4 }}>Total {leaves.total} requests</div>
          </div>
        </SectionCard>

        {/* Marks/Results */}
        <SectionCard title="Exam Results" icon={<Glyph e="📝" />} delay={0.4}>
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            {[
              { label:"Total Records", value:marks.total,   color:"#0F172A", bg:"#F8FAFC" },
              { label:"Passed",        value:marks.passed,  color:"#15803D", bg:"#F0FDF4" },
            ].map((m,i) => (
              <div key={i} style={{ flex:1, background:m.bg, borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:4 }}>{m.label}</div>
                <div style={{ fontSize:20, fontWeight:900, color:m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"var(--brand-soft)", borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:4 }}>AVERAGE SCORE</div>
            <div style={{ fontSize:32, fontWeight:900, color:"var(--brand-dark)" }}>{marks.avgScore}%</div>
          </div>
          <ProgressBar label="Pass Rate" value={marks.passed} total={marks.total} color="var(--brand)" />
        </SectionCard>
      </div>

      {/* Quick Stats Row */}
      <div style={{ background:"white", borderRadius:20, padding:"20px 28px", boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid #E2E8F0", animation:"fadeUp 0.5s ease 0.45s both" }}>
        <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
          <span><Glyph e="⚡" /></span> Quick Snapshot
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
          {[
            { label:"Students/Teacher", value: overview.teachers > 0 ? (overview.students/overview.teachers).toFixed(1) : "—", icon:<Glyph e="📊" /> },
            { label:"Bus Capacity Used", value: `${pct(overview.students, overview.buses*40)}%`, icon:<Glyph e="🚌" /> },
            { label:"Fee Collection",   value: `${collectionPct}%`, icon:<Glyph e="💰" /> },
            { label:"Attendance Rate",  value: `${pct(attendance.present, attendance.total)}%`, icon:<Glyph e="✅" /> },
            { label:"Pass Rate",        value: `${pct(marks.passed, marks.total)}%`, icon:<Glyph e="🎯" /> },
            { label:"Leave Approval",   value: `${pct(leaves.approved, leaves.total)}%`, icon:<Glyph e="📅" /> },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:"center", padding:"14px 10px", background:"#F8FAFC", borderRadius:12 }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:17, fontWeight:900, color:"#0F172A" }}>{s.value}</div>
              <div style={{ fontSize:10, color:"var(--ea-muted)", fontWeight:600, marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

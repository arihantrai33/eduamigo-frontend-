import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const STATUS_CONFIG = {
  Paid:    { bg:"#F0FDF4", color:"#15803D", dot:"#22C55E", border:"#BBF7D0" },
  Pending: { bg:"#FFFBEB", color:"#D97706", dot:"#F59E0B", border:"#FDE68A" },
};

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", borderRadius:24, padding:32, width:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.25)", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:16, color:"#64748B" }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SalaryManagement() {
  const [salaries, setSalaries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editSalary, setEditSalary] = useState(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({ teacherId:"", month: new Date().getMonth()+1, year: new Date().getFullYear(), basicSalary:"", allowances:"0", deductions:"0", remarks:"" });
  const [genForm, setGenForm] = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear() });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.allSettled([
        axios.get(`${API}/hr/salaries`, auth()),
        axios.get(`${API}/teachers`, auth()),
      ]);
      setSalaries(sRes.status === "fulfilled" ? (sRes.value.data.data || []) : []);
      setTeachers(tRes.status === "fulfilled" ? (tRes.value.data.data || []) : []);
    } catch(e) {}
    setLoading(false);
  };

  const openAdd = () => {
    setEditSalary(null);
    setForm({ teacherId:"", month: new Date().getMonth()+1, year: new Date().getFullYear(), basicSalary:"", allowances:"0", deductions:"0", remarks:"" });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditSalary(s);
    setForm({ teacherId: s.teacher?._id || s.teacher, month: s.month, year: s.year, basicSalary: s.basicSalary, allowances: s.allowances, deductions: s.deductions, remarks: s.remarks || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.teacherId || !form.basicSalary) return alert("Teacher and basic salary required");
    setSaving(true);
    try {
      const payload = { teacher: form.teacherId, month: form.month, year: form.year, basicSalary: Number(form.basicSalary), allowances: Number(form.allowances||0), deductions: Number(form.deductions||0), remarks: form.remarks };
      if (editSalary) await axios.put(`${API}/hr/salaries/${editSalary._id}`, payload, auth());
      else await axios.post(`${API}/hr/salaries`, payload, auth());
      setShowModal(false);
      fetchAll();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleMarkPaid = async (id) => {
    try {
      await axios.put(`${API}/hr/salaries/${id}`, { status:"Paid", paidOn: new Date() }, auth());
      fetchAll();
    } catch(e) {}
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await axios.post(`${API}/hr/salaries/generate`, genForm, auth());
      setShowGenerateModal(false);
      fetchAll();
      alert(`Generated salary for ${r.data.data} teachers!`);
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setGenerating(false);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const net = (Number(form.basicSalary||0) + Number(form.allowances||0) - Number(form.deductions||0));

  const filtered = salaries.filter(s =>
    (!filterMonth || s.month === Number(filterMonth)) &&
    (!filterYear  || s.year  === Number(filterYear))  &&
    (!filterStatus|| s.status === filterStatus)
  );

  const totalPaid    = filtered.filter(s => s.status === "Paid").reduce((a, s) => a + (s.netSalary||0), 0);
  const totalPending = filtered.filter(s => s.status === "Pending").reduce((a, s) => a + (s.netSalary||0), 0);
  const paidCount    = filtered.filter(s => s.status === "Paid").length;
  const pendingCount = filtered.filter(s => s.status === "Pending").length;

  const years = [...new Set(salaries.map(s => s.year))].sort((a,b) => b-a);

  return (
    <div style={{ fontFamily:"Inter,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .sal-row:hover { background:#F0FDF4 !important; transform:translateX(2px); }
        .sal-row { transition: all 0.15s ease; }
        .act-btn { transition: all 0.15s ease; }
        .act-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#059669,#0D9488,#0891B2)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:100, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>Salary Management</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Manage teacher salaries and payroll</div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setShowGenerateModal(true)}
              style={{ padding:"11px 20px", borderRadius:12, border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.15)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              ⚡ Generate Month
            </button>
            <button onClick={openAdd}
              style={{ padding:"11px 20px", borderRadius:12, border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.2)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              + Add Salary
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"TOTAL RECORDS", value: filtered.length, icon:"📋", border:"#0891B2", bg:"#ECFEFF" },
          { label:"PAID",          value: paidCount,        icon:"✅", border:"#10B981", bg:"#F0FDF4" },
          { label:"PENDING",       value: pendingCount,     icon:"⏳", border:"#F59E0B", bg:"#FFFBEB" },
          { label:"TOTAL PAID",    value: `₹${totalPaid.toLocaleString()}`, icon:"💰", border:"#059669", bg:"#F0FDF4" },
        ].map((card, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${card.border}`, animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{card.label}</div>
                <div style={{ fontSize:24, fontWeight:900, color:"#0F172A" }}>{card.value}</div>
              </div>
              <div style={{ width:42, height:42, borderRadius:12, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:20, animation:"fadeUp 0.4s ease 0.1s both" }}>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:150 }}>
          <option value="">All Months</option>
          {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:120 }}>
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none", background:"white", cursor:"pointer", minWidth:130 }}>
          <option value="">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>
        <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600, alignSelf:"center" }}>{filtered.length} records</div>
      </div>

      {/* Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.5s ease 0.15s both" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
              {["Teacher","Month/Year","Basic Salary","Allowances","Deductions","Net Salary","Status","Action"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #059669", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
                <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading salaries...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:"80px 0", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>💰</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No salary records found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Use "Generate Month" to auto-create salary records</div>
              </td></tr>
            ) : filtered.map((s, i) => {
              const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.Pending;
              return (
                <tr key={s._id} className="sal-row" style={{ borderBottom:"1px solid #F1F5F9", animation:`fadeUp 0.3s ease ${i*0.03}s both` }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#059669,#0891B2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white" }}>
                        {s.teacher?.name?.[0]?.toUpperCase() || "T"}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{s.teacher?.name || "Teacher"}</div>
                        {s.teacher?.employeeId && <div style={{ fontSize:11, color:"#94A3B8" }}>{s.teacher.employeeId}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{MONTHS[s.month-1]} {s.year}</span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, fontWeight:700, color:"#0F172A" }}>₹{(s.basicSalary||0).toLocaleString()}</td>
                  <td style={{ padding:"14px 18px", fontSize:13, fontWeight:600, color:"#10B981" }}>+₹{(s.allowances||0).toLocaleString()}</td>
                  <td style={{ padding:"14px 18px", fontSize:13, fontWeight:600, color:"#EF4444" }}>-₹{(s.deductions||0).toLocaleString()}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:14, fontWeight:900, color:"#059669" }}>₹{(s.netSalary||0).toLocaleString()}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:cfg.bg, border:`1px solid ${cfg.border}`, width:"fit-content" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot }} />
                      <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{s.status}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:8 }}>
                      {s.status === "Pending" && (
                        <button className="act-btn" onClick={() => handleMarkPaid(s._id)}
                          style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                          Mark Paid
                        </button>
                      )}
                      <button className="act-btn" onClick={() => openEdit(s)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#374151", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editSalary ? "Edit Salary" : "Add Salary Record"}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>TEACHER</div>
            <select value={form.teacherId} onChange={e => f("teacherId", e.target.value)}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name}{t.employeeId ? ` (${t.employeeId})` : ""}</option>)}
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>MONTH</div>
              <select value={form.month} onChange={e => f("month", Number(e.target.value))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>YEAR</div>
              <input type="number" value={form.year} onChange={e => f("year", Number(e.target.value))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {[["BASIC SALARY","basicSalary"],["ALLOWANCES","allowances"],["DEDUCTIONS","deductions"]].map(([label, key]) => (
              <div key={key}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label} (₹)</div>
                <input type="number" value={form[key]} onChange={e => f(key, e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ background:"#F0FDF4", borderRadius:12, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#64748B" }}>Net Salary</span>
            <span style={{ fontSize:20, fontWeight:900, color:"#059669" }}>₹{net.toLocaleString()}</span>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>REMARKS</div>
            <input value={form.remarks} onChange={e => f("remarks", e.target.value)} placeholder="Optional remarks..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#059669,#0891B2)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Generate Modal */}
      <Modal show={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Monthly Salaries">
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"#F0FDF4", borderRadius:12, padding:"14px 16px", fontSize:13, color:"#374151" }}>
            Auto-generate salary records for all active teachers based on their salary in profile.
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>MONTH</div>
              <select value={genForm.month} onChange={e => setGenForm(p => ({ ...p, month: Number(e.target.value) }))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>YEAR</div>
              <input type="number" value={genForm.year} onChange={e => setGenForm(p => ({ ...p, year: Number(e.target.value) }))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowGenerateModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleGenerate} disabled={generating} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#059669,#0891B2)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:generating?0.7:1 }}>
              {generating ? "Generating..." : "⚡ Generate"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

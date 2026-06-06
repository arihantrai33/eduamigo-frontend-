import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const LEAVE_TYPES = ["Sick","Casual","Earned","Maternity","Other"];

function Tab({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:12, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, transition:"all 0.2s", background: active ? "linear-gradient(135deg,#0F172A,#1E3A5F)" : "white", color: active ? "white" : "#94A3B8", boxShadow: active ? "0 4px 12px rgba(15,23,42,0.3)" : "none" }}>
      <span>{icon}</span>{label}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = { Paid:"#10B981", Pending:"#F59E0B", Approved:"#10B981", Rejected:"#EF4444" };
  const bg = { Paid:"#F0FDF4", Pending:"#FFFBEB", Approved:"#F0FDF4", Rejected:"#FEF2F2" };
  return <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background: bg[status]||"#F8FAFC", color: map[status]||"#64748B" }}>{status}</span>;
}

export default function HRManagement() {
  const [tab, setTab] = useState("salary");
  const [teachers, setTeachers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editItem, setEditItem] = useState(null);

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({});

  useEffect(() => { fetchTeachers(); }, []);
  useEffect(() => { if (tab === "salary") fetchSalaries(); else fetchLeaves(); }, [tab, filterMonth, filterYear, filterStatus]);

  const fetchTeachers = async () => {
    const r = await axios.get(`${API}/teachers`, auth());
    setTeachers(r.data.data || []);
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/hr/salaries?month=${filterMonth}&year=${filterYear}`, auth());
      setSalaries(r.data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/hr/leaves${filterStatus ? `?status=${filterStatus}` : ""}`, auth());
      setLeaves(r.data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const generateSalaries = async () => {
    if (!window.confirm(`Generate salaries for ${MONTHS[filterMonth-1]} ${filterYear}?`)) return;
    setLoading(true);
    try {
      await axios.post(`${API}/hr/salaries/generate`, { month: filterMonth, year: filterYear }, auth());
      fetchSalaries();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setLoading(false);
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditItem(item);
    setForm(item ? { ...item, teacher: item.teacher?._id || item.teacher } : { month: filterMonth, year: filterYear });
    setShowModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (tab === "salary") {
        if (editItem) await axios.put(`${API}/hr/salaries/${editItem._id}`, form, auth());
        else await axios.post(`${API}/hr/salaries`, form, auth());
        fetchSalaries();
      } else {
        if (editItem) await axios.put(`${API}/hr/leaves/${editItem._id}`, form, auth());
        else await axios.post(`${API}/hr/leaves`, form, auth());
        fetchLeaves();
      }
      setShowModal(false);
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete karna chahte ho?")) return;
    try {
      if (tab === "salary") { await axios.delete(`${API}/hr/salaries/${id}`, auth()); fetchSalaries(); }
      else { await axios.delete(`${API}/hr/leaves/${id}`, auth()); fetchLeaves(); }
    } catch(e) {}
  };

  const handleLeaveAction = async (id, status) => {
    try {
      await axios.put(`${API}/hr/leaves/${id}`, { status }, auth());
      fetchLeaves();
    } catch(e) {}
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const totalPaid = salaries.filter(s => s.status === "Paid").reduce((a, s) => a + (s.netSalary || 0), 0);
  const totalPending = salaries.filter(s => s.status === "Pending").reduce((a, s) => a + (s.netSalary || 0), 0);
  const pendingLeaves = leaves.filter(l => l.status === "Pending").length;

  const inp = (placeholder, key, type="text") => (
    <input type={type} placeholder={placeholder} value={form[key]||""} onChange={e => f(key, e.target.value)}
      style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
  );

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, color:"#0F172A", letterSpacing:"-0.3px" }}>HR Management</div>
        <div style={{ fontSize:12, color:"#94A3B8", marginTop:3 }}>Salary records and staff leave management</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Teachers", value: teachers.length, icon:"👩‍🏫", color:"#6366F1" },
          { label:"Salary Paid", value: `₹${totalPaid.toLocaleString()}`, icon:"✅", color:"#10B981" },
          { label:"Salary Pending", value: `₹${totalPending.toLocaleString()}`, icon:"⏳", color:"#F59E0B" },
          { label:"Leave Requests", value: pendingLeaves, icon:"📋", color:"#EF4444" },
        ].map((s,i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"16px 20px", boxShadow:"0 4px 16px rgba(15,23,42,0.06)", border:"1px solid rgba(226,232,240,0.8)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.06em" }}>{s.label.toUpperCase()}</span>
              <span style={{ fontSize:20 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:6, background:"white", borderRadius:14, padding:5, border:"1px solid #E2E8F0", width:"fit-content", marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <Tab label="Salary" icon="💵" active={tab==="salary"} onClick={() => setTab("salary")} />
        <Tab label="Staff Leaves" icon="🌴" active={tab==="leaves"} onClick={() => setTab("leaves")} />
      </div>

      {tab === "salary" && (
        <div style={{ background:"white", borderRadius:20, padding:24, boxShadow:"0 4px 24px rgba(15,23,42,0.08)", border:"1px solid rgba(226,232,240,0.8)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding:"9px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none" }}>
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ padding:"9px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none" }}>
                {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={generateSalaries} disabled={loading} style={{ padding:"10px 20px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#374151" }}>
                ⚡ Auto Generate
              </button>
              <button onClick={() => openModal("salary")} style={{ padding:"10px 20px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#0F172A,#1E3A5F)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                + Add Salary
              </button>
            </div>
          </div>

          {loading ? <div style={{ textAlign:"center", padding:"40px 0", color:"#94A3B8" }}>Loading...</div>
          : salaries.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>💵</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No salary records for {MONTHS[filterMonth-1]} {filterYear}</div>
              <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Click "Auto Generate" to create records for all teachers</div>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#F8FAFC" }}>
                  {["Teacher","Emp ID","Basic","Allowances","Deductions","Net Salary","Status","Actions"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.06em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salaries.map((s,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid #F1F5F9" }}>
                    <td style={{ padding:"12px 14px", fontSize:13, fontWeight:700, color:"#0F172A" }}>{s.teacher?.name || "—"}</td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:"#64748B" }}>{s.teacher?.employeeId || "—"}</td>
                    <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600, color:"#0F172A" }}>₹{(s.basicSalary||0).toLocaleString()}</td>
                    <td style={{ padding:"12px 14px", fontSize:13, color:"#10B981" }}>+₹{(s.allowances||0).toLocaleString()}</td>
                    <td style={{ padding:"12px 14px", fontSize:13, color:"#EF4444" }}>-₹{(s.deductions||0).toLocaleString()}</td>
                    <td style={{ padding:"12px 14px", fontSize:14, fontWeight:800, color:"#0F172A" }}>₹{(s.netSalary||0).toLocaleString()}</td>
                    <td style={{ padding:"12px 14px" }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        {s.status === "Pending" && (
                          <button onClick={() => handleLeaveAction(s._id, "Paid")} style={{ padding:"5px 12px", borderRadius:8, border:"none", background:"#F0FDF4", color:"#15803D", fontSize:11, fontWeight:700, cursor:"pointer" }}>Mark Paid</button>
                        )}
                        <button onClick={() => openModal("salary", s)} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", fontSize:11, cursor:"pointer" }}>✏️</button>
                        <button onClick={() => handleDelete(s._id)} style={{ padding:"5px 10px", borderRadius:8, border:"none", background:"#FEF2F2", color:"#DC2626", fontSize:11, cursor:"pointer" }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "leaves" && (
        <div style={{ background:"white", borderRadius:20, padding:24, boxShadow:"0 4px 24px rgba(15,23,42,0.08)", border:"1px solid rgba(226,232,240,0.8)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding:"9px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none" }}>
              <option value="">All Statuses</option>
              {["Pending","Approved","Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => openModal("leave")} style={{ padding:"10px 20px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#0F172A,#1E3A5F)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              + Add Leave
            </button>
          </div>

          {loading ? <div style={{ textAlign:"center", padding:"40px 0", color:"#94A3B8" }}>Loading...</div>
          : leaves.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🌴</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No leave requests found</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {leaves.map((l,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", borderRadius:14, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                  <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#0F172A,#1E3A5F)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"white", fontWeight:800 }}>
                      {l.teacher?.name?.[0] || "?"}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>{l.teacher?.name || "—"}</div>
                      <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>
                        {l.leaveType} Leave · {new Date(l.fromDate).toLocaleDateString()} – {new Date(l.toDate).toLocaleDateString()} · {l.days} day{l.days!==1?"s":""}
                      </div>
                      {l.reason && <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>"{l.reason}"</div>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <StatusBadge status={l.status} />
                    {l.status === "Pending" && (
                      <>
                        <button onClick={() => handleLeaveAction(l._id, "Approved")} style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#F0FDF4", color:"#15803D", fontSize:12, fontWeight:700, cursor:"pointer" }}>✓ Approve</button>
                        <button onClick={() => handleLeaveAction(l._id, "Rejected")} style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#FEF2F2", color:"#DC2626", fontSize:12, fontWeight:700, cursor:"pointer" }}>✗ Reject</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(l._id)} style={{ padding:"6px 10px", borderRadius:8, border:"none", background:"#F1F5F9", color:"#64748B", fontSize:12, cursor:"pointer" }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
          <div style={{ background:"white", borderRadius:24, padding:28, width:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#0F172A", marginBottom:20 }}>
              {editItem ? "Edit" : "Add"} {tab === "salary" ? "Salary Record" : "Leave Request"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>TEACHER</div>
                <select value={form.teacher||""} onChange={e => f("teacher", e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none" }}>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name} — {t.employeeId}</option>)}
                </select>
              </div>
              {tab === "salary" ? <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>MONTH</div>
                    <select value={form.month||""} onChange={e => f("month", e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none" }}>
                      {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>YEAR</div>
                    <select value={form.year||""} onChange={e => f("year", e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none" }}>
                      {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>BASIC (₹)</div>{inp("Basic Salary","basicSalary","number")}</div>
                  <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>ALLOWANCES (₹)</div>{inp("Allowances","allowances","number")}</div>
                  <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>DEDUCTIONS (₹)</div>{inp("Deductions","deductions","number")}</div>
                </div>
                <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>STATUS</div>
                  <select value={form.status||"Pending"} onChange={e => f("status", e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none" }}>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>REMARKS</div>{inp("Optional remarks","remarks")}</div>
              </> : <>
                <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>LEAVE TYPE</div>
                  <select value={form.leaveType||""} onChange={e => f("leaveType", e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, outline:"none" }}>
                    <option value="">Select Type</option>
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>FROM DATE</div>{inp("","fromDate","date")}</div>
                  <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>TO DATE</div>{inp("","toDate","date")}</div>
                </div>
                <div><div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6 }}>REASON</div>{inp("Reason for leave","reason")}</div>
              </>}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
              <button onClick={handleSave} disabled={loading} style={{ padding:"10px 24px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#0F172A,#1E3A5F)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

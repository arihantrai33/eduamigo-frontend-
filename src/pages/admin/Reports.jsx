import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { RefreshCw, TrendingUp, Users, GraduationCap, DollarSign } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

export default function Reports() {
  const [data, setData]       = useState({ students: 0, teachers: 0, parents: 0, buses: 0 });
  const [fees, setFees]       = useState({ total: 0, paid: 0, pending: 0 });
  const [attendance, setAtt]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stuRes, tchRes, parRes, busRes, feeRes, attRes] = await Promise.allSettled([
        axios.get(`${API}/students`, auth()),
        axios.get(`${API}/teachers`, auth()),
        axios.get(`${API}/parents`, auth()),
        axios.get(`${API}/transport`, auth()),
        axios.get(`${API}/fees`, auth()),
        axios.get(`${API}/attendance/report`, auth()),
      ]);

      setData({
        students: stuRes.value?.data?.count || stuRes.value?.data?.data?.length || 0,
        teachers: tchRes.value?.data?.count || tchRes.value?.data?.data?.length || 0,
        parents:  parRes.value?.data?.count || parRes.value?.data?.data?.length || 0,
        buses:    busRes.value?.data?.count || busRes.value?.data?.data?.length || 0,
      });

      const feeList = feeRes.value?.data?.data || [];
      const paid    = feeList.filter(f => f.status === "Paid").reduce((s, f) => s + (f.amount || 0), 0);
      const pending = feeList.filter(f => f.status !== "Paid").reduce((s, f) => s + (f.amount || 0), 0);
      setFees({ total: paid + pending, paid, pending });

      const attData = attRes.value?.data?.data || [];
      setAtt(attData.slice(0, 6));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const statCards = [
    { label: "Total Students", value: data.students, color: "#4F46E5", bg: "#EEF2FF", icon: <GraduationCap size={18} color="#4F46E5" /> },
    { label: "Total Teachers", value: data.teachers, color: "#16A34A", bg: "#F0FDF4", icon: <Users size={18} color="#16A34A" /> },
    { label: "Total Parents",  value: data.parents,  color: "#D97706", bg: "#FFFBEB", icon: <Users size={18} color="#D97706" /> },
    { label: "Fee Collected",  value: `₹${(fees.paid/1000).toFixed(1)}K`, color: "#0284C7", bg: "#F0F9FF", icon: <DollarSign size={18} color="#0284C7" /> },
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>Reports & Analytics</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>School-wide performance overview</div>
        </div>
        <button onClick={fetchAll} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RefreshCw size={14} color="#64748B" />
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${s.bg}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fee Summary */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={16} color="#4F46E5" /> Fee Collection Summary
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Total Expected", value: `₹${(fees.total/1000).toFixed(1)}K`, color: "#0F172A" },
            { label: "Collected",      value: `₹${(fees.paid/1000).toFixed(1)}K`,  color: "#16A34A" },
            { label: "Pending",        value: `₹${(fees.pending/1000).toFixed(1)}K`, color: "#DC2626" },
          ].map((f, i) => (
            <div key={i} style={{ textAlign: "center", padding: "16px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: f.color }}>{loading ? "—" : f.value}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, fontWeight: 500 }}>{f.label}</div>
            </div>
          ))}
        </div>
        {!loading && fees.total > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>Collection Rate</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A" }}>{Math.round((fees.paid / fees.total) * 100)}%</span>
            </div>
            <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${Math.round((fees.paid / fees.total) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #4F46E5, #16A34A)", borderRadius: 4 }} />
            </div>
          </div>
        )}
      </div>

      {/* Attendance by Class */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>📊 Attendance Overview</div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>Loading...</div>
        ) : attendance.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>No attendance data available</div>
        ) : attendance.map((a, i) => {
          const pct = a.percentage || a.pct || 0;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#64748B", width: 60, flexShrink: 0 }}>Class {a.class || a.cls}</span>
              <div style={{ flex: 1, height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: pct >= 90 ? "#16A34A" : pct >= 75 ? "#D97706" : "#DC2626", borderRadius: 4, transition: "width 0.5s" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, width: 40, textAlign: "right", color: pct >= 90 ? "#16A34A" : pct >= 75 ? "#D97706" : "#DC2626" }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

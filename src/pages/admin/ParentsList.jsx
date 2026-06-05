import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, RefreshCw, Users, Phone, Mail, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const avatarColors = ["#6366F1","#8B5CF6","#EC4899","#F59E0B","#10B981","#3B82F6","#EF4444","#14B8A6"];
const getColor = (name = "") => avatarColors[name.charCodeAt(0) % avatarColors.length];

const inp = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
  fontSize: 13, outline: "none", background: "#F8FAFC",
  fontFamily: "Inter, sans-serif", boxSizing: "border-box",
};

export default function ParentsList() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const navigate = useNavigate();

  const fetchParents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/parents`, auth());
      setParents(res.data.data || []);
    } catch { setParents([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchParents(); }, [fetchParents]);

  const filtered = parents.filter(p => {
    const s = search.toLowerCase();
    return !s || p.name?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s) || p.phone?.includes(s);
  });

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>Parents</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>All registered parent accounts</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchParents} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RefreshCw size={14} color="#64748B" />
          </button>
          <button onClick={() => navigate("/admin/parents/add")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Add Parent
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Parents", value: parents.length, color: "#4F46E5", bg: "#EEF2FF", icon: "👨‍👩‍👧" },
          { label: "With Students", value: parents.filter(p => p.children?.length > 0).length, color: "#16A34A", bg: "#F0FDF4", icon: "🎒" },
          { label: "Active",        value: parents.filter(p => p.isActive !== false).length,    color: "#D97706", bg: "#FFFBEB", icon: "✅" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${s.bg}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 320, marginBottom: 16 }}>
        <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..." style={{ ...inp, paddingLeft: 36, width: "100%" }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 80px", padding: "12px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          {["Parent", "Phone", "Email", "Children", ""].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>Loading parents...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>��‍👩‍👧</div>
            <div style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>No parents found</div>
          </div>
        ) : filtered.map((p, i) => (
          <div key={p._id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 80px", padding: "14px 20px", alignItems: "center", borderTop: i === 0 ? "none" : "1px solid #F1F5F9" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: getColor(p.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {p.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>{p.occupation || "Parent"}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B" }}>
              <Phone size={11} color="#94A3B8" /> {p.phone || "—"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B" }}>
              <Mail size={11} color="#94A3B8" /> {p.email || "—"}
            </div>
            <span style={{ fontSize: 12, color: "#64748B" }}>{p.children?.length || 0} student(s)</span>
            <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 11, cursor: "pointer", color: "#64748B", fontWeight: 500 }}>
              <Eye size={11} /> View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

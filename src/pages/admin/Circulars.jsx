import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, RefreshCw, Plus, Bell, Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const inp = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
  fontSize: 13, outline: "none", background: "#F8FAFC",
  fontFamily: "Inter, sans-serif", boxSizing: "border-box", width: "100%",
};

const AUDIENCES = ["All", "Students", "Teachers", "Parents"];

export default function Circulars() {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ title: "", content: "", audience: "All" });
  const [saving, setSaving]       = useState(false);

  const fetchCirculars = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/circulars`, auth());
      setCirculars(res.data.data || []);
    } catch { setCirculars([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCirculars(); }, [fetchCirculars]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${API}/circulars`, form, auth());
      setForm({ title: "", content: "", audience: "All" });
      setShowForm(false);
      fetchCirculars();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this circular?")) return;
    try {
      await axios.delete(`${API}/circulars/${id}`, auth());
      fetchCirculars();
    } catch {}
  };

  const filtered = circulars.filter(c => {
    const s = search.toLowerCase();
    return !s || c.title?.toLowerCase().includes(s) || c.content?.toLowerCase().includes(s);
  });

  const audienceColor = { All: "#4F46E5", Students: "#16A34A", Teachers: "#D97706", Parents: "#0284C7" };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>Circulars</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>School announcements and notices</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchCirculars} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RefreshCw size={14} color="#64748B" />
          </button>
          <button onClick={() => setShowForm(!showForm)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> New Circular
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Create New Circular</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Circular title..." style={inp} />
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Circular content..." rows={4}
              style={{ ...inp, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
                style={{ ...inp, width: 160 }}>
                {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <button onClick={handleCreate} disabled={saving}
                style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: saving ? "#94A3B8" : "#4F46E5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Posting..." : "Post Circular"}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 13, cursor: "pointer", color: "#64748B" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "relative", maxWidth: 320, marginBottom: 16 }}>
        <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search circulars..." style={{ ...inp, paddingLeft: 36 }} />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>Loading circulars...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📢</div>
          <div style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>No circulars yet</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Click "New Circular" to post one</div>
        </div>
      ) : filtered.map((c) => (
        <div key={c._id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "18px 20px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={16} color="#4F46E5" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                  {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {" · "}
                  <span style={{ color: audienceColor[c.audience] || "#4F46E5", fontWeight: 600 }}>{c.audience || "All"}</span>
                </div>
              </div>
            </div>
            <button onClick={() => handleDelete(c._id)}
              style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #FEE2E2", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Trash2 size={13} color="#DC2626" />
            </button>
          </div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 12, lineHeight: 1.6 }}>{c.content}</div>
        </div>
      ))}
    </div>
  );
}

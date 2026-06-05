import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, Plus, RefreshCw, BookOpen, Trash2, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const CATEGORIES = ["Textbook", "Fiction", "Biography", "Reference", "Science", "History", "Other"];

const CAT_META = {
  Textbook:  { bg: "#EEF2FF", color: "#4F46E5" },
  Fiction:   { bg: "#FDF4FF", color: "#9333EA" },
  Biography: { bg: "#FFFBEB", color: "#D97706" },
  Reference: { bg: "#F0FDF4", color: "#16A34A" },
  Science:   { bg: "#F0F9FF", color: "#0284C7" },
  History:   { bg: "#FFF7ED", color: "#EA580C" },
  Other:     { bg: "#F8FAFC", color: "#64748B" },
};

const inp = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
  fontSize: 13, outline: "none", background: "#F8FAFC",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
};

export default function Library() {
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ title: "", author: "", isbn: "", category: "Textbook", totalCopies: "", publisher: "", year: "" });

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (catFilter !== "all") params.category = catFilter;
      const res = await axios.get(`${API}/library`, { ...auth(), params });
      setBooks(res.data.data || []);
    } catch { setBooks([]); }
    finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleAdd = async () => {
    if (!form.title || !form.totalCopies) return;
    setSaving(true);
    try {
      await axios.post(`${API}/library`, form, auth());
      setShowModal(false);
      setForm({ title: "", author: "", isbn: "", category: "Textbook", totalCopies: "", publisher: "", year: "" });
      fetchBooks();
    } catch (e) { alert(e?.response?.data?.message || "Failed to add book"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this book?")) return;
    await axios.delete(`${API}/library/${id}`, auth());
    fetchBooks();
  };

  const stats = {
    total: books.length,
    available: books.reduce((s, b) => s + (b.available || 0), 0),
    issued: books.reduce((s, b) => s + (b.issued || 0), 0),
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>Library</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Manage books and issue records</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchBooks} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RefreshCw size={14} color="#64748B" />
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Add Book
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Books", value: stats.total, color: "#4F46E5", bg: "#EEF2FF", icon: "📚" },
          { label: "Available",   value: stats.available, color: "#16A34A", bg: "#F0FDF4", icon: "✅" },
          { label: "Issued",      value: stats.issued, color: "#D97706", bg: "#FFFBEB", icon: "📤" },
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

      {/* Search + Category Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books..."
            style={{ ...inp, paddingLeft: 36 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: `1px solid ${catFilter === c ? "#4F46E5" : "#E2E8F0"}`, background: catFilter === c ? "#EEF2FF" : "#fff", color: catFilter === c ? "#4F46E5" : "#64748B", fontWeight: catFilter === c ? 600 : 400 }}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 80px 80px 80px 50px", padding: "12px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          {["Title", "Author", "Category", "Total", "Available", "Issued", ""].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>Loading books...</div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
            <div style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>No books in library</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Add your first book using the button above</div>
          </div>
        ) : books.map((b, i) => {
          const cat = CAT_META[b.category] || CAT_META.Other;
          return (
            <div key={b._id} style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 80px 80px 80px 50px", padding: "14px 20px", alignItems: "center", borderTop: i === 0 ? "none" : "1px solid #F1F5F9" }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={14} color={cat.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{b.title}</div>
                  {b.isbn && <div style={{ fontSize: 11, color: "#94A3B8" }}>ISBN: {b.isbn}</div>}
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#64748B" }}>{b.author || "—"}</span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: cat.bg, color: cat.color, width: "fit-content" }}>{b.category}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{b.totalCopies}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: b.available > 0 ? "#16A34A" : "#EF4444" }}>{b.available}</span>
              <span style={{ fontSize: 13, color: "#D97706", fontWeight: 600 }}>{b.issued}</span>
              <button onClick={() => handleDelete(b._id)}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #FEE2E2", background: "#FFF5F5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Trash2 size={12} color="#EF4444" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Book Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>Add New Book</div>
              <button onClick={() => setShowModal(false)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color="#64748B" />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Book Title", key: "title", placeholder: "e.g. Mathematics Class 10" },
                { label: "Author", key: "author", placeholder: "e.g. R.D. Sharma" },
                { label: "ISBN", key: "isbn", placeholder: "e.g. 978-3-16-148410-0" },
                { label: "Publisher", key: "publisher", placeholder: "e.g. NCERT" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>{label.toUpperCase()}</label>
                  <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={inp} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>CATEGORY</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>TOTAL COPIES *</label>
                  <input type="number" min="1" value={form.totalCopies} onChange={e => setForm({ ...form, totalCopies: e.target.value })} placeholder="e.g. 10" style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>PUBLICATION YEAR</label>
                <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2024" style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 13, cursor: "pointer", color: "#64748B" }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: saving ? "#94A3B8" : "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Adding..." : "Add Book"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

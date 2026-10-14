import { useState, useEffect } from "react";
import axios from "axios";
import { toast, confirmAction, errorMessage } from "../../utils/toast";

import { Plus } from "lucide-react";
import Glyph from "../../components/Glyph";
import Modal from "../../components/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const CATEGORIES = ["Textbook","Fiction","Biography","Reference","Science","History","Other"];
const CAT_CONFIG = {
  Textbook:  { bg:"#EEF2FF", color:"#6366F1", icon:<Glyph e="📚" /> },
  Fiction:   { bg:"#FDF4FF", color:"#9333EA", icon:<Glyph e="📖" /> },
  Biography: { bg:"#FFF7ED", color:"#EA580C", icon:<Glyph e="👤" /> },
  Reference: { bg:"#F0FDF4", color:"#15803D", icon:<Glyph e="🔍" /> },
  Science:   { bg:"#ECFEFF", color:"#0891B2", icon:<Glyph e="🔬" /> },
  History:   { bg:"#FFFBEB", color:"#D97706", icon:<Glyph e="🏛" /> },
  Other:     { bg:"#F8FAFC", color:"#64748B", icon:<Glyph e="📄" /> },
};

export default function Library() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title:"", author:"", isbn:"", category:"Textbook", totalCopies:"1", publisher:"", year:"" });

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/library`, auth());
      setBooks(res.data.data || []);
    } catch(e) {}
    setLoading(false);
  };

  const openAdd = () => {
    setEditBook(null);
    setForm({ title:"", author:"", isbn:"", category:"Textbook", totalCopies:"1", publisher:"", year:"" });
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditBook(b);
    setForm({ title:b.title, author:b.author||"", isbn:b.isbn||"", category:b.category||"Textbook", totalCopies:b.totalCopies, publisher:b.publisher||"", year:b.year||"" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.totalCopies) return toast.error("Title and copies required");
    setSaving(true);
    try {
      if (editBook) await axios.patch(`${API}/library/${editBook._id}`, form, auth());
      else await axios.post(`${API}/library`, form, auth());
      setShowModal(false);
      fetchBooks();
    } catch(e) { toast.error(errorMessage(e, "Could not save the book")); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!(await confirmAction("Delete this book?"))) return;
    try { await axios.delete(`${API}/library/${id}`, auth()); toast.success("Book deleted"); fetchBooks(); }
    catch(e) { toast.error(errorMessage(e, "Could not delete the book")); }
  };

  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const filtered = books.filter(b =>
    (!filterCat || b.category === filterCat) &&
    (!search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase()) || b.isbn?.includes(search))
  );

  const totalBooks = books.reduce((a,b) => a+(b.totalCopies||0), 0);
  const totalAvail = books.reduce((a,b) => a+(b.available||0), 0);
  const totalIssued = books.reduce((a,b) => a+(b.issued||0), 0);

  return (
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
        .book-row:hover { background:#F0FDF4 !important; transform:translateX(3px); }
        .book-row { transition: all 0.15s ease; }
        .act-btn { transition: all 0.15s ease; }
        .act-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .cat-chip:hover { transform:translateY(-1px); }
        .cat-chip { transition: all 0.15s ease; cursor:pointer; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <PageHeader title="Library" subtitle="Manage books, categories and issue records"
          actions={<button type="button" className="ea-btn ea-btn--primary" onClick={openAdd}><Plus size={16} aria-hidden="true" /> Add Book</button>} />
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom:24 }}>
        <StatGrid>
          {[
            { label:"TOTAL TITLES",  value: books.length,  icon:<Glyph e="📚" />, border:"var(--brand)" },
            { label:"TOTAL COPIES",  value: totalBooks,    icon:<Glyph e="📦" />, border:"var(--brand)" },
            { label:"AVAILABLE",     value: totalAvail,    icon:<Glyph e="✅" />, border:"#10B981" },
            { label:"ISSUED",        value: totalIssued,   icon:<Glyph e="📤" />, border:"#F59E0B" },
          ].map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={toneOf(card.border)} />)}
        </StatGrid>
      </div>

      {/* Category Chips + Search + Add */}
      <div style={{ display:"flex", gap:10, marginBottom:20, alignItems:"center", flexWrap:"wrap", animation:"fadeUp 0.4s ease 0.1s both" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94A3B8" }}><Glyph e="🔍" /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search books" placeholder="Search by title, author, ISBN..."
            style={{ width:"100%", padding:"11px 14px 11px 38px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" }}
            onFocus={e=>e.target.style.borderColor="var(--brand)"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
        </div>
        <button className="cat-chip" onClick={() => setFilterCat("")}
          style={{ padding:"9px 16px", borderRadius:10, border:"none", background: !filterCat ? "var(--brand)" : "#F1F5F9", color: !filterCat ? "white" : "#64748B", fontWeight:700, fontSize:12 }}>
          All
        </button>
        {CATEGORIES.map(cat => {
          const cfg = CAT_CONFIG[cat];
          const active = filterCat === cat;
          return (
            <button key={cat} className="cat-chip" onClick={() => setFilterCat(active ? "" : cat)}
              style={{ padding:"9px 14px", borderRadius:10, border:`1.5px solid ${active ? cfg.color : "#E2E8F0"}`, background: active ? cfg.bg : "white", color: active ? cfg.color : "#64748B", fontWeight:700, fontSize:12, display:"flex", alignItems:"center", gap:5 }}>
              {cfg.icon} {cat}
            </button>
          );
        })}
      </div>

      {/* Books Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.5s ease 0.15s both" }}>
        <table data-stack style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"linear-gradient(90deg,#F8FAFC,#F1F5F9)" }}>
              {["Book","Author","ISBN","Category","Copies","Available","Issued","Action"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"#64748B", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:"60px 0", textAlign:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid var(--brand)", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
                <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading books...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:"80px 0", textAlign:"center" }}>
                <div style={{ fontSize:52, marginBottom:12 }}><Glyph e="📚" /></div>
                <div style={{ fontSize:16, fontWeight:700, color:"#94A3B8" }}>No books found</div>
                <div style={{ fontSize:13, color:"#CBD5E1", marginTop:4 }}>Add your first book using the button above</div>
              </td></tr>
            ) : filtered.map((b,i) => {
              const cfg = CAT_CONFIG[b.category] || CAT_CONFIG.Other;
              const availPct = b.totalCopies > 0 ? (b.available/b.totalCopies)*100 : 0;
              return (
                <tr key={b._id} className="book-row" style={{ borderBottom:"1px solid #F1F5F9", animation:`fadeUp 0.3s ease ${i*0.03}s both` }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{cfg.icon}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{b.title}</div>
                        {b.publisher && <div style={{ fontSize:11, color:"#94A3B8" }}>{b.publisher}{b.year ? ` · ${b.year}` : ""}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:500 }}>{b.author || "—"}</td>
                  <td style={{ padding:"14px 18px", fontSize:12, color:"#94A3B8", fontFamily:"monospace" }}>{b.isbn || "—"}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:cfg.bg, color:cfg.color }}>{b.category}</span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, fontWeight:700, color:"#0F172A" }}>{b.totalCopies}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:6, borderRadius:4, background:"#E2E8F0", overflow:"hidden", minWidth:50 }}>
                        <div style={{ width:`${availPct}%`, height:"100%", borderRadius:4, background: availPct>50?"#10B981":availPct>20?"#F59E0B":"#EF4444", transition:"width 0.3s ease" }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color: availPct>50?"#10B981":availPct>20?"#D97706":"#DC2626", minWidth:20 }}>{b.available}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:13, fontWeight:700, color: b.issued>0?"#D97706":"#94A3B8" }}>{b.issued}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="act-btn" onClick={() => openEdit(b)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#374151", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                        Edit
                      </button>
                      <button className="act-btn" onClick={() => handleDelete(b._id)}
                        style={{ width:30, height:30, borderRadius:8, border:"none", background:"#FEF2F2", cursor:"pointer", fontSize:13 }}>
                        <Glyph e="🗑" />
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
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editBook ? "Edit Book" : "Add New Book"}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>TITLE *</div>
            <input value={form.title} onChange={e=>f("title",e.target.value)} placeholder="Book title..."
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
              onFocus={e=>e.target.style.borderColor="var(--brand)"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["AUTHOR","author"],["ISBN","isbn"],["PUBLISHER","publisher"],["YEAR","year"]].map(([label,key]) => (
              <div key={key}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
                <input value={form[key]||""} onChange={e=>f(key,e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                  onFocus={e=>e.target.style.borderColor="var(--brand)"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>CATEGORY</div>
              <select value={form.category} onChange={e=>f("category",e.target.value)}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_CONFIG[c].icon} {c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>TOTAL COPIES *</div>
              <input type="number" value={form.totalCopies} onChange={e=>f("totalCopies",e.target.value)} min="1"
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"#64748B" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"var(--brand-gradient)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Saving..." : editBook ? "Update" : "Add Book"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

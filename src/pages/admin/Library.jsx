import { useState, useEffect } from "react";
import axios from "axios";
import { toast, confirmAction, errorMessage } from "../../utils/toast";
import EmptyState from "../../components/ui/EmptyState";

import { Plus, BookOpen, SearchX } from "lucide-react";
import Glyph from "../../components/Glyph";
import Modal from "../../components/Dialog";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";

const FIELDS = { title: "book-title", totalCopies: "book-totalCopies" };
import PageHeader from "../../components/ui/PageHeader";
import { StatCard, StatGrid } from "../../components/ui/StatCard";
import { toneOf } from "../../components/ui/tone";
import Skeleton from "../../components/ui/Skeleton";
import SearchField from "../../components/ui/SearchField";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const CATEGORIES = ["Textbook","Fiction","Biography","Reference","Science","History","Other"];
// Genres are categories: the six fixed category colours (--ea-cat-*), never status colours.
const CAT_CONFIG = {
  Textbook:  { bg:"var(--ea-cat-1-bg)", color:"var(--ea-cat-1)", icon:<Glyph e="📚" /> },
  Fiction:   { bg:"var(--ea-cat-2-bg)", color:"var(--ea-cat-2)", icon:<Glyph e="📖" /> },
  Biography: { bg:"var(--ea-cat-3-bg)", color:"var(--ea-cat-3)", icon:<Glyph e="👤" /> },
  Reference: { bg:"var(--ea-cat-6-bg)", color:"var(--ea-cat-6)", icon:<Glyph e="🔍" /> },
  Science:   { bg:"var(--ea-cat-5-bg)", color:"var(--ea-cat-5)", icon:<Glyph e="🔬" /> },
  History:   { bg:"var(--ea-cat-4-bg)", color:"var(--ea-cat-4)", icon:<Glyph e="🏛" /> },
  Other:     { bg:"var(--ea-cat-6-bg)", color:"var(--ea-cat-6)", icon:<Glyph e="📄" /> },
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
  const fe = useFieldErrors(FIELDS);

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
    if (!fe.check({
      title: !String(form.title || "").trim() && "Enter the book title",
      totalCopies: !(Number(form.totalCopies) > 0) && "Enter how many copies the library has",
    })) return;
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

  const f = (k,v) => { setForm(p=>({...p,[k]:v})); fe.clear(k); };

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
        <SearchField value={search} onChange={setSearch} label="Search books" placeholder="Search by title, author, ISBN..." style={{ flex: "1 1 200px" }} />
        <div className="ea-chips" role="group" aria-label="Filter by category" style={{ flex:"1 1 100%", minWidth:0 }}>
          <button type="button" className="ea-chip" aria-pressed={!filterCat} onClick={() => setFilterCat("")}>All</button>
          {CATEGORIES.map(cat => {
            const active = filterCat === cat;
            return (
              <button key={cat} type="button" className="ea-chip" aria-pressed={active} onClick={() => setFilterCat(active ? "" : cat)}>
                {CAT_CONFIG[cat].icon} {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Books Table */}
      <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 24px rgba(15,23,42,0.07)", border:"1px solid rgba(226,232,240,0.8)", overflow:"hidden", animation:"fadeUp 0.5s ease 0.15s both" }}>
        <table data-stack style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"var(--ea-hover)" }}>
              {["Book","Author","ISBN","Category","Copies","Available","Issued","Action"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--ea-muted)", letterSpacing:"0.08em", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:"60px 0", textAlign:"center" }}>
                <Skeleton rows={4} label="Loading books" />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 16 }}>
                {books.length
                  ? <EmptyState plain icon={SearchX} title="No books match" text="Try a different search or category." />
                  : <EmptyState plain icon={BookOpen} title="No books yet" text="Add your first book using the button above." />}
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
                        {b.publisher && <div style={{ fontSize:11, color:"var(--ea-muted)" }}>{b.publisher}{b.year ? ` · ${b.year}` : ""}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, color:"#374151", fontWeight:500 }}>{b.author || "—"}</td>
                  <td style={{ padding:"14px 18px", fontSize:12, color:"var(--ea-muted)", fontFamily:"monospace" }}>{b.isbn || "—"}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:cfg.bg, color:cfg.color }}>{b.category}</span>
                  </td>
                  <td style={{ padding:"14px 18px", fontSize:13, fontWeight:700, color:"#0F172A" }}>{b.totalCopies}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, height:6, borderRadius:4, background:"#E2E8F0", overflow:"hidden", minWidth:50 }}>
                        <div style={{ width:`${availPct}%`, height:"100%", borderRadius:4, background: availPct>50?"#10B981":availPct>20?"#F59E0B":"#EF4444", transition:"width 0.3s ease" }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color: availPct>50?"var(--ea-on-card-success)":availPct>20?"var(--ea-on-card-warning)":"#DC2626", minWidth:20 }}>{b.available}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ fontSize:13, fontWeight:700, color: b.issued>0?"var(--ea-on-card-warning)":"var(--ea-muted)" }}>{b.issued}</span>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="act-btn" onClick={() => openEdit(b)}
                        style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#374151", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                        Edit
                      </button>
                      <button type="button" className="act-btn" onClick={() => handleDelete(b._id)} aria-label={`Delete ${b.title}`} title="Delete"
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
      <Modal show={showModal} onClose={() => { setShowModal(false); fe.setErrors({}); }} title={editBook ? "Edit Book" : "Add New Book"}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Each field is a <label> around its caption, so the field takes the caption as its name. */}
          <label style={{ display:"block" }}>
            <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>TITLE *</span>
            <input id="book-title" value={form.title} onChange={e=>f("title",e.target.value)} placeholder="Book title..." {...fe.invalid("title")}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
              onFocus={e=>e.target.style.borderColor="var(--brand)"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
            <FieldError id="book-title-error">{fe.errors.title}</FieldError>
          </label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["AUTHOR","author"],["ISBN","isbn"],["PUBLISHER","publisher"],["YEAR","year"]].map(([label,key]) => (
              <label key={key} style={{ display:"block" }}>
                <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>{label}</span>
                <input value={form[key]||""} onChange={e=>f(key,e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                  onFocus={e=>e.target.style.borderColor="var(--brand)"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
              </label>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <label style={{ display:"block" }}>
              <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>CATEGORY</span>
              <select value={form.category} onChange={e=>f("category",e.target.value)}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", background:"white" }}>
                {/* Plain text: an option cannot show an icon (it rendered as "[object Object]"). */}
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display:"block" }}>
              <span style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--ea-muted)", marginBottom:6, letterSpacing:"0.06em" }}>TOTAL COPIES *</span>
              <input id="book-totalCopies" type="number" value={form.totalCopies} onChange={e=>f("totalCopies",e.target.value)} min="1" {...fe.invalid("totalCopies")}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
              <FieldError id="book-totalCopies-error">{fe.errors.totalCopies}</FieldError>
            </label>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowModal(false)} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"white", fontWeight:700, fontSize:13, cursor:"pointer", color:"var(--ea-muted)" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ea-btn ea-btn--primary">
              {saving ? "Saving..." : editBook ? "Update" : "Add Book"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

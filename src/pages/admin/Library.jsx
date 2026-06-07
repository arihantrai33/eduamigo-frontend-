import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const CATEGORIES = ["Textbook","Fiction","Biography","Reference","Science","History","Other"];
const CAT_CONFIG = {
  Textbook:  { bg:"#EEF2FF", color:"#6366F1", icon:"📚" },
  Fiction:   { bg:"#FDF4FF", color:"#9333EA", icon:"📖" },
  Biography: { bg:"#FFF7ED", color:"#EA580C", icon:"��" },
  Reference: { bg:"#F0FDF4", color:"#15803D", icon:"🔍" },
  Science:   { bg:"#ECFEFF", color:"#0891B2", icon:"🔬" },
  History:   { bg:"#FFFBEB", color:"#D97706", icon:"🏛️" },
  Other:     { bg:"#F8FAFC", color:"#64748B", icon:"📄" },
};

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(6px)" }}>
      <div style={{ background:"white", borderRadius:24, padding:32, width:520, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.25)", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#0F172A" }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:16, color:"#64748B" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

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
    if (!form.title || !form.totalCopies) return alert("Title and copies required");
    setSaving(true);
    try {
      if (editBook) await axios.patch(`${API}/library/${editBook._id}`, form, auth());
      else await axios.post(`${API}/library`, form, auth());
      setShowModal(false);
      fetchBooks();
    } catch(e) { alert(e.response?.data?.message || "Error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this book?")) return;
    try { await axios.delete(`${API}/library/${id}`, auth()); fetchBooks(); }
    catch(e) {}
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
    <div style={{ fontFamily:"Inter,sans-serif" }}>
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
      <div style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6,#06B6D4)", borderRadius:20, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
        <div style={{ position:"absolute", top:-50, right:-50, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:60, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        {/* Floating book emojis */}
        {["📚","📖","📕","📗"].map((e,i) => (
          <div key={i} style={{ position:"absolute", fontSize:28, opacity:0.15, animation:`shimmer 2s ease ${i*0.5}s infinite`,
            top: i<2 ? "15%" : "60%", right: `${8+i*8}%` }}>{e}</div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>📚 Library</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Manage books, categories and issue records</div>
          </div>
          <button onClick={openAdd}
            style={{ padding:"12px 24px", borderRadius:14, border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.2)", color:"white", fontWeight:700, fontSize:14, cursor:"pointer" }}>
            + Add Book
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"TOTAL TITLES",  value: books.length,  icon:"📚", border:"#6366F1", bg:"#EEF2FF" },
          { label:"TOTAL COPIES",  value: totalBooks,    icon:"📦", border:"#8B5CF6", bg:"#F5F3FF" },
          { label:"AVAILABLE",     value: totalAvail,    icon:"✅", border:"#10B981", bg:"#F0FDF4" },
          { label:"ISSUED",        value: totalIssued,   icon:"📤", border:"#F59E0B", bg:"#FFFBEB" },
        ].map((card,i) => (
          <div key={i} style={{ background:"white", borderRadius:16, padding:"18px 22px", boxShadow:"0 4px 20px rgba(15,23,42,0.07)", border:`2px solid ${card.border}`, animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.08em", marginBottom:8 }}>{card.label}</div>
                <div style={{ fontSize:26, fontWeight:900, color:"#0F172A" }}>{card.value}</div>
              </div>
              <div style={{ width:42, height:42, borderRadius:12, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Chips + Search + Add */}
      <div style={{ display:"flex", gap:10, marginBottom:20, alignItems:"center", flexWrap:"wrap", animation:"fadeUp 0.4s ease 0.1s both" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94A3B8" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, author, ISBN..."
            style={{ width:"100%", padding:"11px 14px 11px 38px", borderRadius:12, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"white" }}
            onFocus={e=>e.target.style.borderColor="#6366F1"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
        </div>
        <button className="cat-chip" onClick={() => setFilterCat("")}
          style={{ padding:"9px 16px", borderRadius:10, border:"none", background: !filterCat ? "#6366F1" : "#F1F5F9", color: !filterCat ? "white" : "#64748B", fontWeight:700, fontSize:12 }}>
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
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
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
                <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E2E8F0", borderTop:"3px solid #6366F1", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
                <div style={{ color:"#94A3B8", fontSize:13, fontWeight:600 }}>Loading books...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:"80px 0", textAlign:"center" }}>
                <div style={{ fontSize:52, marginBottom:12 }}>��</div>
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
                        🗑️
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
              onFocus={e=>e.target.style.borderColor="#6366F1"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["AUTHOR","author"],["ISBN","isbn"],["PUBLISHER","publisher"],["YEAR","year"]].map(([label,key]) => (
              <div key={key}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:6, letterSpacing:"0.06em" }}>{label}</div>
                <input value={form[key]||""} onChange={e=>f(key,e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                  onFocus={e=>e.target.style.borderColor="#6366F1"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
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
            <button onClick={handleSave} disabled={saving} style={{ padding:"10px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Saving..." : editBook ? "Update" : "Add Book"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

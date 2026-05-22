import { useState } from "react";

const BOOKS = [
  { id: "1", title: "Mathematics Class 10", author: "R.D. Sharma", category: "Textbook", total: 20, available: 14, issued: 6 },
  { id: "2", title: "Wings of Fire", author: "A.P.J. Abdul Kalam", category: "Biography", total: 5, available: 2, issued: 3 },
  { id: "3", title: "Science Class 9", author: "NCERT", category: "Textbook", total: 25, available: 18, issued: 7 },
  { id: "4", title: "Harry Potter", author: "J.K. Rowling", category: "Fiction", total: 3, available: 1, issued: 2 },
];

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const Library = () => {
  const [books, setBooks] = useState(BOOKS);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", author: "", category: "Textbook", total: "" });

  const filtered = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = () => {
    if (!form.title || !form.total) return;
    const total = Number(form.total);
    setBooks([...books, { ...form, id: Date.now().toString(), total, available: total, issued: 0 }]);
    setForm({ title: "", author: "", category: "Textbook", total: "" });
    setShowModal(false);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Library</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Manage books and issue records</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>+ Add Book</button>
      </div>

      <input placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, marginBottom: 16, width: 260 }} />

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: "#F5F5F3", fontSize: 11, fontWeight: 500, color: "#666" }}>
          <span>Title</span><span>Author</span><span>Category</span><span>Total</span><span>Available</span><span>Issued</span>
        </div>
        {filtered.map(b => (
          <div key={b.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", padding: "12px 16px", alignItems: "center", borderTop: "0.5px solid #E8E8E5" }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{b.title}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{b.author}</span>
            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "#EEEDFE", color: "#534AB7", fontWeight: 500 }}>{b.category}</span>
            <span style={{ fontSize: 12, color: "#666" }}>{b.total}</span>
            <span style={{ fontSize: 12, color: "#3B6D11", fontWeight: 500 }}>{b.available}</span>
            <span style={{ fontSize: 12, color: "#993C1D" }}>{b.issued}</span>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: 400 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Add Book</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {[{ label: "Title", key: "title" }, { label: "Author", key: "author" }, { label: "Total Copies", key: "total", type: "number" }].map(({ label, key, type = "text" }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                  {["Textbook", "Fiction", "Biography", "Reference", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#F5F5F3", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
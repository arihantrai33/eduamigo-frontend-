import { useState } from "react";

const NOTIFS = [
  { id: "1", title: "Fee Reminder", message: "May 2026 fee is due. Please pay before 31st May.", type: "Fee", targetRole: "parent", isRead: false, createdAt: "2026-05-19" },
  { id: "2", title: "Exam Schedule", message: "Mid Term exams start from June 10, 2026.", type: "Exam", targetRole: "all", isRead: true, createdAt: "2026-05-18" },
  { id: "3", title: "Holiday Notice", message: "School will remain closed on May 21 due to local holiday.", type: "General", targetRole: "all", isRead: false, createdAt: "2026-05-17" },
];

const typeColors = {
  Fee:     { bg: "#FAEEDA", color: "#854F0B" },
  Exam:    { bg: "#EEEDFE", color: "#534AB7" },
  General: { bg: "#E1F5EE", color: "#0F6E56" },
  Alert:   { bg: "#FAECE7", color: "#993C1D" },
};

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
};

const Notifications = () => {
  const [notifs, setNotifs] = useState(NOTIFS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "General", targetRole: "all" });

  const handleSubmit = () => {
    if (!form.title || !form.message) return;
    setNotifs([{ ...form, id: Date.now().toString(), isRead: false, createdAt: new Date().toISOString().split("T")[0] }, ...notifs]);
    setForm({ title: "", message: "", type: "General", targetRole: "all" });
    setShowModal(false);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Notifications</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Send notifications to students, parents and staff</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>+ Send</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifs.map(n => (
          <div key={n.id} style={{ background: "#fff", border: `0.5px solid ${n.isRead ? "#E8E8E5" : "#534AB7"}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#534AB7", flexShrink: 0 }} />}
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{n.title}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500, background: typeColors[n.type]?.bg, color: typeColors[n.type]?.color }}>{n.type}</span>
                <span style={{ fontSize: 10, color: "#999" }}>{n.createdAt}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{n.message}</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>Target: {n.targetRole}</div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: 440 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Send Notification</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                    {["General","Fee","Exam","Alert","Leave"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>Send To</label>
                  <select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} style={inputStyle}>
                    {["all","student","teacher","parent","driver"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#F5F5F3", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
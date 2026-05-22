import { useState } from "react";

const CONTACTS = [
  { id: "1", initials: "RS", bg: "#EEEDFE", color: "#534AB7", name: "Rahul Sharma", role: "Student", lastMsg: "Sir homework submit kar diya", time: "9:41 AM", unread: 2 },
  { id: "2", initials: "PK", bg: "#E1F5EE", color: "#0F6E56", name: "Priya Kapoor", role: "Parent", lastMsg: "Fee receipt chahiye thi", time: "Yesterday", unread: 0 },
  { id: "3", initials: "MT", bg: "#FAEEDA", color: "#854F0B", name: "Mr. Mahesh", role: "Teacher", lastMsg: "Attendance sheet send kar dena", time: "Yesterday", unread: 1 },
];

const MESSAGES = {
  "1": [
    { from: "them", text: "Sir homework submit kar diya", time: "9:41 AM" },
    { from: "me", text: "Theek hai, dekh lunga", time: "9:42 AM" },
  ],
  "2": [
    { from: "them", text: "Fee receipt chahiye thi", time: "Yesterday" },
    { from: "me", text: "Kal bhej deta hun", time: "Yesterday" },
  ],
  "3": [
    { from: "them", text: "Attendance sheet send kar dena", time: "Yesterday" },
  ],
};

const Chat = () => {
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MESSAGES);

  const sendMessage = () => {
    if (!input.trim() || !selected) return;
    setMessages({
      ...messages,
      [selected.id]: [...(messages[selected.id] || []), { from: "me", text: input, time: "Now" }]
    });
    setInput("");
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", display: "flex", height: "calc(100vh - 3rem)", gap: 12 }}>
      {/* Contacts */}
      <div style={{ width: 280, background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid #E8E8E5" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>Chat</div>
        </div>
        {CONTACTS.map(c => (
          <div key={c.id} onClick={() => setSelected(c)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", cursor: "pointer",
            background: selected?.id === c.id ? "#EEEDFE" : "transparent",
            borderBottom: "0.5px solid #E8E8E5"
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: c.bg,
              color: c.color, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0
            }}>{c.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{c.name}</span>
                <span style={{ fontSize: 10, color: "#999" }}>{c.time}</span>
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastMsg}</div>
            </div>
            {c.unread > 0 && (
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#534AB7",
                color: "#fff", fontSize: 10, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>{c.unread}</div>
            )}
          </div>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selected ? (
          <>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid #E8E8E5", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: selected.bg,
                color: selected.color, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, fontWeight: 500
              }}>{selected.initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: "#999" }}>{selected.role}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
              {(messages[selected.id] || []).map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                  <div style={{
                    maxWidth: "70%", padding: "8px 12px", borderRadius: 12,
                    background: m.from === "me" ? "#534AB7" : "#F5F5F3",
                    color: m.from === "me" ? "#fff" : "#1a1a1a",
                    fontSize: 12
                  }}>
                    <div>{m.text}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: "right" }}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "1rem", borderTop: "0.5px solid #E8E8E5", display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8,
                  border: "0.5px solid #E8E8E5", fontSize: 12,
                  outline: "none", fontFamily: "Inter, sans-serif"
                }}
              />
              <button onClick={sendMessage} style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: "#534AB7", color: "#fff", fontSize: 12,
                cursor: "pointer", fontWeight: 500
              }}>Send</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 32 }}>💬</div>
            <div style={{ fontSize: 13, color: "#999" }}>Select a contact to start chatting</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
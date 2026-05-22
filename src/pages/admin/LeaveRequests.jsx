import { useState } from "react";

const LEAVES = [
  { id: "1", name: "Rahul Sharma", role: "student", class: "10", leaveType: "Sick", fromDate: "2026-05-20", toDate: "2026-05-22", reason: "Fever", status: "Pending" },
  { id: "2", name: "Mrs. Kapoor", role: "teacher", class: "", leaveType: "Personal", fromDate: "2026-05-21", toDate: "2026-05-21", reason: "Family function", status: "Approved" },
  { id: "3", name: "Arjun Mehta", role: "student", class: "8", leaveType: "Family", fromDate: "2026-05-23", toDate: "2026-05-25", reason: "Wedding", status: "Pending" },
  { id: "4", name: "Mr. Singh", role: "teacher", class: "", leaveType: "Sick", fromDate: "2026-05-19", toDate: "2026-05-19", reason: "Not well", status: "Rejected" },
];

const statusColors = {
  Pending:  { bg: "#FAEEDA", color: "#854F0B" },
  Approved: { bg: "#EAF3DE", color: "#3B6D11" },
  Rejected: { bg: "#FAECE7", color: "#993C1D" },
};

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState(LEAVES);
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? leaves : leaves.filter(l => l.status === filter);

  const updateStatus = (id, status) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Leave Requests</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Approve or reject leave applications</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["All", "Pending", "Approved", "Rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer",
            border: "0.5px solid #E8E8E5", fontWeight: 500,
            background: filter === f ? "#534AB7" : "#fff",
            color: filter === f ? "#fff" : "#666"
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(l => (
          <div key={l.id} style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: "#EEEDFE",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 500, color: "#534AB7"
                }}>{l.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>{l.role === "student" ? `Student · Class ${l.class}` : "Teacher"} · {l.leaveType}</div>
                </div>
              </div>
              <span style={{
                fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 500,
                background: statusColors[l.status].bg, color: statusColors[l.status].color
              }}>{l.status}</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
              <span>📅 {l.fromDate} → {l.toDate}</span>
              <span style={{ marginLeft: 16 }}>📝 {l.reason}</span>
            </div>
            {l.status === "Pending" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => updateStatus(l.id, "Approved")} style={{
                  padding: "6px 16px", borderRadius: 8, border: "none",
                  background: "#EAF3DE", color: "#3B6D11", fontSize: 11,
                  fontWeight: 500, cursor: "pointer"
                }}>✓ Approve</button>
                <button onClick={() => updateStatus(l.id, "Rejected")} style={{
                  padding: "6px 16px", borderRadius: 8, border: "none",
                  background: "#FAECE7", color: "#993C1D", fontSize: 11,
                  fontWeight: 500, cursor: "pointer"
                }}>✗ Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveRequests;
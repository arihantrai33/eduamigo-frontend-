const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

async function call(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}
const json = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const inbox = () => call("/chat/inbox");
export const messages = (roomId, after) => call(`/chat/messages/${roomId}${after ? `?after=${encodeURIComponent(after)}` : ""}`);
export const sendMessage = (receiverId, text, files = []) => {
  const body = new FormData();
  body.append("receiverId", receiverId);
  if (text) body.append("text", text);
  files.forEach((f) => body.append("files", f));
  return call("/chat/messages", { method: "POST", body });
};
export const broadcasts = () => call("/chat/broadcasts");

export const complaintsOfChild = (studentId) => call(`/complaints/child${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ""}`);
export const complaintsForStaff = (status) => call(`/complaints${status ? `?status=${status}` : ""}`);
export const raiseComplaint = (payload) => call("/complaints", json("POST", payload));
export const replyComplaint = (id, text) => call(`/complaints/${id}/reply`, json("POST", { text }));
export const setComplaintStatus = (id, status) => call(`/complaints/${id}`, json("PATCH", { status }));

export const clock = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
export function dayLabel(d) {
  const date = new Date(d); const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}
// The time shown on a chat row: the clock today, "Yesterday", or the date.
export function rowTime(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toDateString() === new Date().toDateString() ? clock(d) : dayLabel(d);
}
export const bytes = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`);

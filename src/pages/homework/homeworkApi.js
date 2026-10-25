const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

async function call(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

export const myHomework = () => call("/homework/my");
export const childHomework = (studentId) => call(`/homework/child${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ""}`);
export const setDone = (id, done) => call(`/homework/${id}/done`, { method: done ? "POST" : "DELETE" });
export const givenHomework = () => call("/homework");
export const homeworkDetail = (id) => call(`/homework/${id}`);
export const removeHomework = (id) => call(`/homework/${id}`, { method: "DELETE" });
export const giveHomework = (form, files) => {
  const body = new FormData();
  Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") body.append(k, Array.isArray(v) ? JSON.stringify(v) : v); });
  files.forEach((f) => body.append("files", f));
  return call("/homework", { method: "POST", body });
};

// "Due today", "Due tomorrow", "Overdue by 2 days", "Due Fri, 30 Oct" (the school's calendar day).
export function dueLabel(dueDate, done = false) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = String(dueDate).split("-").map(Number);
  const days = Math.round((new Date(y, m - 1, d) - today) / 86400000);
  if (done) return { text: `Was due ${new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`, tone: "muted", days };
  if (days < 0) return { text: `Overdue by ${-days} day${days === -1 ? "" : "s"}`, tone: "bad", days };
  if (days === 0) return { text: "Due today", tone: "warn", days };
  if (days === 1) return { text: "Due tomorrow", tone: "warn", days };
  return { text: `Due ${new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`, tone: "ok", days };
}

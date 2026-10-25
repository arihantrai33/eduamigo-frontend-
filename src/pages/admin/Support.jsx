import { useState } from "react";
import axios from "axios";
import { LifeBuoy, Plus } from "lucide-react";
import { toast, errorMessage } from "../../utils/toast";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { useLoad } from "../../components/dash/helpers";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const STATUS = { open: ["Open", "ea-badge--warning"], in_progress: ["Being looked at", "ea-badge--brand"], resolved: ["Resolved", "ea-badge--success"] };
const CATS = [["technical", "Something is not working"], ["billing", "Billing or invoice"], ["account", "Accounts and access"], ["feature", "A feature request"], ["other", "Something else"]];
const field = { padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ea-edge)", fontSize: 13, background: "#F8FAFC", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const when = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Ask EduAmigo for help and follow the replies. Only the school's own requests are listed.
export default function Support() {
  const list = useLoad(async () => (await axios.get(`${API}/support/requests`, auth())).data.data, "support");
  const [form, setForm] = useState({ subject: "", category: "technical", message: "" });
  const [open, setOpen] = useState(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await axios.post(`${API}/support/requests`, form, auth()); setForm({ subject: "", category: "technical", message: "" }); toast.success("Request sent to EduAmigo"); list.reload(); }
    catch (err) { toast.error(errorMessage(err, "Could not send the request")); } finally { setBusy(false); }
  };
  const answer = async (id) => {
    setBusy(true);
    try { await axios.post(`${API}/support/requests/${id}/reply`, { message: reply }, auth()); setReply(""); list.reload(); }
    catch (err) { toast.error(errorMessage(err, "Could not send")); } finally { setBusy(false); }
  };
  return (
    <div className="ea-page--wide">
      <PageHeader title="Help and support" subtitle="Ask EduAmigo for help. Replies appear here." />
      <form onSubmit={send} className="ea-card" style={{ padding: 18, display: "grid", gap: 10, marginBottom: 16 }} aria-label="New request">
        <strong>New request</strong>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Subject<input style={field} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={140} required /></label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>About<select style={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        </div>
        <label style={{ fontSize: 12, fontWeight: 600 }}>What do you need?<textarea style={{ ...field, minHeight: 90 }} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></label>
        <div><button className="ea-btn ea-btn--primary" disabled={busy}><Plus size={16} aria-hidden="true" /> Send request</button></div>
      </form>
      {list.state === "loading" && <Skeleton rows={3} label="Loading requests" />}
      {list.state === "error" && <EmptyState plain icon={LifeBuoy} title="Could not load your requests" actions={<button type="button" className="ea-btn ea-btn--primary" onClick={list.reload}>Try again</button>} />}
      {list.state === "ok" && list.data.length === 0 && <EmptyState plain icon={LifeBuoy} title="No requests yet" text="When you ask EduAmigo for help, the conversation is kept here." />}
      {list.state === "ok" && list.data.length > 0 && (
        <ul aria-label="Your requests" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {list.data.map((r) => (
            <li key={r._id} className="ea-card" style={{ padding: "14px 18px" }}>
              <button type="button" onClick={() => setOpen(open === r._id ? null : r._id)} aria-expanded={open === r._id} style={{ all: "unset", cursor: "pointer", display: "flex", gap: 10, alignItems: "center", width: "100%", flexWrap: "wrap" }}>
                <strong style={{ flex: "1 1 220px" }}>{r.subject}</strong>
                <span className={`ea-badge ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>
                <small style={{ color: "var(--ea-muted)" }}>{when(r.createdAt)}</small>
              </button>
              {open === r._id && (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {r.messages.map((m, i) => (
                    <div key={i} style={{ background: m.by === "platform" ? "var(--brand-soft)" : "#F8FAFC", borderRadius: 10, padding: "8px 12px", fontSize: 13.5 }}>
                      <small style={{ color: "var(--ea-muted)" }}>{m.author} · {when(m.at)}</small><div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={field} aria-label="Your reply" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply" />
                    <button type="button" className="ea-btn ea-btn--primary" disabled={busy || reply.trim().length < 2} onClick={() => answer(r._id)}>Send</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

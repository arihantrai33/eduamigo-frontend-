import { useEffect, useState } from "react";
import axios from "axios";
import { toast, errorMessage } from "../../utils/toast";
import { activityLabel } from "../../utils/activity";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { History } from "lucide-react";

// School activity log: who changed what (backend: GET /api/audit).
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const CATEGORIES = [
  { value: "", label: "All activity" },
  { value: "marks.", label: "Marks" },
  { value: "fee", label: "Fees" },
  { value: "payment", label: "Online payments" },
  { value: "student", label: "Students" },
  { value: "user.", label: "Logins" },
  { value: "exam.", label: "Exams" },
  { value: "attendance.", label: "Attendance" },
  { value: "salary.", label: "Salaries" },
  { value: "notification.", label: "Notifications" },
  { value: "announcement.", label: "Announcements" },
  { value: "event.", label: "Calendar events" },
  { value: "s", label: "Sessions, classes, settings" },
];

const label = activityLabel;
const when = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function ActivityLog() {
  const [rows, setRows] = useState([]);
  const [paging, setPaging] = useState(null);
  const [filters, setFilters] = useState({ action: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    // "s" groups sessions, classes and settings, which have several prefixes.
    if (filters.action && filters.action !== "s") params.set("action", filters.action);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    axios.get(`${API}/audit?${params}`, auth())
      .then((r) => {
        const data = r.data.data || [];
        setRows(filters.action === "s" ? data.filter((x) => /^(session|class|academic|school)\b/.test(x.action)) : data);
        setPaging(r.data.pagination);
      })
      .catch((err) => toast.error(errorMessage(err, "Could not load the activity log")))
      .finally(() => setLoading(false));
  }, [filters, page]);

  const setFilter = (key, value) => { setLoading(true); setFilters((f) => ({ ...f, [key]: value })); setPage(1); };
  const goTo = (n) => { setLoading(true); setPage(n); };

  return (
    <div className="ea-page--wide" style={{ fontFamily: "inherit" }}>
      <div style={{ marginBottom: 18 }}>
        <PageHeader title="Activity Log" subtitle="Who changed marks, fees, students, logins and settings, and when" />
      </div>

      <div style={{ ...card, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={lbl}>Show
          <select style={input} value={filters.action} onChange={(e) => setFilter("action", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label style={lbl}>From<input type="date" style={input} value={filters.from} onChange={(e) => setFilter("from", e.target.value)} /></label>
        <label style={lbl}>To<input type="date" style={input} value={filters.to} onChange={(e) => setFilter("to", e.target.value)} /></label>
        {(filters.action || filters.from || filters.to) && (
          <button style={ghost} onClick={() => { setLoading(true); setFilters({ action: "", from: "", to: "" }); setPage(1); }}>Clear</button>
        )}
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {loading && <Skeleton rows={3} label="Loading" />}
        {!loading && rows.length === 0 && <EmptyState plain icon={History} title="No activity found" text="Nothing has been recorded for this selection yet. Widen the dates or choose all activity." />}
        {!loading && rows.map((r) => (
          <div key={r._id} style={{ borderBottom: "1px solid #F1F5F9" }}>
            <button onClick={() => setOpen(open === r._id ? null : r._id)} style={rowBtn}>
              <span style={{ width: 150, flexShrink: 0, fontSize: 12, color: "var(--ea-muted)" }}>{when(r.createdAt)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{label(r.action)}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--ea-muted)" }}>
                  by {r.actor?.name || "Unknown"}{r.actorRole ? ` (${r.actorRole})` : ""}
                  {r.impersonatedBy && <span style={supportTag}>{r.impersonatedBy}</span>}
                </span>
              </span>
              <span style={{ fontSize: 12, color: "var(--brand-text)", fontWeight: 600 }}>{open === r._id ? "Hide" : "Details"}</span>
            </button>
            {open === r._id && (
              <pre style={details}>{JSON.stringify({ record: r.targetType ? `${r.targetType} ${r.targetId || ""}`.trim() : undefined, ...r.details }, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>

      {paging && paging.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <button style={ghost} disabled={page <= 1} onClick={() => goTo(page - 1)}>← Newer</button>
          <span style={{ fontSize: 12, color: "var(--ea-muted)" }}>Page {paging.page} of {paging.pages}</span>
          <button style={ghost} disabled={page >= paging.pages} onClick={() => goTo(page + 1)}>Older →</button>
        </div>
      )}
    </div>
  );
}

const card = { background: "#fff", border: "1px solid #E8E8E5", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 16 };
const lbl = { fontSize: 11, color: "var(--ea-muted)", fontWeight: 600, display: "flex", flexDirection: "column", gap: 4 };
const input = { padding: "8px 10px", borderRadius: 8, border: "1px solid var(--ea-edge)", fontSize: 13, color: "#0F172A", background: "#F8FAFC" };
const ghost = { padding: "7px 12px", borderRadius: 8, border: "1px solid var(--ea-edge)", background: "#fff", color: "#334155", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const rowBtn = { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer" };
const supportTag = { marginLeft: 6, padding: "1px 6px", borderRadius: 6, background: "#FEF3C7", color: "#92400E", fontSize: 10, fontWeight: 700 };
const details = { margin: "0 16px 12px", padding: 12, background: "#F8FAFC", border: "1px solid var(--ea-edge)", borderRadius: 8, fontSize: 11.5, color: "#334155", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 280, overflow: "auto" };

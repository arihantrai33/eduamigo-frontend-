import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Target, CheckCircle2, CircleHelp, LifeBuoy, Gauge, FileText, Bot, Loader2 } from "lucide-react";
import AskKnowledge from "./AskKnowledge";
import { getAssistantMetrics, getAssistantEvaluation, getTickets, updateTicket, errorText } from "../../api/assistant";

// EduAmigo Ask insights: how well the assistant routes and resolves questions (PS18 metrics),
// what people ask about, and every hand-off ticket in the school.

const STATUS_LABEL = { open: "Open", in_progress: "In progress", resolved: "Resolved" };
const pct = (v) => `${Number(v || 0).toFixed(1).replace(/\.0$/, "")}%`;
const secs = (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);

function Kpi({ icon: Icon, label, value, note }) {
  return (
    <div style={s.kpi}>
      <div style={s.kpiIcon}><Icon size={18} aria-hidden /></div>
      <div style={{ minWidth: 0 }}>
        <div style={s.kpiValue}>{value}</div>
        <div style={s.kpiLabel}>{label}</div>
        {note && <div style={s.kpiNote}>{note}</div>}
      </div>
    </div>
  );
}

export default function AskInsights() {
  const [days, setDays] = useState(30);
  const [metrics, setMetrics] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [status, setStatus] = useState("open");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("insights");
  const [resolving, setResolving] = useState(null); // ticket being resolved, with its note
  const [note, setNote] = useState("");

  const load = useCallback(() => Promise.all([getAssistantMetrics(days), getAssistantEvaluation()])
    .then(([m, e]) => { setMetrics(m); setEvaluation(e); setError(""); })
    .catch((err) => setError(errorText(err))), [days]);
  const refresh = () => { setLoading(true); load().finally(() => setLoading(false)); };
  const loadTickets = useCallback(() => {
    getTickets({ scope: "all", ...(status ? { status } : {}) }).then(setTickets).catch((err) => setError(errorText(err)));
  }, [status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTickets(); }, [loadTickets]);

  const resolve = async (t, next, text = "") => {
    try {
      await updateTicket(t.id, { status: next, ...(text.trim() ? { note: text.trim() } : {}) });
      setResolving(null); setNote("");
      loadTickets(); load();
    } catch (err) { setError(errorText(err)); }
  };

  const ev = evaluation;
  return (
    <div style={s.page}>
      <div style={s.head}>
        <div>
          <h1 style={s.h1}>EduAmigo Ask</h1>
          <div style={s.sub}>How the assistant routes and resolves questions, and what it handed to staff.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={s.select} aria-label="Period">
            {[7, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
          <button type="button" onClick={refresh} style={s.btn} disabled={loading}>
            {loading ? <Loader2 size={15} className="ins-spin" /> : <RefreshCw size={15} />} Refresh
          </button>
        </div>
      </div>
      <div style={s.tabs} role="tablist">
        {[["insights", "Insights and tickets"], ["knowledge", "School documents"]].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} style={tab === k ? s.tabOn : s.tabOff}>{l}</button>
        ))}
      </div>
      {error && <div style={s.error}>{error}</div>}
      {tab === "knowledge" ? <AskKnowledge /> : (<>

      <div style={s.kpis}>
        <Kpi icon={Target} label="Routing accuracy" value={ev ? pct(ev.overall.routingAccuracy) : "-"} note={ev ? `Holdout ${pct(ev.holdout.fullyCorrect)} fully correct` : ""} />
        <Kpi icon={CheckCircle2} label="End-to-end resolution" value={metrics ? pct(metrics.rates.resolution) : "-"} note={metrics ? `${metrics.resolution.resolvedByAssistant} by the assistant, ${metrics.resolution.resolvedByStaff} by staff, ${metrics.resolution.pending} waiting on staff` : ""} />
        <Kpi icon={CircleHelp} label="Asked to clarify" value={metrics ? pct(metrics.rates.clarify) : "-"} note="instead of guessing" />
        <Kpi icon={LifeBuoy} label="Handed to staff" value={metrics ? pct(metrics.rates.handoff) : "-"} note={metrics ? `${metrics.tickets.open || 0} open tickets` : ""} />
        <Kpi icon={FileText} label="Answers with sources" value={metrics ? pct(metrics.rates.sourceCitation) : "-"} note={metrics?.grounding && (metrics.grounding.composed + metrics.grounding.keptStandard) > 0 ? `${pct(metrics.grounding.rejectedPct)} of model-written answers failed the fact check and were replaced` : ""} />
        <Kpi icon={Gauge} label="Speed (p95)" value={metrics ? secs(metrics.speed.p95) : "-"} note={metrics ? `median ${secs(metrics.speed.p50)}` : ""} />
      </div>

      <div style={s.grid}>
        <section style={s.card}>
          <h2 style={s.h2}>Routing evaluation</h2>
          {ev ? (
            <>
              <div style={s.muted}>{ev.overall.questions} labelled questions, read by {ev.mode}{ev.savedAt ? ` (run on ${new Date(ev.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})` : " (free run; no language model)"}. Holdout and Fresh questions were never used to tune the assistant.</div>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Set</th><th style={s.th}>Questions</th><th style={s.th}>Topic</th><th style={s.th}>Action</th><th style={s.th}>Both</th></tr></thead>
                <tbody>
                  {[["Development", ev.dev], ["Holdout", ev.holdout], ["Unseen", ev.unseen], ["Fresh (never tuned on)", ev.fresh], ["All", ev.overall]].filter(([, r]) => r?.questions).map(([n, r]) => (
                    <tr key={n}><td style={s.td}>{n}</td><td style={s.td}>{r.questions}</td><td style={s.td}>{pct(r.routingAccuracy)}</td><td style={s.td}>{pct(r.actionAccuracy)}</td><td style={s.td}><strong>{pct(r.fullyCorrect)}</strong></td></tr>
                  ))}
                </tbody>
              </table>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Topic</th><th style={s.th}>Precision</th><th style={s.th}>Recall</th><th style={s.th}>F1</th><th style={s.th}>Questions</th></tr></thead>
                <tbody>
                  {Object.entries(ev.overall.perTopic).map(([k, v]) => (
                    <tr key={k}><td style={s.td}>{k}</td><td style={s.td}>{v.precision.toFixed(2)}</td><td style={s.td}>{v.recall.toFixed(2)}</td><td style={s.td}><strong>{v.f1.toFixed(2)}</strong></td><td style={s.td}>{v.support}</td></tr>
                  ))}
                </tbody>
              </table>
              {ev.overall.calibration && (
                <>
                  <h3 style={s.h3}>Is the confidence trustworthy?</h3>
                  <div style={s.muted}>Questions grouped by the confidence the assistant reported, and how many it really got right. Calibration error {ev.overall.calibration.ece.toFixed(3)} (0 is perfect). It answers directly at {Math.round((ev.thresholds?.answer || 0.75) * 100)}% or more and asks a question below that.</div>
                  <table style={s.table}>
                    <thead><tr><th style={s.th}>Reported confidence</th><th style={s.th}>Questions</th><th style={s.th}>Actually right</th></tr></thead>
                    <tbody>
                      {ev.overall.calibration.buckets.map((b) => (
                        <tr key={b.from}><td style={s.td}>{Math.round(b.from * 100)}% to {Math.round(b.to * 100)}%</td><td style={s.td}>{b.questions}</td><td style={s.td}>{b.questions ? <strong>{pct(b.accuracy)}</strong> : "-"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {ev.answers && (
                <>
                  <h3 style={s.h3}>Did people get the right answer?</h3>
                  <div style={s.muted}>{ev.answers.questions} questions asked as a parent, student, teacher and admin on a demo school, each checked for the exact facts it must contain, the facts it must not (another child's data) and who a hand-off went to. {ev.answers.fresh?.questions ? `${ev.answers.fresh.correct} of ${ev.answers.fresh.questions} fresh questions written after the last fixes were right. ` : ""}Run on {new Date(ev.answers.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.</div>
                  <table style={s.table}>
                    <thead><tr><th style={s.th}>Asked as</th><th style={s.th}>Questions</th><th style={s.th}>Correct</th></tr></thead>
                    <tbody>
                      {Object.entries(ev.answers.byRole).map(([k, v]) => <tr key={k}><td style={s.td}>{k}</td><td style={s.td}>{v.questions}</td><td style={s.td}><strong>{pct((v.correct / v.questions) * 100)}</strong></td></tr>)}
                      <tr><td style={s.td}>All</td><td style={s.td}>{ev.answers.questions}</td><td style={s.td}><strong>{pct(ev.answers.accuracy)}</strong></td></tr>
                    </tbody>
                  </table>
                </>
              )}
              {ev.overall.mistakes.length > 0 && (
                <>
                  <h3 style={s.h3}>Questions it got wrong</h3>
                  {ev.overall.mistakes.map((m) => (
                    <div key={m.id} style={s.mistake}>
                      <span>"{m.q}" <span style={s.muted}>({m.role})</span></span>
                      <span style={s.muted}>expected {[].concat(m.expected).join(" + ")} / {m.expectedAction}; got {m.got.join(" + ")} / {m.gotAction}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : <div style={s.muted}>Loading...</div>}
        </section>

        <section style={s.card}>
          <h2 style={s.h2}>Live questions</h2>
          {metrics ? (
            <>
              <div style={s.muted}>{metrics.questions} questions in the last {metrics.period.days} days; {pct(metrics.routing.keywordOnly)} routed by keywords alone, {metrics.ai.questions} used the language model{metrics.model?.providers?.length ? ` (${metrics.model.providers.map((p) => `${p.name}: ${p.model}${p.coolingOff ? ", paused" : ""}`).join("; ")})` : " (none configured)"}.</div>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Topic</th><th style={s.th}>Asked</th><th style={s.th}>Answered</th><th style={s.th}>Clarified</th><th style={s.th}>Handed off</th><th style={s.th}>Avg. confidence</th></tr></thead>
                <tbody>
                  {metrics.domains.length === 0 && <tr><td style={s.td} colSpan={6}>No questions yet.</td></tr>}
                  {metrics.domains.map((d) => (
                    <tr key={d.domain}><td style={s.td}>{d.label}</td><td style={s.td}>{d.questions}</td><td style={s.td}>{d.answered}</td><td style={s.td}>{d.clarified}</td><td style={s.td}>{d.handedOff}</td><td style={s.td}>{d.avgConfidence.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div style={s.feedbackRow}>
                <Bot size={14} aria-hidden /> Feedback: {metrics.feedback.helpful} helpful, {metrics.feedback.unhelpful} not helpful
              </div>
              {metrics.needsAttention.length > 0 && (
                <>
                  <h3 style={s.h3}>Needs attention (clarified, no data or handed off)</h3>
                  {metrics.needsAttention.map((n) => <div key={n.text} style={s.mistake}><span>"{n.text}"</span><span style={s.muted}>{n.count}x</span></div>)}
                </>
              )}
            </>
          ) : <div style={s.muted}>Loading...</div>}
        </section>
      </div>

      <section style={s.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ ...s.h2, margin: 0 }}>Hand-off tickets</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {[["open", "Open"], ["in_progress", "In progress"], ["resolved", "Resolved"], ["", "All"]].map(([k, l]) => (
              <button key={k || "all"} type="button" onClick={() => setStatus(k)} style={status === k ? s.segOn : s.segOff}>{l}</button>
            ))}
          </div>
        </div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>Ticket</th><th style={s.th}>Issue</th><th style={s.th}>From</th><th style={s.th}>With</th><th style={s.th}>Status</th><th style={s.th} /></tr></thead>
          <tbody>
            {tickets?.length === 0 && <tr><td style={s.td} colSpan={6}>No tickets.</td></tr>}
            {tickets?.map((t) => (
              <tr key={t.id}>
                <td style={s.td}><strong>{t.number}</strong>{t.priority === "high" && <div style={s.urgent}>Urgent</div>}</td>
                <td style={{ ...s.td, maxWidth: 380 }}><strong>{t.title || t.question}</strong>{t.summary && <div style={s.muted}>{t.summary}</div>}{t.priority === "high" && t.priorityReason && <div style={s.muted}>{t.priorityReason}</div>}{t.notes?.length ? <div style={s.muted}>Latest: {t.notes[t.notes.length - 1].text}</div> : null}{t.original && t.original !== t.title && <details><summary style={s.muted}>Original message</summary><div style={s.muted}>"{t.original}"</div></details>}</td>
                <td style={s.td}>{t.raisedBy?.name} <span style={s.muted}>({t.raisedBy?.role})</span>{t.student && <div style={s.muted}>about {t.student.name} {t.student.class}</div>}</td>
                <td style={s.td}>{t.sentTo?.length ? t.sentTo.map((p) => p.name).join(", ") : (t.domainLabel || "General")}<div style={s.muted}>{t.domainLabel || "General"}{t.delivery?.some((d) => !d.ok) ? " · notification failed" : ""}</div></td>
                <td style={s.td}>{STATUS_LABEL[t.status]}</td>
                <td style={s.td}>
                  {t.status === "open" && <button type="button" style={s.btnSm} onClick={() => resolve(t, "in_progress")}>In progress</button>}
                  {t.status !== "resolved" && <button type="button" style={s.btnPrimary} onClick={() => { setResolving(t.id); setNote(""); }}>Resolve</button>}
                  {resolving === t.id && (
                    <div style={s.resolveBox}>
                      <textarea value={note} maxLength={1000} rows={3} onChange={(e) => setNote(e.target.value)} style={s.noteInput} placeholder={`Note for ${t.raisedBy?.name || "the sender"} (optional)`} aria-label="Resolution note" autoFocus />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" style={s.btnPrimary} onClick={() => resolve(t, "resolved", note)}>Mark resolved</button>
                        <button type="button" style={s.btnSm} onClick={() => setResolving(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      </>)}
      <style>{".ins-spin{animation:insspin 1s linear infinite}@keyframes insspin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

const s = {
  tabs: { display: "flex", gap: 6, borderBottom: "1px solid var(--border)" },
  tabOn: { padding: "9px 14px", border: "none", borderBottom: "2px solid var(--brand-dark)", background: "none", color: "var(--brand-dark)", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  tabOff: { padding: "9px 14px", border: "none", borderBottom: "2px solid transparent", background: "none", color: "var(--subtext)", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  resolveBox: { display: "grid", gap: 6, marginTop: 8, minWidth: 220 },
  noteInput: { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--input)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", resize: "vertical" },
  page: { padding: 24, fontFamily: "inherit", color: "var(--text)", display: "grid", gap: 16 },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" },
  h1: { fontSize: 22, fontWeight: 800, margin: 0 },
  sub: { fontSize: 13, color: "var(--subtext)", marginTop: 4 },
  h2: { fontSize: 15, fontWeight: 800, margin: "0 0 8px" },
  h3: { fontSize: 13, fontWeight: 700, margin: "14px 0 6px" },
  muted: { fontSize: 12, color: "var(--subtext)" },
  kpis: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 },
  kpi: { display: "flex", gap: 12, alignItems: "flex-start", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 },
  kpiIcon: { width: 34, height: 34, borderRadius: 10, background: "var(--brand-soft)", color: "var(--brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  kpiValue: { fontSize: 20, fontWeight: 800 },
  kpiLabel: { fontSize: 12, fontWeight: 600, color: "var(--subtext)" },
  kpiNote: { fontSize: 11, color: "var(--subtext)", marginTop: 2 },
  // A column is at least 380 px, or the full width on a narrower screen (a phone), so the page never scrolls sideways.
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: 16 },
  card: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 10, fontSize: 13 },
  th: { textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--subtext)", padding: "6px 8px", borderBottom: "1px solid var(--border)" },
  td: { padding: "7px 8px", borderBottom: "1px solid var(--border)", verticalAlign: "top" },
  mistake: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, padding: "5px 0", borderBottom: "1px dashed var(--border)", flexWrap: "wrap" },
  feedbackRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--subtext)", marginTop: 10 },
  select: { padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input)", color: "var(--text)", fontSize: 13 },
  btn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--brand-border)", background: "var(--card)", color: "var(--brand-dark)", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnSm: { padding: "5px 9px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 12, cursor: "pointer", marginRight: 6 },
  btnPrimary: { padding: "5px 10px", borderRadius: 8, border: "none", background: "var(--brand-gradient)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  segOn: { padding: "5px 11px", borderRadius: 999, border: "1px solid var(--brand-border)", background: "var(--brand-soft)", color: "var(--brand-dark)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  segOff: { padding: "5px 11px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--card)", color: "var(--subtext)", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  urgent: { display: "inline-block", fontSize: 10, fontWeight: 800, color: "#b91c1c", background: "#fee2e2", borderRadius: 6, padding: "1px 6px", marginTop: 3 },
  error: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 12, padding: "9px 12px", fontSize: 13 },
};

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquareText, SendHorizontal, X, ThumbsUp, ThumbsDown, FileText, ArrowUpRight, LifeBuoy, Loader2, Inbox, CheckCircle2, Route,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { hasFeature } from "../utils/features";
import { can } from "../utils/permissions";
import { userTheme, brandLook, alpha } from "../utils/theme";
import { askAssistant, sendFeedback, getAssistantIntro, getTickets, updateTicket, errorText } from "../api/assistant";

// EduAmigo Ask: one assistant for every school topic, available on every signed-in screen.
// Each answer shows where it was routed (topic and confidence), the records it came from, and a link to
// the screen; unclear questions come back with choices; serious ones become a ticket for a person.

const PORTALS = ["/student", "/parent", "/teacher", "/admin"];
// Screens with their own bottom actions or their own AI chat: the button would cover them.
const HIDDEN_ON = ["/student/bus", "/parent/bus", "/student/chat", "/parent/chat", "/teacher/chat", "/student/revise", "/admin/chat"];
const METHOD_LABEL = { keywords: "keywords", model: "AI", context: "follow-up", choice: "your choice", rule: "safety rule" };
const STATUS_LABEL = { open: "Open", in_progress: "In progress", resolved: "Resolved" };

const convKey = (user) => `eduamigo_ask_conv_${user?._id || user?.id || ""}`;

// Answer text: "- " lines become a list, other lines paragraphs.
function AnswerText({ text }) {
  const blocks = [];
  for (const line of String(text || "").split("\n")) {
    if (/^\s*-\s+/.test(line)) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "list") last.items.push(line.replace(/^\s*-\s+/, ""));
      else blocks.push({ type: "list", items: [line.replace(/^\s*-\s+/, "")] });
    } else if (line.trim()) blocks.push({ type: "p", text: line });
  }
  return blocks.map((b, i) => (b.type === "list"
    ? <ul key={i} style={s.list}>{b.items.map((it, j) => <li key={j} style={{ marginBottom: 3 }}>{it}</li>)}</ul>
    : <p key={i} style={s.p}>{b.text}</p>));
}

function Reply({ r, onOption, onLink, disabled }) {
  const pct = Math.round((r.confidence || 0) * 100);
  return (
    <div style={{ ...s.card, ...(r.action === "handoff" ? s.cardHandoff : {}) }}>
      {r.label && (
        <div style={s.route}>
          <Route size={12} aria-hidden />
          <span>{r.label}</span>
          {r.action !== "handoff" && <span style={s.routeMeta}>· {pct}% · {METHOD_LABEL[r.method] || r.method}</span>}
        </div>
      )}
      <AnswerText text={r.text} />
      {r.ticket && (
        <div style={s.ticket}><LifeBuoy size={14} aria-hidden /> Ticket {r.ticket.number} · {r.ticket.team}</div>
      )}
      {r.sources?.length > 0 && (
        <div style={s.sources}>
          {r.sources.map((src, i) => <span key={i} style={s.source}><FileText size={11} aria-hidden /> {src.label}</span>)}
        </div>
      )}
      {(r.link || r.actions?.length > 0) && (
        <div style={s.links}>
          {r.actions?.map((a, i) => <button key={`a${i}`} type="button" style={s.primaryLink} onClick={() => onLink(a.path)}>{a.label}</button>)}
          {r.link && <button type="button" style={s.link} onClick={() => onLink(r.link.path)}>{r.link.label} <ArrowUpRight size={13} aria-hidden /></button>}
        </div>
      )}
      {r.options?.length > 0 && (
        <div style={s.options}>
          {r.options.map((o, i) => (
            <button key={i} type="button" disabled={disabled} style={o.type === "handoff" ? s.optionMuted : s.option} onClick={() => onOption(o)}>{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Feedback({ turn, onRate }) {
  if (!turn.queryId || turn.replies.every((r) => ["clarify", "handoff"].includes(r.action))) return null;
  return (
    <div style={s.feedback}>
      {turn.rated ? <span>Thanks for the feedback</span> : (
        <>
          <span>Was this helpful?</span>
          <button type="button" aria-label="Helpful" style={s.rate} onClick={() => onRate(turn, true)}><ThumbsUp size={14} /></button>
          <button type="button" aria-label="Not helpful" style={s.rate} onClick={() => onRate(turn, false)}><ThumbsDown size={14} /></button>
        </>
      )}
    </div>
  );
}

function Requests({ user }) {
  const staff = !["student", "parent"].includes(user.role);
  const seesAll = can(user, "assistant.insights");
  const [scope, setScope] = useState(staff ? (seesAll ? "all" : "assigned") : "mine");
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => getTickets({ scope })
    .then((list) => { setItems(list); setError(""); })
    .catch((e) => setError(errorText(e))), [scope]);
  useEffect(() => { load(); }, [load]);

  const act = async (t, status) => {
    const note = status === "resolved" ? window.prompt(`Note for ${t.raisedBy?.name || "the sender"} (optional):`, "") : "";
    if (note === null) return;
    setBusy(t.id);
    try {
      const fresh = await updateTicket(t.id, { status, ...(note ? { note } : {}) });
      setItems((list) => list.map((x) => (x.id === t.id ? fresh : x)));
    } catch (e) { setError(errorText(e)); }
    setBusy(null);
  };

  return (
    <div style={s.scroll}>
      {staff && (
        <div style={s.segment}>
          {[["assigned", "Sent to me"], ...(seesAll ? [["all", "All"]] : []), ["mine", "Raised by me"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setScope(k)} style={scope === k ? s.segOn : s.segOff}>{l}</button>
          ))}
        </div>
      )}
      {error && <div style={s.error}>{error}</div>}
      {!items && !error && <div style={s.empty}><Loader2 size={18} className="ask-spin" /></div>}
      {items?.length === 0 && (
        <div style={s.empty}><Inbox size={28} aria-hidden /><div style={{ marginTop: 8 }}>No requests yet.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Questions EduAmigo Ask passes to school staff appear here.</div></div>
      )}
      {items?.map((t) => (
        <div key={t.id} style={s.ticketCard}>
          <div style={s.ticketHead}>
            <strong>{t.number}</strong>
            {t.priority === "high" && <span style={s.urgent}>Urgent</span>}
            <span style={{ ...s.status, ...(t.status === "resolved" ? s.statusDone : {}) }}>{STATUS_LABEL[t.status]}</span>
          </div>
          <div style={s.ticketQ}>"{t.question}"</div>
          <div style={s.ticketMeta}>
            {t.raisedBy?.name && staff ? `${t.raisedBy.name} (${t.raisedBy.role})` : ""}{t.student ? ` · about ${t.student.name} ${t.student.class || ""}` : ""}
            {` · ${new Date(t.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`}
          </div>
          {t.notes?.length > 0 && <div style={s.ticketNote}>{t.notes[t.notes.length - 1].by ? `${t.notes[t.notes.length - 1].by}: ` : ""}{t.notes[t.notes.length - 1].text}</div>}
          {staff && scope !== "mine" && t.status !== "resolved" && (
            <div style={s.links}>
              {t.status === "open" && <button type="button" disabled={busy === t.id} style={s.link} onClick={() => act(t, "in_progress")}>Mark in progress</button>}
              <button type="button" disabled={busy === t.id} style={s.primaryLink} onClick={() => act(t, "resolved")}><CheckCircle2 size={13} aria-hidden /> Resolve</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AskWidget() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("chat");
  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(null);
  const [wide, setWide] = useState(() => window.innerWidth >= 900);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const convRef = useRef(null);

  const onPortal = PORTALS.some((p) => pathname.startsWith(p)) && !HIDDEN_ON.some((p) => pathname.startsWith(p));
  const enabled = !!user && onPortal && !user.mustChangePassword && hasFeature(user, "ai_assistant") && user.role !== "driver";
  const isAdminArea = pathname.startsWith("/admin");

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    try { convRef.current = sessionStorage.getItem(convKey(user)) || null; } catch { convRef.current = null; }
  }, [user]);

  useEffect(() => {
    if (open && !intro && enabled) getAssistantIntro().then(setIntro).catch(() => setIntro({ suggestions: [] }));
  }, [open, intro, enabled]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns, busy, open]);
  useEffect(() => { if (open && tab === "chat") setTimeout(() => inputRef.current?.focus(), 50); }, [open, tab]);

  const send = useCallback(async (text, choice) => {
    const message = String(text || "").trim();
    if ((!message && !choice) || busy) return;
    setTurns((t) => [...t, { id: Date.now(), user: message }]);
    setInput("");
    setBusy(true);
    try {
      const out = await askAssistant({ message, conversationId: convRef.current, choice });
      convRef.current = out.conversationId;
      try { sessionStorage.setItem(convKey(user), out.conversationId); } catch { /* private mode */ }
      setTurns((t) => [...t, { id: `${Date.now()}a`, queryId: out.queryId, replies: out.replies }]);
    } catch (err) {
      setTurns((t) => [...t, { id: `${Date.now()}e`, error: errorText(err) }]);
    }
    setBusy(false);
  }, [busy, user]);

  const rate = async (turn, helpful) => {
    setTurns((t) => t.map((x) => (x.id === turn.id ? { ...x, rated: true } : x)));
    try { await sendFeedback(turn.queryId, helpful); } catch { /* feedback is best effort */ }
  };

  const goTo = (path) => {
    if (!path) return;
    // The admin side panel can stay open next to the page; the phone-frame chat covers the whole screen, so it closes.
    if (!(isAdminArea && wide)) setOpen(false);
    navigate(path);
  };

  const newChat = () => {
    convRef.current = null;
    try { sessionStorage.removeItem(convKey(user)); } catch { /* ignore */ }
    setTurns([]);
  };

  const panelStyle = useMemo(() => (isAdminArea && wide ? s.panelSide : s.panelPhone), [isAdminArea, wide]);
  // Same look as the school's home screens: a soft tint with dark text for light-style schools,
  // the brand gradient with white text for bold ones.
  const theme = useMemo(() => userTheme(user), [user]);
  const look = useMemo(() => brandLook(theme), [theme]);
  if (!enabled) return null;

  const fabStyle = {
    ...(isAdminArea ? s.fabAdmin : s.fab),
    ...(theme.isLight
      ? { background: "#fff", color: theme.dark, border: `1px solid ${alpha(theme.primary, 0.28)}`, boxShadow: `0 6px 18px ${alpha(theme.deep, 0.18)}` }
      : { background: "var(--brand-gradient)", color: "#fff", border: "none", boxShadow: `0 6px 18px ${alpha(theme.deep, 0.35)}` }),
  };

  return (
    <>
      {!open && (
        <button type="button" aria-label="Ask EduAmigo" title="Ask EduAmigo" style={fabStyle} onClick={() => setOpen(true)}>
          <MessageSquareText size={isAdminArea ? 20 : 22} strokeWidth={2} aria-hidden />
          {isAdminArea && <span style={s.fabText}>Ask EduAmigo</span>}
        </button>
      )}
      {open && (
        <div role="dialog" aria-label="EduAmigo Ask" style={panelStyle}>
          <div style={{ ...s.header, background: look.header, color: look.text, borderBottom: look.border }}>
            <div style={{ ...s.badge, background: theme.isLight ? "#fff" : "rgba(255,255,255,0.18)", color: theme.isLight ? theme.dark : "#fff", border: look.border }}>
              <MessageSquareText size={18} strokeWidth={2} aria-hidden />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.title}>EduAmigo Ask</div>
              <div style={{ ...s.subtitle, color: look.muted }}>Fees, attendance, exams, bus and more</div>
            </div>
            <button type="button" aria-label="Close" style={{ ...s.iconBtn, background: look.glass, color: look.text, border: look.border }} onClick={() => setOpen(false)}><X size={18} /></button>
          </div>
          <div style={s.tabs}>
            {[["chat", "Chat"], ["requests", "Requests"]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} style={tab === k ? s.tabOn : s.tabOff}>{l}</button>
            ))}
            {tab === "chat" && turns.length > 0 && <button type="button" style={s.newChat} onClick={newChat}>New chat</button>}
          </div>

          {tab === "requests" ? <Requests user={user} /> : (
            <>
              <div style={s.scroll}>
                {turns.length === 0 && (
                  <div style={s.welcome}>
                    <div style={s.welcomeTitle}>How can I help{user?.name ? `, ${String(user.name).split(" ")[0]}` : ""}?</div>
                    <div style={s.welcomeText}>Ask in English, Hindi or Hinglish. You can ask about more than one thing at once, for example "fees kitni baki hai aur kal exam kab hai?"</div>
                    <div style={s.options}>
                      {(intro?.suggestions || []).map((o) => (
                        <button key={o.label} type="button" style={s.option} onClick={() => send(o.value)}>{o.label}</button>
                      ))}
                    </div>
                  </div>
                )}
                {turns.map((t) => (
                  t.user !== undefined ? (
                    t.user ? <div key={t.id} style={s.userRow}><div style={s.userBubble}>{t.user}</div></div> : null
                  ) : t.error ? (
                    <div key={t.id} style={s.error}>{t.error}</div>
                  ) : (
                    <div key={t.id}>
                      {t.replies.map((r, i) => (
                        <Reply key={i} r={r} disabled={busy} onLink={goTo} onOption={(o) => send(o.label, o.type === "ask" ? { type: "ask", value: o.value } : { type: o.type, value: o.value })} />
                      ))}
                      <Feedback turn={t} onRate={rate} />
                    </div>
                  )
                ))}
                {busy && <div style={s.typing}><Loader2 size={16} className="ask-spin" aria-hidden /> Looking it up</div>}
                <div ref={endRef} />
              </div>
              <form style={s.inputBar} onSubmit={(e) => { e.preventDefault(); send(input); }}>
                <input
                  ref={inputRef} value={input} maxLength={500} onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about fees, attendance, exams, bus..." aria-label="Your question" style={s.input}
                />
                <button type="submit" aria-label="Send" disabled={busy || !input.trim()} style={{ ...s.send, opacity: busy || !input.trim() ? 0.5 : 1 }}>
                  <SendHorizontal size={18} />
                </button>
              </form>
            </>
          )}
          <style>{".ask-spin{animation:askspin 1s linear infinite}@keyframes askspin{to{transform:rotate(360deg)}}"}</style>
        </div>
      )}
    </>
  );
}

const font = "'Inter','Segoe UI',sans-serif";
const s = {
  // Phone: a round button inside the app frame, just above the bottom navigation.
  fab: {
    position: "fixed", bottom: 88, right: 16, zIndex: 900, width: 52, height: 52, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: font,
  },
  // Admin portal (desktop): a labelled button in the corner.
  fabAdmin: {
    position: "fixed", bottom: 24, right: 24, zIndex: 900, display: "flex", alignItems: "center", gap: 8, padding: "11px 16px",
    borderRadius: 12, fontFamily: font, fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  fabText: { letterSpacing: 0.1 },
  // Phone: fills the app frame exactly (the frame is the containing block, see App.jsx).
  panelPhone: { position: "fixed", inset: 0, zIndex: 1000, background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: font },
  panelSide: {
    position: "fixed", top: 0, bottom: 0, right: 0, width: 420, zIndex: 1000, background: "var(--bg)", display: "flex", flexDirection: "column",
    fontFamily: font, boxShadow: "-8px 0 30px rgba(0,0,0,0.14)", borderLeft: "1px solid var(--border)",
  },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "18px 16px 14px" },
  badge: { width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  title: { fontSize: 16, fontWeight: 800, letterSpacing: 0.1 },
  subtitle: { fontSize: 12, marginTop: 2 },
  iconBtn: { borderRadius: 10, padding: 7, cursor: "pointer", display: "flex" },
  tabs: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "var(--card)", borderBottom: "1px solid var(--border)" },
  tabOn: { padding: "6px 14px", borderRadius: 999, border: "1px solid var(--brand-border)", background: "var(--brand-soft)", color: "var(--brand-dark)", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  tabOff: { padding: "6px 14px", borderRadius: 999, border: "1px solid transparent", background: "transparent", color: "var(--subtext)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  newChat: { marginLeft: "auto", background: "none", border: "none", color: "var(--brand-dark)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  scroll: { flex: 1, overflowY: "auto", padding: "14px 12px 8px" },
  welcome: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 },
  welcomeTitle: { fontSize: 16, fontWeight: 800, color: "var(--text)" },
  welcomeText: { fontSize: 13, color: "var(--subtext)", margin: "6px 0 12px", lineHeight: 1.5 },
  userRow: { display: "flex", justifyContent: "flex-end", margin: "10px 0" },
  userBubble: { maxWidth: "82%", background: "var(--brand-gradient)", color: "#fff", padding: "9px 13px", borderRadius: "16px 16px 4px 16px", fontSize: 14, lineHeight: 1.45, textShadow: "0 1px 1px rgba(0,0,0,0.15)", wordBreak: "break-word" },
  card: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px 16px 16px 4px", padding: "11px 13px", margin: "8px 0", maxWidth: "92%", fontSize: 14, color: "var(--text)", lineHeight: 1.5 },
  cardHandoff: { borderColor: "#f3d9a4", background: "linear-gradient(0deg, rgba(255,248,235,0.6), rgba(255,248,235,0.6)), var(--card)" },
  route: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--brand-dark)", marginBottom: 6 },
  routeMeta: { fontWeight: 600, color: "var(--subtext)" },
  p: { margin: "0 0 6px" },
  list: { margin: "0 0 6px", paddingLeft: 18 },
  ticket: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#92400e", background: "#fef3c7", borderRadius: 8, padding: "4px 8px", marginTop: 4 },
  sources: { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 },
  source: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--brand-dark)", background: "var(--brand-soft)", border: "1px solid var(--brand-border)", borderRadius: 6, padding: "2px 7px" },
  links: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 },
  link: { display: "inline-flex", alignItems: "center", gap: 4, background: "var(--card)", border: "1px solid var(--brand-border)", color: "var(--brand-dark)", borderRadius: 10, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  primaryLink: { display: "inline-flex", alignItems: "center", gap: 4, background: "var(--brand-gradient)", border: "none", color: "#fff", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", textShadow: "0 1px 1px rgba(0,0,0,0.15)" },
  options: { display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 },
  option: { background: "var(--brand-soft)", border: "1px solid var(--brand-border)", color: "var(--brand-dark)", borderRadius: 999, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  optionMuted: { background: "var(--card)", border: "1px dashed var(--border)", color: "var(--subtext)", borderRadius: 999, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  feedback: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--subtext)", margin: "0 0 10px 4px" },
  rate: { background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "3px 6px", color: "var(--subtext)", cursor: "pointer", display: "flex" },
  typing: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--subtext)", padding: "8px 4px" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 12, padding: "9px 12px", fontSize: 13, margin: "8px 0" },
  inputBar: { display: "flex", gap: 8, padding: "10px 12px 16px", background: "var(--card)", borderTop: "1px solid var(--border)" },
  input: { flex: 1, padding: "11px 14px", borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--input)", color: "var(--text)", fontSize: 14, outline: "none", fontFamily: font },
  send: { width: 44, borderRadius: 12, border: "none", background: "var(--brand-gradient)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  empty: { textAlign: "center", color: "var(--subtext)", padding: "40px 16px", fontSize: 14 },
  segment: { display: "flex", gap: 6, marginBottom: 10 },
  segOn: { padding: "5px 11px", borderRadius: 999, border: "1px solid var(--brand-border)", background: "var(--brand-soft)", color: "var(--brand-dark)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  segOff: { padding: "5px 11px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--card)", color: "var(--subtext)", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  ticketCard: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 12, marginBottom: 10 },
  ticketHead: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text)" },
  urgent: { fontSize: 10, fontWeight: 800, color: "#b91c1c", background: "#fee2e2", borderRadius: 6, padding: "2px 6px", letterSpacing: 0.3 },
  status: { marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#92400e", background: "#fef3c7", borderRadius: 6, padding: "2px 7px" },
  statusDone: { color: "#166534", background: "#dcfce7" },
  ticketQ: { fontSize: 13, color: "var(--text)", margin: "6px 0 4px", lineHeight: 1.45 },
  ticketMeta: { fontSize: 11, color: "var(--subtext)" },
  ticketNote: { fontSize: 12, color: "var(--text)", background: "var(--bg)", borderRadius: 8, padding: "6px 8px", marginTop: 6 },
};

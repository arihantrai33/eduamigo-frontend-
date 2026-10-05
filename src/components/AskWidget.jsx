import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquareText, SendHorizontal, X, ThumbsUp, ThumbsDown, FileText, ArrowUpRight, LifeBuoy, Loader2, Inbox, CheckCircle2, Route, Sparkles, MessagesSquare, Clock3, RotateCcw, AlertTriangle,
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
const NOTE_KIND = { note: "Staff note", follow_up: "Follow-up", repeat: "Asked again", escalation: "Escalated", reopen: "Reopened" };
const STATUS_LABEL = { open: "Open", in_progress: "In progress", resolved: "Resolved" };

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
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

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Reveals text word by word, like a person typing. Long answers speed up so none takes more than about 3.5 seconds.
// Clicking the answer shows all of it. onTick lets the chat keep scrolling to the newest line.
function useTypewriter(text, active, onDone, onTick) {
  const words = useMemo(() => String(text || "").match(/\s*\S+\s*/g) || [], [text]);
  const [count, setCount] = useState(0);
  const instant = !active || reducedMotion();
  const doneRef = useRef(false);
  useEffect(() => {
    if (instant) return undefined;
    const step = Math.max(1, Math.ceil((words.length * 38) / 3500));
    const timer = setInterval(() => {
      setCount((c) => {
        const n = Math.min(words.length, c + step);
        if (n >= words.length) clearInterval(timer);
        return n;
      });
      onTick?.();
    }, 38);
    return () => clearInterval(timer);
  }, [instant, words, onTick]);
  const visible = instant ? words.length : count;
  const finished = visible >= words.length;
  useEffect(() => {
    if (active && finished && !doneRef.current) { doneRef.current = true; onDone?.(); }
  }, [active, finished, onDone]);
  return { shown: words.slice(0, visible).join(""), finished, skip: () => setCount(words.length) };
}

function Avatar({ size = 28 }) {
  return (
    <div style={{ ...s.avatar, width: size, height: size }} aria-hidden>
      <Sparkles size={Math.round(size * 0.55)} strokeWidth={2.2} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={s.botRow} role="status" aria-label="EduAmigo Ask is typing">
      <Avatar />
      <div style={{ ...s.card, ...s.typingBubble }}>
        {[0, 1, 2].map((i) => <span key={i} className="ask-dot" style={{ animationDelay: `${i * 0.16}s` }} />)}
      </div>
    </div>
  );
}

const OUTCOME = {
  created: ["Ticket raised", LifeBuoy], followed_up: ["Added to your existing ticket", MessagesSquare], repeat: ["Already open", Clock3],
  escalated: ["Escalated to urgent", ArrowUpRight], reopened: ["Reopened", RotateCcw], status: ["Request status", Inbox],
};

// What actually happened to the person's request, from the verified result of the action (never from what was attempted).
function TicketCard({ ticket }) {
  const [label, Icon] = OUTCOME[ticket.outcome] || OUTCOME.created;
  const sentTo = ticket.sentTo?.length ? ticket.sentTo.map((p) => p.name).join(", ") : ticket.team;
  const failed = ticket.notified?.failed || [];
  const confirmed = ticket.notified?.confirmed || [];
  return (
    <div style={s.ticketBox}>
      <div style={s.ticketBoxHead}><Icon size={14} aria-hidden /> {label} · {ticket.number}{ticket.priority === "high" && <span style={s.urgent}>Urgent</span>}</div>
      {ticket.title && <div style={s.ticketBoxTitle}>{ticket.title}</div>}
      <div style={s.ticketBoxMeta}>With {sentTo}</div>
      {confirmed.length > 0 && <div style={s.ticketOk}><CheckCircle2 size={12} aria-hidden /> Notified: {confirmed.join(", ")}</div>}
      {failed.length > 0 && <div style={s.ticketWarn}><AlertTriangle size={12} aria-hidden /> Could not confirm that {failed.join(", ")} was notified. The ticket is saved.</div>}
    </div>
  );
}

function Reply({ r, onOption, onLink, disabled, animate, onDone, onTick, showRouting }) {
  const pct = Math.round((r.confidence || 0) * 100);
  const { shown, finished, skip } = useTypewriter(r.text, animate, onDone, onTick);
  return (
    <div style={s.botRow}>
    <Avatar />
    <div style={{ ...s.card, ...(r.action === "handoff" ? s.cardHandoff : {}) }} onClick={animate && !finished ? skip : undefined}>
      {showRouting && r.label && (
        <div style={s.route}>
          <Route size={12} aria-hidden />
          <span>{r.label}</span>
          {r.action !== "handoff" && <span style={s.routeMeta}>· {pct}% · {METHOD_LABEL[r.method] || r.method}</span>}
        </div>
      )}
      <AnswerText text={shown} />
      <div style={finished ? s.extras : s.extrasHidden}>
      {r.ticket && <TicketCard ticket={r.ticket} />}
      {r.sources?.some((x) => x.evidence) && (
        <div style={s.evidenceList}>
          {r.sources.filter((x) => x.evidence).slice(0, 2).map((src, i) => (
            <figure key={i} style={s.evidence}>
              <blockquote style={s.quote}>{src.evidence}</blockquote>
              <figcaption style={s.cite}><FileText size={11} aria-hidden /> {src.label}{src.at ? ` · updated ${new Date(src.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {r.sources?.length > 0 && !r.sources.some((x) => x.evidence) && (
        <div style={s.sources}>
          {r.sources.map((src, i) => (
            <span key={i} style={s.source} title={src.at ? `Record last updated ${new Date(src.at).toLocaleString("en-IN")}` : undefined}>
              <FileText size={11} aria-hidden /> {src.label}{src.at ? ` · updated ${new Date(src.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
            </span>
          ))}
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
    </div>
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
  const [resolving, setResolving] = useState(null); // ticket being resolved, with the note being typed
  const [note, setNote] = useState("");

  const load = useCallback(() => getTickets({ scope })
    .then((list) => { setItems(list); setError(""); })
    .catch((e) => setError(errorText(e))), [scope]);
  useEffect(() => { load(); }, [load]);

  const act = async (t, status, text = "") => {
    setBusy(t.id);
    try {
      const fresh = await updateTicket(t.id, { status, ...(text.trim() ? { note: text.trim() } : {}) });
      setItems((list) => list.map((x) => (x.id === t.id ? fresh : x)));
      setResolving(null); setNote("");
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
          <div style={s.ticketTitle}>{t.title || t.question}</div>
          {t.summary && <div style={s.ticketQ}>{t.summary}</div>}
          {staff && t.requestedAction && <div style={s.ticketMeta}><strong>Requested:</strong> {t.requestedAction}</div>}
          {staff && t.priority === "high" && t.priorityReason && <div style={s.ticketMeta}>{t.priorityReason}</div>}
          {staff && t.original && t.original !== t.title && (
            <details style={s.original}><summary style={s.originalSum}>Original message</summary><div style={s.originalText}>"{t.original}"</div></details>
          )}
          {!staff && t.sentTo?.length > 0 && <div style={s.ticketMeta}>Sent to {t.sentTo.map((p) => `${p.name} (${p.title})`).join(", ")}</div>}
          <div style={s.ticketMeta}>
            {t.raisedBy?.name && staff ? `${t.raisedBy.name} (${t.raisedBy.role})` : ""}{t.student ? ` · about ${t.student.name} ${t.student.class || ""}` : ""}
            {` · ${new Date(t.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`}
          </div>
          {t.notes?.length > 0 && (
            <div style={s.timeline}>
              {t.notes.slice(-4).map((n, i) => (
                <div key={i} style={s.ticketNote}>
                  <span style={s.noteKind}>{NOTE_KIND[n.kind] || "Note"}</span> {n.by ? `${n.by}: ` : ""}{n.text}
                </div>
              ))}
            </div>
          )}
          {staff && scope !== "mine" && t.status !== "resolved" && (
            <div style={s.links}>
              {t.status === "open" && <button type="button" disabled={busy === t.id} style={s.link} onClick={() => act(t, "in_progress")}>Mark in progress</button>}
              <button type="button" disabled={busy === t.id} style={s.primaryLink} onClick={() => { setResolving(t.id); setNote(""); }}><CheckCircle2 size={13} aria-hidden /> Resolve</button>
            </div>
          )}
          {resolving === t.id && (
            <div style={s.resolveBox}>
              <label style={s.ticketMeta} htmlFor={`note-${t.id}`}>Note for {t.raisedBy?.name || "the sender"} (optional)</label>
              <textarea id={`note-${t.id}`} value={note} maxLength={1000} rows={3} onChange={(e) => setNote(e.target.value)} style={s.noteInput} placeholder="What was done, or what they should do next" autoFocus />
              <div style={s.links}>
                <button type="button" disabled={busy === t.id} style={s.primaryLink} onClick={() => act(t, "resolved", note)}>{busy === t.id ? "Saving" : "Mark resolved"}</button>
                <button type="button" style={s.link} onClick={() => setResolving(null)}>Cancel</button>
              </div>
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
  // Topic and confidence are for the people who run the assistant, not for parents and students.
  const staffView = !!user && can(user, "assistant.insights");

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
      setTurns((t) => [...t, { id: `${Date.now()}a`, queryId: out.queryId, replies: out.replies, revealed: 0, animate: true }]);
    } catch (err) {
      setTurns((t) => [...t, { id: `${Date.now()}e`, error: errorText(err) }]);
    }
    setBusy(false);
  }, [busy, user]);

  const scrollEnd = useCallback(() => endRef.current?.scrollIntoView({ block: "end" }), []);
  const revealNext = useCallback((id, total) => setTurns((t) => t.map((x) => {
    if (x.id !== id) return x;
    const revealed = x.revealed + 1;
    return { ...x, revealed, animate: revealed < total };
  })), []);

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
              <Sparkles size={18} strokeWidth={2} aria-hidden />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.title}>EduAmigo Ask</div>
              <div style={{ ...s.subtitle, color: look.muted }}>Your school assistant</div>
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
                    <Avatar size={44} />
                    <div style={s.welcomeTitle}>{greeting()}{user?.name ? `, ${String(user.name).split(" ")[0]}` : ""}</div>
                    <div style={s.welcomeText}>I am here to help with your school questions: fees, attendance, exams, timetable, the bus and more. Write in English, Hindi or Hinglish, whichever is easiest. If something needs a person at school, I will pass it on and tell you who has it.</div>
                    {(intro?.suggestions || []).length > 0 && <div style={s.tryLabel}>Popular questions</div>}
                    <div style={s.suggestList}>
                      {(intro?.suggestions || []).map((o) => (
                        <button key={o.label} type="button" style={s.suggestion} onClick={() => send(o.value)}>
                          <span>{o.label}</span><ArrowUpRight size={14} aria-hidden />
                        </button>
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
                      {t.replies.slice(0, t.animate ? t.revealed + 1 : t.replies.length).map((r, i) => (
                        <Reply
                          key={i} r={r} disabled={busy} onLink={goTo} showRouting={staffView}
                          animate={!!t.animate && i === t.revealed} onTick={scrollEnd} onDone={() => revealNext(t.id, t.replies.length)}
                          onOption={(o) => send(o.label, o.type === "ask" ? { type: "ask", value: o.value } : { type: o.type, value: o.value })}
                        />
                      ))}
                      {!t.animate && <Feedback turn={t} onRate={rate} />}
                    </div>
                  )
                ))}
                {busy && <TypingIndicator />}
                <div ref={endRef} />
              </div>
              <form style={s.inputBar} onSubmit={(e) => { e.preventDefault(); send(input); }}>
                <input
                  ref={inputRef} value={input} maxLength={500} onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question" aria-label="Your question" style={s.input}
                />
                <button type="submit" aria-label="Send" disabled={busy || !input.trim()} style={{ ...s.send, opacity: busy || !input.trim() ? 0.5 : 1 }}>
                  <SendHorizontal size={18} />
                </button>
              </form>
            </>
          )}
          <style>{".ask-spin{animation:askspin 1s linear infinite}@keyframes askspin{to{transform:rotate(360deg)}}.ask-dot{width:7px;height:7px;border-radius:50%;background:var(--subtext);display:inline-block;margin:0 2px;opacity:.45;animation:askdot 1.1s ease-in-out infinite}@keyframes askdot{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-4px);opacity:1}}@keyframes askin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.ask-dot{animation:none}}"}</style>
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
  welcomeTitle: { marginTop: 10, fontSize: 18, fontWeight: 800, color: "var(--text)" },
  welcomeText: { fontSize: 13, color: "var(--subtext)", margin: "6px 0 12px", lineHeight: 1.5 },
  userRow: { display: "flex", justifyContent: "flex-end", margin: "10px 0" },
  userBubble: { maxWidth: "82%", background: "var(--brand-gradient)", color: "#fff", padding: "9px 13px", borderRadius: "16px 16px 4px 16px", fontSize: 14, lineHeight: 1.45, textShadow: "0 1px 1px rgba(0,0,0,0.15)", wordBreak: "break-word" },
  botRow: { display: "flex", alignItems: "flex-start", gap: 8, margin: "8px 0" },
  avatar: { borderRadius: "50%", background: "var(--brand-gradient)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  typingBubble: { margin: 0, padding: "12px 14px", display: "flex", alignItems: "center" },
  extras: { animation: "askin .25s ease-out" },
  extrasHidden: { display: "none" },
  tryLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--subtext)", margin: "4px 0 8px" },
  suggestList: { display: "flex", flexDirection: "column", gap: 7 },
  suggestion: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, textAlign: "left", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 12, padding: "10px 12px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  card: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px 16px 16px 4px", padding: "11px 13px", margin: 0, maxWidth: "calc(100% - 36px)", fontSize: 14, color: "var(--text)", lineHeight: 1.5 },
  cardHandoff: { borderColor: "#f3d9a4", background: "linear-gradient(0deg, rgba(255,248,235,0.6), rgba(255,248,235,0.6)), var(--card)" },
  route: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--brand-dark)", marginBottom: 6 },
  routeMeta: { fontWeight: 600, color: "var(--subtext)" },
  p: { margin: "0 0 6px" },
  list: { margin: "0 0 6px", paddingLeft: 18 },
  ticket: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#92400e", background: "#fef3c7", borderRadius: 8, padding: "4px 8px", marginTop: 4 },
  evidenceList: { display: "grid", gap: 6, marginTop: 8 },
  evidence: { margin: 0, background: "var(--bg)", borderLeft: "3px solid var(--brand-dark)", borderRadius: 8, padding: "7px 10px" },
  quote: { margin: 0, fontSize: 12.5, lineHeight: 1.45, color: "var(--text)", fontStyle: "italic" },
  cite: { display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11, fontWeight: 700, color: "var(--brand-dark)" },
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
  resolveBox: { marginTop: 8, display: "flex", flexDirection: "column", gap: 6 },
  noteInput: { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--input)", color: "var(--text)", fontSize: 13, fontFamily: font, resize: "vertical", outline: "none" },
  ticketTitle: { fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "6px 0 2px", lineHeight: 1.35 },
  original: { margin: "4px 0" },
  originalSum: { fontSize: 11, color: "var(--subtext)", cursor: "pointer" },
  originalText: { fontSize: 12, color: "var(--subtext)", fontStyle: "italic", padding: "4px 0" },
  timeline: { display: "grid", gap: 4, marginTop: 6 },
  noteKind: { fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3, color: "var(--brand-dark)" },
  ticketBox: { background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 10px", marginTop: 8, display: "grid", gap: 3 },
  ticketBoxHead: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "#92400e" },
  ticketBoxTitle: { fontSize: 13, fontWeight: 600, color: "var(--text)" },
  ticketBoxMeta: { fontSize: 12, color: "var(--subtext)" },
  ticketOk: { display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#166534" },
  ticketWarn: { display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#b45309" },
  ticketNote: { fontSize: 12, color: "var(--text)", background: "var(--bg)", borderRadius: 8, padding: "6px 8px", marginTop: 6 },
};

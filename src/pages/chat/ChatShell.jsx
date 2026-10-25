import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Megaphone, MessageCircle, ShieldAlert } from "lucide-react";
import Avatar from "../../components/ui/Avatar";
import SearchField from "../../components/ui/SearchField";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { toast, errorMessage } from "../../utils/toast";
import Composer from "./Composer";
import MessageBubble from "./MessageBubble";
import Complaints from "./Complaints";
import { broadcasts as loadBroadcasts, dayLabel, inbox, messages as loadMessages, rowTime, sendMessage } from "./chatApi";
import "./chat.css";

const ROLE_LABEL = { admin: "School office", teacher: "Teacher", parent: "Parent", student: "Student" };
const FILTERS = { admin: [["all", "All"], ["unread", "Unread"], ["teacher", "Teachers"], ["parent", "Parents"], ["student", "Students"]], teacher: [["all", "All"], ["unread", "Unread"], ["parent", "Parents"], ["student", "Students"]], default: [["all", "All"], ["unread", "Unread"]] };

// A chat screen like WhatsApp Web: the people you may message on the left (photo, last message, time, unread count), the
// conversation on the right. On a phone the list and the conversation are two screens. Tabs: Chats, Concerns from the school
// (parents) or Concerns raised (staff), and Announcements (students).
export default function ChatShell({ role }) {
  const { user } = useAuth();
  const me = String(user?._id || "");
  const [tab, setTab] = useState("chats");
  const [contacts, setContacts] = useState(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const refresh = useCallback(() => inbox().then((r) => { setContacts(r.data); setError(""); }).catch((e) => { setError(errorMessage(e, "Could not load your chats")); setContacts((c) => c || []); }), []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 8000); return () => clearInterval(t); }, [refresh]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (contacts || []).filter((c) => (filter === "all" || (filter === "unread" ? c.unread > 0 : c.role === filter)) && (!q || `${c.name} ${c.subtitle || ""}`.toLowerCase().includes(q)));
  }, [contacts, query, filter]);
  const current = active ? (contacts || []).find((c) => c.userId === active) : null;
  const totalUnread = (contacts || []).reduce((n, c) => n + (c.unread || 0), 0);
  const filters = FILTERS[role] || FILTERS.default;
  const complaintsLabel = role === "parent" ? "Concerns" : "Concerns raised";

  return (
    <div className={`cs${current && tab === "chats" ? " is-chat" : ""}`} data-tab={tab}>
      <aside className="cs-side" aria-label="Chats">
        <div className="cs-tabs" role="tablist" aria-label="Messages">
          <button type="button" role="tab" aria-selected={tab === "chats"} onClick={() => setTab("chats")}><MessageCircle size={16} aria-hidden="true" />Chats{totalUnread > 0 && <b>{totalUnread}</b>}</button>
          {role !== "student" && <button type="button" role="tab" aria-selected={tab === "concerns"} onClick={() => { setTab("concerns"); setActive(null); }}><ShieldAlert size={16} aria-hidden="true" />{complaintsLabel}</button>}
          {role === "student" && <button type="button" role="tab" aria-selected={tab === "news"} onClick={() => { setTab("news"); setActive(null); }}><Megaphone size={16} aria-hidden="true" />Announcements</button>}
        </div>
        {tab === "chats" && (
          <>
            <div className="cs-search"><SearchField value={query} onChange={setQuery} label="Search conversations" placeholder="Search people" /></div>
            <div className="cs-filters" role="group" aria-label="Filter chats">
              {filters.map(([v, l]) => <button key={v} type="button" className={filter === v ? "is-on" : ""} aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>)}
            </div>
            <div className="cs-list">
              {contacts === null && <Skeleton rows={5} label="Loading chats" />}
              {error && <p className="cs-error" role="alert">{error}</p>}
              {contacts && !shown.length && !error && <p className="cs-none">{query || filter !== "all" ? "No one matches." : "No one to message yet."}</p>}
              <ul className="cs-people">
                {shown.map((c) => (
                  <li key={c.userId}>
                    <button type="button" className={`cs-contact${active === c.userId ? " is-active" : ""}${c.unread ? " has-unread" : ""}`} aria-current={active === c.userId ? "true" : undefined} onClick={() => setActive(c.userId)}>
                      <Avatar name={c.name} photo={c.avatar} size="md" />
                      <span className="cs-contact__main">
                        <span className="cs-contact__top"><strong>{c.name}</strong><time>{rowTime(c.lastTime)}</time></span>
                        <span className="cs-contact__bottom"><small>{c.lastMsg || c.subtitle || ROLE_LABEL[c.role]}</small>{c.unread > 0 && <b aria-label={`${c.unread} unread`}>{c.unread}</b>}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        {tab === "concerns" && <p className="cs-hint">{role === "parent" ? "Concerns the school has shared about your child, and your replies." : "Raise a concern with a student's parents and follow their replies."}</p>}
        {tab === "news" && <p className="cs-hint">Messages the school sends to your whole class.</p>}
      </aside>

      <section className="cs-pane" aria-label={tab === "chats" ? "Conversation" : tab === "concerns" ? complaintsLabel : "Announcements"}>
        {tab === "chats" && (current
          ? <Conversation key={current.userId} contact={current} me={me} onBack={() => setActive(null)} onSent={refresh} onRead={() => setContacts((l) => l.map((c) => (c.userId === current.userId ? { ...c, unread: 0 } : c)))} />
          : (
            <div className="cs-welcome">
              <span className="cs-welcome__icon"><MessageCircle size={30} aria-hidden="true" /></span>
              <h2>Your messages</h2>
              <p>Choose a person on the left to start chatting. You can send photos, files and voice messages.</p>
            </div>
          ))}
        {tab === "concerns" && <Complaints role={role} contacts={contacts || []} />}
        {tab === "news" && <News />}
      </section>
    </div>
  );
}

function News() {
  const [list, setList] = useState(null);
  useEffect(() => { loadBroadcasts().then((r) => setList(r.data)).catch(() => setList([])); }, []);
  if (list === null) return <div className="cs-pad"><Skeleton rows={3} label="Loading announcements" /></div>;
  if (!list.length) return <EmptyState icon={Megaphone} title="No announcements" text="Class announcements from your teachers will appear here." />;
  return (
    <div className="cs-pad cs-news">
      {list.map((b) => (
        <article key={b._id} className="cs-card"><h3>{b.title || b.subject || "Announcement"}</h3><p>{b.message || b.text}</p><small>{b.teacherName ? `${b.teacherName} · ` : ""}{new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></article>
      ))}
    </div>
  );
}

function Conversation({ contact, me, onBack, onSent, onRead }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const end = useRef(null);
  const last = useRef(null);

  const merge = useCallback((incoming) => setList((cur) => {
    const seen = new Set((cur || []).map((m) => m._id));
    const fresh = incoming.filter((m) => !seen.has(m._id));
    return fresh.length || cur === null ? [...(cur || []), ...fresh] : cur;
  }), []);

  useEffect(() => {
    let alive = true;
    loadMessages(contact.roomId).then((r) => { if (!alive) return; setList(r.data); setError(""); onRead(); })
      .catch((e) => { if (alive) { setError(errorMessage(e, "Could not load this chat")); setList([]); } });
    const t = setInterval(() => {
      const after = last.current;
      loadMessages(contact.roomId, after).then((r) => { if (alive && r.data.length) { merge(r.data); onRead(); } }).catch(() => {});
    }, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [contact.roomId, merge, onRead]);

  useEffect(() => { if (list?.length) last.current = list[list.length - 1].createdAt; end.current?.scrollIntoView({ block: "end" }); }, [list]);

  const send = async (text, files) => {
    try {
      const r = await sendMessage(contact.userId, text, files);
      merge([r.data]); onSent();
    } catch (e) { toast.error(errorMessage(e, "The message could not be sent. Please try again.")); throw e; }
  };

  const groups = useMemo(() => {
    const out = []; let day = "";
    for (const m of list || []) { const d = dayLabel(m.createdAt); if (d !== day) { out.push({ divider: d, key: `d-${m._id}` }); day = d; } out.push(m); }
    return out;
  }, [list]);

  return (
    <div className="cs-convo">
      <header className="cs-head">
        <button type="button" className="cs-back" onClick={onBack} aria-label="Back to contacts"><ArrowLeft size={20} /></button>
        <Avatar name={contact.name} photo={contact.avatar} size="md" />
        <div><h2>{contact.name}</h2><p>{contact.subtitle || ROLE_LABEL[contact.role]}</p></div>
      </header>
      <div className="cs-messages" role="log" aria-live="polite" aria-label={`Messages with ${contact.name}`}>
        {list === null && <Skeleton rows={4} label="Loading messages" />}
        {error && <p className="cs-error" role="alert">{error}</p>}
        {list && !list.length && !error && <p className="cs-none">No messages yet. Say hello to {contact.name.split(" ")[0]}.</p>}
        {groups.map((m) => (m.divider ? <div key={m.key} className="cs-day"><span>{m.divider}</span></div> : <MessageBubble key={m._id} m={m} mine={String(m.senderId) === me} />))}
        <div ref={end} />
      </div>
      <Composer onSend={send} label={`Message to ${contact.name}`} placeholder={`Message ${contact.name.split(" ")[0]}`} />
    </div>
  );
}

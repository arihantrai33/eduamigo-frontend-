import { Children, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Info, Sparkles } from "lucide-react";
import "./dash.css";
import Ring from "../ui/Ring";
import AccountTools from "../ui/AccountTools";
import { usePageIcon } from "../ui/usePageIcon";

// Building blocks of the home dashboards (parent, student, teacher, school admin). Role-specific pages choose and order them;
// none of them invents data: a page passes in what the server returned and what is missing is shown as missing.

// The top bar of a home dashboard: the title on the left, notifications and the account menu on the right. On a desktop it looks
// like the header of every other screen (see "One header for every desktop screen" in index.css).
export function TopBar({ title }) {
  const icon = usePageIcon();
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="dx-top">
      {icon && <span className="ea-head-chip" aria-hidden="true">{icon}</span>}
      <div className="dx-top__text"><span className="dx-top__title">{title}</span><span className="dx-top__date">{today}</span></div>
      <AccountTools />
    </div>
  );
}

// Greeting with the person's real name, the school, and (for a parent) the children they may see.
export function Welcome({ user, eyebrow, title, lead, children }) {
  const school = user?.branding?.appName || user?.school;
  const logo = user?.branding?.logoUrl;
  return (
    <section className="dx-welcome" aria-labelledby="dx-title">
      <div className="dx-welcome__top">
        <div style={{ minWidth: 0 }}>
          <p className="dx-eyebrow">{eyebrow}</p>
          <h1 className="dx-h1" id="dx-title">{title}</h1>
          {lead && <p className="dx-lead">{lead}</p>}
        </div>
        {school && (
          <span className="dx-school">
            {logo ? <img src={logo} alt="" /> : <span className="dx-school__init" aria-hidden="true">{school.trim().charAt(0).toUpperCase()}</span>}
            <span>{school}</span>
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function KidAvatar({ kid }) {
  const [failed, setFailed] = useState(false);
  return kid.photo && !failed
    ? <img className="dx-avatar" src={kid.photo} alt="" onError={() => setFailed(true)} style={{ objectFit: "cover" }} />
    : <span className="dx-avatar" aria-hidden="true">{String(kid.name || "?").trim().charAt(0).toUpperCase()}</span>;
}

// Who the parent is looking at. A tablist: arrow keys move between children; the choice is only a convenience, the server
// still checks every request.
export function ChildTabs({ kids, current, onPick }) {
  const refs = useRef([]);
  if (!kids || kids.length < 2) return null;
  const idx = Math.max(0, kids.findIndex((k) => String(k._id) === String(current?._id)));
  const onKey = (e) => {
    const next = e.key === "ArrowRight" ? (idx + 1) % kids.length : e.key === "ArrowLeft" ? (idx + kids.length - 1) % kids.length : e.key === "Home" ? 0 : e.key === "End" ? kids.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    onPick(kids[next]);
    refs.current[next]?.focus();
  };
  return (
    <div className="dx-kids" role="tablist" aria-label="Choose child" onKeyDown={onKey}>
      {kids.map((k, i) => (
        <button key={k._id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" className="dx-kid" aria-selected={i === idx} tabIndex={i === idx ? 0 : -1} onClick={() => onPick(k)}>
          <KidAvatar kid={k} />
          <span><strong>{k.name}</strong><small>Class {k.class}-{k.section}</small></span>
        </button>
      ))}
    </div>
  );
}

// The columns follow the number of cards, so no card is left alone on the last row.
export const MetricGrid = ({ children, label = "Summary" }) => (
  <section className="dx-metrics" aria-label={label} data-count={Children.toArray(children).filter(Boolean).length}>{children}</section>
);

// One number. `to` makes it a link to the screen behind it. `meter` (0 to 100) draws a bar. Tone only for meaning.
export function Metric({ icon: Icon, label, value, sub, tone, meter, to, onClick }) {
  const body = (
    <>
      <span className="dx-metric__head">
        <span className={`dx-chip${tone ? ` dx-chip--${tone}` : ""}`} aria-hidden="true">{Icon && <Icon size={17} />}</span>
        <span className="dx-metric__label">{label}</span>
      </span>
      {Number.isFinite(meter) ? (
        <span className="dx-metric__ringrow">
          <Ring value={meter} label={label} text={typeof value === "string" ? value : undefined} variant="center" size={88} tone={tone === "good" || tone === "warn" || tone === "bad" ? tone : "brand"} />
          {sub && <span className="dx-metric__sub">{sub}</span>}
        </span>
      ) : (
        <span>
          <span className="dx-metric__value">{value}</span>
          {sub && <span className="dx-metric__sub">{sub}</span>}
        </span>
      )}
    </>
  );
  if (to) return <Link className="dx-metric" to={to}>{body}</Link>;
  if (onClick) return <button type="button" className="dx-metric" onClick={onClick}>{body}</button>;
  return <div className="dx-metric">{body}</div>;
}

export function Panel({ title, icon: Icon, action, to, children, id, className = "" }) {
  return (
    <section className={`dx-panel ${className}`} aria-labelledby={id}>
      <div className="dx-panel__head">
        <h2 className="dx-panel__title" id={id}>{Icon && <Icon size={20} aria-hidden />}{title}</h2>
        {to ? <Link className="dx-more" to={to}>{action || "View all"}</Link> : action}
      </div>
      {children}
    </section>
  );
}

export function Loading({ label = "Loading" }) {
  return <div className="dx-skel" role="status" aria-label={label}><i /><i /><i /></div>;
}

// Something is missing or went wrong: say what, and what to do.
export function Note({ tone, title, children, action }) {
  const Icon = tone === "bad" ? AlertCircle : Info;
  return (
    <div className={`dx-note${tone === "bad" ? " dx-note--bad" : ""}`} role={tone === "bad" ? "alert" : undefined}>
      <Icon size={18} aria-hidden />
      <div>{title && <strong>{title}</strong>}{children}{action && <div style={{ marginTop: 6 }}>{action}</div>}</div>
    </div>
  );
}

const pct = (n) => `${Math.round(n)}%`;
const meterTone = (p) => (p >= 75 ? "good" : p >= 50 ? "warn" : "bad");

// Horizontal bars, one per subject (or class, day...). Values are percentages the page computed from real marks. The bars are
// a list with the number in text, so nothing depends on the colour or the picture.
export function BarList({ items, label }) {
  return (
    <ul className="dx-bars" aria-label={label}>
      {items.map((it) => (
        <li key={it.label} className="dx-bar">
          <span className="dx-bar__label">{it.label}</span>
          <span className={`dx-meter dx-meter--${meterTone(it.value)}`} aria-hidden="true"><i style={{ width: `${Math.max(2, Math.min(100, it.value))}%` }} /></span>
          <span className="dx-bar__value">{pct(it.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function NoticeRows({ items }) {
  return (
    <ul className="dx-list">
      {items.map((n) => (
        <li key={n._id || n.title + n.createdAt} className="dx-row">
          <span className={`dx-dot${n.read ? " dx-dot--read" : ""}`} aria-hidden="true" />
          <div className="dx-row__body">
            <div className="dx-row__title">{n.title}{!n.read && <span className="sr-only"> (new)</span>}</div>
            {n.message && <div className="dx-row__sub" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.message}</div>}
            <div className="dx-row__sub">{n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// A day badge and a title: events, exams, due dates.
export function DateRows({ items }) {
  return (
    <ul className="dx-list">
      {items.map((e) => {
        const d = new Date(e.date);
        const opts = { timeZone: "UTC" };
        return (
          <li key={e.key} className="dx-row">
            <span className={`dx-date${e.orange ? " dx-date--orange" : ""}`} aria-hidden="true">
              <b>{d.toLocaleDateString("en-IN", { ...opts, day: "numeric" })}</b>
              <small>{d.toLocaleDateString("en-IN", { ...opts, month: "short" })}</small>
            </span>
            <div className="dx-row__body">
              <div className="dx-row__title">{e.title}</div>
              <div className="dx-row__sub">{e.sub}</div>
            </div>
            {e.pill && <span className={`dx-pill${e.pillTone ? ` dx-pill--${e.pillTone}` : ""}`}>{e.pill}</span>}
          </li>
        );
      })}
    </ul>
  );
}

const toMinutes = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || "")); return m ? +m[1] * 60 + +m[2] : null; };

// Periods of one day in time order; the one running now is marked (and says so in text).
export function ScheduleRows({ periods, now = new Date() }) {
  const mins = now.getHours() * 60 + now.getMinutes();
  return (
    <ul className="dx-list">
      {periods.map((p, i) => {
        const start = toMinutes(p.startTime ?? String(p.time || "").split("-")[0]);
        const end = toMinutes(p.endTime ?? String(p.time || "").split("-")[1]);
        const live = start !== null && end !== null && mins >= start && mins < end;
        return (
          <li key={p._id || i} className={`dx-row${live ? " is-now" : ""}`}>
            <span className="dx-time">{p.time || [p.startTime, p.endTime].filter(Boolean).join(" - ")}</span>
            <div className="dx-row__body dx-period">
              <div className="dx-row__title">{p.subject || "Period"}{live && <span className="dx-pill dx-pill--orange" style={{ marginLeft: 8 }}>Now</span>}</div>
              {(p.teacher?.name || p.sub) && <div className="dx-row__sub">{p.sub || p.teacher?.name}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// The EduAmigo Ask entry (parents, teachers, school staff) or Learning AI (students). Opens the real assistant; nothing here
// answers by itself. Suggested questions are sent as the person's own message.
export function AssistantCard({ title, text, prompts = [], to, cta = "Ask EduAmigo" }) {
  const ask = (prompt) => window.dispatchEvent(new CustomEvent("eduamigo:ask", { detail: { prompt } }));
  return (
    <section className="dx-ai" aria-labelledby="dx-ai-title">
      <h2 id="dx-ai-title"><Sparkles size={22} aria-hidden />{title}</h2>
      <p>{text}</p>
      {prompts.length > 0 && !to && (
        <div className="dx-ai__prompts">
          {prompts.map((q) => <button key={q} type="button" onClick={() => ask(q)}>{q}</button>)}
        </div>
      )}
      {to
        ? <Link className="dx-ai__go" to={to}><Sparkles size={18} aria-hidden />{cta}</Link>
        : <button type="button" className="dx-ai__go" onClick={() => ask()}><Sparkles size={18} aria-hidden />{cta}</button>}
    </section>
  );
}

// Plain badge for a status that is also written in words.
export const Pill = ({ tone, children }) => <span className={`dx-pill${tone ? ` dx-pill--${tone}` : ""}`}>{children}</span>;

export function Facts({ rows }) {
  return <dl className="dx-facts">{rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

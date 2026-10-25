import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell, BookOpenCheck, Bus, CalendarDays, ClipboardList, LineChart } from "lucide-react";
import { BarList, DateRows, Facts, Loading, Note, NoticeRows, Panel, Pill, ScheduleRows } from "./Dash";
import { busState, rupees } from "./helpers";
import { dueLabel } from "../../pages/homework/homeworkApi";

// Panels shared by the role dashboards. Each takes the result of useLoad() for its data and shows loading, error (with a retry),
// missing and empty states itself, so every dashboard handles them the same way.

const retry = (load) => <button type="button" onClick={load.reload}>Try again</button>;

export function SchedulePanel({ load, title, to, action, empty, sunday = false }) {
  const periods = load.state === "ok" ? (Array.isArray(load.data) ? load.data : load.data?.data?.periods || load.data?.data || []) : [];
  return (
    <Panel id="p-today" title={title} icon={ClipboardList} to={to} action={action}>
      {sunday ? <Note title="No classes on Sunday" />
        : load.state === "loading" ? <Loading label="Loading today's schedule" />
          : load.state === "error" ? <Note tone="bad" title="Could not load the timetable" action={retry(load)} />
            : periods.length === 0 ? <Note title="No timetable for today">{empty}</Note>
              : <ScheduleRows periods={periods} />}
    </Panel>
  );
}

export function ResultsPanel({ load, result, to, title = "Recent academic performance" }) {
  return (
    <Panel id="p-perf" title={title} icon={LineChart} to={to} action="All results">
      {load.state === "loading" ? <Loading label="Loading results" />
        : load.state === "error" ? <Note tone="bad" title="Could not load results" action={retry(load)} />
          : result.bars.length === 0 ? <Note title="No results yet">Marks appear here once the school publishes them.</Note>
            : <>
              <p className="dx-lead" style={{ margin: "0 0 14px", fontSize: 13.5 }}>{result.latest}{result.overall !== null && <> · overall <b>{result.overall}%</b> <Pill tone="orange">Grade {result.grade}</Pill></>}</p>
              <BarList items={result.bars} label={`Marks by subject in ${result.latest}`} />
            </>}
    </Panel>
  );
}

// Events, exams (for the class or child) and unpaid fees with a due date, soonest first.
export function UpcomingPanel({ events, exams, fees, to }) {
  const items = useMemo(() => {
    const from = new Date(); from.setHours(0, 0, 0, 0);
    const out = [];
    for (const e of events?.state === "ok" ? events.data.data || [] : []) {
      if (new Date(e.endDate || e.date) >= from) out.push({ key: `e${e._id}`, date: e.date, title: e.title, sub: e.description || (e.type ? String(e.type) : "School event"), pill: e.type === "holiday" ? "Holiday" : undefined });
    }
    for (const x of exams?.state === "ok" ? exams.data.data || [] : []) {
      if (x.date && new Date(x.date) >= from) out.push({ key: `x${x._id}`, date: x.date, title: `${x.subject || "Exam"}${x.title ? `: ${x.title}` : ""}`, sub: [x.examType, x.startTime].filter(Boolean).join(" · ") || "Exam", pill: "Exam", pillTone: "orange", orange: true });
    }
    for (const d of fees?.state === "ok" ? fees.data.data || [] : []) {
      if (d.status !== "Paid" && d.dueDate && new Date(d.dueDate) >= from) out.push({ key: `f${d._id}`, date: d.dueDate, title: `${d.feeType || "Fee"} due`, sub: `Balance ${rupees((d.amount || 0) - (d.paidAmount || 0))}`, pill: "Fee", pillTone: "warn", orange: true });
    }
    return out.sort((x, y) => new Date(x.date) - new Date(y.date)).slice(0, 5);
  }, [events, exams, fees]);
  const loading = [events, exams, fees].some((l) => l?.state === "loading");
  return (
    <Panel id="p-up" title="Upcoming" icon={CalendarDays} to={to}>
      {loading ? <Loading label="Loading upcoming" />
        : items.length === 0 ? <Note title="Nothing coming up">Exams, events and fee due dates will appear here.</Note>
          : <DateRows items={items} />}
    </Panel>
  );
}

export function NoticesPanel({ load, to, title = "Recent notices" }) {
  const items = load.state === "ok" ? (load.data.data || []).slice(0, 4) : [];
  return (
    <Panel id="p-notices" title={title} icon={Bell} to={to}>
      {load.state === "loading" ? <Loading label="Loading notices" />
        : load.state === "error" ? <Note tone="bad" title="Could not load notices" action={retry(load)} />
          : items.length === 0 ? <Note title="No notices at the moment" />
            : <NoticeRows items={items} />}
    </Panel>
  );
}

// Homework still to do, soonest first. For a parent it is the child's.
export function HomeworkPanel({ load, to, title = "Homework" }) {
  const items = load.state === "ok" ? (load.data.data || []).filter((h) => !h.done).slice(0, 4) : [];
  return (
    <Panel id="p-homework" title={title} icon={BookOpenCheck} to={to} action="All homework">
      {load.state === "loading" ? <Loading label="Loading homework" />
        : load.state === "error" ? <Note tone="bad" title="Could not load homework" action={retry(load)} />
          : items.length === 0 ? <Note title="No homework to do">Nothing is waiting right now.</Note>
            : (
              <ul className="dx-list">
                {items.map((h) => {
                  const due = dueLabel(h.dueDate);
                  return (
                    <li key={h._id} className="dx-row">
                      <div className="dx-row__body">
                        <div className="dx-row__title">{h.title}</div>
                        <div className="dx-row__sub">{h.subject}</div>
                      </div>
                      <Pill tone={due.tone === "bad" ? "bad" : due.tone === "warn" ? "orange" : undefined}>{due.text}</Pill>
                    </li>
                  );
                })}
              </ul>
            )}
    </Panel>
  );
}

// Only when a bus is assigned (the server answered with one); no position or arrival time is shown here.
export function BusPanel({ bus, to }) {
  if (!bus) return null;
  return (
    <Panel id="p-bus" title="School bus" icon={Bus} to={to} action="Track bus">
      <div className="dx-bus">
        <div className="dx-bus__top"><strong>{bus.busNumber}</strong><Pill tone={busState(bus).tone}>{busState(bus).text}</Pill></div>
        <Facts rows={[["Route", bus.routeName], ["Driver", bus.driverName], ["Class", bus.studentClass]]} />
      </div>
    </Panel>
  );
}

export function QuickActions({ items, title = "Quick actions" }) {
  return (
    <Panel id="p-actions" title={title} icon={ClipboardList}>
      <nav className="dx-qa" aria-label={title}>
        {items.map(([path, label, Icon]) => (
          <Link key={path + label} to={path}><span className="dx-chip" aria-hidden="true"><Icon size={18} /></span>{label}</Link>
        ))}
      </nav>
    </Panel>
  );
}

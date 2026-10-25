import axios from "axios";
import { Link } from "react-router-dom";
import { CalendarCheck, ClipboardList, Clock, MessageCircle, NotebookPen, Trophy, Upload, Users, BookOpenCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { hasFeature } from "../../utils/features";
import BottomNav from "../../layout/BottomNav";
import { AssistantCard, Loading, Metric, MetricGrid, Note, Panel, Pill, TopBar, Welcome } from "../../components/dash/Dash";
import { DAYS, greeting, useLoad, firstName } from "../../components/dash/helpers";
import { NoticesPanel, QuickActions, SchedulePanel, UpcomingPanel } from "../../components/dash/sections";

const API = import.meta.env.VITE_API_URL;
const get = async (path) => (await axios.get(`${API}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })).data;
// Calendar day in the school's timezone, YYYY-MM-DD (the attendance API keys its records by this day).
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const parseClass = (c) => { const [cls, ...sec] = String(c).split("-"); return { cls, section: sec.join("-") }; };
const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" });

// The teacher's home: today's periods, which of their classes still need attendance, leave requests waiting for them and
// unread parent messages. Everything is limited by the server to this teacher's own classes.
export default function TeacherHome() {
  const { user } = useAuth();
  const day = DAYS[new Date().getDay()];

  const me = useLoad(() => get("/teachers/me"), "me");
  const t = me.state === "ok" ? me.data.data : null;
  const classes = t?.assignedClasses || [];
  const tt = useLoad(() => (t ? get(`/timetable/teacher/${t._id}`) : null), t?._id);
  const marked = useLoad(async () => {
    if (!classes.length) return [];
    return Promise.all(classes.map(async (c) => {
      const { cls, section } = parseClass(c);
      try {
        const r = await get(`/attendance/class/${encodeURIComponent(cls)}?date=${today()}${section ? `&section=${encodeURIComponent(section)}` : ""}`);
        const rows = r.data || [];
        return { name: c, marked: rows.length > 0, present: rows.filter((x) => x.status === "Present" || x.status === "Late").length, total: rows.length };
      } catch { return { name: c, unknown: true }; }
    }));
  }, `${t?._id}|${classes.join(",")}`);
  const leaves = useLoad(() => (get("/leaves/pending")), "leaves");
  const unread = useLoad(() => get("/chat/unread-count"), "chat");
  const events = useLoad(() => get("/events"), "events");
  const exams = useLoad(() => get("/exams"), "exams");
  const notes = useLoad(() => get("/notifications/my"), "notes");

  const first = firstName(user?.name) || "there";
  const dayRow = tt.state === "ok" ? (tt.data.data || []).find((d) => d.day === day) : null;
  const periods = (dayRow?.periods || []).map((p) => ({ ...p, sub: p.class ? `Class ${p.class}${p.section ? `-${p.section}` : ""}` : undefined }));
  const periodsLoad = { ...tt, data: tt.state === "ok" ? { data: { periods } } : null };
  const att = marked.state === "ok" ? marked.data : [];
  const toMark = att.filter((c) => !c.marked && !c.unknown).length;
  const pending = leaves.state === "ok" ? leaves.data.data || [] : [];
  const unreadCount = unread.state === "ok" ? unread.data.count || 0 : null;
  // Exams for this teacher's classes only (the server's list is school-wide; this narrows what is shown, it is not a permission).
  const myExams = exams.state === "ok" ? { ...exams, data: { data: (exams.data.data || []).filter((x) => classes.some((c) => { const { cls, section } = parseClass(c); return String(x.class) === cls && (!x.section || !section || x.section === section); })) } } : exams;

  const actions = [
    ["/teacher/attendance", "Take attendance", CalendarCheck], ["/teacher/homework", "Give homework", BookOpenCheck], ["/teacher/upload", "Upload notes", Upload], ["/teacher/marks", "Enter marks", Trophy],
    ["/teacher/chat", "Parent messages", MessageCircle], ["/teacher/timetable", "My timetable", Clock], ["/teacher/leave", "Leave requests", NotebookPen],
    ["/teacher/students", "My students", Users],
  ];

  return (
    <div className="ea-home dx dx-page">
      <TopBar title="Home" />

      <Welcome user={user} eyebrow={greeting()} title={`Welcome, ${first}`}
        lead={t ? `${t.subjects?.length ? t.subjects.join(", ") : "No subjects assigned yet"}` : me.state === "loading" ? "Loading your day…" : undefined}>
        {me.state === "error" && <Note tone="bad" title="Could not load your dashboard" action={<button type="button" onClick={me.reload}>Try again</button>}>Please check your connection.</Note>}
        {t && <p className="dx-child-line"><b>{classes.length ? `${classes.length} ${classes.length === 1 ? "class" : "classes"}` : "No classes assigned"}</b>{classes.length ? `: ${classes.join(", ")}` : ""}</p>}
      </Welcome>

      <MetricGrid label="Your day">
        <Metric icon={Clock} label="Periods today" to="/teacher/timetable" value={tt.state === "loading" ? "…" : tt.state === "ok" ? (day === "Sunday" ? "0" : periods.length) : "—"}
          sub={tt.state === "error" ? "Could not load" : day === "Sunday" ? "Sunday" : day} />
        <Metric icon={CalendarCheck} label="Attendance to mark" to="/teacher/attendance" tone={toMark > 0 ? "orange" : "good"}
          value={marked.state === "loading" ? "…" : marked.state === "ok" && classes.length ? `${toMark} of ${classes.length}` : "—"}
          sub={marked.state === "ok" ? (toMark === 0 && classes.length ? "All classes marked today" : "classes not marked yet") : undefined} />
        <Metric icon={NotebookPen} label="Leave requests" to="/teacher/leave" tone={pending.length ? "orange" : undefined}
          value={leaves.state === "loading" ? "…" : leaves.state === "ok" ? pending.length : "—"} sub={leaves.state === "error" ? "Could not load" : "waiting for your review"} />
        <Metric icon={MessageCircle} label="Unread messages" to="/teacher/chat" tone={unreadCount ? "orange" : undefined}
          value={unread.state === "loading" ? "…" : unreadCount === null ? "—" : unreadCount} sub="from parents and students" />
      </MetricGrid>

      <div className="dx-grid">
        <div className="dx-col">
          <SchedulePanel load={periodsLoad} sunday={day === "Sunday"} title={`Today's periods${day === "Sunday" ? "" : ` · ${day}`}`} to="/teacher/timetable" action="Full timetable" empty={`You have no periods on ${day}.`} />

          <Panel id="p-att" title="Attendance today" icon={CalendarCheck} to="/teacher/attendance" action="Take attendance">
            {marked.state === "loading" || me.state === "loading" ? <Loading label="Loading attendance" />
              : marked.state === "error" ? <Note tone="bad" title="Could not load attendance" action={<button type="button" onClick={marked.reload}>Try again</button>} />
                : att.length === 0 ? <Note title="No classes assigned to you yet">The school office assigns classes to teachers.</Note>
                  : (
                    <ul className="dx-list">
                      {att.map((c) => (
                        <li key={c.name} className="dx-row">
                          <div className="dx-row__body">
                            <div className="dx-row__title">Class {c.name}</div>
                            <div className="dx-row__sub">{c.unknown ? "Could not check" : c.marked ? `${c.present} of ${c.total} present` : "Not marked yet today"}</div>
                          </div>
                          {c.unknown ? <Pill>Unknown</Pill> : c.marked ? <Pill tone="good">Marked</Pill> : <Link className="dx-pill dx-pill--orange" to="/teacher/attendance" style={{ textDecoration: "none" }}>Mark now</Link>}
                        </li>
                      ))}
                    </ul>
                  )}
          </Panel>

          <UpcomingPanel events={events} exams={myExams} to="/teacher/timetable" />
        </div>

        <div className="dx-col">
          <QuickActions items={actions} />
          {hasFeature(user, "ai_assistant") && (
            <AssistantCard title="Ask EduAmigo" text="Ask about your classes, who was absent, or your timetable, in your own words. You only see your own classes."
              prompts={["Who was absent today in my class?", "What is my timetable tomorrow?", "Any leave requests waiting?"]} />
          )}
          <Panel id="p-leave" title="Leave requests to review" icon={ClipboardList} to="/teacher/leave">
            {leaves.state === "loading" ? <Loading label="Loading leave requests" />
              : leaves.state === "error" ? <Note tone="bad" title="Could not load leave requests" action={<button type="button" onClick={leaves.reload}>Try again</button>} />
                : pending.length === 0 ? <Note title="Nothing waiting for you" />
                  : (
                    <ul className="dx-list">
                      {pending.slice(0, 3).map((l) => (
                        <li key={l._id} className="dx-row">
                          <div className="dx-row__body">
                            <div className="dx-row__title">{l.studentName || l.name || "Student"}{l.class ? ` · ${l.class}${l.section ? `-${l.section}` : ""}` : ""}</div>
                            <div className="dx-row__sub">{l.fromDate ? `${fmt(l.fromDate)}${l.toDate && l.toDate !== l.fromDate ? ` to ${fmt(l.toDate)}` : ""}` : ""}{l.reason ? ` · ${l.reason}` : ""}</div>
                          </div>
                          <Pill tone="warn">Pending</Pill>
                        </li>
                      ))}
                    </ul>
                  )}
          </Panel>
          <NoticesPanel load={notes} to="/teacher/notifications" />
        </div>
      </div>

      <BottomNav role="teacher" />
    </div>
  );
}

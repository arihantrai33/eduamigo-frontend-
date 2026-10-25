import axios from "axios";
import PlatformNotices from "../../components/PlatformNotices";
import { Link } from "react-router-dom";
import {
  Backpack, BadgeIndianRupee, BarChart3, Bell, Bus, CalendarCheck, Clock, CreditCard, FileText, GraduationCap, History, Notebook, Percent, Presentation, Umbrella, Users,
} from "lucide-react";
import { can } from "../../utils/permissions";
import { hasFeature } from "../../utils/features";
import { activityLabel } from "../../utils/activity";
import { plural } from "../../utils/plural";
import { Loading, Metric, MetricGrid, Note, NoticeRows, Panel, Pill, TopBar, Welcome, BarList } from "../../components/dash/Dash";
import { greeting, rupees, useLoad, firstName } from "../../components/dash/helpers";
import { QuickActions } from "../../components/dash/sections";

const API = import.meta.env.VITE_API_URL;
const get = async (path) => (await axios.get(`${API}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })).data;
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
const ago = (d) => {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// Same modules and permissions as the menu; a module only appears when the role may open it and the school's plan has it.
const MODULES = [
  { icon: Backpack, name: "Students", path: "/admin/students", perm: "students.read" },
  { icon: Presentation, name: "Teachers", path: "/admin/teachers", perm: "teachers.manage" },
  { icon: Users, name: "Parents", path: "/admin/parents", perm: "parents.read" },
  { icon: CreditCard, name: "Fee collection", path: "/admin/fees", perm: "fees.collect", feature: "fees" },
  { icon: BarChart3, name: "Attendance reports", path: "/admin/attendance-reports", perm: "attendance.reports" },
  { icon: FileText, name: "Exams", path: "/admin/exams", perm: "exams.manage", feature: "exams" },
  { icon: Clock, name: "Timetable", path: "/admin/timetable", perm: "timetable.manage" },
  { icon: Umbrella, name: "Leaves", path: "/admin/leaves", perm: "leaves.all" },
  { icon: Bus, name: "Transport", path: "/admin/transport", perm: "transport.manage", feature: "transport" },
];

// The school office's home. Numbers are counted by the server for this school and this role; a section the role may not see is
// simply not sent by the server and not drawn here.
export default function Dashboard({ user }) {
  const dash = useLoad(() => get("/schools/me/dashboard"), "dash");
  const setupLoad = useLoad(() => (can(user, "academics.manage") ? get("/academic/setup-status") : null), "setup");
  const notes = useLoad(() => get("/notifications/my"), "notes");

  const d = dash.state === "ok" ? dash.data.data : null;
  const setup = setupLoad.state === "ok" ? setupLoad.data.data : null;
  const counts = d?.counts || {};
  const att = d?.attendance;
  const fees = d?.fees;
  const pending = d?.pendingLeaves || 0;
  const present = att ? (att.present || 0) + (att.late || 0) : 0;
  const attPct = att?.total ? pct(present, att.total) : null;
  const feePct = fees?.billed ? pct(fees.collected, fees.billed) : null;
  const totalInClasses = (d?.classes || []).reduce((t, c) => t + c.count, 0) || 1;
  const bars = (d?.classes || []).map((c) => ({ label: `Class ${c.class}-${c.section} · ${c.count}`, value: pct(c.count, totalInClasses) }));
  const modules = MODULES.filter((m) => can(user, m.perm) && hasFeature(user, m.feature)).map((m) => [m.path, m.name, m.icon]);
  const unread = notes.state === "ok" ? notes.data.unread || 0 : 0;
  const first = firstName(user?.name) || "there";
  const loading = dash.state === "loading";

  return (
    <div className="dx dx-page">
      <TopBar title="Dashboard" />
      <PlatformNotices />

      {setup && !setup.complete && (
        <Link className="dx-note" to="/admin/academic" style={{ textDecoration: "none", color: "inherit", background: "var(--dx-orange-bg)" }}>
          <GraduationCap size={20} aria-hidden />
          <div><strong>Finish setting up your school</strong>{setup.done} of {setup.total} steps done. Next: {setup.steps.find((x) => !x.done)?.label}. <b style={{ color: "var(--dx-orange)" }}>Continue</b></div>
        </Link>
      )}

      <Welcome user={user} eyebrow={greeting()} title={`Welcome back, ${first}`}
        lead={d?.counts ? <>{plural(counts.students, "student")}{counts.teachers !== undefined && <> and {plural(counts.teachers, "teacher")}</>} enrolled{pending > 0 && <>, <b>{plural(pending, "leave")}</b> waiting for approval</>}.</> : loading ? "Loading your school…" : undefined}>
        {dash.state === "error" && <Note tone="bad" title="The dashboard could not be loaded" action={<button type="button" onClick={dash.reload}>Try again</button>}>Please check your connection.</Note>}
      </Welcome>

      {(loading || d) && (
        <MetricGrid label="School summary">
          {(loading || counts.students !== undefined) && <Metric icon={Backpack} label="Students" to="/admin/students" value={loading ? "…" : counts.students} sub="Enrolled" />}
          {(loading || counts.teachers !== undefined) && <Metric icon={Presentation} label="Teachers" to="/admin/teachers" value={loading ? "…" : counts.teachers} sub="Active staff" />}
          {att && <Metric icon={Percent} label="Attendance today" to="/admin/attendance-reports" value={attPct === null ? "—" : `${attPct}%`}
            sub={att.marked ? `${att.marked} of ${att.totalStudents} students marked` : "Not marked yet today"} meter={attPct ?? undefined} tone={attPct === null ? undefined : attPct >= 85 ? "good" : attPct >= 75 ? "warn" : "bad"} />}
          {fees && <Metric icon={BadgeIndianRupee} label="Fees collected" to="/admin/fee-reports" value={feePct === null ? "—" : `${feePct}%`}
            sub={`${rupees(fees.collected)} of ${rupees(fees.billed)}`} meter={feePct ?? undefined} tone="orange" />}
          {d?.pendingLeaves !== undefined && <Metric icon={Notebook} label="Leave requests" to="/admin/leaves" value={pending} tone={pending ? "orange" : "good"} sub={pending ? "waiting for approval" : "All caught up"} />}
          {counts.buses !== undefined && <Metric icon={Bus} label="Buses" to="/admin/transport" value={counts.buses} sub="Active fleet" />}
        </MetricGrid>
      )}

      <div className="dx-grid">
        <div className="dx-col">
          {att && (
            <Panel id="p-att" title="Today's attendance" icon={CalendarCheck} to="/admin/attendance-reports" action="Reports">
              <p className="dx-lead" style={{ margin: "0 0 12px", fontSize: 13.5 }}>{att.marked ? `${att.marked} of ${att.totalStudents} students marked so far` : "Attendance has not been marked yet today."}</p>
              {att.total > 0 && (
                <ul className="dx-list">
                  <li className="dx-row"><div className="dx-row__body"><div className="dx-row__title">Present</div></div><Pill tone="good">{present}</Pill></li>
                  <li className="dx-row"><div className="dx-row__body"><div className="dx-row__title">Absent</div></div><Pill tone={att.absent ? "bad" : undefined}>{att.absent || 0}</Pill></li>
                </ul>
              )}
            </Panel>
          )}
          {fees && (
            <Panel id="p-fee" title="Fee collection" icon={BadgeIndianRupee} to="/admin/fee-reports" action="Fee reports">
              {fees.billed ? (
                <ul className="dx-list">
                  <li className="dx-row"><div className="dx-row__body"><div className="dx-row__title">Collected</div></div><Pill tone="good">{rupees(fees.collected)}</Pill></li>
                  <li className="dx-row"><div className="dx-row__body"><div className="dx-row__title">Outstanding</div></div><Pill tone={fees.due ? "warn" : "good"}>{rupees(fees.due)}</Pill></li>
                  <li className="dx-row"><div className="dx-row__body"><div className="dx-row__title">Billed</div></div><Pill>{rupees(fees.billed)}</Pill></li>
                </ul>
              ) : <Note title="No fees billed yet">Assign a fee structure to start collecting.</Note>}
            </Panel>
          )}
          {d?.classes && (
            <Panel id="p-classes" title="Students by class" icon={Users} to="/admin/students">
              {bars.length === 0 ? <Note title="No students yet">Add students from the Students screen.</Note> : <BarList items={bars} label="Share of students by class" />}
            </Panel>
          )}
        </div>

        <div className="dx-col">
          <Panel id="p-inbox" title="Alerts for you" icon={Bell} to="/admin/inbox" action={unread ? `${unread} unread` : "Open inbox"}>
            {notes.state === "loading" ? <Loading label="Loading alerts" />
              : notes.state === "error" ? <Note tone="bad" title="Could not load alerts" action={<button type="button" onClick={notes.reload}>Try again</button>} />
                : (notes.data.data || []).length === 0 ? <Note title="No alerts at the moment">Safety alerts from parents and other messages for the school office appear here.</Note>
                  : <NoticeRows items={(notes.data.data || []).slice(0, 4)} />}
          </Panel>
          {d?.recentStudents && (
            <Panel id="p-recent" title="Recently enrolled" icon={Backpack} to="/admin/students">
              {d.recentStudents.length === 0 ? <Note title="No students yet" /> : (
                <ul className="dx-list">
                  {d.recentStudents.map((s) => (
                    <li key={s._id} className="dx-row">
                      <span className="dx-avatar" aria-hidden="true" style={{ flex: "none" }}>{s.name?.[0]?.toUpperCase()}</span>
                      <div className="dx-row__body">
                        <Link className="dx-row__title" to={`/admin/students/${s._id}`} style={{ color: "inherit", textDecoration: "none" }}>{s.name}</Link>
                        <div className="dx-row__sub">Class {s.class}-{s.section} · Roll {s.rollNumber}</div>
                      </div>
                      <Pill tone={s.feeStatus === "Paid" ? "good" : "warn"}>{s.feeStatus || "Not billed"}</Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
          {d?.activity && (
            <Panel id="p-activity" title="Recent activity" icon={History} to="/admin/activity">
              {d.activity.length === 0 ? <Note title="No activity yet" /> : (
                <ul className="dx-list">
                  {d.activity.slice(0, 5).map((a, i) => (
                    <li key={i} className="dx-row"><div className="dx-row__body"><div className="dx-row__title">{activityLabel(a.action)}</div><div className="dx-row__sub">{a.by || "System"} · {ago(a.at)}</div></div></li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
          {modules.length > 0 && <QuickActions items={modules} title="Go to" />}
        </div>
      </div>
    </div>
  );
}

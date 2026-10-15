import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Backpack, Presentation, Users, Bus, CreditCard, BarChart3, FileText, Clock, Umbrella,
  CalendarCheck, BadgeIndianRupee, Notebook, GraduationCap, AlertCircle, History, ChevronRight, RefreshCw,
} from "lucide-react";
import { can } from "../../utils/permissions";
import { hasFeature } from "../../utils/features";
import { activityLabel } from "../../utils/activity";
import { plural } from "../../utils/plural";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Same modules, names and permissions as before; colours now come from the school's brand.
const MODULES = [
  { icon: Backpack, name: "Students", path: "/admin/students", perm: "students.read" },
  { icon: Presentation, name: "Teachers", path: "/admin/teachers", perm: "teachers.manage" },
  { icon: Users, name: "Parents", path: "/admin/parents", perm: "parents.read" },
  { icon: CreditCard, name: "Fee Mgmt", path: "/admin/fees", perm: "fees.collect", feature: "fees" },
  { icon: BarChart3, name: "Att. Reports", path: "/admin/attendance-reports", perm: "attendance.reports" },
  { icon: FileText, name: "Exams", path: "/admin/exams", perm: "exams.manage", feature: "exams" },
  { icon: Clock, name: "Timetable", path: "/admin/timetable", perm: "timetable.manage" },
  { icon: Umbrella, name: "Leaves", path: "/admin/leaves", perm: "leaves.all" },
  { icon: Bus, name: "Transport", path: "/admin/transport", perm: "transport.manage", feature: "transport" },
];

const money = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
const ago = (d) => {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
const greetingNow = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
};

function StatCard({ icon: Icon, value, label, sub, onClick, loading }) {
  return (
    <button type="button" className="ea-stat" onClick={onClick} disabled={!onClick}>
      <span className="ea-icon-chip" aria-hidden="true"><Icon size={20} /></span>
      <span className="ea-stat__value">{loading ? <span className="skeleton" style={{ display: "inline-block", width: 48, height: 28 }} /> : value}</span>
      <span className="ea-stat__label">{label}</span>
      <span className="ea-stat__sub">{sub}</span>
    </button>
  );
}

function Card({ title, subtitle, icon: Icon, action, onClick, children, className = "" }) {
  return (
    <section className={`ea-card ${onClick ? "is-clickable" : ""} ${className}`} onClick={onClick}>
      <header className="ea-card__head">
        <div>
          <h2 className="ea-card__title">{title}</h2>
          {subtitle && <p className="ea-card__subtitle">{subtitle}</p>}
        </div>
        {action || (Icon && <span className="ea-icon-chip ea-icon-chip--sm" aria-hidden="true"><Icon size={16} /></span>)}
      </header>
      {children}
    </section>
  );
}

const Bar = ({ value }) => (
  <div className="ea-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export default function Dashboard({ navigate, user }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [setup, setSetup] = useState(null);

  const load = useCallback(() => {
    setFailed(false);
    axios.get(`${API}/schools/me/dashboard`, authHeader())
      .then((r) => setData(r.data.data))
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!can(user, "academics.manage")) return;
    axios.get(`${API}/academic/setup-status`, authHeader()).then((r) => setSetup(r.data.data)).catch(() => {});
  }, [user]);

  const loading = !data && !failed;
  const counts = data?.counts || {};
  const att = data?.attendance;
  const fees = data?.fees;
  const pendingLeaves = data?.pendingLeaves || 0;
  const attPresent = att ? (att.present || 0) + (att.late || 0) : 0;
  const attPct = att ? pct(attPresent, att.total) : 0;
  const feePct = fees ? pct(fees.collected, fees.billed) : 0;
  const totalInClasses = (data?.classes || []).reduce((t, c) => t + c.count, 0) || 1;

  const stats = [
    { icon: Backpack, key: "students", label: "Total Students", sub: "Enrolled this year", path: "/admin/students" },
    { icon: Presentation, key: "teachers", label: "Total Teachers", sub: "Active staff members", path: "/admin/teachers" },
    { icon: Users, key: "parents", label: "Linked Parents", sub: "Connected families", path: "/admin/parents" },
    { icon: Bus, key: "buses", label: "Total Buses", sub: "Active fleet", path: "/admin/transport" },
  ].filter((s) => loading || counts[s.key] !== undefined);

  const modules = MODULES.filter((m) => can(user, m.perm) && hasFeature(user, m.feature));

  return (
    <div className="ea-dash">
      {setup && !setup.complete && (
        <button type="button" className="ea-callout" onClick={() => navigate("/admin/academic")}>
          <GraduationCap size={20} aria-hidden="true" />
          <span className="ea-callout__text">
            <strong>Finish setting up your school</strong>
            <span>{setup.done} of {setup.total} steps done. Next: {setup.steps.find((x) => !x.done)?.label}</span>
          </span>
          <span className="ea-callout__action">Continue <ChevronRight size={14} aria-hidden="true" /></span>
        </button>
      )}

      <div className="ea-page-head">
        <div>
          <h1 className="ea-page-title">Dashboard</h1>
          <p className="ea-page-subtitle">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="ea-page-actions">
          {pendingLeaves > 0 && (
            <button type="button" className="ea-pill ea-pill--warning" onClick={() => navigate("/admin/leaves")}>
              <AlertCircle size={13} aria-hidden="true" />{pendingLeaves} leave{pendingLeaves > 1 ? "s" : ""} pending
            </button>
          )}
          <span className="ea-userchip">
            <span className="ea-avatar ea-avatar--brand" aria-hidden="true">{user?.name?.[0]?.toUpperCase() || "A"}</span>
            <span>{user?.name || "Admin"}</span>
          </span>
        </div>
      </div>

      <section className="ea-hero">
        <span className="ea-hero__school">{user?.school || "EduAmigo School"}</span>
        <h2 className="ea-hero__title">{greetingNow()}, {user?.name || "Admin"}</h2>
        {data?.counts && (
          <p className="ea-hero__text">
            You have <strong>{plural(counts.students, "student")}</strong>
            {counts.teachers !== undefined && <> and <strong>{plural(counts.teachers, "teacher")}</strong></>} enrolled.
            {pendingLeaves > 0 && <> <strong>{plural(pendingLeaves, "leave")}</strong> awaiting approval.</>}
          </p>
        )}
      </section>

      {failed && (
        <div className="ea-alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>The dashboard could not be loaded. Check your connection and try again.</span>
          <button type="button" className="ea-btn ea-btn--ghost" onClick={load}><RefreshCw size={14} aria-hidden="true" /> Retry</button>
        </div>
      )}

      {stats.length > 0 && (
        <div className="ea-grid ea-grid--4">
          {stats.map((s) => (
            <StatCard key={s.key} icon={s.icon} value={counts[s.key]} label={s.label} sub={s.sub} loading={loading}
              onClick={() => navigate(s.path)} />
          ))}
        </div>
      )}

      {modules.length > 0 && (
        <Card title="Quick Access" subtitle="Jump to any module">
          <div className="ea-quick">
            {modules.map(({ icon: Icon, name, path }) => (
              <button key={path} type="button" className="ea-quick__tile" onClick={() => navigate(path)}>
                <Icon size={20} aria-hidden="true" />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {(att || fees || data?.pendingLeaves !== undefined) && (
        <div className="ea-grid ea-grid--3">
          {att && (
            <Card title="Today's Attendance" icon={CalendarCheck} onClick={() => navigate("/admin/attendance-reports")}
              subtitle={att.marked ? `${att.marked} of ${att.totalStudents} students marked` : "Not marked yet today"}>
              <div className="ea-metric">{att.total ? <>{attPct}<small>%</small></> : <span className="ea-muted">—</span>}</div>
              <Bar value={attPct} />
              <div className="ea-metric__foot">
                <span className="ea-text-success">{attPresent} Present</span>
                <span className="ea-text-danger">{att.absent || 0} Absent</span>
              </div>
            </Card>
          )}
          {fees && (
            <Card title="Fee Collection" subtitle="Collected against billed" icon={BadgeIndianRupee} onClick={() => navigate("/admin/fee-reports")}>
              <div className="ea-metric">{feePct}<small>%</small></div>
              <Bar value={feePct} />
              <div className="ea-metric__foot">
                <span className="ea-text-success">{money(fees.collected)} collected</span>
                <span className="ea-text-warning">{money(fees.due)} due</span>
              </div>
            </Card>
          )}
          {data?.pendingLeaves !== undefined && (
            <Card title="Leave Requests" subtitle="Needs your approval" icon={Notebook} onClick={() => navigate("/admin/leaves")}>
              <div className={`ea-metric ${pendingLeaves ? "ea-text-danger" : "ea-text-success"}`}>{pendingLeaves}</div>
              <div className={`ea-metric__note ${pendingLeaves ? "ea-text-danger" : "ea-text-success"}`}>
                {pendingLeaves ? `${pendingLeaves} ${pendingLeaves === 1 ? "request" : "requests"} pending` : "All caught up"}
              </div>
            </Card>
          )}
        </div>
      )}

      {data?.classes && (
        <div className="ea-grid ea-grid--2">
          <Card title="Students by Class" subtitle="Distribution across grades"
            action={<button type="button" className="ea-link" onClick={() => navigate("/admin/students")}>View all</button>}>
            {data.classes.length === 0 ? <p className="ea-empty-line">No students yet</p> : data.classes.map((c) => {
              const share = pct(c.count, totalInClasses);
              return (
                <div key={`${c.class}-${c.section}`} className="ea-row-bar">
                  <div className="ea-row-bar__label"><span>Class {c.class}-{c.section}</span><span>{c.count} students ({share}%)</span></div>
                  <Bar value={share} />
                </div>
              );
            })}
          </Card>
          <Card title="Recently Enrolled" subtitle="Latest student additions"
            action={<button type="button" className="ea-link" onClick={() => navigate("/admin/students")}>View all</button>}>
            {data.recentStudents.length === 0 ? <p className="ea-empty-line">No students yet</p> : (
              <ul className="ea-list">
                {data.recentStudents.map((s) => (
                  <li key={s._id}>
                    <button type="button" className="ea-list__item" onClick={() => navigate(`/admin/students/${s._id}`)}>
                      {s.photo ? <img src={s.photo} alt="" className="ea-avatar ea-avatar--img" /> : <span className="ea-avatar" aria-hidden="true">{s.name?.[0]?.toUpperCase()}</span>}
                      <span className="ea-list__text"><strong>{s.name}</strong><small>Class {s.class}-{s.section} · Roll {s.rollNumber}</small></span>
                      <span className={`ea-badge ${s.feeStatus === "Paid" ? "ea-badge--success" : "ea-badge--warning"}`}>{s.feeStatus || "Not billed"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {data?.activity && (
        <Card title="Recent Activity" subtitle="Who changed what in the school"
          action={<button type="button" className="ea-link" onClick={() => navigate("/admin/activity")}>View all</button>}>
          {data.activity.length === 0 ? <p className="ea-empty-line">No activity yet</p> : (
            <ul className="ea-list">
              {data.activity.map((a, i) => (
                <li key={i} className="ea-list__item ea-list__item--static">
                  <span className="ea-icon-chip ea-icon-chip--sm" aria-hidden="true"><History size={15} /></span>
                  <span className="ea-list__text"><strong>{activityLabel(a.action)}</strong><small>{a.by || "System"} · {ago(a.at)}</small></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

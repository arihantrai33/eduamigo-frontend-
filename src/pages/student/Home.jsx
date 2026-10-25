import axios from "axios";
import { BookOpen, BookOpenCheck, Clock, CreditCard, GraduationCap, LineChart, MessageCircle, NotebookPen, Percent, Trophy, Bus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { FEATURE_OF_PATH, hasFeature } from "../../utils/features";
import BottomNav from "../../layout/BottomNav";
import { AssistantCard, Metric, MetricGrid, Note, TopBar, Welcome } from "../../components/dash/Dash";
import { busState, DAYS, greeting, latestResult, useLoad, firstName } from "../../components/dash/helpers";
import { BusPanel, HomeworkPanel, NoticesPanel, QuickActions, ResultsPanel, SchedulePanel, UpcomingPanel } from "../../components/dash/sections";

const API = import.meta.env.VITE_API_URL;
const get = async (path) => (await axios.get(`${API}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })).data;

// The student's home. Everything is for the signed-in student (the server answers from the account, never from an id sent by
// this page). A section with nothing to show says so; nothing here is filled in with example data.
export default function StudentHome() {
  const { user } = useAuth();
  const allowed = (path) => hasFeature(user, FEATURE_OF_PATH[path]);
  const day = DAYS[new Date().getDay()];

  const me = useLoad(() => get("/students/my-profile"), "me");
  const att = useLoad(() => get("/attendance/my-summary"), "att");
  const res = useLoad(() => (allowed("/student/result") ? get("/exams/my-results") : null), "res");
  const table = useLoad(() => (day !== "Sunday" ? get(`/timetable/my?day=${day}`) : null), day);
  const exams = useLoad(() => get("/exams"), "exams");
  const events = useLoad(() => get("/events"), "events");
  const notes = useLoad(() => get("/notifications/my"), "notes");
  const hw = useLoad(() => get("/homework/my"), "hw");
  const profile = me.state === "ok" ? me.data.data : null;
  const bus = useLoad(() => (profile?.bus && allowed("/student/bus") ? get("/transport/my-child-bus") : null), profile?._id || "nobus");

  const first = firstName(user?.name) || "there";
  const a = att.state === "ok" ? att.data.data : null;
  const attPct = a?.total ? parseFloat(a.percentage) : null; // a percentage means something only once a school day has been marked
  const r = latestResult(res.state === "ok" ? res.data.data : []);
  const avg = res.state === "ok" && Number.isFinite(Number(res.data.averagePercentage)) && r.bars.length ? Math.round(Number(res.data.averagePercentage)) : null;
  const b = bus.state === "ok" ? bus.data.data : null;
  const fee = profile?.feeStatus;

  const actions = [
    ["/student/homework", "Homework", BookOpenCheck], ["/student/timetable", "Timetable", Clock], ["/student/notes", "Notes", BookOpen], ["/student/result", "Results", Trophy],
    ["/student/fee", "Fee Status", CreditCard], ["/student/apply-leave", "Apply for leave", NotebookPen], ["/student/chat", "Chat", MessageCircle],
  ].filter(([path]) => allowed(path));

  return (
    <div className="ea-home dx dx-page">
      <TopBar title="Home" />

      <Welcome user={user} eyebrow={greeting()} title={`Hello, ${first}`}
        lead={profile ? "Here is your day at a glance." : me.state === "loading" ? "Loading your day…" : undefined}>
        {me.state === "error" && <Note tone="bad" title="Could not load your profile" action={<button type="button" onClick={me.reload}>Try again</button>}>Please check your connection.</Note>}
        {profile && <p className="dx-child-line"><b>Class {profile.class}-{profile.section}</b>{profile.rollNumber ? ` · Roll ${profile.rollNumber}` : ""}{profile.admissionNo ? ` · Admission ${profile.admissionNo}` : ""}</p>}
      </Welcome>

      <MetricGrid label="Your summary">
        <Metric icon={Percent} label="Attendance" to="/student/attendance"
          value={att.state === "loading" ? "…" : attPct === null ? "—" : `${attPct}%`}
          sub={att.state === "error" ? "Could not load" : a?.total ? `${(a.present || 0) + (a.late || 0)} of ${a.total} school days` : "No attendance marked yet"}
          meter={attPct ?? undefined} tone={attPct === null ? undefined : attPct >= 85 ? "good" : attPct >= 75 ? "warn" : "bad"} />
        {allowed("/student/result") && (
          <Metric icon={LineChart} label="Average marks" to="/student/result" value={res.state === "loading" ? "…" : avg === null ? "—" : `${avg}%`}
            sub={res.state === "error" ? "Could not load" : avg === null ? "No results published yet" : "Across published exams"} meter={avg ?? undefined} />
        )}
        {allowed("/student/result") && (
          <Metric icon={GraduationCap} label="Overall grade" to="/student/result" tone="orange"
            value={res.state === "loading" ? "…" : res.state === "ok" && res.data.overallGrade && r.bars.length ? res.data.overallGrade : "—"} sub={r.latest ? `Latest: ${r.latest}` : undefined} />
        )}
        {allowed("/student/fee") && fee && <Metric icon={CreditCard} label="Fees" to="/student/fee" value={fee} tone={/paid/i.test(fee) && !/un|part/i.test(fee) ? "good" : "warn"} />}
        {b && <Metric icon={Bus} label="School bus" to="/student/bus" tone={busState(b).live ? "orange" : undefined} value={busState(b).text} sub={[b.busNumber, b.routeName].filter(Boolean).join(" · ")} />}
      </MetricGrid>

      <div className="dx-grid">
        <div className="dx-col">
          <SchedulePanel load={table} sunday={day === "Sunday"} title={`Today's classes${day === "Sunday" ? "" : ` · ${day}`}`} to="/student/timetable" action="Full timetable"
            empty={`There are no periods for ${day} on your timetable.`} />
          <HomeworkPanel load={hw} to="/student/homework" />
          {allowed("/student/result") && <ResultsPanel load={res} result={r} to="/student/result" title="Recent results" />}
          <UpcomingPanel events={events} exams={exams} to="/student/timetable" />
        </div>
        <div className="dx-col">
          <QuickActions items={actions} />
          {allowed("/student/learn")
            ? <AssistantCard title="Learning AI" to="/student/learn" cta="Start learning" text="Get a topic explained step by step, practise with questions, and plan your revision. Teachers' notes for your class are used where available." />
            : hasFeature(user, "ai_assistant") && <AssistantCard title="Ask EduAmigo" text="Ask about your attendance, timetable or exams in your own words." prompts={["What is my attendance?", "What classes do I have today?", "When is my next exam?"]} />}

          <BusPanel bus={b} to="/student/bus" />
          <NoticesPanel load={notes} to="/student/notifications" />
        </div>
      </div>

      <BottomNav role="student" />
    </div>
  );
}

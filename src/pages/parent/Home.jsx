import { useState } from "react";
import axios from "axios";
import { CalendarCheck, CalendarDays, CreditCard, GraduationCap, LineChart, MessageCircle, NotebookPen, Percent, Trophy, Bus, BookOpenCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { FEATURE_OF_PATH, hasFeature } from "../../utils/features";
import { childQuery, pickChild, setSelectedChildId } from "../../utils/selectedChild";
import BottomNav from "../../layout/BottomNav";
import { AssistantCard, ChildTabs, Metric, MetricGrid, Note, TopBar, Welcome } from "../../components/dash/Dash";
import { busState, DAYS, greeting, latestResult, rupees, useLoad, firstName } from "../../components/dash/helpers";
import { BusPanel, HomeworkPanel, NoticesPanel, QuickActions, ResultsPanel, SchedulePanel, UpcomingPanel } from "../../components/dash/sections";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const get = async (path) => (await axios.get(`${API}${path}`, auth())).data;

// The parent's home: everything below comes from the server for the selected child, and a section whose data is missing or
// failed says so instead of showing a made-up number. The server checks every request against the parent's own children.
export default function ParentHome() {
  const { user } = useAuth();
  const [, setPicked] = useState(0); // re-render after the child is changed (the choice lives in selectedChild.js)

  const kids = useLoad(() => get("/parents/my-child"), "kids");
  const list = kids.state === "ok" ? kids.data.data.children || [] : [];
  const child = pickChild(list); // read on every render: the choice lives in localStorage (selectedChild.js)
  const cid = child?._id;
  const q = childQuery();
  const allowed = (path) => hasFeature(user, FEATURE_OF_PATH[path]);

  const att = useLoad(() => (cid ? get(`/attendance/student/${cid}/summary`) : null), cid);
  const res = useLoad(() => (cid && allowed("/parent/result") ? get(`/exams/student/${cid}/results`) : null), cid);
  const fees = useLoad(() => (cid && allowed("/parent/fee") ? get(`/fees/my${q}`) : null), cid);
  const bus = useLoad(() => (cid && allowed("/parent/bus") ? get(`/transport/my-child-bus${q}`) : null), cid);
  const day = DAYS[new Date().getDay()];
  const table = useLoad(() => (cid && day !== "Sunday" ? get(`/timetable/class/${encodeURIComponent(child.class)}/${day}?section=${encodeURIComponent(child.section)}`) : null), cid);
  const exams = useLoad(() => (cid ? get(`/exams${q}`) : null), cid);
  const hw = useLoad(() => (cid ? get(`/homework/child${q}`) : null), cid);
  const events = useLoad(() => get("/events"), "events");
  const notes = useLoad(() => get("/notifications/my"), "notes");

  const pick = (k) => { setSelectedChildId(String(k._id)); setPicked((n) => n + 1); };
  const first = firstName(user?.name) || "there";

  // Attendance
  const a = att.state === "ok" ? att.data.summary : null;
  const attPct = a?.total ? parseFloat(a.percentage) : null;
  const r = latestResult(res.state === "ok" ? res.data.data : []);
  const { latest, overall } = r;
  // Fees
  const f = fees.state === "ok" ? fees.data : null;
  const due = f?.summary?.totalDue ?? 0;
  const feeTotal = f?.summary?.total ?? 0;
  // Bus
  const b = bus.state === "ok" ? bus.data.data : null;
  const actions = [
    ["/parent/homework", "Homework", BookOpenCheck], ["/parent/chat", "Chat with teachers", MessageCircle], ["/parent/apply-leave", "Apply for leave", NotebookPen],
    ["/parent/fee", "Fee Status", CreditCard], ["/parent/result", "Results", Trophy],
    ["/parent/attendance", "Attendance", CalendarCheck], ["/parent/calendar", "School calendar", CalendarDays],
  ].filter(([path]) => allowed(path));

  return (
    <div className="ea-home dx dx-page">
      <TopBar title="Home" />

      <Welcome user={user} eyebrow={greeting()} title={`Welcome back, ${first}`}
        lead={kids.state === "loading" ? "Loading your children…" : child ? `Here is how ${child.name.split(" ")[0]} is doing.` : undefined}>
        {kids.state === "error" && <Note tone="bad" title="Could not load your children" action={<button type="button" onClick={kids.reload}>Try again</button>}>Please check your connection.</Note>}
        {kids.state === "missing" && <Note title="No child is linked to this account yet">Please ask the school office to link your child to your mobile number or email.</Note>}
        {child && (list.length > 1
          ? <ChildTabs kids={list} current={child} onPick={pick} />
          : <p className="dx-child-line"><b>{child.name}</b> · Class {child.class}-{child.section}{child.rollNumber ? ` · Roll ${child.rollNumber}` : ""}</p>)}
      </Welcome>

      {child && (
        <MetricGrid label={`Summary for ${child.name}`}>
          <Metric icon={Percent} label="Attendance" to="/parent/attendance"
            value={att.state === "loading" ? "…" : attPct === null ? "—" : `${attPct}%`}
            sub={att.state === "error" ? "Could not load" : a?.total ? `${a.present + (a.late || 0)} of ${a.total} school days` : "No attendance marked yet"}
            meter={attPct ?? undefined} tone={attPct === null ? undefined : attPct >= 85 ? "good" : attPct >= 75 ? "warn" : "bad"} />
          {allowed("/parent/result") && (
            <Metric icon={LineChart} label="Academic performance" to="/parent/result"
              value={res.state === "loading" ? "…" : overall === null ? "—" : `${overall}%`}
              sub={res.state === "error" ? "Could not load" : overall === null ? "No results published yet" : latest} meter={overall ?? undefined} />
          )}
          {allowed("/parent/result") && (
            <Metric icon={GraduationCap} label="Current grade" to="/parent/result" tone="orange"
              value={res.state === "loading" ? "…" : overall === null ? "—" : r.grade} sub={overall === null ? undefined : `Overall in ${latest}`} />
          )}
          {allowed("/parent/fee") && (
            <Metric icon={CreditCard} label="Fees" to="/parent/fee"
              value={fees.state === "loading" ? "…" : fees.state === "error" ? "—" : !feeTotal ? "—" : due > 0 ? `${rupees(due)} due` : "All paid"}
              sub={fees.state === "error" ? "Could not load" : !feeTotal ? "No fees assigned yet" : `of ${rupees(feeTotal)} this year`}
              tone={!feeTotal ? undefined : due > 0 ? "warn" : "good"} />
          )}
          {b && (
            <Metric icon={Bus} label="School bus" to="/parent/bus" tone={busState(b).live ? "orange" : undefined} value={busState(b).text} sub={[b.busNumber, b.routeName].filter(Boolean).join(" · ")} />
          )}
        </MetricGrid>
      )}

      {child && (
        <div className="dx-grid">
          <div className="dx-col">
            <SchedulePanel load={table} sunday={day === "Sunday"} title={`Today's schedule${day === "Sunday" ? "" : ` · ${day}`}`} to="/parent/calendar" action="School calendar"
              empty={`The school has not published periods for Class ${child.class}-${child.section} on ${day}.`} />
            <HomeworkPanel load={hw} to="/parent/homework" title="Homework" />
            <ResultsPanel load={res} result={r} to="/parent/result" />
            <UpcomingPanel events={events} exams={exams} fees={fees} to="/parent/calendar" />
          </div>
          <div className="dx-col">
            <QuickActions items={actions} />
            {hasFeature(user, "ai_assistant") && (
              <AssistantCard title="Ask EduAmigo" text={`Ask about ${child.name.split(" ")[0]}'s attendance, fees, results or timetable, in your own words.`}
                prompts={["How is attendance this month?", "Are any fees pending?", "When is the next exam?"]} />
            )}
            <BusPanel bus={b} to="/parent/bus" />
            <NoticesPanel load={notes} to="/parent/notifications" />
          </div>
        </div>
      )}

      <BottomNav role="parent" />
    </div>
  );
}

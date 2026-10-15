import { useEffect, useState } from "react";
import { Target, Award, MessageSquare, CalendarCheck } from "lucide-react";
import { learningApi } from "./api";
import { errorMessage } from "../../../utils/toast";
import { StatCard, StatGrid } from "../../../components/ui/StatCard";
import Skeleton from "../../../components/ui/Skeleton";

// Learning Progress: counts from the student's own practice answers, tutor chats and revision plan. A topic is called weak
// or strong only after at least three marked answers. No AI involved.

export default function Progress({ onPractise }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { learningApi.get("/progress").then(setData).catch((err) => setError(errorMessage(err, "Could not load your progress"))); }, []);

  if (error) return <p className="ea-alert" role="alert"><span>{error}</span></p>;
  if (!data) return <Skeleton rows={4} label="Loading" />;
  const empty = !data.practice.sets && !data.tutorConversations && !data.plan;
  return (
    <section className="ea-learn__progress" aria-label="Learning Progress">
      <StatGrid>
        <StatCard label="Practice sets" value={data.practice.sets} icon={<Target size={18} />} />
        <StatCard label="Answers marked" value={data.practice.answered} icon={<Award size={18} />} tone="success" />
        <StatCard label="Tutor chats" value={data.tutorConversations} icon={<MessageSquare size={18} />} tone="info" />
        <StatCard label="Plan done" value={data.plan ? `${data.plan.done}/${data.plan.total}` : "—"} icon={<CalendarCheck size={18} />} tone="neutral"
          sub={data.plan ? `${data.plan.dueToday} due today${data.plan.overdue ? `, ${data.plan.overdue} overdue` : ""}` : "No plan yet"} />
      </StatGrid>
      {empty && <p className="ea-learn__muted">Your progress appears here after you practise, chat with the AI Tutor or make a revision plan.</p>}
      {data.weak.length > 0 && (
        <div className="ea-card">
          <p className="ea-card__title">Needs more practice</p>
          <ul className="ea-learn__list">
            {data.weak.map((t) => (
              <li key={`${t.subject}|${t.topic}`} className="ea-learn__topic">
                <span>{t.subject}: {t.topic}</span>
                <span className="ea-learn__muted">{t.accuracy}% of {t.total} answers</span>
                <button type="button" className="ea-btn ea-btn--ghost" onClick={() => onPractise(t)}>Practise</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.topics.length > 0 && (
        <div className="ea-card">
          <p className="ea-card__title">All practised topics</p>
          <ul className="ea-learn__list">
            {data.topics.map((t) => (
              <li key={`${t.subject}|${t.topic}`} className="ea-learn__topic">
                <span>{t.subject}{t.topic ? `: ${t.topic}` : ""}</span>
                <span className="ea-learn__bar" aria-hidden="true"><span style={{ width: `${t.accuracy}%` }} /></span>
                <span className="ea-learn__muted">{t.accuracy}% · {t.total} answer{t.total === 1 ? "" : "s"}{t.total < 3 ? " (too few to judge)" : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

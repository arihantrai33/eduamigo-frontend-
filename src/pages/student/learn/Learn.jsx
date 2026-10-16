import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PortalHeader from "../../../components/ui/PortalHeader";
import BottomNav from "../../../layout/BottomNav";
import { learningApi } from "./api";
import { errorMessage } from "../../../utils/toast";
import TutorChat from "./TutorChat";
import Practice from "./Practice";
import Planner from "./Planner";
import Progress from "./Progress";

// EduAmigo Learning AI for students: AI Tutor (with Guided Learning and Voice Learning), Practice & Assessment, the
// Revision Planner and Learning Progress, as tabs of one screen. ?tab=practice|planner|progress opens a tab; ?q= fills the
// tutor's question (from "Continue in AI Tutor" in EduAmigo Ask), without sending it.

const TABS = [
  { key: "tutor", label: "AI Tutor" },
  { key: "practice", label: "Practice & Assessment" },
  { key: "planner", label: "Revision Planner" },
  { key: "progress", label: "Learning Progress" },
];

export default function Learn() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : "tutor";
  const [context, setContext] = useState(null);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState(null);
  const [question, setQuestion] = useState(() => params.get("q") || "");
  const tabRefs = useRef({});

  useEffect(() => {
    learningApi.get("/context").then(setContext).catch((err) => setError(errorMessage(err, "Could not open Learning AI")));
  }, []);

  const select = (key) => { const next = new URLSearchParams(params); next.set("tab", key); next.delete("q"); setParams(next, { replace: true }); };
  // Buttons inside answers: a checked practice set on the conversation's topic, or the planner.
  const onSuggest = (sug) => {
    if (sug.action === "practice") { setPreset({ subject: sug.subject, topic: sug.topic, count: sug.count }); select("practice"); }
    if (sug.action === "planner") select("planner");
  };
  // After a practice set that went badly: the tutor teaches the missed topics again, with the question already typed.
  const onReteach = ({ subject, topics }) => {
    setQuestion(`I did not understand ${topics.join(" and ")}${subject ? ` in ${subject}` : ""}. Please teach it again from the basics, with a simple example.`);
    select("tutor");
  };
  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onKey = (e) => {
    const i = TABS.findIndex((t) => t.key === tab);
    const to = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i - 1 + TABS.length) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    select(TABS[to].key);
    tabRefs.current[TABS[to].key]?.focus();
  };

  return (
    <div className="ea-learn">
      <PortalHeader title="Learning AI" subtitle={context ? `Class ${context.class}-${context.section}` : "Your study companion"} onBack={() => navigate("/student/home")} />
      <div className="ea-learn__tabs">
      <div className="ea-seg" role="tablist" aria-label="Learning AI" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button key={t.key} ref={(el) => { tabRefs.current[t.key] = el; }} type="button" role="tab" id={`learn-tab-${t.key}`} aria-selected={tab === t.key}
            aria-controls={`learn-panel-${t.key}`} tabIndex={tab === t.key ? 0 : -1} className="ea-seg__opt" onClick={() => select(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      </div>
      <div className="ea-learn__panel" role="tabpanel" id={`learn-panel-${tab}`} aria-labelledby={`learn-tab-${tab}`}>
        {error ? <p className="ea-alert" role="alert"><span>{error}</span></p> : (
          <>
            {context?.capabilities?.ai && !context.capabilities.ai.available && (
              <p className="ea-alert ea-alert--warning" role="status">
                <span>{context.capabilities.ai.reason === "off"
                  ? "The AI is switched off on this server, so answers, practice questions and marking are not available. The Revision Planner and your progress still work."
                  : "No AI provider is configured on this server, so answers, practice questions and marking are not available. The Revision Planner and your progress still work."}</span>
              </p>
            )}
            {tab === "tutor" && <TutorChat key={question} context={context} initialQuestion={question} onSuggest={onSuggest} />}
            {tab === "practice" && <Practice key={preset ? `${preset.subject}|${preset.topic}|${preset.count}` : "p"} context={context} preset={preset} onReteach={onReteach} />}
            {tab === "planner" && <Planner context={context} />}
            {tab === "progress" && <Progress onPractise={(t) => { setPreset(t); select("practice"); }} />}
          </>
        )}
      </div>
      <BottomNav role="student" />
    </div>
  );
}

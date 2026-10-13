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
  const [question] = useState(() => params.get("q") || "");
  const tabRefs = useRef({});

  useEffect(() => {
    learningApi.get("/context").then(setContext).catch((err) => setError(errorMessage(err, "Could not open Learning AI")));
  }, []);

  const select = (key) => { const next = new URLSearchParams(params); next.set("tab", key); next.delete("q"); setParams(next, { replace: true }); };
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
      <div className="ea-learn__tabs" role="tablist" aria-label="Learning AI" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button key={t.key} ref={(el) => { tabRefs.current[t.key] = el; }} type="button" role="tab" id={`learn-tab-${t.key}`} aria-selected={tab === t.key}
            aria-controls={`learn-panel-${t.key}`} tabIndex={tab === t.key ? 0 : -1} className={`ea-learn__tab${tab === t.key ? " is-on" : ""}`} onClick={() => select(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="ea-learn__panel" role="tabpanel" id={`learn-panel-${tab}`} aria-labelledby={`learn-tab-${tab}`}>
        {error ? <p className="ea-alert" role="alert"><span>{error}</span></p> : (
          <>
            {tab === "tutor" && <TutorChat context={context} initialQuestion={question} />}
            {tab === "practice" && <Practice key={preset ? `${preset.subject}|${preset.topic}` : "p"} context={context} preset={preset} />}
            {tab === "planner" && <Planner context={context} />}
            {tab === "progress" && <Progress onPractise={(t) => { setPreset(t); select("practice"); }} />}
          </>
        )}
      </div>
      <BottomNav role="student" />
    </div>
  );
}

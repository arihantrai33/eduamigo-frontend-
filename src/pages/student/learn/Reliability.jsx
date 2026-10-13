import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

// The evidence-based reliability note of a tutor answer (backend learning/confidence.js): High confidence, Moderate
// confidence or Needs verification, with the reason. No percentages. Kept apart from AnswerView so EduAmigo Ask can show
// it without loading the Markdown renderer.
const LEVEL_ICON = { high: CheckCircle2, moderate: Info, needs_verification: AlertTriangle };

export default function Reliability({ value }) {
  if (!value?.level) return null;
  const Icon = LEVEL_ICON[value.level] || Info;
  return (
    <p className={`ea-learn__reliability is-${value.level}`}>
      <Icon size={14} aria-hidden="true" /> <strong>{value.label}</strong>
      <span> · {value.reason}</span>
    </p>
  );
}

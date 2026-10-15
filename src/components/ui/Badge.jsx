import { TONES, catOf } from "./tone";

// Status badge: one size and shape everywhere, sentence-case text, colour from the tone (meaning only).
//   <Badge tone="warning" dot>Pending</Badge>
// Status must also be in the text, never in the colour alone.
export default function Badge({ tone = "neutral", dot = false, children }) {
  return (
    <span className={`ea-badge ea-badge--${TONES.includes(tone) ? tone : "neutral"}`}>
      {dot && <span className="ea-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

// Category badge (event type, genre, exam type, subject): one of the six category colours, chosen by name.
//   <CategoryBadge>Fiction</CategoryBadge>   or   <CategoryBadge cat={3}>Exam</CategoryBadge>
export function CategoryBadge({ cat, name, children }) {
  const n = cat || catOf(name ?? (typeof children === "string" ? children : ""));
  return <span className={`ea-badge ea-badge--cat${n}`}>{children}</span>;
}

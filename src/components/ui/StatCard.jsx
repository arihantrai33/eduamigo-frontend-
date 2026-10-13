import { TONES } from "./tone";

// Summary numbers at the top of a screen, in one style everywhere: a neutral card, an icon chip and the value.
// Colour is kept for meaning only (the chip's tone: success, warning, danger, info), never for decoration.
//   <StatGrid><StatCard label="Fee pending" value={2} icon={<Hourglass />} tone="warning" /></StatGrid>
// With onClick it is a button (for example a filter); `selected` marks the active filter.
export function StatCard({ label, value, icon, tone = "brand", sub, onClick, selected }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} aria-pressed={onClick && selected !== undefined ? !!selected : undefined}
      className={`ea-stat ea-stat--row${onClick ? "" : " is-static"}${selected ? " is-selected" : ""}`}>
      {icon && <span className={`ea-icon-chip ea-icon-chip--${TONES.includes(tone) ? tone : "brand"}`} aria-hidden="true">{icon}</span>}
      <span className="ea-stat__text">
        <span className="ea-stat__caption">{label}</span>
        <span className="ea-stat__number">{value}</span>
        {sub && <span className="ea-stat__sub">{sub}</span>}
      </span>
    </Tag>
  );
}

export function StatGrid({ children }) {
  return <div className="ea-stats">{children}</div>;
}

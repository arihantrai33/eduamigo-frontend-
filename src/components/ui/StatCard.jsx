import { Children, useEffect, useRef, useState } from "react";
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

// The grid of StatCards. On a phone, five or more cards become one row that scrolls sideways, so the list or table
// under them starts near the top (design plan §2.6, B6); while it scrolls, it can be reached and scrolled by keyboard.
// columns={3}: three small cards side by side on a phone as well (short labels and small numbers only).
export function StatGrid({ children, columns, label = "Summary", style }) {
  const count = Children.toArray(children).filter(Boolean).length;
  const many = count >= 5;
  const ref = useRef(null);
  const [scrolls, setScrolls] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!many || !el || typeof ResizeObserver === "undefined") return undefined;
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [many, count]);

  const cls = `ea-stats${many ? " ea-stats--many" : ""}${columns === 3 ? " ea-stats--3" : ""}`;
  return (
    <div ref={ref} className={cls} style={style} {...(scrolls ? { tabIndex: 0, role: "region", "aria-label": label } : {})}>
      {children}
    </div>
  );
}

import { useEffect, useId, useState } from "react";

// A circle that fills to a percentage while the number counts up (the same motion as the sign-in screens). Under reduced motion
// it simply shows the final value. `value` is 0-100, or null/undefined for "no data yet" (an empty ring and a dash).
//   <Ring value={95} label="Attendance" sub="38 of 40 days" tone="brand" />
const R = 25;
const C = 2 * Math.PI * R;

export default function Ring({ value, label, sub, size = 64, tone = "brand", variant = "side", text, format = (v) => `${Math.round(v)}%` }) {
  const gid = useId();
  const has = Number.isFinite(value);
  const target = has ? Math.max(0, Math.min(100, value)) : 0;
  const reduce = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [animated, setAnimated] = useState(0);
  const shown = reduce ? target : animated;
  const done = shown >= target - 0.05;
  const display = (v) => (done && text ? text : format(v)); // the exact figure once the count-up has finished

  useEffect(() => {
    if (reduce) return undefined;
    let raf = 0;
    const start = performance.now();
    const DURATION = 1100;
    const step = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      setAnimated(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);

  return (
    <div className={`ea-ring ea-ring--${tone} ea-ring--${variant}`} role="img" aria-label={`${label}: ${has ? text || format(target) : "no data yet"}${sub ? `, ${sub}` : ""}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--ring-from)" /><stop offset="1" stopColor="var(--ring-to)" />
          </linearGradient>
        </defs>
        <circle className="ea-ring__bg" cx="32" cy="32" r={R} />
        <circle className="ea-ring__fg" cx="32" cy="32" r={R} stroke={`url(#${gid})`} strokeDasharray={C} strokeDashoffset={C * (1 - shown / 100)} />
      </svg>
      {variant === "center"
        ? (
          <strong className="ea-ring__center" style={{ width: size, height: size }} aria-hidden="true">
            {has ? format(shown) : "—"}
            {has && text && text !== format(shown) && <span className="ea-ring__exact">{text}</span>}
          </strong>
        )
        : (
          <div className="ea-ring__text">
            <small>{label}</small>
            <strong>{has ? display(shown) : "—"}</strong>
            {sub && <span>{sub}</span>}
          </div>
        )}
    </div>
  );
}

// The one summary at the top of a portal screen (design plan §2.5.4): a white card with a title, one large value,
// an optional ring for a percentage, a line under the value and optional figures or controls below.
//   <SummaryCard title="Overall attendance" value="95%" caption="35 of 40 days present" ring={95} />
//   <SummaryCard title="Leave balance" items={[{ label: "Total", value: 12 }, { label: "Available", value: 12 }]} />
// `items` are small labelled figures in a row; `children` go under everything.
export default function SummaryCard({ title, value, caption, ring, items, children, label }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(ring) || 0));
  return (
    <section className="ea-card ea-summary" aria-label={label || title}>
      {title && <h2 className="ea-summary__title">{title}</h2>}
      {(value !== undefined || ring !== undefined) && (
        <div className="ea-summary__main">
          {ring !== undefined && (
            <svg className="ea-summary__ring" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
              <circle cx="42" cy="42" r={r} className="ea-summary__ring-track" />
              <circle cx="42" cy="42" r={r} className="ea-summary__ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 42 42)" />
            </svg>
          )}
          <div className="ea-summary__text">
            {value !== undefined && <div className="ea-summary__value">{value}</div>}
            {caption && <div className="ea-summary__caption">{caption}</div>}
          </div>
        </div>
      )}
      {items?.length > 0 && (
        <dl className="ea-summary__items">
          {items.map((it) => (
            <div key={it.label} className="ea-summary__item">
              <dt>{it.label}</dt>
              <dd style={it.tone ? { color: `var(--ea-on-card-${it.tone})` } : undefined}>{it.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </section>
  );
}

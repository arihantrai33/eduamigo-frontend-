// Filter chips: one choice from a short list, each with an optional count. On phones the row scrolls sideways.
//   <Chips label="Filter by status" value={status} onChange={setStatus}
//     items={[{ value: "", label: "All", count: 5 }, { value: "Enquiry", label: "Enquiry", count: 2 }]} />
export default function Chips({ items, value, onChange, label }) {
  return (
    <div className="ea-chips" role="group" aria-label={label}>
      {items.map((c) => (
        <button key={c.value} type="button" className="ea-chip" aria-pressed={value === c.value} onClick={() => onChange(c.value)}>
          <span>{c.label}</span>
          {c.count !== undefined && <span className="ea-chip__count">{c.count}</span>}
        </button>
      ))}
    </div>
  );
}

// Placeholder rows while a list or table loads (instead of "Loading…" text). Screen readers hear the label once.
//   {loading ? <Skeleton rows={4} label="Loading students" /> : <Table … />}
export default function Skeleton({ rows = 3, label = "Loading" }) {
  return (
    <div className="ea-skeleton" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => <span key={i} className="ea-skeleton__row" aria-hidden="true" />)}
    </div>
  );
}

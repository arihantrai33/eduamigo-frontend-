// Segmented control: switches between 2–4 views of the same section. The chosen option is a raised surface.
//   <Segmented label="HR section" value={tab} onChange={setTab}
//     options={[{ value: "salary", label: "Salary", icon: <Wallet size={16} /> }, { value: "leaves", label: "Staff Leaves" }]} />
// Each option is a button with aria-pressed, so it is reached with Tab and chosen with Enter or Space.
export default function Segmented({ options, value, onChange, label }) {
  return (
    <div className="ea-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="ea-seg__opt" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon && <span className="ea-seg__icon" aria-hidden="true">{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

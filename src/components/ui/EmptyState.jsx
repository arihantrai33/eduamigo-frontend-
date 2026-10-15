// The one empty or unavailable state: an icon, what is missing, why, and (when there is one) the next step.
//   <EmptyState icon={FileText} title="No transfer certificate yet" text="Issued when the student leaves."
//     actions={<button className="ea-btn ea-btn--primary" ...>Go to Year End</button>} />
export default function EmptyState({ icon: Icon, title, text, actions, role }) {
  return (
    <div className="ea-empty" role={role}>
      {Icon && <span className="ea-empty__icon" aria-hidden="true"><Icon size={24} /></span>}
      <h2 className="ea-empty__title">{title}</h2>
      {text && <p className="ea-empty__text">{text}</p>}
      {actions && <div className="ea-empty__actions">{actions}</div>}
    </div>
  );
}

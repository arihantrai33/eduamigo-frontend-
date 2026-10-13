import { ArrowLeft } from "lucide-react";

// The one header for app screens: title, an optional line under it, an optional back button and actions on the
// right. It sits on the page background (no coloured banner), like the admin dashboard.
//   <PageHeader title="Students" subtitle="Manage all enrolled students" actions={<button ...>Add Student</button>} />
export default function PageHeader({ title, subtitle, icon: Icon, onBack, backLabel = "Back", actions }) {
  return (
    <header className="ea-page-head">
      <div className="ea-page-head__main">
        {onBack && (
          <button type="button" className="ea-back" onClick={onBack} aria-label={backLabel}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        )}
        {Icon && <span className="ea-icon-chip" aria-hidden="true"><Icon size={20} /></span>}
        <div className="ea-page-head__text">
          <h1 className="ea-page-title">{title}</h1>
          {subtitle && <p className="ea-page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="ea-page-actions">{actions}</div>}
    </header>
  );
}

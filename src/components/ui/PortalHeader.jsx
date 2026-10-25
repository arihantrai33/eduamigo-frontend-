import { ArrowLeft } from "lucide-react";
import AccountTools from "./AccountTools";
import { usePageIcon } from "./usePageIcon";

// Page header of the student, teacher and parent screens (design plan §2.5).
//   Phones and tablets (below 1024 px): a 56 px app bar in the solid brand colour with a back button, the title and
//   up to two actions.
//   Desktop: the same header as admin (PageHeader): the title on the page background, a line under it, actions on the
//   right. No back button there (the sidebar navigates), unless the page is a detail page (`detail`).
//   <PortalHeader title="Timetable" subtitle="This week" onBack={() => navigate("/student/home")} />
// Actions are buttons with the class ea-portal-head__btn; they look right on both bars.
export default function PortalHeader({ title, subtitle, onBack, backLabel = "Back", actions, detail = false }) {
  const icon = usePageIcon();
  return (
    <header className={`ea-portal-head${detail ? " ea-portal-head--detail" : ""}`}>
      {onBack && (
        <button type="button" className="ea-portal-head__back" onClick={onBack} aria-label={backLabel}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}
      {icon && <span className="ea-head-chip" aria-hidden="true">{icon}</span>}
      <div className="ea-portal-head__text">
        <h1 className="ea-portal-head__title">{title}</h1>
        {subtitle && <p className="ea-portal-head__sub">{subtitle}</p>}
      </div>
      {actions && <div className="ea-portal-head__actions">{actions}</div>}
      <div className="ea-portal-head__tools"><AccountTools /></div>
    </header>
  );
}

import { ArrowLeft } from "lucide-react";

// Header bar of the student, teacher and parent screens: the school's brand colour, a back button, the title and an
// optional line under it, actions on the right. The same bar most portal screens already drew by hand.
//   <PortalHeader title="Timetable" subtitle="This week" onBack={() => navigate("/student/home")} />
export default function PortalHeader({ title, subtitle, onBack, backLabel = "Back", actions }) {
  return (
    <header className="ea-portal-head">
      {onBack && (
        <button type="button" className="ea-portal-head__back" onClick={onBack} aria-label={backLabel}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}
      <div className="ea-portal-head__text">
        <h1 className="ea-portal-head__title">{title}</h1>
        {subtitle && <p className="ea-portal-head__sub">{subtitle}</p>}
      </div>
      {actions && <div className="ea-portal-head__actions">{actions}</div>}
    </header>
  );
}

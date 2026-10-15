import { ChevronRight } from "lucide-react";
import Avatar from "./Avatar";

// The parts of a profile screen (student, teacher, parent; design plan §2.6, B12): a header card on the surface,
// a list of details and a menu of actions. The same on every portal and in light and dark mode.
//   <ProfileCard name="Riya Sharma" photo={url} meta="Class 9-A • Roll #1" role="Student" />
//   <InfoList rows={[{ label: "Email", value: "riya@school.in" }]} />
//   <MenuList items={[{ icon: <Bell />, label: "Notifications", sub: "View all notifications", onClick }]} />

export function ProfileCard({ name, photo, meta, role, children }) {
  return (
    <section className="ea-card ea-profile-card" aria-label="Profile">
      <Avatar name={name} photo={photo} size="lg" />
      <h2 className="ea-profile-card__name">{name}</h2>
      {meta && <p className="ea-profile-card__meta">{meta}</p>}
      {role && <span className="ea-badge ea-badge--brand">{role}</span>}
      {children}
    </section>
  );
}

export function InfoList({ rows, title }) {
  return (
    <section className="ea-card ea-info-list" aria-label={title}>
      {title && <h2 className="ea-info-list__title">{title}</h2>}
      <dl>
        {rows.map((r) => (
          <div key={r.label} className="ea-info-list__row">
            <dt>{r.label}</dt>
            <dd>{r.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Each item is a button (reachable by keyboard). `danger` marks sign-out style actions; `right` replaces the chevron
// (for example a switch).
export function MenuList({ items, label }) {
  return (
    <section className="ea-card ea-menu-list" aria-label={label}>
      {items.map((it) => (
        <button key={it.label} type="button" className={`ea-menu-list__row${it.danger ? " is-danger" : ""}`} onClick={it.onClick}
          aria-pressed={it.pressed}>
          {it.icon && <span className={`ea-icon-chip ${it.danger ? "ea-icon-chip--danger" : "ea-icon-chip--brand"}`} aria-hidden="true">{it.icon}</span>}
          <span className="ea-menu-list__text">
            <span className="ea-menu-list__label">{it.label}</span>
            {it.sub && <span className="ea-menu-list__sub">{it.sub}</span>}
          </span>
          {it.right ?? <ChevronRight size={18} aria-hidden="true" className="ea-menu-list__chev" />}
        </button>
      ))}
    </section>
  );
}

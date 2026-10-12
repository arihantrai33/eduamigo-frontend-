import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { visibleFor } from "../utils/features";
import { PORTAL_NAV } from "./portalNav";

// Frame of the Student, Teacher and Parent portals.
//   Phones and tablets (below 1024 px): the page fills the screen; each page shows the shared BottomNav.
//   Desktop (1024 px and up): a sidebar with every screen of the portal, and the page in a wide content area.
// The content area (.ea-stage) is the containing block for the pages' position: fixed elements (bottom bars,
// sheets, EduAmigo Ask), so they stay inside it instead of covering the sidebar.
export default function PortalShell({ role, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = PORTAL_NAV[role];
  const schoolName = user?.branding?.appName || user?.school || "EduAmigo";
  const logo = user?.branding?.logoUrl;

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="ea-shell">
      <aside className="ea-sidebar" aria-label={`${nav.label} navigation`}>
        <div className="ea-sidebar__brand">
          {logo
            ? <img src={logo} alt="" className="ea-sidebar__logo" />
            : <span className="ea-sidebar__logo ea-sidebar__logo--initial" aria-hidden="true">{schoolName.trim().charAt(0).toUpperCase()}</span>}
          <span className="ea-sidebar__school">
            <strong title={schoolName}>{schoolName}</strong>
            <small>{nav.label}</small>
          </span>
        </div>

        <nav className="ea-sidebar__nav">
          {nav.sections.map((section, i) => {
            const items = section.items.filter(visibleFor(user));
            if (!items.length) return null;
            return (
              <div key={section.title || i} className="ea-sidebar__section">
                {section.title && <div className="ea-sidebar__heading">{section.title}</div>}
                {items.map(({ icon: Icon, label, path }) => (
                  <NavLink key={path} to={path} end={path === nav.home}
                    className={({ isActive }) => (isActive ? "ea-sidebar__link is-active" : "ea-sidebar__link")}>
                    <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="ea-sidebar__footer">
          <div className="ea-sidebar__user">
            <span className="ea-avatar" aria-hidden="true">{(user?.name || "?").trim().charAt(0).toUpperCase()}</span>
            <span className="ea-sidebar__user-text">
              <strong title={user?.name}>{user?.name}</strong>
              <small>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}</small>
            </span>
          </div>
          <button type="button" className="ea-sidebar__signout" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" /> Log Out
          </button>
        </div>
      </aside>

      <main className="ea-main">
        <div className="ea-stage">{children}</div>
      </main>
    </div>
  );
}

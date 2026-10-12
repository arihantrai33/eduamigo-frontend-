import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { visibleFor } from "../utils/features";
import { PORTAL_NAV, isActivePath } from "./portalNav";

// The tab bar of the Student, Teacher and Parent portals on phones and tablets. From 1024 px the sidebar
// (PortalShell) takes its place and this bar is hidden by CSS (.ea-bottom-nav).
export default function BottomNav({ role }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = (PORTAL_NAV[role]?.bottom || []).filter(visibleFor(user));

  return (
    <nav className="ea-bottom-nav" aria-label="Main">
      {items.map(({ icon: Icon, label, path }) => {
        const active = isActivePath(pathname, path);
        return (
          <button key={path} type="button" onClick={() => navigate(path)} aria-current={active ? "page" : undefined}
            className={active ? "ea-bottom-nav__item is-active" : "ea-bottom-nav__item"}>
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

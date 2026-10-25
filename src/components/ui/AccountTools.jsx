import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Building2, ChevronDown, LogOut, UserRound } from "lucide-react";
import { usesOfficePortal } from "../../utils/permissions";
import "../dash/dash.css";
import { useAuth } from "../../context/AuthContext";
import { confirmLeave } from "../../utils/unsavedChanges";
import { useUnread } from "../dash/helpers";

const NOTIFICATIONS_PATH = { student: "/student/notifications", parent: "/parent/notifications", teacher: "/teacher/notifications", admin: "/admin/inbox", accountant: "/admin/inbox" };
const PROFILE_PATH = { student: "/student/profile", parent: "/parent/profile", teacher: "/teacher/profile" };
const roleLabel = (role) => (role === "admin" ? "School admin" : role === "accountant" ? "Accountant" : role === "staff" ? "School staff" : role || "");

// Notifications with the real unread number, and the account menu (photo, name, my profile, log out). Shown at the right of every
// desktop page header. Only controls that do something.
export default function AccountTools() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { count } = useUnread();
  const [open, setOpen] = useState(false);
  const btn = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    menu.current?.querySelector("a, button")?.focus();
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const onDown = (e) => { if (!menu.current?.contains(e.target) && !btn.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [open]);

  const signOut = async () => {
    if (!(await confirmLeave())) return;
    logout();
    navigate("/login", { replace: true });
  };
  const shown = count > 99 ? "99+" : count;
  const bellPath = NOTIFICATIONS_PATH[user?.role] || "/";
  const name = user?.name || "Account";

  return (
    <div className="dx-top__tools">
        <Link className="dx-icon-btn" to={bellPath} aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}>
          <Bell size={20} aria-hidden />
          {count > 0 && <span className="dx-count" aria-hidden="true">{shown}</span>}
        </Link>
        <div className="dx-profile">
          <button ref={btn} type="button" className="dx-profile__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {user?.avatar ? <img className="dx-avatar" src={user.avatar} alt="" style={{ objectFit: "cover" }} /> : <span className="dx-avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>}
            <span className="dx-profile__name">{name}</span>
            <ChevronDown size={16} aria-hidden />
          </button>
          {open && (
            <div ref={menu} className="dx-menu" role="menu" aria-label="Account">
              <div className="dx-menu__who"><strong>{name}</strong><span>{roleLabel(user?.role)}</span></div>
              {PROFILE_PATH[user?.role] && <Link role="menuitem" to={PROFILE_PATH[user.role]} onClick={() => setOpen(false)}><UserRound size={18} aria-hidden />My profile</Link>}
              {user?.role === "teacher" && usesOfficePortal(user) && <Link role="menuitem" to="/admin" onClick={() => setOpen(false)}><Building2 size={18} aria-hidden />School office</Link>}
              <button role="menuitem" type="button" onClick={signOut}><LogOut size={18} aria-hidden />Log out</button>
            </div>
          )}
        </div>
    </div>
  );
}


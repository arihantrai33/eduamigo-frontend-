import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import SupportContent from "../../components/SupportContent";
import { signOutEverywhere, resetStudentPassword } from "../../utils/account";
import { showCredentials, toast } from "../../utils/toast";
import { Bell, KeyRound, UserRoundCog, LifeBuoy, MonitorOff, LogOut } from "lucide-react";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import { ProfileCard, InfoList, MenuList } from "../../components/ui/Profile";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Parent profile: a profile card, the parent's details and a menu (design plan §2.6, B12), the same parts as the
// student and teacher profiles.
export default function ParentProfile() {
  const navigate         = useNavigate();
  const { user, logout } = useAuth();
  const [parentData, setParentData] = useState(null);
  const [showHelp,   setShowHelp]   = useState(false);
  const [children,   setChildren]   = useState([]);
  const [showReset,  setShowReset]  = useState(false);

  useEffect(() => {
    const fetchParent = async () => {
      try {
        const res = await axios.get(`${API}/parents/my-child`, authHeader());
        if (res.data.success) setParentData(res.data.data.parent);
      } catch {
        // silent fail — fallback to user object
      }
    };
    fetchParent();
    axios.get(`${API}/students/my-child`, authHeader())
      .then((r) => setChildren(r.data.children || []))
      .catch(() => {});
  }, []);

  // Students usually have no email, so the parent gives them a new temporary password here.
  const resetChild = async (child) => {
    const credentials = await resetStudentPassword(child);
    if (!credentials) return;
    showCredentials([{ label: child.name, ...credentials }], "New password for your child");
    toast.success(`${child.name} must set a new password after logging in`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (showHelp) return (
    <div className="ea-pd-read" style={{ minHeight: "100vh", background: "var(--app-bg, #F4F6FB)", fontFamily: "inherit", paddingBottom: 80 }}>
      <PortalHeader detail title="Help & Support" onBack={() => setShowHelp(false)} />
      <div className="ea-pd-body" style={{ padding: 16 }}>
        <SupportContent role="parent" />
      </div>
      <BottomNav role="parent" />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg, #F4F6FB)", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      <PortalHeader title="My Profile" onBack={() => navigate(-1)} />

      <div className="ea-pd-body" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>
        <div className="ea-profile"><div className="ea-profile__aside">
        <ProfileCard name={user?.name || "Parent"} photo={parentData?.photo} role="Parent"
          meta={[parentData?.occupation, parentData?.address].filter(Boolean).join(" • ") || null} />

        <InfoList title="Contact details" rows={[
          { label: "Email",      value: parentData?.email || user?.email },
          { label: "Phone",      value: parentData?.phone },
          { label: "Gender",     value: parentData?.gender },
          { label: "Occupation", value: parentData?.occupation },
          { label: "Address",    value: parentData?.address },
        ]} />
        </div><div className="ea-profile__main">

        {showReset && (
          <section className="ea-card" style={{ padding: "12px 16px" }} aria-label="Reset your child's password">
            <p style={{ fontSize: 13, color: "var(--ea-muted)", margin: "0 0 8px", lineHeight: 1.5 }}>
              Your child logs in with the school code and their admission number. Choose a child to give them a new temporary password.
            </p>
            {children.map((c) => (
              <div key={c._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ea-ink)" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ea-muted)" }}>Class {c.class}-{c.section}{c.admissionNo ? ` · Admission No ${c.admissionNo}` : ""}</div>
                </div>
                <button type="button" className="ea-btn ea-btn--primary ea-btn--sm" onClick={() => resetChild(c)}>Reset password</button>
              </div>
            ))}
          </section>
        )}

        <MenuList label="Profile" items={[
          { icon: <Bell size={18} />,     label: "Notifications",   onClick: () => navigate("/parent/notifications") },
          { icon: <KeyRound size={18} />, label: "Change Password", onClick: () => navigate("/change-password") },
          ...(children.length ? [{ icon: <UserRoundCog size={18} />, label: "Reset child's password", pressed: showReset, onClick: () => setShowReset((v) => !v) }] : []),
          { icon: <LifeBuoy size={18} />, label: "Help & Support",  onClick: () => setShowHelp(true) },
        ]} />
        <MenuList label="Sign out" items={[
          { icon: <MonitorOff size={18} />, label: "Sign out on all devices", danger: true, onClick: () => signOutEverywhere(logout, navigate) },
          { icon: <LogOut size={18} />,     label: "Logout", danger: true, onClick: handleLogout },
        ]} />

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--ea-faint)", margin: "0 0 8px" }}>EduAmigo v1.0.0</p>
        </div></div>
      </div>

      <BottomNav role="parent" />
    </div>
  );
}

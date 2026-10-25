import { useNavigate } from "react-router-dom";
import PortalHeader from "../../components/ui/PortalHeader";
import BottomNav from "../../layout/BottomNav";
import ChatShell from "../chat/ChatShell";

// Messages for the parent: the shared chat screen (pages/chat/ChatShell.jsx).
export default function ParentChat() {
  const navigate = useNavigate();
  return (
    <div className="cs-page">
      <PortalHeader title="Messages" subtitle="Teachers and the school office" onBack={() => navigate("/parent/home")} />
      <div className="ea-pd-body"><ChatShell role="parent" /></div>
      <BottomNav role="parent" />
    </div>
  );
}

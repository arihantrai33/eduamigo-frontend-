import { useNavigate } from "react-router-dom";
import PortalHeader from "../../components/ui/PortalHeader";
import BottomNav from "../../layout/BottomNav";
import ChatShell from "../chat/ChatShell";

// Messages for the student: the shared chat screen (pages/chat/ChatShell.jsx).
export default function StudentChat() {
  const navigate = useNavigate();
  return (
    <div className="cs-page">
      <PortalHeader title="Messages" subtitle="Your teachers and the school office" onBack={() => navigate("/student/home")} />
      <div className="ea-pd-body"><ChatShell role="student" /></div>
      <BottomNav role="student" />
    </div>
  );
}

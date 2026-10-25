import { useNavigate } from "react-router-dom";
import PortalHeader from "../../components/ui/PortalHeader";
import BottomNav from "../../layout/BottomNav";
import ChatShell from "../chat/ChatShell";

// Messages for the teacher: the shared chat screen (pages/chat/ChatShell.jsx).
export default function TeacherChat() {
  const navigate = useNavigate();
  return (
    <div className="cs-page">
      <PortalHeader title="Messages" subtitle="Students, parents and the school office" onBack={() => navigate("/teacher/home")} />
      <div className="ea-pd-body"><ChatShell role="teacher" /></div>
      <BottomNav role="teacher" />
    </div>
  );
}

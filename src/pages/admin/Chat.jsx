import PageHeader from "../../components/ui/PageHeader";
import ChatShell from "../chat/ChatShell";

// Messages for the school office: the shared chat screen (pages/chat/ChatShell.jsx) with every teacher, parent and student.
export default function AdminChat() {
  return (
    <div style={{ fontFamily: "inherit" }}>
      <PageHeader title="Messages" subtitle="Chat with teachers, parents and students, and follow concerns raised with parents" />
      <ChatShell role="admin" />
    </div>
  );
}

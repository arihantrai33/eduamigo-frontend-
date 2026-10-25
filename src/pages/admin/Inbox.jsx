import axios from "axios";
import { CheckCheck } from "lucide-react";
import { toast, errorMessage } from "../../utils/toast";
import { Loading, Note, NoticeRows, Panel } from "../../components/dash/Dash";
import PageHeader from "../../components/ui/PageHeader";
import { useLoad } from "../../components/dash/helpers";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Messages the server addressed to this person or to all school staff: for the school office this includes safety alerts raised
// from the bus screen. (The office had no screen for them before.) Marking as read only changes this person's own flag.
export default function Inbox() {
  const list = useLoad(async () => (await axios.get(`${API}/notifications/my`, auth())).data, "inbox");
  const items = list.state === "ok" ? list.data.data || [] : [];
  const unread = list.state === "ok" ? list.data.unread || 0 : 0;

  const markAll = async () => {
    try {
      await axios.patch(`${API}/notifications/read`, {}, auth());
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err, "Could not mark as read"));
    }
  };

  return (
    <div className="dx ea-page--wide">
      <PageHeader title="Notifications" subtitle={unread ? `${unread} unread` : "Messages for the school office, such as safety alerts"}
        actions={unread > 0 && <button type="button" className="ea-btn ea-btn--ghost" onClick={markAll}><CheckCheck size={16} aria-hidden="true" /> Mark all as read</button>} />
      <div style={{ marginTop: 16 }}><Panel id="p-inbox-all" title="Latest">
        {list.state === "loading" ? <Loading label="Loading notifications" />
          : list.state === "error" ? <Note tone="bad" title="Could not load notifications" action={<button type="button" onClick={list.reload}>Try again</button>} />
            : items.length === 0 ? <Note title="Nothing here yet">Messages for the school office, such as safety alerts, appear here.</Note>
              : <NoticeRows items={items.slice(0, 100)} />}
      </Panel></div>
    </div>
  );
}

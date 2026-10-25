import { useState } from "react";
import axios from "axios";
import { AlertTriangle, Info, X } from "lucide-react";
import { useLoad } from "./dash/helpers";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
const TONE = { info: ["var(--brand-soft)", "var(--brand-border)", Info], warning: ["#FFFBEB", "#FDE68A", AlertTriangle], critical: ["#FEF2F2", "#FECACA", AlertTriangle] };

// Announcements from EduAmigo (maintenance, new features). Office roles only; a notice can be closed for the rest of the session.
export default function PlatformNotices() {
  const list = useLoad(async () => (await axios.get(`${API}/support/notices`, auth())).data.data, "notices");
  const [gone, setGone] = useState(() => { try { return JSON.parse(sessionStorage.getItem("closedNotices") || "[]"); } catch { return []; } });
  if (list.state !== "ok") return null;
  const shown = list.data.filter((n) => !gone.includes(n._id));
  if (!shown.length) return null;
  const close = (id) => { const next = [...gone, id]; setGone(next); try { sessionStorage.setItem("closedNotices", JSON.stringify(next)); } catch { /* not saved */ } };
  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 12 }} aria-label="Announcements from EduAmigo">
      {shown.map((n) => {
        const [bg, edge, Icon] = TONE[n.level] || TONE.info;
        return (
          <div key={n._id} role={n.level === "critical" ? "alert" : "status"} style={{ background: bg, border: `1px solid ${edge}`, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5 }}>
            <Icon size={18} aria-hidden="true" style={{ flex: "none", marginTop: 2 }} />
            <div style={{ flex: 1 }}><strong>{n.title}</strong><div>{n.message}</div></div>
            <button type="button" onClick={() => close(n._id)} aria-label={`Close announcement: ${n.title}`} style={{ border: 0, background: "transparent", cursor: "pointer", padding: 4 }}><X size={16} aria-hidden="true" /></button>
          </div>
        );
      })}
    </div>
  );
}

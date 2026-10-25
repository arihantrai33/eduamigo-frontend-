import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenCheck } from "lucide-react";
import PortalHeader from "../../components/ui/PortalHeader";
import Segmented from "../../components/ui/Segmented";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import BottomNav from "../../layout/BottomNav";
import { toast, errorMessage } from "../../utils/toast";
import { getSelectedChildId } from "../../utils/selectedChild";
import HomeworkCard from "./HomeworkCard";
import { childHomework, dueLabel, myHomework, setDone } from "./homeworkApi";
import "./homework.css";

// Homework for a student (they can tick it off) and, with role="parent", for the child a parent is looking at (read only).
export default function StudentHomework({ role = "student" }) {
  const navigate = useNavigate();
  const parent = role === "parent";
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("todo");
  const [busy, setBusy] = useState("");

  const [round, setRound] = useState(0);
  const load = useCallback(() => setRound((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    (parent ? childHomework(getSelectedChildId() || undefined) : myHomework())
      .then((r) => { if (alive) { setError(""); setList(r.data); } })
      .catch((e) => { if (alive) { setError(errorMessage(e, "Could not load homework")); setList([]); } });
    return () => { alive = false; };
  }, [parent, round]);

  const toggle = async (hw) => {
    setBusy(hw._id);
    try {
      await setDone(hw._id, !hw.done);
      setList((l) => l.map((h) => (h._id === hw._id ? { ...h, done: !hw.done, overdue: !hw.done ? false : dueLabel(hw.dueDate).days < 0 } : h)));
      if (!hw.done) toast.success("Marked as done.");
    } catch (e) { toast.error(errorMessage(e, "Could not update this homework")); } finally { setBusy(""); }
  };

  const shown = useMemo(() => {
    const all = list || [];
    if (tab === "done") return all.filter((h) => h.done).sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));
    if (tab === "all") return all;
    return all.filter((h) => !h.done);
  }, [list, tab]);
  const todo = (list || []).filter((h) => !h.done).length;
  const groups = useMemo(() => {
    if (tab !== "todo") return [["", shown]];
    const g = { Overdue: [], Today: [], Tomorrow: [], "This week": [], Later: [] };
    for (const h of shown) {
      const d = dueLabel(h.dueDate).days;
      (d < 0 ? g.Overdue : d === 0 ? g.Today : d === 1 ? g.Tomorrow : d <= 7 ? g["This week"] : g.Later).push(h);
    }
    return Object.entries(g).filter(([, v]) => v.length);
  }, [shown, tab]);

  return (
    <div className="ea-pd-read hw-page">
      <PortalHeader title="Homework" subtitle={list ? (todo ? `${todo} to do` : "All caught up") : undefined} onBack={() => navigate(parent ? "/parent/home" : "/student/home")} />
      <div className="ea-pd-body hw-body">
        <Segmented label="Homework view" value={tab} onChange={setTab} options={[{ value: "todo", label: `To do${todo ? ` (${todo})` : ""}` }, { value: "done", label: "Done" }, { value: "all", label: "All" }]} />
        {list === null && <Skeleton rows={3} label="Loading homework" />}
        {error && <div className="ea-card hw-error" role="alert">{error} <button type="button" className="ea-btn ea-btn--ghost" onClick={load}>Try again</button></div>}
        {list && !error && shown.length === 0 && (
          <EmptyState icon={BookOpenCheck} title={tab === "done" ? "Nothing finished yet" : tab === "all" ? "No homework yet" : "No homework to do"}
            text={tab === "todo" ? "When a teacher gives homework it will appear here." : undefined} />
        )}
        {groups.map(([name, items]) => (
          <section key={name || "all"} aria-label={name || "Homework"}>
            {name && <h2 className={`hw-group${name === "Overdue" ? " is-bad" : ""}`}>{name}<span>{items.length}</span></h2>}
            <div className="hw-list">
              {items.map((hw) => <HomeworkCard key={hw._id} hw={hw} onToggle={toggle} busy={busy === hw._id} readOnly={parent} />)}
            </div>
          </section>
        ))}
      </div>
      <BottomNav role={role} />
    </div>
  );
}

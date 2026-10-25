import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bus as BusIcon } from "lucide-react";
import { getChildBus } from "../../api/transport";
import { getSelectedChildId } from "../../utils/selectedChild";
import Skeleton from "../../components/ui/Skeleton";
import BusTracker from "../bus/BusTracker";

// The parent's Live Bus screen: loads the bus of the selected child, then hands over to the shared tracker
// (pages/bus/BusTracker.jsx), with the bell for alert settings.
export default function ParentBus() {
  const navigate = useNavigate();
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChildBus()
      .then((res) => { if (res.success) setBus(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="ea-bus-state"><BusIcon size={44} aria-hidden="true" /><Skeleton rows={3} label="Loading bus information" /></div>;
  }
  if (!bus) {
    return (
      <div className="ea-bus-state">
        <BusIcon size={44} aria-hidden="true" />
        <p className="ea-bus-state__title">No bus has been assigned yet.</p>
        <p>Ask the school office to add your child to a bus.</p>
        <button type="button" className="ea-btn ea-btn--primary" onClick={() => navigate("/parent/home")}>Go back</button>
      </div>
    );
  }
  return <BusTracker bus={bus} studentName={bus.studentName} studentClass={bus.studentClass} studentId={getSelectedChildId() || undefined} role="parent" alerts onBack={() => navigate("/parent/home")} />;
}

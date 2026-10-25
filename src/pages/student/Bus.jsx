import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bus as BusIcon, TriangleAlert } from "lucide-react";
import { getChildBus } from "../../api/transport";
import { errorMessage } from "../../utils/toast";
import Skeleton from "../../components/ui/Skeleton";
import BusTracker from "../bus/BusTracker";

// The student's Live Bus screen: loads the bus the student rides, then hands over to the shared tracker (pages/bus/BusTracker.jsx).
export default function StudentBus() {
  const navigate = useNavigate();
  const [bus, setBus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChildBus()
      .then((res) => { if (!res.success) throw new Error(res.message); setBus(res.data); })
      .catch((err) => setError(errorMessage(err, "Could not load the bus details")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="ea-bus-state"><BusIcon size={44} aria-hidden="true" /><Skeleton rows={3} label="Loading bus info" /></div>;
  }
  if (error || !bus) {
    return (
      <div className="ea-bus-state">
        <TriangleAlert size={44} aria-hidden="true" />
        <p className="ea-bus-state__title">No bus assigned</p>
        <p>{error || "No bus has been assigned to you yet. Ask the school office."}</p>
        <button type="button" className="ea-btn ea-btn--primary" onClick={() => navigate("/student/home")}>Go back</button>
      </div>
    );
  }
  return <BusTracker bus={bus} studentName={bus.studentName} studentClass={bus.studentClass} role="student" onBack={() => navigate("/student/home")} />;
}

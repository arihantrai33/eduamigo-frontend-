import { useState, useEffect } from "react";
import { getDriverBus, startTrip as apiStartTrip, endTrip as apiEndTrip, markStopDone } from "../../api/transport";
import { useDriverTracker } from "./useDriverTracker";

import Glyph from "../../components/Glyph";
import AuthShell from "../auth/AuthShell";
import { AlertCircle } from "lucide-react";
export default function DriverHome() {
  const [token, setToken] = useState(localStorage.getItem("driverToken") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [busData, setBusData] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [direction, setDirection] = useState("pickup");
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [tripError, setTripError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const forgetToken = () => { setToken(""); setBusData(null); setTracking(false); localStorage.removeItem("driverToken"); setTokenInput(""); };

  const tracker = useDriverTracker({
    token,
    active: tracking,
    // The server follows the bus along the route and tells us the stop it is at after every batch.
    onServerState: (d) => { if (typeof d?.currentStopIndex === "number") setCurrentStopIndex(d.currentStopIndex); },
    onTripOver: () => { setTracking(false); setTripError("This trip was closed by the school. Start a new trip to continue."); },
    onInvalid: () => { setTracking(false); setError("This driver code is no longer valid. Ask the school for a new one."); forgetToken(); },
  });

  // A reload or a crash must not lose a running trip: the server knows which trip is on and where it has got to.
  const fetchBus = async (t) => {
    setLoading(true);
    setError("");
    try {
      const res = await getDriverBus(t);
      if (res.success) {
        setBusData(res.data);
        setStops(res.data.stops || []);
        if (res.data.direction) setDirection(res.data.direction);
        if (res.data.busStatus === "On Route") { setTracking(true); setCurrentStopIndex(res.data.currentStopIndex || 0); } else { setTracking(false); setCurrentStopIndex(0); }
      } else {
        setError("Invalid token. Please try again.");
        forgetToken();
      }
    } catch (e) {
      const status = e?.response?.status;
      setError(status === 403 ? (e.response.data?.message || "Bus tracking is not available for this school right now.") : status ? "Invalid token. Please try again." : "No internet connection. Please try again.");
      if (status) forgetToken();
    }
    setLoading(false);
  };
  useEffect(() => { if (token) fetchBus(token); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Sent 3 s ago" keeps counting while the trip runs.
  useEffect(() => {
    if (!tracking) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [tracking]);

  const handleTokenSubmit = () => {
    if (!tokenInput.trim()) return;
    localStorage.setItem("driverToken", tokenInput.trim());
    setToken(tokenInput.trim());
  };

  const startTrip = async () => {
    setTripError("");
    if (!navigator.geolocation) { setTripError("This phone or browser cannot give its location. Open the driver page in Chrome or Safari."); return; }
    setStarting(true);
    try {
      const res = await apiStartTrip(token, direction);
      setStops(res.data?.stops || stops);
      setCurrentStopIndex(0);
      tracker.discard();
      setTracking(true);
    } catch (e) {
      setTripError(e?.response?.data?.message || "Could not start the trip. Check the internet and try again.");
    }
    setStarting(false);
  };

  const stopTrip = async () => {
    setTracking(false);
    setCurrentStopIndex(0);
    try { await apiEndTrip(token); } catch { setTripError("The trip could not be ended on the server. Check the internet and press End Trip again."); setTracking(true); }
  };

  const markNextStop = () => {
    const nextIndex = currentStopIndex + 1;
    if (nextIndex >= stops.length) return;
    setCurrentStopIndex(nextIndex);
    markStopDone(token).then((r) => { if (typeof r?.data?.currentStopIndex === "number") setCurrentStopIndex(r.data.currentStopIndex); }).catch(() => setCurrentStopIndex(nextIndex - 1));
  };

  const gpsLine = {
    idle: ["Ready to Start", "#facc15", "rgba(250,204,21,0.15)"],
    searching: ["Finding GPS signal…", "#facc15", "rgba(250,204,21,0.15)"],
    ok: ["GPS Connected", "#22c55e", "rgba(34,197,94,0.15)"],
    weak: ["GPS signal is weak", "#f59e0b", "rgba(245,158,11,0.15)"],
    lost: ["GPS signal lost", "#ef4444", "rgba(239,68,68,0.15)"],
    denied: ["Location is blocked", "#ef4444", "rgba(239,68,68,0.15)"],
    unsupported: ["No GPS on this device", "#ef4444", "rgba(239,68,68,0.15)"],
  }[tracker.gps];
  const status = tracker.gps === "ok" ? "active" : tracker.gps === "idle" ? "idle" : "error";
  const coords = tracker.fix;
  const sentAgo = tracker.lastSentAt ? Math.max(0, Math.round((now - tracker.lastSentAt) / 1000)) : null;

  const s = { label: gpsLine[0], dot: gpsLine[1], bg: gpsLine[2] };
  const warn = { ...{ width: "100%", maxWidth: "320px", borderRadius: "12px", padding: "10px 14px", marginBottom: "12px", fontSize: "12.5px", lineHeight: 1.45, boxSizing: "border-box" } };
  const isLastStop = currentStopIndex >= stops.length - 1;

  // Sign-in with the driver token: the EduAmigo split like "Find your school". The trip screen below keeps its own look.
  if (!token || !busData) {
    return (
      <AuthShell>
        <h1 className="au-h1">Driver sign-in</h1>
        <p className="au-sub">Enter the driver token the school gave you.</p>
        <form className="au-form" onSubmit={(e) => { e.preventDefault(); handleTokenSubmit(); }} noValidate>
          <div className="au-field">
            <label className="au-label" htmlFor="driver-token">Driver token</label>
            <div className="au-box">
              <input id="driver-token" className="au-input" aria-invalid={error ? true : undefined} aria-describedby={error ? "driver-token-error" : undefined}
                value={tokenInput} onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. BUS_01-257868" autoCapitalize="characters" autoComplete="off" spellCheck={false}
                style={{ letterSpacing: 1, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }} />
            </div>
          </div>
          {error && <div id="driver-token-error" className="au-alert au-alert--bad" role="alert"><AlertCircle size={18} aria-hidden />{error}</div>}
          <button type="submit" className="au-btn" disabled={loading}>{loading ? "Verifying…" : "Continue"}</button>
        </form>
      </AuthShell>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "inherit", padding: "24px" }}>
      <div style={{ width: "80px", height: "80px", background: "rgba(255,255,255,0.08)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", marginBottom: "16px", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}><Glyph e="🚌" /></div>
      <div style={{ color: "white", fontSize: "22px", fontWeight: "800", marginBottom: "4px" }}>EduAmigo Driver</div>
      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", marginBottom: "8px" }}>{busData.busNumber} — {busData.routeName}</div>
      <button onClick={forgetToken} disabled={tracking} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "12.5px", textDecoration: "underline", cursor: tracking ? "default" : "pointer", marginBottom: "24px", opacity: tracking ? 0.4 : 1 }}>
        Change Token
      </button>
      <div style={{ background: s.bg, border: `1px solid ${s.dot}40`, borderRadius: "16px", padding: "16px 24px", width: "100%", maxWidth: "320px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.dot, boxShadow: `0 0 8px ${s.dot}`, flexShrink: 0, animation: status === "active" ? "pulse 1.5s infinite" : "none" }} />
        <div>
          <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{s.label}</div>
          {coords && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "2px" }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} · ±{coords.accuracy} m</div>}
        </div>
      </div>
      {tracking && (
        <div style={{ width: "100%", maxWidth: "320px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "16px", marginBottom: "24px" }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: "700", marginBottom: "12px", letterSpacing: "1px" }}>CURRENT STOP</div>
          {stops.map((stop, i) => {
            const isDone = i < currentStopIndex;
            const isCurrent = i === currentStopIndex;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", opacity: isDone ? 0.35 : 1 }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: isDone ? "#334155" : isCurrent ? "#1a73e8" : "rgba(255,255,255,0.08)", border: `2px solid ${isDone ? "#475569" : isCurrent ? "#1a73e8" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", flexShrink: 0, color: isDone ? "var(--ea-muted)" : "white" }}>
                  {isDone ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: "13px", fontWeight: isCurrent ? "700" : "400", color: isDone ? "#475569" : isCurrent ? "#60a5fa" : "rgba(255,255,255,0.7)" }}>{stop.name}</div>
                {isCurrent && <span style={{ marginLeft: "auto", fontSize: "10px", background: "rgba(26,115,232,0.2)", color: "#60a5fa", padding: "2px 8px", borderRadius: "99px", fontWeight: "700" }}>NOW</span>}
              </div>
            );
          })}
          {!isLastStop && (
            <button onClick={markNextStop} style={{ marginTop: "16px", width: "100%", background: "rgba(26,115,232,0.15)", border: "1px solid rgba(26,115,232,0.4)", color: "#60a5fa", borderRadius: "12px", padding: "12px", fontSize: "13px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.5px" }}>
              <Glyph e="✅" /> Reached {stops[currentStopIndex]?.name} — Next Stop →
            </button>
          )}
          {isLastStop && <div style={{ marginTop: "16px", textAlign: "center", color: "#22c55e", fontWeight: "700", fontSize: "13px" }}>Reached school</div>}
        </div>
      )}
      {!tracking && (
        <div role="group" aria-label="Which run is this" style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "320px", marginBottom: "16px" }}>
          {[["pickup", "Morning pickup"], ["drop", "Afternoon drop"]].map(([v, label]) => (
            <button key={v} type="button" aria-pressed={direction === v} onClick={() => setDirection(v)}
              style={{ flex: 1, padding: "11px 8px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: `1.5px solid ${direction === v ? "#60a5fa" : "rgba(255,255,255,0.18)"}`, background: direction === v ? "rgba(26,115,232,0.25)" : "transparent", color: direction === v ? "#bfdbfe" : "rgba(255,255,255,0.65)" }}>
              {label}
            </button>
          ))}
        </div>
      )}
      {tripError && <div role="alert" style={{ ...warn, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fecaca" }}>{tripError}</div>}
      {tracking && tracker.gps === "denied" && <div role="alert" style={{ ...warn, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fecaca" }}>Location is blocked for this page, so the bus cannot be tracked. Open the browser's site settings, allow Location, and reload.</div>}
      {tracking && !tracker.online && <div role="status" style={{ ...warn, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#fde68a" }}>No internet. Your location is being saved on this phone ({tracker.queued} waiting) and will be sent as soon as the connection is back.</div>}
      {tracking && tracker.online && tracker.queued > 8 && <div role="status" style={{ ...warn, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#fde68a" }}>The connection is slow: {tracker.queued} readings are waiting to be sent.</div>}
      {tracking && tracker.pausedWhileHidden && (
        <div role="status" style={{ ...warn, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#fde68a" }}>
          The screen was off or another app was open, so the bus location may have paused. Keep this app open and the screen on during the trip.
          <button type="button" onClick={tracker.clearPaused} style={{ display: "block", marginTop: 6, background: "none", border: "none", color: "#fff", textDecoration: "underline", cursor: "pointer", padding: 0, fontSize: "12.5px" }}>OK</button>
        </div>
      )}
      {tracking && (
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11.5px", marginBottom: "14px", textAlign: "center" }}>
          {sentAgo === null ? "Waiting for the first location…" : `Location sent ${sentAgo < 2 ? "just now" : `${sentAgo} s ago`}`}
          {tracker.wakeLock === "unsupported" && " · This browser cannot keep the screen on: do not lock the phone."}
        </div>
      )}
      {!tracking ? (
        <button onClick={startTrip} disabled={starting} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: "16px", padding: "18px 56px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 8px 24px rgba(34,197,94,0.3)" }}>
          {starting ? "Starting…" : "Start Trip"}
        </button>
      ) : (
        <button onClick={stopTrip} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", borderRadius: "16px", padding: "18px 56px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 8px 24px rgba(239,68,68,0.3)" }}>
          End Trip
        </button>
      )}
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12.5px", lineHeight: 1.5, marginTop: "24px", textAlign: "center", maxWidth: "300px" }}>
        Keep this app open and the phone unlocked during the trip. Your location is shared with the school and the parents of the students on this bus.
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }`}</style>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { getDriverBus, startTrip as apiStartTrip, endTrip as apiEndTrip, markStopDone, updateDriverLocation } from "../../api/transport";

import Glyph from "../../components/Glyph";
import PlatformHero from "../../components/PlatformHero";
import { Bus, AlertCircle } from "lucide-react";
export default function DriverHome() {
  const [token, setToken] = useState(localStorage.getItem("driverToken") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [busData, setBusData] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("idle");
  const [coords, setCoords] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wakeLockRef = useRef(null);
  const trackingRef = useRef(false);
  const watchIdRef = useRef(null);
  const firebaseKeyRef = useRef(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (token) fetchBus(token);
  }, [token]);

  const fetchBus = async (t) => {
    setLoading(true);
    setError("");
    try {
      const res = await getDriverBus(t);
      if (res.success) {
        setBusData(res.data);
        firebaseKeyRef.current = res.data.trackingId;
        setTracking(false);
        setStatus("idle");
        setCurrentStopIndex(0);
      } else {
        setError("Invalid token. Please try again.");
        setToken("");
        localStorage.removeItem("driverToken");
      }
    } catch (e) {
      setError("Invalid token. Please try again.");
      setToken("");
      localStorage.removeItem("driverToken");
    }
    setLoading(false);
  };

  const handleTokenSubmit = () => {
    if (!tokenInput.trim()) return;
    localStorage.setItem("driverToken", tokenInput.trim());
    setToken(tokenInput.trim());
  };

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch (e) {}
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const startGPSWatch = () => {
    if (!navigator.geolocation || !firebaseKeyRef.current) return null;
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setStatus("active");
        // Send at most one update every 5 seconds; the server publishes it to parents.
        const now = Date.now();
        if (now - lastSentRef.current < 5000) return;
        lastSentRef.current = now;
        updateDriverLocation(token, latitude, longitude).catch((e) => {
          if (e?.response?.status === 409) setStatus("error");
        });
      },
      (err) => {
        // Timeout: retry
        if (err.code === 3 && trackingRef.current) {
          setTimeout(() => {
            if (!trackingRef.current) return;
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
            const newId = startGPSWatch();
            watchIdRef.current = newId;
          }, 3000);
        } else if (err.code === 1) {
          // Permission denied
          setStatus("error");
        } else {
          setStatus("error");
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
    );
    return id;
  };

  // Restart GPS only while tracking is active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && trackingRef.current) {
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        const newId = startGPSWatch();
        watchIdRef.current = newId;
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [busData]);

  const startTrip = async () => {
    if (!firebaseKeyRef.current) return;

    // Location access is required to run a trip
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }

    // Update the UI immediately; do not wait for the API
    trackingRef.current = true;
    setTracking(true);
    setStatus("idle");
    setCurrentStopIndex(0);

    // The server marks the trip as started and notifies parents' tracking screens.
    try {
      await apiStartTrip(token);
    } catch {
      trackingRef.current = false;
      setTracking(false);
      setStatus("error");
      return;
    }

    // Start GPS
    await requestWakeLock();
    const id = startGPSWatch();
    watchIdRef.current = id;
  };

  const stopTrip = async () => {
    // Update the UI immediately
    trackingRef.current = false;
    setTracking(false);
    setCoords(null);
    setStatus("idle");
    setCurrentStopIndex(0);

    // Stop GPS
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    releaseWakeLock();

    // The server ends the trip and clears the live location for parents.
    apiEndTrip(token).catch(() => {});
  };

  const markNextStop = () => {
    const nextIndex = currentStopIndex + 1;
    const stops = busData?.stops || [];
    if (nextIndex >= stops.length) return;
    setCurrentStopIndex(nextIndex);
    markStopDone(token).catch(() => setCurrentStopIndex(nextIndex - 1));
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      releaseWakeLock();
    };
  }, []);

  const statusConfig = {
    idle:   { label: "Ready to Start",  dot: "#facc15", bg: "rgba(250,204,21,0.15)" },
    active: { label: "GPS Connected",   dot: "#22c55e", bg: "rgba(34,197,94,0.15)"  },
    error:  { label: "GPS Signal Lost", dot: "#ef4444", bg: "rgba(239,68,68,0.15)"  },
  };

  const s = statusConfig[status];
  const stops = busData?.stops || [];
  const isLastStop = currentStopIndex >= stops.length - 1;

  // Sign-in with the driver token: the EduAmigo split like "Find your school". The trip screen below keeps its own look.
  if (!token || !busData) {
    return (
      <div className="ea-auth ea-platform" style={{ minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column", background: "var(--card)", fontFamily: "inherit", overflowY: "auto" }}>
        <PlatformHero icon={Bus} title="EduAmigo Driver" subtitle="Enter your driver token to continue" />
        <div style={{ flex: 1, background: "var(--card)", padding: "16px 22px 40px" }}>
          <label htmlFor="driver-token" style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 5 }}>Driver token</label>
          <input
            id="driver-token" aria-invalid={error ? true : undefined} aria-describedby={error ? "driver-token-error" : undefined}
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleTokenSubmit()}
            placeholder="e.g. BUS_01-257868" autoCapitalize="characters" autoComplete="off" spellCheck={false}
            style={{ width: "100%", padding: "12px 13px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 15, color: "var(--text)", boxSizing: "border-box", background: "var(--input)", marginBottom: 12, letterSpacing: 1, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
          {error && (
            <div id="driver-token-error" role="alert" style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#fef2f2", border: "1px solid #fecaca", color: "#B91C1C", borderRadius: 10, padding: "9px 13px", fontSize: 12, marginBottom: 12 }}>
              <AlertCircle aria-hidden size={16} style={{ flexShrink: 0 }} />{error}
            </div>
          )}
          <button onClick={handleTokenSubmit} disabled={loading} className="ea-btn ea-btn--primary" style={{ width: "100%", minHeight: 48, fontSize: 15 }}>
            {loading ? "Verifying..." : "Continue →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "inherit", padding: "24px" }}>
      <div style={{ width: "80px", height: "80px", background: "rgba(255,255,255,0.08)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.1)" }}><Glyph e="🚌" /></div>
      <div style={{ color: "white", fontSize: "22px", fontWeight: "800", marginBottom: "4px" }}>EduAmigo Driver</div>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "8px" }}>{busData.busNumber} — {busData.routeName}</div>
      <button onClick={() => { setToken(""); setBusData(null); localStorage.removeItem("driverToken"); setTokenInput(""); firebaseKeyRef.current = null; }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "11px", cursor: "pointer", marginBottom: "24px" }}>
        Change Token
      </button>
      <div style={{ background: s.bg, border: `1px solid ${s.dot}40`, borderRadius: "16px", padding: "16px 24px", width: "100%", maxWidth: "320px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.dot, boxShadow: `0 0 8px ${s.dot}`, flexShrink: 0, animation: status === "active" ? "pulse 1.5s infinite" : "none" }} />
        <div>
          <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{s.label}</div>
          {coords && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "2px" }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>}
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
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: isDone ? "#334155" : isCurrent ? "#1a73e8" : "rgba(255,255,255,0.08)", border: `2px solid ${isDone ? "#475569" : isCurrent ? "#1a73e8" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", flexShrink: 0, color: isDone ? "#64748b" : "white" }}>
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
          {isLastStop && <div style={{ marginTop: "16px", textAlign: "center", color: "#22c55e", fontWeight: "700", fontSize: "13px" }}>Reached School!</div>}
        </div>
      )}
      {!tracking ? (
        <button onClick={startTrip} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: "16px", padding: "18px 56px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 8px 24px rgba(34,197,94,0.3)" }}>
          Start Trip
        </button>
      ) : (
        <button onClick={stopTrip} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", borderRadius: "16px", padding: "18px 56px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 8px 24px rgba(239,68,68,0.3)" }}>
          End Trip
        </button>
      )}
      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", marginTop: "24px", textAlign: "center", maxWidth: "260px" }}>
        Your location will be shared with students in real time
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }`}</style>
    </div>
  );
}
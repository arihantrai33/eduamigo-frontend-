import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { ref, set, update } from "firebase/database";
import { getDriverBus, startTrip as apiStartTrip, endTrip as apiEndTrip } from "../../api/transport";

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
        firebaseKeyRef.current = res.data.busId || res.data.driverToken;
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
    const firebasePath = `transport/${firebaseKeyRef.current}`;
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setStatus("active");
        update(ref(db, `${firebasePath}/location`), {
          lat: latitude,
          lng: longitude,
          updatedAt: Date.now(),
        });
      },
      (err) => {
        // Timeout error — retry karo
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

  // ✅ FIX: Sirf tab restart karo GPS jab tracking chal rahi ho
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

    // ✅ FIX: Pehle location permission lo
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }

    // ✅ FIX: UI turant update karo, API ko wait mat karo
    trackingRef.current = true;
    setTracking(true);
    setStatus("idle");
    setCurrentStopIndex(0);

    // Firebase pehle update karo — fast
    const firebasePath = `transport/${firebaseKeyRef.current}`;
    update(ref(db, firebasePath), {
      tripStartedAt: Date.now(),
      tripEndedAt: null,
      busStatus: "On Route",
      currentStopIndex: 0,
      updatedAt: Date.now(),
    });

    // GPS shuru karo
    await requestWakeLock();
    const id = startGPSWatch();
    watchIdRef.current = id;

    // ✅ FIX: API ko background mein call karo — await mat karo
    apiStartTrip(token).catch(() => {});
  };

  const stopTrip = async () => {
    // ✅ FIX: UI turant update karo
    trackingRef.current = false;
    setTracking(false);
    setCoords(null);
    setStatus("idle");
    setCurrentStopIndex(0);

    // GPS band karo
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    releaseWakeLock();

    // Firebase update karo
    if (firebaseKeyRef.current) {
      const firebasePath = `transport/${firebaseKeyRef.current}`;
      await set(ref(db, `${firebasePath}/location`), null);
      update(ref(db, firebasePath), {
        tripEndedAt: Date.now(),
        busStatus: "Completed",
        updatedAt: Date.now(),
      });
    }

    // ✅ FIX: API background mein
    apiEndTrip(token).catch(() => {});
  };

  const markNextStop = () => {
    const nextIndex = currentStopIndex + 1;
    const stops = busData?.stops || [];
    if (nextIndex >= stops.length) return;
    setCurrentStopIndex(nextIndex);
    if (firebaseKeyRef.current) {
      update(ref(db, `transport/${firebaseKeyRef.current}`), {
        currentStopIndex: nextIndex,
        updatedAt: Date.now(),
      });
    }
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

  if (!token || !busData) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Poppins', sans-serif", padding: "24px" }}>
        <div style={{ width: "80px", height: "80px", background: "rgba(255,255,255,0.08)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>🚌</div>
        <div style={{ color: "white", fontSize: "22px", fontWeight: "800", marginBottom: "4px" }}>EduAmigo Driver</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "32px" }}>Enter your driver token to continue</div>
        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "12px", padding: "12px 20px", color: "#f87171", fontSize: "13px", marginBottom: "16px", width: "100%", maxWidth: "320px" }}>{error}</div>
        )}
        <input
          value={tokenInput}
          onChange={e => setTokenInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleTokenSubmit()}
          placeholder="e.g. BUS_01-257868"
          style={{ width: "100%", maxWidth: "320px", padding: "14px 18px", borderRadius: "14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "15px", fontWeight: "600", outline: "none", marginBottom: "16px", letterSpacing: "1px", textAlign: "center", fontFamily: "monospace" }}
        />
        <button onClick={handleTokenSubmit} disabled={loading} style={{ background: "linear-gradient(135deg, #1a73e8, #0EA5E9)", color: "white", border: "none", borderRadius: "14px", padding: "14px 48px", fontSize: "15px", fontWeight: "700", cursor: "pointer", width: "100%", maxWidth: "320px" }}>
          {loading ? "Verifying..." : "Continue →"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Poppins', sans-serif", padding: "24px" }}>
      <div style={{ width: "80px", height: "80px", background: "rgba(255,255,255,0.08)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>🚌</div>
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
              ✅ Reached {stops[currentStopIndex]?.name} — Next Stop →
            </button>
          )}
          {isLastStop && <div style={{ marginTop: "16px", textAlign: "center", color: "#22c55e", fontWeight: "700", fontSize: "13px" }}>🎉 Reached School!</div>}
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
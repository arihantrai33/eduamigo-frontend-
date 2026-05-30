import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ── Utils ──────────────────────────────────────────────────────
const getTrafficStatus = (speed) => {
  if (!speed || speed === 0) return { color: "#9CA3AF", label: "Stationary" };
  if (speed < 15)            return { color: "#EF4444",  label: "Heavy traffic — Delay possible" };
  if (speed < 30)            return { color: "#F59E0B",  label: "Moderate traffic" };
  return                            { color: "#10B981",  label: "Clear road" };
};

async function fetchETA(fromLat, fromLng, toLat, toLng) {
  try {
    const url  = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const data = await (await fetch(url)).json();
    if (data.routes?.[0]) {
      const m = Math.round(data.routes[0].duration / 60);
      return m <= 1 ? "< 1 min" : `${m} min`;
    }
  } catch {}
  return null;
}

async function fetchRoadRoute(fromLat, fromLng, toStops) {
  try {
    const waypoints = [{ lat: fromLat, lng: fromLng }, ...toStops];
    const coords    = waypoints.map(s => `${s.lng},${s.lat}`).join(";");
    const ctrl      = new AbortController();
    const timer     = setTimeout(() => ctrl.abort(), 8000);
    const data      = await (await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal: ctrl.signal }
    )).json();
    clearTimeout(timer);
    if (data.routes?.[0]) return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch {}
  return toStops.map(s => [s.lat, s.lng]);
}

async function fetchFullRoute(allStops) {
  try {
    const coords = allStops.map(s => `${s.lng},${s.lat}`).join(";");
    const ctrl   = new AbortController();
    const timer  = setTimeout(() => ctrl.abort(), 8000);
    const data   = await (await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal: ctrl.signal }
    )).json();
    clearTimeout(timer);
    if (data.routes?.[0]) return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch {}
  return allStops.map(s => [s.lat, s.lng]);
}

function getNearestPointIndex(routePoints, lat, lng) {
  let minDist = Infinity, minIdx = 0;
  routePoints.forEach(([pLat, pLng], i) => {
    const d = (pLat - lat) ** 2 + (pLng - lng) ** 2;
    if (d < minDist) { minDist = d; minIdx = i; }
  });
  return minIdx;
}

function getNearestStopIndex(stops, lat, lng) {
  let minDist = Infinity, minIdx = 0;
  stops.forEach((stop, i) => {
    const d = (stop.lat - lat) ** 2 + (stop.lng - lng) ** 2;
    if (d < minDist) { minDist = d; minIdx = i; }
  });
  return minIdx;
}

// ── Icons ──────────────────────────────────────────────────────
const busIcon = L.divIcon({
  className: "",
  html: `<div style="width:52px;height:52px;background:linear-gradient(135deg,#4F46E5,#6366F1);border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(79,70,229,0.6);border:3px solid white;">
    <span style="transform:rotate(45deg);font-size:24px;line-height:1;">🚌</span></div>`,
  iconSize: [52, 52], iconAnchor: [26, 52], popupAnchor: [0, -56],
});

function makeStopIcon(type) {
  const configs = {
    completed: { bg: "#10B981", text: "✓",  size: 22 },
    current:   { bg: "#4F46E5", text: "●",  size: 26 },
    school:    { bg: "#F59E0B", text: "🏫", size: 24 },
    upcoming:  { bg: "#E5E7EB", text: "●",  size: 18 },
  };
  const c = configs[type] || configs.upcoming;
  return L.divIcon({
    className: "",
    html: `<div style="width:${c.size}px;height:${c.size}px;background:${c.bg};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2.5px solid white;font-size:${Math.round(c.size*0.48)}px;color:white;font-weight:700;">${c.text}</div>`,
    iconSize: [c.size, c.size], iconAnchor: [c.size/2, c.size/2], popupAnchor: [0, -c.size/2-4],
  });
}

// ── Sub-components ─────────────────────────────────────────────
function SmoothBusMarker({ position, driverName, busLabel }) {
  const markerRef  = useRef(null);
  const currentPos = useRef(position);
  const animFrame  = useRef(null);
  useEffect(() => {
    if (!markerRef.current || !position) return;
    const start = { ...currentPos.current };
    const end   = position;
    let startTime = null;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const t     = Math.min((ts - startTime) / 2000, 1);
      const eased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      markerRef.current?.setLatLng([
        start.lat + (end.lat - start.lat) * eased,
        start.lng + (end.lng - start.lng) * eased,
      ]);
      if (t < 1) animFrame.current = requestAnimationFrame(animate);
      else currentPos.current = end;
    };
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(animate);
    return () => { if (animFrame.current) cancelAnimationFrame(animFrame.current); };
  }, [position]);
  if (!position) return null;
  return (
    <Marker ref={markerRef} position={[position.lat, position.lng]} icon={busIcon}>
      <Popup><strong>{busLabel}</strong><br />Driver: {driverName}</Popup>
    </Marker>
  );
}

function MapAutoCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], 16, { animate: true, duration: 1.5 });
  }, [position, map]);
  return null;
}

function SOSModal({ onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={{ fontSize: "52px", marginBottom: "12px" }}>🆘</div>
        <p style={styles.modalTitle}>Send SOS Alert?</p>
        <p style={styles.modalSub}>This will immediately notify the school admin, driver, and emergency contacts with your live bus location.</p>
        <div style={styles.modalBtns}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.confirmSosBtn} onClick={() => { alert("🆘 SOS Sent! Admin and emergency contacts notified."); onClose(); }}>🆘 Send SOS</button>
        </div>
      </div>
    </div>
  );
}

function CallModal({ onClose, driverName, driverPhone }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={{ fontSize: "52px", marginBottom: "12px" }}>📞</div>
        <p style={styles.modalTitle}>Call Driver</p>
        <p style={styles.modalSub}><strong>{driverName}</strong><br />{driverPhone}</p>
        <div style={styles.modalBtns}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <a href={`tel:${driverPhone}`} style={styles.callConfirmBtn}>📞 Call Now</a>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function ParentBus() {
  const navigate = useNavigate();

  const [busInfo,        setBusInfo]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [apiError,       setApiError]       = useState(null);

  const [busLocation,    setBusLocation]    = useState(null);
  const [busSpeed,       setBusSpeed]       = useState(0);
  const [eta,            setEta]            = useState("—");
  const [tripActive,     setTripActive]     = useState(false);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [fullRoute,      setFullRoute]      = useState([]);
  const [remainingRoute, setRemainingRoute] = useState([]);
  const [completedRoute, setCompletedRoute] = useState([]);

  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [showSOS,       setShowSOS]       = useState(false);
  const [showCall,      setShowCall]      = useState(false);
  const [headerHeight,  setHeaderHeight]  = useState(0);

  const headerRef     = useRef(null);
  const lastUpdateRef = useRef(null);

  // ── 1. Fetch bus info ──
  useEffect(() => {
    const fetchBusInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/transport/my-child-bus`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setBusInfo(data.data);
      } catch (err) {
        setApiError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBusInfo();
  }, []);

  // ── 2. Header height ──
  useEffect(() => {
    if (!headerRef.current) return;
    const ro = new ResizeObserver(([e]) => setHeaderHeight(e.contentRect.height));
    ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── 3. Full road route ──
  useEffect(() => {
    if (!busInfo?.stops?.length) return;
    const mapped = busInfo.stops
      .sort((a, b) => a.order - b.order)
      .map(s => ({ lat: s.latitude, lng: s.longitude, name: s.name }));
    fetchFullRoute(mapped).then(setFullRoute);
  }, [busInfo]);

  // ── 4. Firebase live tracking — FIXED ──
  useEffect(() => {
    if (!busInfo?.firebasePath) return;

    // Status listener — trip active/inactive decide karta hai
    const statusRef = ref(db, `transport/${busInfo.firebasePath}/busStatus`);
    const unsubscribeStatus = onValue(statusRef, (snap) => {
      const status = snap.val();
      if (status === 'Idle' || status === 'Completed' || !status) {
        setTripActive(false);
        setBusLocation(null);
        setBusSpeed(0);
        setEta("—");
        setRemainingRoute([]);
        setCompletedRoute([]);
      }
    });
    // currentStopIndex driver se sync
    const stopIndexRef = ref(db, `transport/${busInfo.firebasePath}/currentStopIndex`);
    const unsubscribeStopIndex = onValue(stopIndexRef, (snap) => {
      const idx = snap.val();
      if (idx !== null && idx !== undefined) setCurrentStopIdx(idx);
    });
    // Location listener — live GPS updates
    const busRef = ref(db, `transport/${busInfo.firebasePath}/location`);
    const unsubscribeLocation = onValue(busRef, async (snapshot) => {
      const data = snapshot.val();

      if (!data?.lat || !data?.lng || (data.lat === 0 && data.lng === 0)) {
        setTripActive(false);
        setBusLocation(null);
        setBusSpeed(0);
        setEta("—");
        setCurrentStopIdx(busInfo.currentStopIndex || 0);
        setRemainingRoute([]);
        setCompletedRoute([]);
        return;
      }

      // Speed calculation
      const now = Date.now();
      if (lastUpdateRef.current) {
        const { lat: pLat, lng: pLng, time: pTime } = lastUpdateRef.current;
        const timeDelta = (now - pTime) / 1000;
        if (timeDelta > 0) {
          const distance = Math.sqrt(
            ((data.lat - pLat) * 111_000) ** 2 +
            ((data.lng - pLng) * 111_000 * Math.cos(data.lat * (Math.PI / 180))) ** 2
          );
          setBusSpeed(Math.round((distance / timeDelta) * 3.6));
        }
      }
      lastUpdateRef.current = { lat: data.lat, lng: data.lng, time: now };

      setTripActive(true);
      setBusLocation({ lat: data.lat, lng: data.lng });

      if (busInfo.stops?.length) {
        const stops = busInfo.stops
          .sort((a, b) => a.order - b.order)
          .map(s => ({ lat: s.latitude, lng: s.longitude }));
        const nearestIdx = getNearestStopIndex(stops, data.lat, data.lng);
        setCurrentStopIdx(nearestIdx);

        const remainingStops = stops.slice(nearestIdx);
        const remaining = await fetchRoadRoute(data.lat, data.lng, remainingStops);
        setRemainingRoute(remaining);

        if (fullRoute.length > 0) {
          const splitIdx = getNearestPointIndex(fullRoute, data.lat, data.lng);
          setCompletedRoute(fullRoute.slice(0, splitIdx + 1));
        }

        const lastStop = stops[stops.length - 1];
        const etaResult = await fetchETA(data.lat, data.lng, lastStop.lat, lastStop.lng);
        if (etaResult) setEta(etaResult);
      }
    });

    // Dono listeners ka cleanup
    return () => {
      unsubscribeStatus();
      unsubscribeLocation();
    };
  }, [busInfo, fullRoute]);

  // ── 5. ESC key ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setIsFullscreen(false); setShowSOS(false); setShowCall(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Derived values ──
  const stops = busInfo?.stops
    ? [...busInfo.stops].sort((a, b) => a.order - b.order)
        .map(s => ({ id: s._id, name: s.name, lat: s.latitude, lng: s.longitude }))
    : [];

  const traffic        = getTrafficStatus(busSpeed);
  const completedCount = stops.filter((_, i) => i < currentStopIdx).length;
  const progressPct    = !tripActive ? 0
    : currentStopIdx === stops.length - 1 ? 100
    : Math.round((completedCount / Math.max(stops.length - 1, 1)) * 100);

  const busLabel   = busInfo ? `Bus #${busInfo.busNumber}` : "Bus";
  const routeLabel = busInfo?.routeName || "—";

  function getStopType(i) {
    if (i < currentStopIdx)                 return "completed";
    if (i === currentStopIdx && tripActive) return "current";
    if (i === stops.length - 1)            return "school";
    return "upcoming";
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ ...styles.pageShell, alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚌</div>
          <p style={{ color: "#4F46E5", fontWeight: 600 }}>Loading bus info...</p>
        </div>
      </div>
    );
  }

  if (apiError || !busInfo) {
    return (
      <div style={{ ...styles.pageShell, alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>⚠️</div>
          <p style={{ color: "#EF4444", fontWeight: 600, marginBottom: "8px" }}>No bus assigned</p>
          <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "20px" }}>
            {apiError || "No bus found for your child"}
          </p>
          <button
            onClick={() => navigate("/student/home")}
            style={{ padding: "10px 24px", borderRadius: "12px", background: "#4F46E5", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Map content ──
  const mapContent = busLocation ? (
    <MapContainer
      center={[busLocation.lat, busLocation.lng]}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {completedRoute.length > 1 && (
        <Polyline positions={completedRoute} color="#A5B4FC" weight={5} opacity={0.55} />
      )}
      {remainingRoute.length > 1 && (
        <Polyline
          positions={remainingRoute}
          color={traffic.color}
          weight={6}
          opacity={0.92}
          dashArray={traffic.color === "#EF4444" ? "10 6" : undefined}
        />
      )}
      {fullRoute.length > 1 && (
        <Polyline positions={fullRoute} color="#4F46E5" weight={2} opacity={0.18} dashArray="8 10" />
      )}
      <SmoothBusMarker position={busLocation} driverName={busInfo.driverName} busLabel={busLabel} />
      <MapAutoCenter   position={busLocation} />
      {stops.map((stop, i) => {
        const type = getStopType(i);
        return (
          <Marker key={stop.id || i} position={[stop.lat, stop.lng]} icon={makeStopIcon(type)}>
            <Popup>
              <strong>{stop.name}</strong><br />
              {type === "completed" && "✅ Departed"}
              {type === "current"   && "🚌 Bus is here now"}
              {type === "school"    && `🏫 Destination — ETA ${eta}`}
              {type === "upcoming"  && "⏳ Upcoming stop"}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  ) : (
    <div style={styles.mapPlaceholder}>
      <div style={{ fontSize: "56px" }}>🚌</div>
      <p style={styles.busEmptyTitle}>Bus not on route yet</p>
      <p style={styles.busEmptySub}>Trip has not started</p>
    </div>
  );

  // ── Fullscreen ──
  if (isFullscreen) {
    return (
      <div style={styles.fullscreenRoot}>
        <div style={{ width: "100%", height: "100%" }}>{mapContent}</div>
        <button style={styles.exitFsBtn} onClick={() => setIsFullscreen(false)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
            <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
          </svg>
          <span style={{ fontSize: "12px", fontWeight: 600 }}>Exit</span>
        </button>
        <div style={styles.fsActionRow}>
          <button style={styles.fsCallBtn} onClick={() => setShowCall(true)}>📞 Call Driver</button>
          <button style={styles.fsSosBtn}  onClick={() => setShowSOS(true)}>🆘 SOS</button>
        </div>
        <div style={styles.fsMiniPill}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: traffic.color, display: "inline-block" }} />
          <span style={{ color: "white", fontSize: "13px", fontWeight: 500 }}>{busLabel}</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginLeft: "4px" }}>ETA {eta}</span>
        </div>
        {showSOS  && <SOSModal  onClose={() => setShowSOS(false)} />}
        {showCall && <CallModal onClose={() => setShowCall(false)} driverName={busInfo.driverName} driverPhone={busInfo.driverPhone} />}
      </div>
    );
  }

  // ── Main render ──
  return (
    <div style={styles.pageShell}>
      <div style={styles.phoneCard}>
        <div style={{
          position: "absolute", top: headerHeight, left: 0, right: 0, bottom: 0,
          zIndex: 0, transition: "top 0.3s ease",
        }}>
          {mapContent}
        </div>

        <button
          style={{ ...styles.fsBtn, bottom: panelExpanded ? "calc(70vh + 12px)" : "260px" }}
          onClick={() => setIsFullscreen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
            <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
          </svg>
        </button>

        <div ref={headerRef} style={styles.header}>
          <div style={styles.navRow}>
            <button style={styles.backBtn} onClick={() => navigate("/student/home")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <div style={{ flex: 1 }}>
              <p style={styles.navTitle}>Live Bus Tracking</p>
              <p style={styles.navSub}>{busLabel} · {routeLabel}</p>
            </div>
            {tripActive && (
              <div style={styles.livePill}>
                <span style={styles.liveDot} />
                <span style={styles.liveText}>LIVE</span>
              </div>
            )}
          </div>

          <div style={styles.childCard}>
            <div style={{ fontSize: "32px" }}>🧒</div>
            <div style={{ flex: 1 }}>
              <p style={styles.childName}>{busInfo.studentName}</p>
              <p style={styles.childClass}>{busInfo.studentClass}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px",
                background: tripActive ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.15)",
                color: tripActive ? "#4ADE80" : "rgba(255,255,255,0.7)",
                border: `1px solid ${tripActive ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.2)"}`,
              }}>
                {tripActive ? "🚌 On Bus" : "🏠 At Home"}
              </span>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>
                {tripActive ? `ETA: ${eta}` : "Trip not started yet"}
              </p>
            </div>
          </div>

          <div style={styles.metricsRow}>
            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>EST. ARRIVAL</p>
              <p style={styles.metricValue}>{eta}</p>
              <p style={styles.metricSub}>to school</p>
            </div>
            <div style={styles.metricDivider} />
            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>BUS SPEED</p>
              {busSpeed === 0
                ? <p style={{ ...styles.metricValue, fontSize: "16px", marginTop: "4px" }}>Stationary</p>
                : <p style={styles.metricValue}>{busSpeed} <span style={styles.metricUnit}>km/h</span></p>
              }
              <p style={styles.metricSub}>{busSpeed === 0 ? "not moving" : busSpeed < 15 ? "slow" : busSpeed < 30 ? "moderate" : "normal"}</p>
            </div>
            <div style={styles.metricDivider} />
            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>DRIVER</p>
              <p style={{ ...styles.metricValue, fontSize: "14px", marginTop: "2px" }}>{busInfo.driverName?.split(" ")[0]}</p>
              <p style={styles.metricSub}>on duty</p>
            </div>
          </div>

          <div style={styles.trafficStrip}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: traffic.color, display: "inline-block", flexShrink: 0 }} />
            <span style={styles.trafficLabel}>{traffic.label}</span>
            <span style={styles.trafficRight}>
              {!tripActive ? "Not Started" : busSpeed === 0 ? "Paused on Route" : "Moving"}
            </span>
          </div>
        </div>

        <div style={{ ...styles.stopsPanel, maxHeight: panelExpanded ? "70vh" : "240px" }}>
          <div style={styles.stopsHeader} onClick={() => setPanelExpanded(p => !p)}>
            <div style={styles.dragHandle} />
            <div style={styles.stopsHeaderRow}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <p style={styles.stopsTitle}>Route Stops</p>
                <span style={styles.stopsBadge}>{stops.length} stops</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={styles.progressPill} title={`${completedCount} of ${stops.length - 1} stops done`}>
                  <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
                  <span style={styles.progressText}>{progressPct}% done</span>
                </div>
                <span style={{ ...styles.chevron, transform: panelExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▲</span>
              </div>
            </div>
          </div>

          <div style={styles.routeBar}>
            <div style={{ ...styles.routeBarFill, width: `${progressPct}%` }} />
          </div>

          <div style={styles.panelActionRow}>
            <button style={styles.panelCallBtn} onClick={() => setShowCall(true)}>
              📞 Call Driver · {busInfo.driverName}
            </button>
            <button style={styles.panelSosBtn} onClick={() => setShowSOS(true)}>🆘 SOS</button>
          </div>

          <div style={styles.stopsList}>
            {stops.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "13px", padding: "20px" }}>
                No stops configured for this bus
              </p>
            ) : stops.map((stop, i) => {
              const type        = getStopType(i);
              const isLast      = i === stops.length - 1;
              const isCompleted = type === "completed";
              const isCurrent   = type === "current";
              const isSchool    = isLast && !isCurrent;
              const circleBg     = isCurrent ? "#4F46E5" : isCompleted ? "#D1FAE5" : isSchool ? "#FFF7ED" : "#F3F4F6";
              const circleBorder = isCurrent ? "2px solid #4F46E5" : isCompleted ? "2px solid #6EE7B7" : isSchool ? "2px solid #FCD34D" : "2px solid #E5E7EB";
              const circleShadow = isCurrent ? "0 0 0 4px #EEF2FF" : "none";
              return (
                <div key={stop.id || i} style={styles.stopRow}>
                  <div style={styles.timeline}>
                    <div style={{ ...styles.stopCircle, background: circleBg, border: circleBorder, boxShadow: circleShadow }}>
                      {isCompleted ? <span style={{ fontSize: "9px", color: "#059669" }}>✓</span>
                       : isCurrent ? <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--card)", display: "block" }} />
                       : isSchool  ? <span style={{ fontSize: "10px" }}>🏫</span>
                       : <span style={{ fontSize: "9px", color: "#9CA3AF" }}>{i + 1}</span>}
                    </div>
                    {!isLast && (
                      <div style={{
                        ...styles.connector,
                        background: isCompleted
                          ? "linear-gradient(to bottom, #6EE7B7, #D1FAE5)"
                          : isCurrent
                          ? "linear-gradient(to bottom, #4F46E5, #E5E7EB)"
                          : "#E5E7EB",
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 4 : "18px" }}>
                    <div style={styles.stopContent}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          ...styles.stopName,
                          color: isCompleted ? "#9CA3AF" : isCurrent ? "#4F46E5" : isSchool ? "#D97706" : "#111827",
                          textDecoration: isCompleted ? "line-through" : "none",
                          fontWeight: isCurrent || isSchool ? 600 : 400,
                        }}>{stop.name}</p>
                        <p style={styles.stopSub}>
                          {isCompleted ? "✅ Departed"
                           : isCurrent ? "🚌 Bus is here now"
                           : isSchool  ? `🏁 Est. arrival — ${eta}`
                           : "Upcoming stop"}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {isCompleted && <span style={{ ...styles.badge, background: "#F0FDF4", color: "#16A34A", border: "0.5px solid #BBF7D0" }}>Done</span>}
                        {isCurrent   && <span style={{ ...styles.badge, background: "#EEF2FF", color: "#4F46E5", border: "0.5px solid #C7D2FE" }}>Live</span>}
                        {isSchool    && <span style={{ ...styles.badge, background: "#FFF7ED", color: "#C2410C", border: "0.5px solid #FED7AA" }}>{eta}</span>}
                        {type === "upcoming" && <span style={{ fontSize: "10px", color: "#D1D5DB" }}>—</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showSOS  && <SOSModal  onClose={() => setShowSOS(false)} />}
        {showCall && <CallModal onClose={() => setShowCall(false)} driverName={busInfo.driverName} driverPhone={busInfo.driverPhone} />}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = {
  pageShell: { minHeight: "100dvh", background: "#E5E7EB", display: "flex", justifyContent: "center", alignItems: "flex-start", fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif" },
  phoneCard: { position: "relative", width: "100%", maxWidth: "430px", height: "100dvh", overflow: "hidden", background: "#F1F5F9", boxShadow: "0 0 60px rgba(0,0,0,0.18)" },
  mapPlaceholder: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", background: "#F8FAFC" },
  busEmptyTitle: { fontSize: "17px", fontWeight: 600, color: "#1E293B" },
  busEmptySub:   { fontSize: "13px", color: "#94A3B8" },
  fullscreenRoot: { position: "fixed", inset: 0, zIndex: 9999, background: "black" },
  exitFsBtn: { position: "fixed", top: "max(20px, env(safe-area-inset-top, 20px))", right: "16px", zIndex: 10000, display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "20px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer" },
  fsActionRow: { position: "fixed", top: "max(20px, env(safe-area-inset-top, 20px))", left: "16px", zIndex: 10000, display: "flex", gap: "10px" },
  fsCallBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, background: "rgba(79,70,229,0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer" },
  fsSosBtn:  { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, background: "rgba(220,38,38,0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer" },
  fsMiniPill: { position: "fixed", bottom: "max(24px, env(safe-area-inset-bottom, 24px))", left: "50%", transform: "translateX(-50%)", zIndex: 10000, display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "30px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap" },
  header: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", paddingTop: "env(safe-area-inset-top, 44px)", paddingLeft: "16px", paddingRight: "16px", paddingBottom: "14px", borderRadius: "0 0 24px 24px", boxShadow: "0 4px 24px rgba(79,70,229,0.25)" },
  navRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", marginTop: "10px" },
  backBtn: { width: "36px", height: "36px", borderRadius: "12px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  navTitle: { color: "white", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.3px" },
  navSub:   { color: "rgba(255,255,255,0.6)", fontSize: "12px", marginTop: "2px" },
  livePill: { display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "20px", padding: "5px 10px" },
  liveDot:  { width: "6px", height: "6px", borderRadius: "50%", background: "#4ADE80" },
  liveText: { color: "white", fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px" },
  childCard: { display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "16px", padding: "12px 14px", marginBottom: "10px" },
  childName:  { color: "white", fontSize: "15px", fontWeight: 600 },
  childClass: { color: "rgba(255,255,255,0.6)", fontSize: "12px", marginTop: "2px" },
  metricsRow: { display: "flex", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "16px", padding: "14px 16px", marginBottom: "10px", backdropFilter: "blur(10px)" },
  metricCard:    { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  metricDivider: { width: "1px", background: "rgba(255,255,255,0.2)", margin: "4px 12px", flexShrink: 0 },
  metricLabel: { color: "rgba(255,255,255,0.55)", fontSize: "9px", letterSpacing: "0.8px", textTransform: "uppercase", fontWeight: 500 },
  metricValue: { color: "white", fontSize: "22px", fontWeight: 700, lineHeight: 1.1 },
  metricUnit:  { fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.65)" },
  metricSub:   { color: "rgba(255,255,255,0.5)", fontSize: "11px" },
  trafficStrip: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "8px 14px" },
  trafficLabel: { color: "rgba(255,255,255,0.85)", fontSize: "12px", flex: 1, fontWeight: 500 },
  trafficRight: { color: "rgba(255,255,255,0.45)", fontSize: "11px" },
  fsBtn: { position: "absolute", right: "14px", zIndex: 200, width: "40px", height: "40px", borderRadius: "12px", background: "rgba(79,70,229,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 12px rgba(79,70,229,0.35)", transition: "bottom 0.35s cubic-bezier(0.4,0,0.2,1)" },
  stopsPanel: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 100, background: "var(--card)", borderRadius: "24px 24px 0 0", boxShadow: "0 -4px 30px rgba(0,0,0,0.10)", overflowY: "auto", transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)", paddingBottom: "env(safe-area-inset-bottom, 0px)", WebkitOverflowScrolling: "touch" },
  stopsHeader: { position: "sticky", top: 0, background: "var(--card)", borderBottom: "1px solid var(--border)", paddingBottom: "10px", zIndex: 10, cursor: "pointer", userSelect: "none" },
  dragHandle: { width: "36px", height: "4px", borderRadius: "2px", background: "#E2E8F0", margin: "10px auto 8px" },
  stopsHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "20px", paddingRight: "20px" },
  stopsTitle: { fontSize: "14px", fontWeight: 700, color: "var(--text)" },
  stopsBadge: { fontSize: "11px", color: "#64748B", background: "var(--card2)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: "20px", fontWeight: 500 },
  progressPill: { position: "relative", width: "68px", height: "18px", background: "var(--card2)", borderRadius: "10px", overflow: "hidden", display: "flex", alignItems: "center" },
  progressFill: { position: "absolute", left: 0, top: 0, bottom: 0, background: "linear-gradient(90deg, #6366F1, #4F46E5)", borderRadius: "10px", transition: "width 0.5s ease" },
  progressText: { position: "relative", zIndex: 1, fontSize: "9px", fontWeight: 700, color: "#1E3A5F", width: "100%", textAlign: "center" },
  chevron: { fontSize: "10px", color: "#94A3B8", transition: "transform 0.3s ease", display: "inline-block" },
  routeBar:     { height: "3px", background: "#F1F5F9" },
  routeBarFill: { height: "100%", background: "linear-gradient(90deg, #6366F1, #4F46E5)", transition: "width 0.5s ease" },
  panelActionRow: { display: "flex", gap: "10px", padding: "10px 20px 2px" },
  panelCallBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "9px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: "var(--card2)", color: "#4F46E5", border: "1px solid #C7D2FE", cursor: "pointer" },
  panelSosBtn:  { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, background: "var(--card2)", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" },
  stopsList: { padding: "10px 20px 20px" },
  stopRow:   { display: "flex", alignItems: "flex-start", gap: "14px" },
  timeline:  { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "20px" },
  stopCircle: { width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, transition: "all 0.3s ease", marginTop: "6px" },
  connector:  { width: "2px", flex: 1, minHeight: "22px", borderRadius: "2px", marginTop: "3px" },
  stopContent: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", paddingTop: "4px" },
  stopName: { fontSize: "13px", lineHeight: "1.3" },
  stopSub:  { fontSize: "11px", color: "#94A3B8", marginTop: "3px" },
  badge: { flexShrink: 0, fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "8px", letterSpacing: "0.2px", whiteSpace: "nowrap" },
  modalOverlay: { position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modalCard: { background: "var(--card)", borderRadius: "24px", padding: "28px 24px", width: "100%", maxWidth: "340px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
  modalTitle: { fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" },
  modalSub:   { fontSize: "13px", color: "#64748B", lineHeight: 1.6, marginBottom: "20px" },
  modalBtns:  { display: "flex", gap: "10px" },
  cancelBtn: { flex: 1, padding: "12px", borderRadius: "14px", fontSize: "14px", fontWeight: 600, background: "var(--card2)", color: "var(--subtext)", border: "none", cursor: "pointer" },
  confirmSosBtn: { flex: 1, padding: "12px", borderRadius: "14px", fontSize: "14px", fontWeight: 700, background: "linear-gradient(135deg,#DC2626,#EF4444)", color: "white", border: "none", cursor: "pointer" },
  callConfirmBtn: { flex: 1, padding: "12px", borderRadius: "14px", fontSize: "14px", fontWeight: 700, background: "linear-gradient(135deg,#4F46E5,#6366F1)", color: "white", border: "none", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" },
};
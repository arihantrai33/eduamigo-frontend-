import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBusLive, formatEta, signalLabel } from "../bus/liveBus";
import { AnimatedBusMarker, FollowBus } from "../bus/AnimatedBusMarker";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getChildBus } from "../../api/transport";
import SosModal from "../../components/SosModal";

import Glyph from "../../components/Glyph";
import { BUS_SVG, schoolSvg, cssVar } from "../../utils/mapIcons";
import Skeleton from "../../components/ui/Skeleton";
const COLOR = {
  primary: "var(--brand)", primaryDark: "var(--brand-dark)", primaryLight: "var(--brand-soft)",
  success: "#10B981", successLight: "color-mix(in srgb, var(--ea-success) 16%, var(--ea-surface))",
  danger: "#EF4444", warning: "#F59E0B", sos: "#DC2626", safe: "#10B981",
};

const busIcon = L.divIcon({
  className: "",
  html: `<div style="width:52px;height:52px;background:linear-gradient(135deg,var(--brand),var(--brand-light));border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px color-mix(in srgb, var(--brand) 60%, transparent);border:3px solid white;"><span style="transform:rotate(45deg);display:flex;line-height:1;">${BUS_SVG}</span></div>`,
  iconSize: [52, 52], iconAnchor: [26, 52], popupAnchor: [0, -56],
});

function makeStopIcon(type) {
  const configs = {
    completed: { bg: "#10B981", text: "✓", size: 22 },
    current:   { bg: "var(--brand)", text: "●", size: 26 },
    school:    { bg: "#F59E0B", text: schoolSvg(13), size: 24 },
    upcoming:  { bg: "var(--ea-line)", text: "●", size: 18 },
  };
  const c = configs[type] || configs.upcoming;
  return L.divIcon({
    className: "",
    html: `<div style="width:${c.size}px;height:${c.size}px;background:${c.bg};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2.5px solid white;font-size:${Math.round(c.size*0.48)}px;color:white;font-weight:700;">${c.text}</div>`,
    iconSize: [c.size, c.size], iconAnchor: [c.size/2, c.size/2], popupAnchor: [0, -c.size/2-4],
  });
}

function getTrafficStatus(speed) {
  if (!speed || speed === 0) return { color: "var(--ea-muted)", label: "Stationary" };
  if (speed < 15) return { color: COLOR.danger,  label: "Heavy traffic — Delay possible" };
  if (speed < 30) return { color: COLOR.warning, label: "Moderate traffic" };
  return { color: COLOR.safe, label: "Clear road" };
}

function getChildStatus(tripActive, currentStopIdx, stops) {
  if (!tripActive) return { emoji: <Glyph e="🏠" />, label: "At Home", color: COLOR.success, sub: "Trip not started yet" };
  if (currentStopIdx === stops.length - 1) return { emoji: <Glyph e="🏫" />, label: "Reached School", color: COLOR.success, sub: "Safe at school" };
  return { emoji: <Glyph e="🚌" />, label: "On the Bus", color: COLOR.primary, sub: `Near ${stops[currentStopIdx]?.name}` };
}

const clock = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

function getStopType(i, currentStopIdx, tripActive, stopsLength) {
  if (i < currentStopIdx) return "completed";
  if (i === currentStopIdx && tripActive) return "current";
  if (i === stopsLength - 1) return "school";
  return "upcoming";
}

function CallModal({ onClose, name, phone }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={{ fontSize:"52px", marginBottom:"12px" }}><Glyph e="📞" /></div>
        <p style={styles.modalTitle}>Call {name}</p>
        <p style={styles.modalSub}>{phone}</p>
        <div style={styles.modalBtns}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <a href={`tel:${phone}`} style={styles.callConfirmBtn}>Call Now</a>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(phone); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ marginTop:"10px", width:"100%", padding:"10px", borderRadius:"12px", border:"1px solid var(--ea-edge)", background: copied?"#F0FDF4":"#F8FAFC", color: copied?"#16A34A":"var(--ea-muted)", fontSize:"13px", fontWeight:600, cursor:"pointer" }}
        >
          {copied ? "Copied" : "Copy Number"}
        </button>
      </div>
    </div>
  );
}

function NotificationSettingsModal({ onClose, prefs, onChange }) {
  const items = [
    { key: "tripStartEnd", icon: <Glyph e="🚦" />, label: "Trip Started / Ended" },
    { key: "stopReached",  icon: <Glyph e="📍" />, label: "Bus reached a stop" },
    { key: "nearby",       icon: <Glyph e="📡" />, label: "Bus nearby (within 500m)" },
    { key: "sos",          icon: <Glyph e="🆘" />, label: "Emergency alerts" },
  ];
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={{ fontSize:"36px", marginBottom:"8px" }}><Glyph e="🔔" /></div>
        <p style={styles.modalTitle}>Notification Preferences</p>
        <p style={{ fontSize:"13px", color:"var(--ea-muted)", marginBottom:"16px" }}>Select which alerts you want to receive.</p>
        {items.map(item => (
          <div
            key={item.key}
            onClick={() => onChange(item.key)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 4px", borderBottom:"1px solid #F1F5F9", cursor:"pointer" }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"20px" }}>{item.icon}</span>
              <span style={{ fontSize:"13px", fontWeight:500, color:"var(--ea-ink)" }}>{item.label}</span>
            </div>
            <div style={{ width:"44px", height:"24px", borderRadius:"12px", background: prefs[item.key] ? "var(--brand)" : "#E2E8F0", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:"3px", left: prefs[item.key] ? "23px" : "3px", width:"18px", height:"18px", borderRadius:"50%", background:"white", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left 0.2s" }} />
            </div>
          </div>
        ))}
        <button style={{ ...styles.cancelBtn, marginTop:"16px", width:"100%" }} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

export default function ParentBus() {
  const navigate = useNavigate();
  const [apiStops,            setApiStops]            = useState([]);
  const [studentData,         setStudentData]         = useState(null);
  const [driverData,          setDriverData]          = useState(null);
  const [busId,               setBusId]               = useState(null);
  const [myStopId,            setMyStopId]            = useState(null);
  const [loading,             setLoading]             = useState(true);
  // The live bus comes from the server (position on the road, stops reached, ETAs); see pages/bus/liveBus.js.
  const live = useBusLive(busId);
  const busLocation    = live.active && live.position ? { lat: live.position.lat, lng: live.position.lng } : null;
  const busSpeed       = live.speedKmh;
  const eta            = live.etaSchool;
  const tripActive     = live.active;
  const currentStopIdx = live.active ? live.currentStopIdx : 0;
  const fullRoute      = live.full;
  const remainingRoute = live.remaining;
  const completedRoute = live.completed;
  // In the order of the current run (a drop run goes the other way); before the first snapshot, the stored order.
  const stops = live.stops.length
    ? live.stops.map(s => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, etaMin: s.etaMin, departedAt: s.departedAt }))
    : apiStops;
  const [isFullscreen,        setIsFullscreen]        = useState(false);
  const [panelExpanded,       setPanelExpanded]       = useState(false);
  const [showSOS,             setShowSOS]             = useState(false);
  const [showCallDriver,      setShowCallDriver]      = useState(false);
  const [showCallSchool,      setShowCallSchool]      = useState(false);
  const [showNotifSettings,   setShowNotifSettings]   = useState(false);
  const [notifPrefs,          setNotifPrefs]          = useState({ tripStartEnd: true, stopReached: true, nearby: true, sos: true });
  const [notifications,       setNotifications]       = useState([]);
  const [headerHeight,        setHeaderHeight]        = useState(0);

  const headerRef     = useRef(null);
  const prevStopIdx   = useRef(null);
  const prevTrip      = useRef(false);
  const nearSent      = useRef(false);

  const traffic = getTrafficStatus(busSpeed);

  useEffect(() => {
    if (!headerRef.current) return;
    const ro = new ResizeObserver(([entry]) => setHeaderHeight(entry.contentRect.height));
    ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const fetchBusData = async () => {
      try {
        const res = await getChildBus();
        if (!res.success) { setLoading(false); return; }
        const bus = res.data;
        setDriverData({ name: bus.driverName, phone: bus.driverPhone });
        setBusId(bus.busId);
        setMyStopId(bus.myStopId || null);
        setStudentData({ name: bus.studentName || "Your Child", class: bus.studentClass || "—" });
        if (bus.stops?.length > 0) {
          setApiStops([...bus.stops].sort((a, b) => a.order - b.order).map(s => ({ id: s._id, name: s.name, lat: s.latitude || 0, lng: s.longitude || 0 })));
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchBusData();
  }, []);

  // In-app notification helper
  const pushNotif = (icon, text) => {
    const id   = Date.now();
    const time = new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true });
    setNotifications(prev => [{ id, icon, text, time }, ...prev].slice(0, 20));
    if (Notification.permission === "granted") new Notification(text, { icon: "/favicon.ico" });
  };

  // In-app alerts from what the server reports (the server also sends them as notifications, even when this page is closed).
  useEffect(() => {
    if (!live.ready) return;
    const later = (icon, text) => setTimeout(() => pushNotif(icon, text), 0); // the alert list updates after this effect has run
    if (tripActive && !prevTrip.current && notifPrefs.tripStartEnd) later(<Glyph e="🚦" />, "Trip has started. Your child's bus is now on the way.");
    if (!tripActive && prevTrip.current && notifPrefs.tripStartEnd) later(<Glyph e="🏁" />, "Trip has ended. Your child's bus has stopped.");
    prevTrip.current = tripActive;
    if (!tripActive) { prevStopIdx.current = null; nearSent.current = false; return; }
    if (prevStopIdx.current !== null && prevStopIdx.current !== currentStopIdx && notifPrefs.stopReached) {
      const done = stops[currentStopIdx - 1]?.name;
      if (done) later(<Glyph e="📍" />, `Bus has left ${done}.`);
    }
    prevStopIdx.current = currentStopIdx;
    const mine = stops.findIndex((x) => x.id === myStopId);
    const minutes = mine >= 0 ? live.etaOf?.(mine) : null;
    if (notifPrefs.nearby && !nearSent.current && minutes !== null && minutes !== undefined && minutes <= 5 && mine >= currentStopIdx) {
      nearSent.current = true;
      later(<Glyph e="📡" />, minutes <= 0 ? "Bus is at your child's stop." : `Bus is about ${minutes} min from your child's stop.`);
    }
  }, [live.ready, tripActive, currentStopIdx, notifPrefs, myStopId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false); setShowSOS(false);
        setShowCallDriver(false); setShowCallSchool(false); setShowNotifSettings(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const completedCount = stops.filter((_, i) => i < currentStopIdx).length;
  const progressPct    = !tripActive ? 0 : currentStopIdx === stops.length - 1 ? 100 : Math.round((completedCount / (stops.length - 1)) * 100);
  const childStatus    = getChildStatus(tripActive, currentStopIdx, stops);
  const busLabel       = `Bus · ${driverData?.name || "—"}`;

  if (loading) {
    return (
      <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", flexDirection:"column", gap:"16px" }}>
        <div style={{ fontSize:"48px" }}><Glyph e="🚌" /></div>
        <Skeleton rows={3} label="Loading bus information" />
      </div>
    );
  }

  if (!busId) {
    return (
      <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", flexDirection:"column", gap:"16px" }}>
        <div style={{ fontSize:"48px" }}><Glyph e="🚌" /></div>
        <p style={{ fontSize:"16px", color:"var(--ea-muted)", fontWeight:600 }}>No bus has been assigned yet.</p>
        <button onClick={() => navigate("/parent/home")} style={{ padding:"10px 24px", borderRadius:"12px", background:"var(--brand)", color:"white", border:"none", fontWeight:600, cursor:"pointer" }}>Go Back</button>
      </div>
    );
  }

  const mapStart = busLocation;
  const mapContent = mapStart ? (
    <MapContainer center={[mapStart.lat, mapStart.lng]} zoom={16} style={{ height:"100%", width:"100%" }} zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
      {completedRoute.length > 1 && <Polyline positions={completedRoute} color={cssVar("--brand-border", "#BAE6FD")} weight={5} opacity={0.55} />}
      {remainingRoute.length > 1 && <Polyline positions={remainingRoute} color={traffic.color} weight={6} opacity={0.92} dashArray={traffic.color === COLOR.danger ? "10 6" : undefined} />}
      {fullRoute.length > 1 && <Polyline positions={fullRoute} color={cssVar("--brand", "#0EA5E9")} weight={2} opacity={0.18} dashArray="8 10" />}
      <AnimatedBusMarker position={live.active ? live.position : null} route={live.route} icon={busIcon}>
        <strong>{busLabel}</strong><br />Driver: {driverData?.name || "Driver"}
      </AnimatedBusMarker>
      <FollowBus position={busLocation} />
      {stops.map((stop, i) => {
        const type = getStopType(i, currentStopIdx, tripActive, stops.length);
        return (
          <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={makeStopIcon(type)}>
            <Popup>
              <strong>{stop.name}</strong><br />
              {type === "completed" && (stop.departedAt ? `Departed at ${clock(stop.departedAt)}` : "Departed")}
              {type === "upcoming"  && stop.etaMin != null && `Arriving in about ${formatEta(stop.etaMin)}`}
              {type === "current"   && "Bus is here now"}
              {type === "school"    && `Destination — ETA ${eta}`}
              {type === "upcoming"  && stop.etaMin == null && "Upcoming stop"}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  ) : (
    <div className="ea-bus-empty" style={styles.mapPlaceholder}>
      <div style={{ fontSize:"56px" }}><Glyph e="🚌" /></div>
      <p style={styles.busEmptyTitle}>{tripActive ? "The bus has started: waiting for its location" : "Bus is not on route yet"}</p>
      <p style={styles.busEmptySub}>{tripActive ? "The driver's GPS will appear on the map in a moment" : "Trip has not started"}</p>
    </div>
  );

  if (isFullscreen) {
    return (
      <div style={styles.fullscreenRoot}>
        <div style={{ width:"100%", height:"100%" }}>{mapContent}</div>
        <button type="button" aria-label="Exit full-screen map" style={styles.exitFsBtn} onClick={() => setIsFullscreen(false)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          <span style={{ fontSize:"12px", fontWeight:600 }}>Exit</span>
        </button>
        <div style={styles.fsActionRow}>
          <button style={styles.fsCallBtn} onClick={() => setShowCallDriver(true)}><Glyph e="📞" /> Driver</button>
          <button style={styles.fsCallBtn} onClick={() => setShowCallSchool(true)}>School</button>
          <button style={styles.fsSosBtn}  onClick={() => setShowSOS(true)}>SOS</button>
        </div>
        <div style={styles.fsMiniPill}>
          <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:childStatus.color, display:"inline-block" }} />
          <span style={{ color:"white", fontSize:"13px", fontWeight:500 }}>{studentData?.name || "Your child"}</span>
          <span style={{ color:"rgba(255,255,255,0.92)", fontSize:"13px", marginLeft:"4px" }}>ETA {eta}</span>
        </div>
        {showSOS           && <SosModal onClose={() => setShowSOS(false)} studentName={studentData?.name} location={busLocation} driverPhone={driverData?.phone} />}
        {showCallDriver    && <CallModal               onClose={() => setShowCallDriver(false)}       name={driverData?.name || "Driver"}  phone={driverData?.phone || ""} />}
        {showCallSchool    && <CallModal               onClose={() => setShowCallSchool(false)}       name="School Office" phone="" />}
        {showNotifSettings && <NotificationSettingsModal onClose={() => setShowNotifSettings(false)} prefs={notifPrefs} onChange={key => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))} />}
      </div>
    );
  }

  return (
    <div style={styles.pageShell}>
      <div style={styles.phoneCard}>
        <div style={{ position:"absolute", top:headerHeight, left:0, right:0, bottom:0, zIndex:0, transition:"top 0.3s ease" }}>
          {mapContent}
        </div>
        <button type="button" aria-label="Full-screen map" className="ea-bus-fs" style={{ ...styles.fsBtn, bottom: panelExpanded ? "calc(70vh + 12px)" : "300px" }} onClick={() => setIsFullscreen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
        </button>

        <div ref={headerRef} className="ea-bus-head" style={styles.header}>
          <div style={styles.navRow}>
            <button type="button" aria-label="Back to home" className="ea-bus-back" style={styles.backBtn} onClick={() => navigate("/parent/home")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{ flex:1 }}>
              <h1 style={{ ...styles.navTitle, margin: 0 }}>Live Bus Tracking</h1>
              <p style={styles.navSub}>{busLabel}</p>
            </div>
            {tripActive && (
              <div style={styles.livePill} data-testid="bus-live-badge" role="status" aria-live="polite">
                <span style={{ ...styles.liveDot, background: signalLabel(live).color }} />
                <span style={styles.liveText}>{signalLabel(live).text}</span>
              </div>
            )}
            <button type="button" aria-label="Bus alert settings" title="Bus alert settings" onClick={() => setShowNotifSettings(true)} style={styles.notifBtn}><Glyph e="🔔" /></button>
          </div>

          <div style={styles.childCard}>
            <div style={styles.childAvatar}><span style={{ fontSize:"26px" }}><Glyph e="👦" /></span></div>
            <div style={{ flex:1 }}>
              <p style={styles.childName}>{studentData?.name || "Your Child"}</p>
              <p style={styles.childClass}>{studentData?.class || "—"}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ ...styles.statusBadge, background:"rgba(255,255,255,0.95)", border:`1px solid color-mix(in srgb, ${childStatus.color} 33%, transparent)` }}>
                <span style={{ color:`color-mix(in srgb, ${childStatus.color} 65%, black)`, display:"flex" }}>{childStatus.emoji}</span>
                <span style={{ color:`color-mix(in srgb, ${childStatus.color} 65%, black)`, fontSize:"11px", fontWeight:700 }}>{childStatus.label}</span>
              </div>
              <p style={{ color:"rgba(255,255,255,0.92)", fontSize:"10px", marginTop:"4px" }}>{childStatus.sub}</p>
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
                ? <p style={{ ...styles.metricValue, fontSize:"15px", marginTop:"4px" }}>Stationary</p>
                : <p style={styles.metricValue}>{busSpeed} <span style={styles.metricUnit}>km/h</span></p>
              }
              <p style={styles.metricSub}>{busSpeed === 0 ? "not moving" : busSpeed < 15 ? "slow" : busSpeed < 30 ? "moderate" : "normal"}</p>
            </div>
            <div style={styles.metricDivider} />
            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>DRIVER</p>
              <p style={{ ...styles.metricValue, fontSize:"13px", marginTop:"2px" }}>{driverData?.name?.split(" ")[0] || "—"}</p>
              <p style={styles.metricSub}>on duty</p>
            </div>
          </div>

          <div style={styles.trafficStrip}>
            <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:traffic.color, display:"inline-block", flexShrink:0 }} />
            <span style={styles.trafficLabel}>{traffic.label}</span>
            <span style={styles.trafficRight}>{!tripActive ? "Not Started" : busSpeed === 0 ? "Paused on Route" : "Moving"}</span>
          </div>
        </div>

        <div className="ea-bus-panel" style={{ ...styles.stopsPanel, maxHeight: panelExpanded ? "70vh" : "300px" }}>
          <div style={styles.stopsHeader} onClick={() => setPanelExpanded(p => !p)}>
            <div style={styles.dragHandle} />
            <div style={styles.stopsHeaderRow}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <p style={styles.stopsTitle}>Route Stops</p>
                <span style={styles.stopsBadge}>{stops.length} stops</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={styles.progressPill}>
                  <div style={{ ...styles.progressFill, width:`${progressPct}%` }} />
                  <span style={styles.progressText}>{progressPct}% done</span>
                </div>
                <span style={{ ...styles.chevron, transform: panelExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▲</span>
              </div>
            </div>
          </div>

          <div style={styles.routeBar}><div style={{ ...styles.routeBarFill, width:`${progressPct}%` }} /></div>

          <div style={styles.panelActionRow}>
            <button style={styles.panelCallBtn}  onClick={() => setShowCallDriver(true)}><Glyph e="📞" /> Call Driver</button>
            <button style={styles.panelSchoolBtn} onClick={() => setShowCallSchool(true)}>Call School</button>
            <button style={styles.panelSosBtn}   onClick={() => setShowSOS(true)}>SOS</button>
          </div>

          {notifications.length > 0 && (
            <div style={styles.notifSection}>
              <p style={styles.notifTitle}>Today's Updates</p>
              {notifications.map(n => (
                <div key={n.id} style={styles.notifRow}>
                  <span style={styles.notifIcon}>{n.icon}</span>
                  <div style={{ flex:1 }}>
                    <p style={styles.notifText}>{n.text}</p>
                    <p style={styles.notifTime}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.stopsList}>
            <p style={{ fontSize:"12px", fontWeight:700, color:"var(--ea-muted)", marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Route</p>
            {stops.map((stop, i) => {
              const type        = getStopType(i, currentStopIdx, tripActive, stops.length);
              const isLast      = i === stops.length - 1;
              const isCompleted = type === "completed";
              const isCurrent   = type === "current";
              const isSchool    = isLast && !isCurrent;
              const circleBg     = isCurrent ? COLOR.primary : isCompleted ? "color-mix(in srgb, var(--ea-success) 16%, var(--ea-surface))" : isSchool ? "color-mix(in srgb, var(--ea-warning) 5%, var(--ea-surface))" : "var(--ea-hover)";
              const circleBorder = isCurrent ? `2px solid ${COLOR.primary}` : isCompleted ? "2px solid #6EE7B7" : isSchool ? "2px solid #FCD34D" : "2px solid var(--ea-line)";
              const circleShadow = isCurrent ? `0 0 0 4px ${COLOR.primaryLight}` : "none";
              return (
                <div key={stop.id} style={styles.stopRow}>
                  <div style={styles.timeline}>
                    <div style={{ ...styles.stopCircle, background:circleBg, border:circleBorder, boxShadow:circleShadow }}>
                      {isCompleted ? <span style={{ fontSize:"9px", color:"var(--ea-on-card-success)" }}>✓</span>
                        : isCurrent ? <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"white", display:"block" }} />
                        : isSchool  ? <span style={{ fontSize:"10px" }}><Glyph e="🏫" /></span>
                        : <span style={{ fontSize:"9px", color:"var(--ea-muted)" }}>{i + 1}</span>}
                    </div>
                    {!isLast && <div style={{ ...styles.connector, background: isCompleted ? "linear-gradient(to bottom, #6EE7B7, color-mix(in srgb, var(--ea-success) 16%, var(--ea-surface)))" : isCurrent ? `linear-gradient(to bottom, ${COLOR.primary}, var(--ea-line))` : "var(--ea-line)" }} />}
                  </div>
                  <div style={{ flex:1, minWidth:0, paddingBottom: isLast ? 4 : "18px" }}>
                    <div style={styles.stopContent}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ ...styles.stopName, color: isCompleted ? "var(--ea-muted)" : isCurrent ? COLOR.primary : isSchool ? "var(--ea-on-card-warning)" : "var(--ea-ink)", textDecoration: isCompleted ? "line-through" : "none", fontWeight: isCurrent || isSchool ? 600 : 400 }}>{stop.name}</p>
                        <p style={styles.stopSub}>
                          {isCompleted ? (stop.departedAt ? `Departed at ${clock(stop.departedAt)}` : "Departed")
                            : isCurrent ? "Bus is here now"
                            : isSchool  ? `Estimated arrival — ${eta}`
                            : stop.etaMin != null ? `Arriving in about ${formatEta(stop.etaMin)}` : "Upcoming stop"}{stop.id === myStopId ? " · Your child's stop" : ""}
                        </p>
                      </div>
                      <div style={{ flexShrink:0 }}>
                        {isCompleted        && <span style={{ ...styles.badge, background:"#F0FDF4", color:"#166534", border:"0.5px solid #BBF7D0" }}>Done</span>}
                        {isCurrent          && <span style={{ ...styles.badge, background:COLOR.primaryLight, color:COLOR.primary, border:`0.5px solid var(--brand-border)` }}>Live</span>}
                        {isSchool           && <span style={{ ...styles.badge, background:"color-mix(in srgb, var(--ea-warning) 5%, var(--ea-surface))", color:"var(--ea-on-card-warning)", border:"0.5px solid #FED7AA" }}>{eta}</span>}
                        {type === "upcoming" && <span style={{ fontSize:"11px", color:"var(--ea-muted)", fontWeight:600 }}>{stop.etaMin != null ? formatEta(stop.etaMin) : "—"}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showSOS           && <SosModal onClose={() => setShowSOS(false)} studentName={studentData?.name} location={busLocation} driverPhone={driverData?.phone} />}
        {showCallDriver    && <CallModal               onClose={() => setShowCallDriver(false)}       name={driverData?.name || "Driver"}  phone={driverData?.phone || ""} />}
        {showCallSchool    && <CallModal               onClose={() => setShowCallSchool(false)}       name="School Office" phone="" />}
        {showNotifSettings && <NotificationSettingsModal onClose={() => setShowNotifSettings(false)} prefs={notifPrefs} onChange={key => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))} />}
      </div>
    </div>
  );
}

const styles = {
  // The shell fills the screen (the app layout maps 100dvh on a page root to the screen area); the map card fills the shell.
  pageShell:      { minHeight:"100dvh", height:"100dvh", background:"var(--brand-soft)", display:"flex", justifyContent:"center", alignItems:"flex-start", fontFamily: "inherit" },
  phoneCard:      { position:"relative", width:"100%", height:"100%", overflow:"hidden", background:"var(--bg)" },
  mapPlaceholder: { height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"10px", background:"var(--bg)" },
  busEmptyTitle:  { fontSize:"17px", fontWeight:600, color:"var(--ea-ink)" },
  busEmptySub:    { fontSize:"13px", color:"var(--ea-muted)" },
  fullscreenRoot: { position:"fixed", inset:0, zIndex:9999, background:"black" },
  // The app layout already keeps the page below the status bar, so these need no safe-area offset at the top.
  exitFsBtn:      { position:"fixed", top:"20px", right:"16px", zIndex:10000, display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"20px", background:"rgba(0,0,0,0.55)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.2)", color:"white", cursor:"pointer" },
  fsActionRow:    { position:"fixed", top:"20px", left:"16px", zIndex:10000, display:"flex", gap:"8px" },
  fsCallBtn:      { display:"flex", alignItems:"center", gap:"6px", padding:"8px 12px", borderRadius:"20px", fontSize:"12px", fontWeight:600, background:"color-mix(in srgb, var(--brand) 85%, transparent)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.2)", color:"white", cursor:"pointer" },
  fsSosBtn:       { display:"flex", alignItems:"center", gap:"6px", padding:"8px 12px", borderRadius:"20px", fontSize:"12px", fontWeight:600, background:"rgba(220,38,38,0.85)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.2)", color:"white", cursor:"pointer" },
  fsMiniPill:     { position:"fixed", bottom:"max(24px, env(safe-area-inset-bottom, 24px))", left:"50%", transform:"translateX(-50%)", zIndex:10000, display:"flex", alignItems:"center", gap:"8px", padding:"10px 20px", borderRadius:"30px", background:"rgba(0,0,0,0.55)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.15)", whiteSpace:"nowrap" },
  header:         { position:"absolute", top:0, left:0, right:0, zIndex:100, background:"color-mix(in srgb, var(--brand) 76%, #000)", paddingTop:"0px", paddingLeft:"16px", paddingRight:"16px", paddingBottom:"14px", borderRadius:"0 0 24px 24px", boxShadow:"0 4px 24px color-mix(in srgb, var(--brand-dark) 30%, transparent)" },
  navRow:         { display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px", marginTop:"10px" },
  backBtn:        { width:"36px", height:"36px", borderRadius:"12px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 },
  notifBtn:       { width:"36px", height:"36px", borderRadius:"12px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"18px", flexShrink:0 },
  navTitle:       { color:"white", fontSize:"17px", fontWeight:600, letterSpacing:"-0.3px" },
  navSub:         { color:"rgba(255,255,255,0.92)", fontSize:"12px", marginTop:"2px" },
  livePill:       { display:"flex", alignItems:"center", gap:"5px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"20px", padding:"5px 10px" },
  liveDot:        { width:"6px", height:"6px", borderRadius:"50%", background:"#4ADE80" },
  liveText:       { color:"white", fontSize:"11px", fontWeight:600, letterSpacing:"0.5px" },
  childCard:      { display:"flex", alignItems:"center", gap:"12px", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:"16px", padding:"12px 14px", marginBottom:"10px", backdropFilter:"blur(10px)" },
  childAvatar:    { width:"44px", height:"44px", borderRadius:"14px", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  childName:      { color:"white", fontSize:"15px", fontWeight:700 },
  childClass:     { color:"rgba(255,255,255,0.92)", fontSize:"11px", marginTop:"2px" },
  statusBadge:    { display:"inline-flex", alignItems:"center", gap:"4px", padding:"4px 10px", borderRadius:"20px" },
  metricsRow:     { display:"flex", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:"16px", padding:"12px 14px", marginBottom:"10px", backdropFilter:"blur(10px)" },
  metricCard:     { flex:1, display:"flex", flexDirection:"column", gap:"2px" },
  metricDivider:  { width:"1px", background:"rgba(255,255,255,0.2)", margin:"4px 12px", flexShrink:0 },
  metricLabel:    { color:"rgba(255,255,255,0.92)", fontSize:"9px", letterSpacing:"0.8px", textTransform:"uppercase", fontWeight:500 },
  metricValue:    { color:"white", fontSize:"20px", fontWeight:700, lineHeight:1.1 },
  metricUnit:     { fontSize:"12px", fontWeight:400, color:"rgba(255,255,255,0.92)" },
  metricSub:      { color:"rgba(255,255,255,0.92)", fontSize:"10px" },
  trafficStrip:   { display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"12px", padding:"8px 14px" },
  trafficLabel:   { color:"rgba(255,255,255,0.85)", fontSize:"12px", flex:1, fontWeight:500 },
  trafficRight:   { color:"rgba(255,255,255,0.92)", fontSize:"11px" },
  fsBtn:          { position:"absolute", right:"14px", zIndex:200, width:"40px", height:"40px", borderRadius:"12px", background:"color-mix(in srgb, var(--brand) 85%, transparent)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 12px color-mix(in srgb, var(--brand-dark) 35%, transparent)", transition:"bottom 0.35s cubic-bezier(0.4,0,0.2,1)" },
  stopsPanel:     { position:"absolute", bottom:0, left:0, right:0, zIndex:100, background:"var(--ea-surface)", borderRadius:"24px 24px 0 0", boxShadow:"0 -4px 30px rgba(0,0,0,0.10)", overflowY:"auto", transition:"max-height 0.35s cubic-bezier(0.4,0,0.2,1)", paddingBottom:"env(safe-area-inset-bottom, 0px)", WebkitOverflowScrolling:"touch" },
  stopsHeader:    { position:"sticky", top:0, background:"var(--ea-surface)", borderBottom:"1px solid var(--ea-line)", paddingBottom:"10px", zIndex:1, cursor:"pointer", userSelect:"none" },
  dragHandle:     { width:"36px", height:"4px", borderRadius:"2px", background:"var(--ea-line)", margin:"10px auto 8px" },
  stopsHeaderRow: { display:"flex", alignItems:"center", justifyContent:"space-between", paddingLeft:"20px", paddingRight:"20px" },
  stopsTitle:     { fontSize:"14px", fontWeight:700, color:"var(--ea-ink)" },
  stopsBadge:     { fontSize:"11px", color:"var(--ea-muted)", background:"var(--ea-hover)", border:"1px solid var(--ea-edge)", padding:"3px 10px", borderRadius:"20px", fontWeight:500 },
  progressPill:   { position:"relative", width:"68px", height:"18px", background:"var(--ea-hover)", borderRadius:"10px", overflow:"hidden", display:"flex", alignItems:"center" },
  progressFill:   { position:"absolute", left:0, top:0, bottom:0, background:"linear-gradient(90deg, var(--brand-light), var(--brand))", borderRadius:"10px", transition:"width 0.5s ease" },
  progressText:   { position:"relative", zIndex:1, fontSize:"9px", fontWeight:700, color:"var(--ea-ink)", width:"100%", textAlign:"center", letterSpacing:"0.2px" },
  chevron:        { fontSize:"10px", color:"var(--ea-muted)", transition:"transform 0.3s ease", display:"inline-block" },
  routeBar:       { height:"3px", background:"var(--ea-line)" },
  routeBarFill:   { height:"100%", background:"linear-gradient(90deg, var(--brand-light), var(--brand))", transition:"width 0.5s ease" },
  panelActionRow: { display:"flex", gap:"8px", padding:"10px 16px 4px" },
  panelCallBtn:   { flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"5px", padding:"9px 8px", borderRadius:"12px", fontSize:"11px", fontWeight:600, background:"var(--brand-soft)", color:"var(--brand-text)", border:"1px solid color-mix(in srgb, var(--brand) 55%, var(--ea-surface))", cursor:"pointer" },
  panelSchoolBtn: { flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"5px", padding:"9px 8px", borderRadius:"12px", fontSize:"11px", fontWeight:600, background:"color-mix(in srgb, var(--ea-warning) 5%, var(--ea-surface))", color:"var(--ea-on-card-warning)", border:"1px solid color-mix(in srgb, var(--ea-warning) 55%, var(--ea-surface))", cursor:"pointer" },
  panelSosBtn:    { display:"flex", alignItems:"center", justifyContent:"center", gap:"5px", padding:"9px 14px", borderRadius:"12px", fontSize:"11px", fontWeight:700, background:"color-mix(in srgb, var(--ea-danger) 9%, var(--ea-surface))", color:"var(--ea-on-card-danger)", border:"1px solid color-mix(in srgb, var(--ea-on-card-danger) 75%, var(--ea-surface))", cursor:"pointer" },
  notifSection:   { padding:"12px 20px 0", borderTop:"1px solid #F1F5F9" },
  notifTitle:     { fontSize:"11px", fontWeight:700, color:"var(--ea-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" },
  notifRow:       { display:"flex", alignItems:"flex-start", gap:"10px", marginBottom:"8px" },
  notifIcon:      { fontSize:"16px", flexShrink:0, marginTop:"1px" },
  notifText:      { fontSize:"12px", color:"var(--ea-body)", lineHeight:1.4 },
  notifTime:      { fontSize:"10px", color:"var(--ea-muted)", marginTop:"2px" },
  stopsList:      { padding:"12px 20px 20px" },
  stopRow:        { display:"flex", alignItems:"flex-start", gap:"14px" },
  timeline:       { display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, width:"20px" },
  stopCircle:     { width:"20px", height:"20px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1, transition:"all 0.3s ease", marginTop:"6px" },
  connector:      { width:"2px", flex:1, minHeight:"22px", borderRadius:"2px", marginTop:"3px" },
  stopContent:    { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"8px", paddingTop:"4px" },
  stopName:       { fontSize:"13px", lineHeight:"1.3" },
  stopSub:        { fontSize:"11px", color:"var(--ea-muted)", marginTop:"3px" },
  badge:          { flexShrink:0, fontSize:"10px", fontWeight:600, padding:"3px 9px", borderRadius:"8px", letterSpacing:"0.2px", whiteSpace:"nowrap" },
  modalOverlay:   { position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
  modalCard:      { background:"var(--ea-surface)", borderRadius:"24px", padding:"28px 24px", width:"100%", maxWidth:"340px", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" },
  modalTitle:     { fontSize:"18px", fontWeight:700, color:"var(--ea-ink)", marginBottom:"8px" },
  modalSub:       { fontSize:"13px", color:"var(--ea-muted)", lineHeight:1.6, marginBottom:"20px" },
  modalBtns:      { display:"flex", gap:"10px" },
  cancelBtn:      { flex:1, padding:"12px", borderRadius:"14px", fontSize:"14px", fontWeight:600, background:"var(--ea-hover)", color:"var(--ea-body)", border:"none", cursor:"pointer" },
  confirmSosBtn:  { flex:1, padding:"12px", borderRadius:"14px", fontSize:"14px", fontWeight:700, background:"var(--ea-on-card-danger)", color:"white", border:"none", cursor:"pointer", boxShadow:"0 4px 16px rgba(220,38,38,0.4)" },
  callConfirmBtn: { flex:1, padding:"12px", borderRadius:"14px", fontSize:"14px", fontWeight:700, background:"var(--brand)", color:"white", border:"none", cursor:"pointer", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px color-mix(in srgb, var(--brand-dark) 40%, transparent)" },
};
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Bell, Check, ChevronUp, Maximize2, Minimize2, Phone, Siren, School, Bus, Home, MapPin } from "lucide-react";
import Ring from "../../components/ui/Ring";
import { useBusLive, formatEta, signalLabel } from "./liveBus";
import { AnimatedBusMarker, FollowBus } from "./AnimatedBusMarker";
import { BUS_SVG, schoolSvg, cssVar } from "../../utils/mapIcons";
import SosModal from "../../components/SosModal";

// The live bus screen for students and parents: a full map with the bus on the road, a slim title bar with the live status, and
// a stops panel that can be dragged up and down (three heights: just the summary, half, nearly full). Same screen for both
// roles; the page around it loads the bus and says where "back" goes.
//   props: bus (my-child-bus data), studentName, studentClass, studentId, role, homePath, onBack, alerts (parents: bell + settings)

const TILES = import.meta.env.VITE_MAP_TILES || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const busIcon = L.divIcon({
  className: "",
  html: `<div class="ea-bus-pin"><span>${BUS_SVG}</span></div>`,
  iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -50],
});

const stopIcon = (kind, label) => L.divIcon({
  className: "",
  html: `<div class="ea-bus-stop is-${kind}">${kind === "done" ? "&#10003;" : kind === "school" ? schoolSvg(13) : label}</div>`,
  iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -14],
});

const clock = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

// ---- the draggable panel ----

const LEVELS = ["peek", "half", "full"];

function useSheet(containerRef) {
  const [level, setLevel] = useState("peek"); // the stops panel rests at the bottom and opens only when it is pulled up
  const [drag, setDrag] = useState(null); // live height in px while a finger or the mouse is dragging
  const [box, setBox] = useState({ h: 700, w: 1200 });
  const start = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => setBox({ h: el.clientHeight, w: el.clientWidth });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  const desktop = box.w >= 1024;
  const top = desktop ? 112 : 108; // room kept for the title bar above the panel
  const heights = { peek: 128, half: Math.min(Math.max(box.h * 0.46, 300), 470), full: Math.max(300, box.h - top - 12) };
  const height = drag ?? heights[level];

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    start.current = { y: e.clientY, h: heights[level], moved: false, t: performance.now() };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const s = start.current;
    if (!s) return;
    const dy = e.clientY - s.y;
    if (Math.abs(dy) > 4) s.moved = true;
    if (s.moved) setDrag(Math.min(heights.full, Math.max(heights.peek, s.h - dy)));
  };
  const onPointerUp = (e) => {
    const s = start.current;
    start.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!s) return;
    if (!s.moved) { setLevel((l) => (l === "peek" ? "half" : l === "half" ? "peek" : "half")); return; } // a tap
    const dy = e.clientY - s.y;
    const speed = dy / Math.max(1, performance.now() - s.t); // px per ms, + = downwards
    let h = Math.min(heights.full, Math.max(heights.peek, s.h - dy)) - speed * 140; // a quick flick goes further
    h = Math.min(heights.full, Math.max(heights.peek, h));
    const nearest = LEVELS.reduce((best, l) => (Math.abs(heights[l] - h) < Math.abs(heights[best] - h) ? l : best), "half");
    setLevel(nearest);
    setDrag(null);
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); setLevel((l) => LEVELS[Math.min(2, LEVELS.indexOf(l) + 1)]); }
    if (e.key === "ArrowDown") { e.preventDefault(); setLevel((l) => LEVELS[Math.max(0, LEVELS.indexOf(l) - 1)]); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLevel((l) => (l === "peek" ? "half" : "peek")); }
  };

  return { level, height, dragging: drag !== null, desktop, box, bind: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onKeyDown } };
}

// The map must be told when its box changes size (full screen on and off).
function MapResize({ token }) {
  const map = useMap();
  useEffect(() => { const t = setTimeout(() => map.invalidateSize(), 60); return () => clearTimeout(t); }, [map, token]);
  return null;
}

// With no trip running the map still shows the whole route: every stop in view, the line between them.
function FitStops({ stops, padding }) {
  const map = useMap();
  const key = stops.map((s) => `${s.lat},${s.lng}`).join("|");
  useEffect(() => {
    if (stops.length > 1) map.fitBounds(stops.map((s) => [s.lat, s.lng]), { paddingTopLeft: [40, padding.top], paddingBottomRight: [padding.right, 170], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

function CallModal({ name, phone, onClose }) {
  return (
    <div className="ea-bus-modal" role="dialog" aria-modal="true" aria-label={`Call ${name}`} onClick={onClose}>
      <div className="ea-bus-modal__card" onClick={(e) => e.stopPropagation()}>
        <Phone size={28} aria-hidden="true" />
        <h2>Call {name}</h2>
        <p>{phone}</p>
        <div className="ea-bus-modal__row">
          <button type="button" className="ea-btn ea-btn--ghost" onClick={onClose}>Cancel</button>
          <a className="ea-btn ea-btn--primary" href={`tel:${phone}`}>Call now</a>
        </div>
      </div>
    </div>
  );
}

const ALERT_ITEMS = [
  ["tripStartEnd", "Trip started and ended"],
  ["stopReached", "Bus left a stop"],
  ["nearby", "Bus about 5 minutes from my child's stop"],
];

export default function BusTracker({ bus, studentName, studentClass, studentId, role, homePath, onBack, alerts = false }) {
  const live = useBusLive(bus.busId, { studentId });
  const rootRef = useRef(null);
  const sheet = useSheet(rootRef);
  const [full, setFull] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [prefs, setPrefs] = useState(() => { try { return { tripStartEnd: true, stopReached: true, nearby: true, ...JSON.parse(localStorage.getItem("eduamigo_bus_alerts") || "{}") }; } catch { return { tripStartEnd: true, stopReached: true, nearby: true }; } });
  const toggle = (k) => setPrefs((p) => { const n = { ...p, [k]: !p[k] }; try { localStorage.setItem("eduamigo_bus_alerts", JSON.stringify(n)); } catch { /* private mode */ } return n; });

  const stops = live.stops.length
    ? live.stops
    : [...(bus.stops || [])].sort((a, b) => a.order - b.order).map((s) => ({ id: s._id, name: s.name, lat: s.latitude, lng: s.longitude, status: "Pending", etaMin: null }));
  const active = live.active;
  const pos = active && live.position ? live.position : null;
  const cur = active ? live.currentStopIdx : 0;
  const mineIdx = stops.findIndex((s) => s.id === bus.myStopId);
  const lastIdx = stops.length - 1;
  const target = mineIdx >= cur && mineIdx >= 0 ? mineIdx : lastIdx; // the ETA shown: my child's stop while it is ahead, otherwise the end of the run
  const targetStop = stops[target];
  const next = active && cur < stops.length ? stops[cur] : null;
  const done = active ? Math.min(cur, stops.length) : 0;
  const speed = live.speedKmh;
  const pill = signalLabel(live);
  const me = studentName || "Your child";
  const childState = !active ? { Icon: Home, text: "At home", sub: "Trip not started yet" }
    : cur >= lastIdx && stops[lastIdx]?.status === "Live" && live.direction !== "drop" ? { Icon: School, text: "Reached school", sub: "Safe at school" }
      : { Icon: Bus, text: "On the bus", sub: next ? `Heading to ${next.name}` : "On the way" };

  // Alerts while this screen is open (the server also sends them as notifications, even when it is closed).
  const prev = useRef({ active: null, cur: null, near: false });
  useEffect(() => {
    if (!live.ready) return;
    const say = (text) => { try { if (Notification.permission === "granted") new Notification(text); } catch { /* not supported */ } };
    const p = prev.current;
    if (p.active !== null && active !== p.active && prefs.tripStartEnd) say(active ? "The bus has started its trip." : "The bus trip has ended.");
    if (active && p.cur !== null && cur > p.cur && prefs.stopReached && stops[cur - 1]) say(`The bus has left ${stops[cur - 1].name}.`);
    const mins = mineIdx >= cur ? live.etaOf?.(mineIdx) : null;
    if (active && !p.near && prefs.nearby && mins !== null && mins !== undefined && mins <= 5) { p.near = true; say(mins <= 0 ? "The bus is at your child's stop." : `The bus is about ${mins} min from your child's stop.`); }
    if (!active) p.near = false;
    p.active = active; p.cur = active ? cur : null;
  }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (alerts) { try { if (Notification.permission === "default") Notification.requestPermission(); } catch { /* not supported */ } } }, [alerts]);

  const onEsc = useCallback((e) => { if (e.key === "Escape") { setFull(false); setShowCall(false); setShowSos(false); setShowAlerts(false); } }, []);
  useEffect(() => { window.addEventListener("keydown", onEsc); return () => window.removeEventListener("keydown", onEsc); }, [onEsc]);

  // The part of the map that is not under the title bar or the panel: the bus is kept inside it.
  const inset = sheet.desktop
    ? { top: 110, right: 400, bottom: 24, left: 24 }
    : { top: 120, right: 16, bottom: sheet.height + 16, left: 16 };

  const kindOf = (i) => (i < cur && active ? "done" : i === cur && active ? "current" : i === mineIdx ? "mine" : i === lastIdx && live.direction !== "drop" ? "school" : "next");
  const start = pos ? [pos.lat, pos.lng] : stops[0] ? [stops[0].lat, stops[0].lng] : null;

  const map = start ? (
    <MapContainer center={start} zoom={active ? 16 : 13} zoomControl={false} className="ea-bus-leaflet">
      <TileLayer url={TILES} attribution="&copy; OpenStreetMap contributors" />
      {!active && stops.length > 1 && <Polyline positions={stops.map((s) => [s.lat, s.lng])} pathOptions={{ color: cssVar("--brand", "#4F46E5"), weight: 4, opacity: 0.55, dashArray: "2 10", lineCap: "round" }} />}
      {live.full.length > 1 && <Polyline positions={live.full} pathOptions={{ color: "#94a3b8", weight: 4, opacity: 0.5 }} />}
      {live.completed.length > 1 && <Polyline positions={live.completed} pathOptions={{ color: "#94a3b8", weight: 6, opacity: 0.7 }} />}
      {live.remaining.length > 1 && <Polyline positions={live.remaining} pathOptions={{ color: "#ffffff", weight: 10, opacity: 0.95 }} />}
      {live.remaining.length > 1 && <Polyline positions={live.remaining} pathOptions={{ color: cssVar("--brand", "#4F46E5"), weight: 6, opacity: 1 }} />}
      {stops.map((s, i) => (
        <Marker key={s.id || i} title={`Stop ${i + 1}: ${s.name}`} alt={`Stop ${i + 1}: ${s.name}`} position={[s.lat, s.lng]} icon={stopIcon(kindOf(i), i + 1)} zIndexOffset={kindOf(i) === "current" ? 400 : 0}>
          <Popup>
            <strong>{s.name}</strong><br />
            {i < cur ? (s.departedAt ? `Left at ${clock(s.departedAt)}` : "Left") : i === cur ? "The bus is here" : s.etaMin != null ? `Arriving in about ${formatEta(s.etaMin)}` : "Coming up"}
            {s.id === bus.myStopId ? <><br /><em>{me}'s stop</em></> : null}
          </Popup>
        </Marker>
      ))}
      {active && (
        <AnimatedBusMarker position={pos} route={live.route} icon={busIcon}>
          <strong>Bus {bus.busNumber}</strong><br />Driver: {bus.driverName}
        </AnimatedBusMarker>
      )}
      {active ? <FollowBus position={pos ? { lat: pos.lat, lng: pos.lng } : null} inset={inset} /> : <FitStops stops={stops} padding={{ top: sheet.desktop ? 150 : 150, right: sheet.desktop ? 420 : 40 }} />}
      <MapResize token={`${full}-${sheet.desktop}`} />
    </MapContainer>
  ) : null;

  const stopsList = (
    <ol className="ea-bus-stops">
      {stops.map((s, i) => {
        const kind = kindOf(i);
        const isMine = s.id === bus.myStopId;
        return (
          <li key={s.id || i} className={`ea-bus-row is-${kind}${isMine ? " is-mine" : ""}`}>
            <span className="ea-bus-rail" aria-hidden="true">
              <span className="ea-bus-dot">{kind === "done" ? <Check size={11} /> : kind === "school" ? <School size={11} /> : kind === "current" ? <span className="ea-bus-dot__core" /> : i + 1}</span>
            </span>
            <span className="ea-bus-row__text">
              <strong>{s.name}</strong>
              <small>
                {i < cur && active ? (s.departedAt ? `Left at ${clock(s.departedAt)}` : "Left")
                  : kind === "current" ? "The bus is here now"
                    : s.etaMin != null ? `Arriving in about ${formatEta(s.etaMin)}` : "Coming up"}
                {isMine ? ` · ${me}'s stop` : ""}
              </small>
            </span>
            {i >= cur || !active ? <span className="ea-bus-row__eta">{active && s.etaMin != null ? formatEta(s.etaMin) : ""}</span> : <span className="ea-bus-row__tag">Done</span>}
          </li>
        );
      })}
    </ol>
  );

  return (
    <div ref={rootRef} className={`ea-bus${full ? " is-full" : ""}${sheet.dragging ? " is-dragging" : ""}`} style={{ "--sheet-h": `${sheet.height}px` }}>
      <div className="ea-bus-map">
        {map}
        {!map && (
          <div className="ea-bus-empty">
            <Bus size={44} aria-hidden="true" />
            <p className="ea-bus-empty__title">{active ? "The bus has started: waiting for its location" : "Bus not on route yet"}</p>
            <p className="ea-bus-empty__sub">{active ? "The driver's GPS will appear on the map in a moment" : "Trip has not started"}</p>
          </div>
        )}
        {map && active && !pos && (
          <div className="ea-bus-empty ea-bus-empty--over">
            <p className="ea-bus-empty__title">The bus has started: waiting for its location</p>
            <p className="ea-bus-empty__sub">The driver's GPS will appear on the map in a moment</p>
          </div>
        )}
      </div>

      <header className="ea-bus-head">
        <button type="button" className="ea-bus-back" aria-label="Back to home" onClick={onBack}><ArrowLeft size={20} aria-hidden="true" /></button>
        <span className="ea-bus-badge" aria-hidden="true"><Bus size={22} /></span>
        <div className="ea-bus-head__title">
          <h1>Live bus</h1>
          <p><span className="ea-bus-plate">{bus.busNumber}</span>{bus.routeName}</p>
        </div>
        <span className="ea-bus-pill" data-testid="bus-live-badge" role="status" aria-live="polite" style={{ "--pill": active ? pill.color : "#64748b" }}>
          <i aria-hidden="true" />{active ? pill.text : "NOT ON ROUTE"}
        </span>
        {alerts && <button type="button" className="ea-bus-iconbtn" aria-label="Bus alert settings" title="Bus alert settings" onClick={() => setShowAlerts(true)}><Bell size={18} aria-hidden="true" /></button>}
        <button type="button" className="ea-bus-iconbtn ea-bus-fs" aria-label={full ? "Exit full-screen map" : "Full-screen map"} onClick={() => setFull((f) => !f)}>
          {full ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
        </button>
      </header>

      <section className="ea-bus-panel" aria-label="Route stops" style={{ height: sheet.height }}>
        <div className="ea-bus-grip" {...sheet.bind} role="slider" tabIndex={0} aria-label="Resize the stops panel: drag up or down" aria-orientation="vertical"
          aria-valuemin={0} aria-valuemax={2} aria-valuenow={LEVELS.indexOf(sheet.level)} aria-valuetext={sheet.level === "peek" ? "Summary only" : sheet.level === "half" ? "Half height" : "Full height"}>
          <span className="ea-bus-handle" aria-hidden="true" />
          <div className="ea-bus-summary">
            <div className="ea-bus-eta">
              <small>{active ? (target === mineIdx && mineIdx >= 0 ? `Arriving at ${targetStop?.name}` : `Arriving at ${targetStop?.name || "the last stop"}`) : "Trip not started"}</small>
              <strong>{active && targetStop?.etaMin != null ? formatEta(targetStop.etaMin) : "—"}</strong>
            </div>
            <div className="ea-bus-facts">
              <span><b>{active ? Math.round(speed) : 0}</b> km/h</span>
              <span>{!active ? "Idle" : live.signal === "lost" ? "No signal" : speed < 3 ? "Stopped" : "Moving"}</span>
            </div>
            <Ring value={stops.length ? (done / stops.length) * 100 : 0} label="Stops completed" text={`${done}/${stops.length}`} variant="center" size={52} />
            <ChevronUp size={18} className="ea-bus-chev" aria-hidden="true" />
          </div>
        </div>

        <div className="ea-bus-body">
          <div className="ea-bus-progress" role="progressbar" aria-label="Stops completed" aria-valuemin={0} aria-valuemax={stops.length} aria-valuenow={done}>
            <span style={{ width: `${stops.length ? (done / stops.length) * 100 : 0}%` }} />
          </div>
          <div className="ea-bus-child">
            <childState.Icon size={18} aria-hidden="true" />
            <div><strong>{me}</strong><small>{studentClass ? `${studentClass} · ` : ""}{childState.text}: {childState.sub}</small></div>
          </div>
          <div className="ea-bus-actions">
            <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setShowCall(true)}><Phone size={16} aria-hidden="true" /> Call driver</button>
            <button type="button" className="ea-btn ea-bus-sos" onClick={() => setShowSos(true)}><Siren size={16} aria-hidden="true" /> SOS</button>
          </div>
          <h2 className="ea-bus-h2"><MapPin size={14} aria-hidden="true" /> Route Stops <span>{stops.length}</span></h2>
          {stopsList}
        </div>
      </section>

      {full && pos && createPortal(<div className="ea-bus-mini">{pill.text} · {formatEta(targetStop?.etaMin)}</div>, rootRef.current || document.body)}
      {showCall && <CallModal name={bus.driverName} phone={bus.driverPhone} onClose={() => setShowCall(false)} />}
      {showSos && <SosModal onClose={() => setShowSos(false)} studentName={studentName} studentId={role === "parent" ? studentId : undefined} location={pos ? { lat: pos.lat, lng: pos.lng } : null} driverPhone={bus.driverPhone} />}
      {showAlerts && (
        <div className="ea-bus-modal" role="dialog" aria-modal="true" aria-label="Bus alert settings" onClick={() => setShowAlerts(false)}>
          <div className="ea-bus-modal__card" onClick={(e) => e.stopPropagation()}>
            <Bell size={26} aria-hidden="true" />
            <h2>Bus alerts</h2>
            <p>Alerts on this phone while the app is open. Notifications from the school arrive either way.</p>
            {ALERT_ITEMS.map(([k, label]) => (
              <label key={k} className="ea-bus-check"><input type="checkbox" checked={!!prefs[k]} onChange={() => toggle(k)} /> {label}</label>
            ))}
            <button type="button" className="ea-btn ea-btn--primary" onClick={() => setShowAlerts(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Marker, Popup, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import { pointAt } from "./liveBus";

// The bus moves like a rider on a delivery map: between two GPS readings it glides along the road at the pace it was going,
// instead of jumping from reading to reading. Each new reading starts a glide from where the marker is now to the new place
// (over about the time since the last reading), following the road line when the bus is on it.

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

export function AnimatedBusMarker({ position, route, icon, children, onMove }) {
  const markerRef = useRef(null);
  const shown = useRef(null);     // where the marker is drawn now: { lat, lng, meters }
  const lastAt = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    if (!position || !markerRef.current) return undefined;
    const target = { lat: position.lat, lng: position.lng, meters: position.routeMeters ?? null, offRoute: !!position.offRoute };
    const from = shown.current || target;
    const sinceLast = lastAt.current ? Date.now() - lastAt.current : 4000;
    lastAt.current = Date.now();
    const duration = Math.min(6000, Math.max(1200, sinceLast * 0.95));
    const along = route && !target.offRoute && from.meters !== null && target.meters !== null && target.meters >= from.meters && !from.offRoute;
    const start = performance.now();
    cancelAnimationFrame(frame.current);
    const step = (t) => {
      const k = ease(Math.min(1, (t - start) / duration));
      let lat; let lng; let meters = null;
      if (along) {
        meters = from.meters + (target.meters - from.meters) * k;
        [lat, lng] = pointAt(route, meters).latlng;
      } else {
        lat = from.lat + (target.lat - from.lat) * k; lng = from.lng + (target.lng - from.lng) * k;
      }
      shown.current = { lat, lng, meters: meters ?? (k >= 1 ? target.meters : from.meters), offRoute: target.offRoute };
      markerRef.current?.setLatLng([lat, lng]);
      onMove?.(lat, lng);
      if (k < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.at, position?.lat, position?.lng, position?.routeMeters]);

  if (!position) return null;
  return (
    <Marker ref={markerRef} position={[position.lat, position.lng]} icon={icon} title="School bus" alt="School bus">
      {children && <Popup>{children}</Popup>}
    </Marker>
  );
}

// Keeps the bus in view like a navigation app: the map moves only when the bus leaves the free part of the map (the part not under
// the title bar or the stops panel, given as `inset` in pixels), puts it in the middle of that free part, stops following when the
// person drags the map, and a button brings it back.
export function FollowBus({ position, inset = { top: 0, right: 0, bottom: 0, left: 0 }, zoom = 16 }) {
  const map = useMap();
  const following = useRef(true);
  const programmatic = useRef(false);
  const lastPos = useRef(null);
  const buttonRef = useRef(null);
  const syncButton = () => { if (buttonRef.current) buttonRef.current.style.display = following.current ? "none" : "flex"; };

  // The map centre that puts `p` in the middle of the free part.
  const centreFor = (p, z) => {
    const dx = (inset.left - inset.right) / 2;
    const dy = (inset.top - inset.bottom) / 2;
    return map.unproject(map.project([p.lat, p.lng], z).subtract([dx, dy]), z);
  };
  const go = (p, z, animate = true) => {
    programmatic.current = true;
    map.setView(centreFor(p, z), z, { animate, duration: 1 });
    setTimeout(() => { programmatic.current = false; }, 1300);
  };

  useEffect(() => {
    const stop = () => { if (!programmatic.current) following.current = false; syncButton(); };
    map.on("dragstart", stop);
    map.on("zoomstart", stop);
    return () => { map.off("dragstart", stop); map.off("zoomstart", stop); };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!position) return;
    const first = !lastPos.current;
    lastPos.current = position;
    if (!following.current) return;
    const size = map.getSize();
    const pt = map.latLngToContainerPoint([position.lat, position.lng]);
    const margin = 48;
    const inside = pt.x > inset.left + margin && pt.x < size.x - inset.right - margin && pt.y > inset.top + margin && pt.y < size.y - inset.bottom - margin;
    if (first || !inside || map.getZoom() < 14) go(position, Math.max(map.getZoom(), zoom), !first);
  }, [position?.lat, position?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const recenter = () => {
    const p = lastPos.current;
    if (!p) return;
    following.current = true;
    go(p, Math.max(map.getZoom(), zoom));
    syncButton();
  };

  return createPortal(
    <button ref={buttonRef} type="button" onClick={recenter} aria-label="Follow the bus" className="ea-bus-follow" style={{ display: "none" }}>
      <LocateFixed size={20} aria-hidden="true" />
    </button>,
    map.getContainer(),
  );
}

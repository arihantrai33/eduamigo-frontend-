import { useEffect, useMemo, useState } from "react";

// The live view of one bus for parents, students and school staff. The server (services/busTracking.js) does the work: it
// follows the road and the stops, works out the ETAs and tells us the changes. This hook only keeps a connection to it:
//   1. a snapshot first (the whole picture, with the road),
//   2. then a stream of changes (one JSON object per line) held open as long as possible,
//   3. and if the stream drops, the screen keeps working by asking for a snapshot every few seconds while it reconnects.
// Nothing here talks to a routing service or to Firebase.

const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const query = (studentId, extra = "") => `${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ""}${extra ? `${studentId ? "&" : "?"}${extra}` : ""}`;

// ---- geometry on the route (metres) ----

const RAD = Math.PI / 180;
export function metersBetween(a, b) {
  const dLat = (b[0] - a[0]) * RAD; const dLng = (b[1] - a[1]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Cumulative metres at each point of the road, computed once per route.
export function routeIndex(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i += 1) cum.push(cum[i - 1] + metersBetween(points[i - 1], points[i]));
  return { points, cum };
}

// The [lat, lng] and the segment index `metres` along the road.
export function pointAt(route, metres) {
  const { points, cum } = route;
  if (!points.length) return null;
  if (metres <= 0) return { latlng: points[0], index: 0 };
  if (metres >= cum[cum.length - 1]) return { latlng: points[points.length - 1], index: points.length - 1 };
  let lo = 0; let hi = cum.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= metres) lo = mid; else hi = mid; }
  const t = (metres - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
  return { latlng: [points[lo][0] + (points[hi][0] - points[lo][0]) * t, points[lo][1] + (points[hi][1] - points[lo][1]) * t], index: lo };
}

// The road split at the bus: what has been driven and what is left.
export function splitRoute(route, metres, bus) {
  if (!route || !route.points.length) return { done: [], left: [] };
  const at = pointAt(route, metres);
  const here = bus || at.latlng;
  return { done: [...route.points.slice(0, at.index + 1), here], left: [here, ...route.points.slice(at.index + 1)] };
}

export const formatEta = (min) => (min === null || min === undefined ? "—" : min <= 0 ? "Arriving" : min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`);

// ---- the connection ----

function reduce(state, ev) {
  switch (ev.type) {
    case "snapshot":
      return { ...state, ready: true, snap: { ...ev, route: ev.route || state.snap?.route }, lastEventAt: Date.now() };
    case "position":
      if (!state.snap) return state;
      return {
        ...state, lastEventAt: Date.now(),
        snap: { ...state.snap, position: ev.position, signal: ev.signal, currentStopIndex: ev.currentStopIndex, serverTime: ev.serverTime,
          stops: state.snap.stops.map((s, i) => ({ ...s, etaMin: ev.etas?.[i] ?? null, status: i < ev.currentStopIndex ? "Departed" : i === ev.currentStopIndex ? "Live" : "Pending" })) },
      };
    case "stops":
      return state.snap ? { ...state, lastEventAt: Date.now(), snap: { ...state.snap, stops: ev.stops, currentStopIndex: ev.currentStopIndex, serverTime: ev.serverTime } } : state;
    case "ping":
      return { ...state, lastEventAt: Date.now() };
    default:
      return state;
  }
}

async function readLines(res, onLine, signal) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done || signal.aborted) return;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) { try { onLine(JSON.parse(line)); } catch { /* a broken line is skipped */ } }
    }
  }
}

export function useBusLive(busId, { studentId } = {}) {
  const [state, setState] = useState({ ready: false, snap: null, lastEventAt: 0 });
  const [connection, setConnection] = useState("connecting"); // connecting | live | polling
  const [now, setNow] = useState(() => Date.now());
  const [skew, setSkew] = useState(0); // server clock minus this phone's clock, so "seconds ago" is right even if the phone's clock is off

  useEffect(() => {
    if (!busId) return undefined;
    let stopped = false;
    let ctl = null;
    let wait = 1000;
    const apply = (ev) => { if (ev.serverTime) setSkew(ev.serverTime - Date.now()); setState((s) => reduce(s, ev)); };

    const snapshot = async (withRoute) => {
      const res = await fetch(`${API}/transport/live/${busId}${query(studentId, withRoute ? "" : "route=0")}`, { headers: headers() });
      if (!res.ok) throw new Error(`snapshot ${res.status}`);
      apply((await res.json()).data);
    };

    const run = async () => {
      let haveRoute = false;
      while (!stopped) {
        ctl = new AbortController();
        // If nothing, not even a ping, arrives for 40 s the link is dead without saying so: drop it and start again.
        let watchdog = setTimeout(() => ctl.abort(), 40000);
        try {
          const res = await fetch(`${API}/transport/live/${busId}/stream${query(studentId)}`, { headers: headers(), signal: ctl.signal });
          if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
          setConnection("live");
          wait = 1000;
          await readLines(res, (ev) => { clearTimeout(watchdog); watchdog = setTimeout(() => ctl.abort(), 40000); haveRoute = haveRoute || ev.type === "snapshot"; apply(ev); }, ctl.signal);
        } catch { /* fall through to the fallback below */ }
        clearTimeout(watchdog);
        if (stopped) return;
        // The stream is down: keep the screen fresh with snapshots while waiting to reconnect.
        setConnection("polling");
        const until = Date.now() + wait;
        while (!stopped && Date.now() < until) {
          try { await snapshot(!haveRoute); haveRoute = true; } catch { /* offline: try again */ }
          await new Promise((r) => setTimeout(r, Math.min(8000, Math.max(1000, until - Date.now()))));
        }
        wait = Math.min(15000, wait * 2);
      }
    };
    run();
    return () => { stopped = true; ctl?.abort(); };
  }, [busId, studentId]);

  const snap = state.snap;
  const active = snap?.status === "On Route";
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const routePoints = snap?.route?.points;
  const route = useMemo(() => (routePoints?.length ? routeIndex(routePoints) : null), [routePoints]);

  return useMemo(() => {
    if (!snap) return { ready: state.ready, connection, active: false, signal: "idle", position: null, stops: [], currentStopIdx: 0, route: null, completed: [], remaining: [], full: [], lastSeenSec: null, speedKmh: 0, etaSchool: "—", etaMyStop: null };
    const serverNow = now + skew;
    const pos = snap.position;
    const age = pos ? Math.max(0, Math.round((serverNow - pos.receivedAt) / 1000)) : null;
    let signal = snap.signal;
    if (active && pos && age * 1000 > (snap.staleMs || 45000)) signal = "lost";
    if (connection === "polling" && signal === "live" && age > 20) signal = "weak";
    const { done, left } = pos && route ? splitRoute(route, pos.routeMeters, [pos.lat, pos.lng]) : { done: [], left: route?.points || [] };
    const last = snap.stops[snap.stops.length - 1];
    return {
      ready: true, connection, active, signal, status: snap.status, direction: snap.direction, position: pos, stops: snap.stops,
      currentStopIdx: snap.currentStopIndex, route, full: route?.points || [], completed: done, remaining: left, lastSeenSec: age,
      speedKmh: pos && signal !== "lost" ? pos.speedKmh : 0, etaSchool: formatEta(last?.etaMin), etaOf: (i) => snap.stops[i]?.etaMin ?? null,
      routeSource: snap.route?.source,
    };
  }, [snap, state.ready, connection, now, skew, route, active]);
}

const agoText = (s) => (s === null || s === undefined ? "" : s < 5 ? "just now" : s < 60 ? `${s} s ago` : s < 3600 ? `${Math.floor(s / 60)} min ago` : `${Math.floor(s / 3600)} h ago`);

// The words and colour for the status pill on the Bus screen: live, weak signal, signal lost (with when it was last seen), or waiting.
export function signalLabel(live) {
  if (live.signal === "lost") return { text: `SIGNAL LOST · LAST SEEN ${agoText(live.lastSeenSec).toUpperCase()}`, color: "#F87171" };
  if (live.signal === "weak") return { text: "WEAK GPS SIGNAL", color: "#FBBF24" };
  if (live.signal === "waiting" || !live.position) return { text: "WAITING FOR GPS", color: "#FBBF24" };
  return { text: live.connection === "polling" ? "LIVE · RECONNECTING" : "LIVE", color: "#4ADE80" };
}

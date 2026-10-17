import { useCallback, useEffect, useRef, useState } from "react";
import { sendLocations } from "../../api/transport";

// The driver phone's side of live tracking. While a trip is running it
//   * reads the GPS continuously (high accuracy) and keeps every reading in a queue, saved on the phone, so nothing is lost
//     in a tunnel or a dead spot, or if the page is reloaded;
//   * sends the queue to the server every few seconds in one batch and removes what the server has taken, retrying with a
//     growing pause when there is no network;
//   * sends a "still here" reading when the bus stands still (the GPS stops reporting then);
//   * keeps the screen awake (Wake Lock). A web page cannot read the GPS once the phone is locked or another app is in front:
//     the screen shows that plainly, and the school app on Android can be installed for background tracking.
// The server decides which stop the bus is at; the answer to every batch carries it, so this screen follows the server.

const SEND_EVERY_MS = 4000;
const STILL_AFTER_MS = 10000;
const MAX_QUEUE = 400;
const BATCH = 40;
const queueKey = (token) => `eduamigo_driver_queue_${String(token).slice(0, 24)}`;

const loadQueue = (token) => { try { return JSON.parse(localStorage.getItem(queueKey(token)) || "[]"); } catch { return []; } };
const saveQueue = (token, q) => { try { localStorage.setItem(queueKey(token), JSON.stringify(q.slice(-MAX_QUEUE))); } catch { /* storage full or private mode: the queue stays in memory */ } };

export function useDriverTracker({ token, active, onServerState, onTripOver, onInvalid }) {
  const [gps, setGps] = useState("idle");       // idle | searching | ok | weak | denied | unsupported | lost
  const [fix, setFix] = useState(null);          // { lat, lng, accuracy }
  const [queued, setQueued] = useState(0);
  const [lastSentAt, setLastSentAt] = useState(null);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [wakeLock, setWakeLock] = useState("unknown"); // unknown | on | off | unsupported
  const [pausedWhileHidden, setPausedWhileHidden] = useState(false);

  const queue = useRef([]);
  const lastReading = useRef(null);
  const lastFixAt = useRef(0);
  const backoff = useRef(0);
  const nextTry = useRef(0);
  const sending = useRef(false);
  const watchId = useRef(null);
  const wake = useRef(null);
  const cb = useRef({});
  useEffect(() => { cb.current = { onServerState, onTripOver, onInvalid }; });

  const push = useCallback((p) => {
    queue.current.push(p);
    if (queue.current.length > MAX_QUEUE) queue.current.splice(0, queue.current.length - MAX_QUEUE);
    saveQueue(token, queue.current);
    setQueued(queue.current.length);
  }, [token]);

  const flush = useCallback(async () => {
    if (sending.current || !queue.current.length || Date.now() < nextTry.current) return;
    sending.current = true;
    const batch = queue.current.slice(0, BATCH);
    try {
      const res = await sendLocations(token, batch);
      queue.current.splice(0, batch.length);
      saveQueue(token, queue.current);
      setQueued(queue.current.length);
      setLastSentAt(Date.now());
      backoff.current = 0; nextTry.current = 0;
      setOnline(true);
      cb.current.onServerState?.(res.data);
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 409 && code === "TRIP_NOT_ACTIVE") { queue.current = []; saveQueue(token, []); setQueued(0); cb.current.onTripOver?.(); }
      else if (status === 403 || status === 404) cb.current.onInvalid?.(err?.response?.data?.message);
      else if (status === 400) { queue.current.splice(0, batch.length); saveQueue(token, queue.current); setQueued(queue.current.length); } // a batch the server will never accept
      else { backoff.current = Math.min(15000, (backoff.current || 2000) * 2); nextTry.current = Date.now() + backoff.current; if (!err?.response) setOnline(false); }
    } finally {
      sending.current = false;
    }
  }, [token]);

  // GPS
  useEffect(() => {
    if (!active) return undefined;
    queue.current = loadQueue(token);
    if (!navigator.geolocation) { Promise.resolve().then(() => setGps("unsupported")); return undefined; }
    Promise.resolve().then(() => { setQueued(queue.current.length); setGps("searching"); });
    const onPos = (pos) => {
      const c = pos.coords;
      const reading = { lat: c.latitude, lng: c.longitude, accuracy: Math.round(c.accuracy), at: pos.timestamp || Date.now() };
      if (Number.isFinite(c.speed) && c.speed !== null) reading.speed = c.speed;
      if (Number.isFinite(c.heading) && c.heading !== null) reading.heading = c.heading;
      lastFixAt.current = Date.now();
      setFix({ lat: reading.lat, lng: reading.lng, accuracy: reading.accuracy });
      setGps(reading.accuracy > 60 ? "weak" : "ok");
      // No more than one reading every 2 seconds is kept; the server samples far less.
      if (lastReading.current && reading.at - lastReading.current.at < 2000) return;
      lastReading.current = reading;
      push(reading);
    };
    const onErr = (err) => {
      if (err.code === 1) setGps("denied");
      else setGps("lost"); // unavailable or timed out: the watch keeps trying by itself
    };
    watchId.current = navigator.geolocation.watchPosition(onPos, onErr, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    return () => { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; setGps("idle"); };
  }, [active, token, push]);

  // Sending, and the "still here" reading
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => {
      const quiet = Date.now() - lastFixAt.current > STILL_AFTER_MS;
      const last = lastReading.current;
      if (quiet && last && queue.current.length === 0 && gps !== "denied") push({ ...last, at: Date.now(), speed: 0 });
      flush();
    }, SEND_EVERY_MS);
    flush();
    return () => clearInterval(t);
  }, [active, flush, push, gps]);

  // Network
  useEffect(() => {
    const up = () => { setOnline(true); nextTry.current = 0; flush(); };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, [flush]);

  // Screen awake
  const acquire = useCallback(async () => {
    if (!("wakeLock" in navigator)) { setWakeLock("unsupported"); return; }
    try {
      wake.current = await navigator.wakeLock.request("screen");
      setWakeLock("on");
      wake.current.addEventListener("release", () => setWakeLock("off"));
    } catch { setWakeLock("off"); }
  }, []);
  useEffect(() => {
    if (!active) { wake.current?.release?.().catch?.(() => {}); wake.current = null; return undefined; }
    Promise.resolve().then(acquire);
    const onVisible = () => {
      // The screen was turned off or another app came in front: readings may have been missed. Say so, and take the lock again.
      if (document.visibilityState === "visible") acquire(); else setPausedWhileHidden(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => { document.removeEventListener("visibilitychange", onVisible); wake.current?.release?.().catch?.(() => {}); wake.current = null; };
  }, [active, acquire]);

  const clearPaused = useCallback(() => setPausedWhileHidden(false), []);
  const discard = useCallback(() => { queue.current = []; saveQueue(token, []); setQueued(0); }, [token]);

  return { gps, fix, queued, lastSentAt, online, wakeLock, pausedWhileHidden, clearPaused, discard, flush };
}

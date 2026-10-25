import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { gradeFor } from "../../utils/grades";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

export function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// Real unread count: what the server says is unread among the person's latest notifications. Refreshed every minute while
// the page is visible. null until the first answer (so a badge is not drawn from a guess), and stays null if it fails.
export function useUnread() {
  const [count, setCount] = useState(null);
  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/notifications/my`, auth());
      if (res.data?.success && Number.isFinite(res.data.unread)) setCount(res.data.unread);
    } catch { /* the bell simply shows no number */ }
  }, []);
  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(() => { if (!document.hidden) load(); }, 60000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [load]);
  return { count, reload: load };
}

// One request per dashboard section, so a failing section says so by itself and the others still show.
//   const att = useLoad(() => axios.get(...), child?._id)
//   att.state: "loading" | "ok" | "idle" (nothing to ask yet) | "missing" (the server said 404: nothing exists, e.g. no bus) | "error"
// The request runs again when `key` changes, or when reload() is called. A result belongs to the key it was asked for, so a
// section never shows the previous child's numbers under the new child's name.
export function useLoad(fn, key) {
  const [version, setVersion] = useState(0);
  const full = `${key}|${version}`;
  const [result, setResult] = useState({ key: null });
  const run = useRef(fn);
  useEffect(() => { run.current = fn; }); // the newest request function; declared before the effect that uses it
  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => run.current())
      .then(
        (data) => alive && setResult({ key: full, state: data == null ? "idle" : "ok", data }), // a request function may return null: nothing to ask
        (error) => alive && setResult({ key: full, state: error?.response?.status === 404 ? "missing" : "error", error }),
      );
    return () => { alive = false; };
  }, [full]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return result.key === full ? { ...result, reload } : { state: "loading", data: null, reload };
}

export const rupees = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const BUS_TEXT = { Idle: "Not on route", "On Route": "On route now", Completed: "Trip finished" };
// What to say about a bus. "On route now" only when the driver's phone is really sending its position.
export function busState(bus) {
  if (!bus) return { text: "Not on route", live: false, tone: undefined };
  if (bus.busStatus !== "On Route") return { text: BUS_TEXT[bus.busStatus] || "Not on route", live: false, tone: undefined };
  const sig = bus.tripSignal;
  if (sig === "live" || sig === "weak") return { text: "On route now", live: true, tone: "orange" };
  if (sig === "lost") return { text: "Location lost", live: false, tone: "bad" };
  return { text: "Started, waiting for GPS", live: false, tone: undefined };
}
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// The newest exam in a list of result rows: its subjects as percentages and the overall result, from the same rows.
export function latestResult(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const latest = list[0]?.examName;
  const used = latest ? list.filter((r) => r.examName === latest && Number(r.totalMarks) > 0 && Number.isFinite(Number(r.marksObtained))) : [];
  const got = used.reduce((s, r) => s + Number(r.marksObtained), 0);
  const max = used.reduce((s, r) => s + Number(r.totalMarks), 0);
  const overall = max > 0 ? Math.round((got / max) * 100) : null;
  return { latest, overall, grade: overall === null ? null : gradeFor(overall), bars: used.map((r) => ({ label: r.subject || "Subject", value: (Number(r.marksObtained) / Number(r.totalMarks)) * 100 })) };
}


// First name for a greeting: titles are skipped ("Dr. Meenakshi Rathore" is "Meenakshi", not "Dr.").
const TITLES = new Set(["dr", "mr", "mrs", "ms", "miss", "prof", "shri", "smt", "sri", "mx"]);
export function firstName(full) {
  const words = String(full || "").trim().split(/\s+/).filter(Boolean);
  const real = words.find((w) => !TITLES.has(w.replace(/\.$/, "").toLowerCase()));
  return real || words[0] || "";
}

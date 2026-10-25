import { useEffect, useRef, useState } from "react";
import { BarChart3, Bus, CalendarCheck, Mic, Send, Sparkles, Wallet } from "lucide-react";

// "A day in your school": a section that stays on screen while the visitor scrolls through five steps, and the device on the
// right changes with each step (its colour too). Normal scrolling is untouched (CSS sticky, no scroll hijacking). On a phone it
// is a plain list. All names and figures are made up.
const STEPS = [
  { icon: CalendarCheck, ac: "#4f46e5", title: "Morning attendance", text: "A teacher marks a class in seconds. Parents are told at once.", screen: "Attendance", sub: "Class 7B · Today", chip: "Parents notified" },
  { icon: Wallet, ac: "#059669", title: "Fees and receipts", text: "Dues by student and class. Receipts printed in one click.", screen: "Fees", sub: "This month", chip: "Receipt #1042 ready" },
  { icon: Bus, ac: "#0284c7", title: "The school bus, live", text: "Parents see the bus on a map, with arrival times.", screen: "Live bus", sub: "Route 4 · Morning trip", chip: "Arriving in 6 min" },
  { icon: BarChart3, ac: "#d97706", title: "Results and report cards", text: "Marks entered once. Report cards ready when you are.", screen: "Report card", sub: "Term 1 · Class 7B", chip: "Report cards ready" },
  { icon: Sparkles, ac: "#7c3aed", title: "Doubts, answered", text: "A study companion that explains step by step.", screen: "Learning AI", sub: "Mathematics", chip: "Hindi · English · Hinglish" },
];

const STOPS = [["Oak Street", "7:42", true], ["Maple Road", "7:51", false], ["Green Valley School", "8:05", false]];

export default function DayInSchool() {
  const wrap = useRef(null);
  const bar = useRef(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -r.top / total));
      if (bar.current) bar.current.style.width = `${p * 100}%`;
      setI(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const jump = (k) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    window.scrollTo({ top: window.scrollY + r.top + total * ((k + 0.5) / STEPS.length), behavior: "smooth" });
  };

  const on = (k) => (i === k ? " is-on" : "");
  const cur = STEPS[i];
  return (
    <section className="lp-day" id="day" ref={wrap} aria-labelledby="day-title">
      <div className="lp-day__stage" style={{ "--ac": cur.ac }}>
        <i className="lp-day__glow" aria-hidden="true" />
        <div className="lp-day__copy">
          <span className="lp-eyebrow">A day in your school</span>
          <h2 className="lp-h2" id="day-title">From the first bell to the last bus</h2>
          <ol className="lp-day__steps">
            {STEPS.map((s, k) => (
              <li key={s.title}>
                <button type="button" className={`lp-day__step${on(k)}`} style={{ "--sc": s.ac }} aria-current={i === k ? "step" : undefined} onClick={() => jump(k)}>
                  <span className="lp-day__n"><s.icon size={18} aria-hidden /></span>
                  <span><b>{s.title}</b><small>{s.text}</small></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="lp-day__bar" aria-hidden="true"><i ref={bar} /></div>
        </div>

        <div className="lp-day__wrap" aria-hidden="true">
          <div className="lp-day__device">
            <div className="lp-day__head">
              <span className="lp-day__hicon"><cur.icon size={20} /></span>
              <span><b>{cur.screen}</b><small>{cur.sub}</small></span>
              <span className="lp-day__count">{i + 1}/{STEPS.length}</span>
            </div>

            <div className={`lp-day__scr${on(0)}`}>
              <div className="lp-day__tiles"><div><b>38</b><small>Present</small></div><div><b>2</b><small>Absent</small></div><div><b>95%</b><small>Today</small></div></div>
              {[["Aarav Sharma", "Present"], ["Diya Verma", "Present"], ["Kabir Singh", "Absent"], ["Meera Nair", "Present"]].map(([n, st], k) => (
                <div key={n} className="lp-day__row" style={{ "--i": k }}><span className="lp-day__av">{n[0]}</span>{n}<span className={`lp-day__pill${st === "Absent" ? " is-a" : ""}`}>{st}</span></div>
              ))}
              <div className="lp-day__toast">✓ Parents of absent students told</div>
            </div>

            <div className={`lp-day__scr${on(1)}`}>
              <div className="lp-day__tiles lp-day__tiles--2"><div><b>₹ 3.2 L</b><small>Collected</small></div><div><b>₹ 0.9 L</b><small>Pending</small></div></div>
              <div className="lp-day__track" style={{ "--w": "78%" }}><i /></div>
              {[["Aarav Sharma", "Paid", ""], ["Kabir Singh", "Due ₹ 4,500", " is-w"], ["Meera Nair", "Paid", ""], ["Rohan Das", "Paid", ""]].map(([n, st, c], k) => (
                <div key={n} className="lp-day__row" style={{ "--i": k }}><span className="lp-day__av">{n[0]}</span>{n}<span className={`lp-day__pill${c}`}>{st}</span></div>
              ))}
              <div className="lp-day__toast">Receipt #1042 printed</div>
            </div>

            <div className={`lp-day__scr${on(2)}`}>
              <div className="lp-day__map">
                <svg viewBox="0 0 500 210"><path pathLength="100" d="M20 170 C110 170 120 50 230 96 S380 150 470 50" fill="none" stroke="#b9cff0" strokeWidth="4" strokeDasharray="1.2 3" strokeLinecap="round" /><path className="trail" pathLength="100" d="M20 170 C110 170 120 50 230 96 S380 150 470 50" fill="none" strokeWidth="4.5" strokeLinecap="round" /><circle cx="20" cy="170" r="7" fill="#fff" stroke="#8fb0e0" strokeWidth="3" /><circle cx="230" cy="96" r="7" fill="#fff" stroke="#8fb0e0" strokeWidth="3" /><circle cx="470" cy="50" r="7" fill="#fff" stroke="#8fb0e0" strokeWidth="3" /></svg>
                <i className="lp-day__dot" />
              </div>
              {STOPS.map(([n, t, done], k) => (
                <div key={n} className="lp-day__row" style={{ "--i": k }}><span className={`lp-day__av${done ? " is-done" : ""}`}>{done ? "✓" : k + 1}</span>{n}<span className="lp-day__time">{t}</span></div>
              ))}
              <div className="lp-day__toast">Next stop · Maple Road · 6 min</div>
            </div>

            <div className={`lp-day__scr${on(3)}`}>
              <div className="lp-day__grade"><div><b>A</b><small>Overall grade</small></div><div><b>91%</b><small>Term 1</small></div><div><b>#3</b><small>In class</small></div></div>
              {[["Mathematics", 92], ["Science", 86], ["English", 78], ["Hindi", 88]].map(([n, v]) => (
                <div key={n} className="lp-day__sub"><div><span>{n}</span><span>{v}</span></div><div className="lp-day__track" style={{ "--w": `${v}%` }}><i /></div></div>
              ))}
              <div className="lp-day__toast">★ Results published · report cards ready</div>
            </div>

            <div className={`lp-day__scr${on(4)}`}>
              <div className="lp-day__chat">
                <div className="lp-day__b is-me" style={{ "--i": 0 }}>Solve 2x + 3 = 11. I don't get the steps.</div>
                <div className="lp-day__b is-ai" style={{ "--i": 1 }}>Take 3 away from both sides: 2x = 8.<br />Divide both sides by 2: x = 4.<br />Check: 2 × 4 + 3 = 11 ✓</div>
                <div className="lp-day__b is-me" style={{ "--i": 2 }}>Why do we subtract 3 first?</div>
                <div className="lp-day__b is-ai" style={{ "--i": 3 }}>Because the 3 is added to 2x. Undo it first, then divide.</div>
              </div>
              <div className="lp-day__input"><Mic size={16} /><span>Ask by typing or by voice</span><Send size={16} /></div>
            </div>
          </div>
          {STEPS.map((s, k) => <span key={s.chip} className={`lp-day__float${on(k)}`}><i />{s.chip}</span>)}
        </div>
      </div>
    </section>
  );
}

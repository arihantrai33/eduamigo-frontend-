import { useEffect, useRef, useState } from "react";
import { Mic, Send, Sparkles } from "lucide-react";

// A sample conversation that plays itself: the student types a question, the tutor "thinks", then its answer is written out
// word by word. It starts when it scrolls into view, pauses off screen, repeats, and shows the whole chat at once under reduced motion.
const SCRIPT = [
  ["me", "Solve 2x + 3 = 11. I don't get the steps."],
  ["ai", "Let's do it one step at a time. We want x alone.\n1. Take 3 away from both sides: 2x = 8\n2. Divide both sides by 2: x = 4\n3. Check: 2 × 4 + 3 = 11 ✓"],
  ["me", "Why do we subtract 3 first?"],
  ["ai", "Because the 3 is added to 2x. Undoing it first leaves 2x on its own, and then dividing by 2 gives x."],
];
const ALT = "Sample conversation: a student asks how to solve an equation and the tutor explains it step by step";

export default function AiDemo() {
  const box = useRef(null);
  const body = useRef(null);
  const [live, setLive] = useState(false); // on screen
  const [reduce] = useState(() => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const [done, setDone] = useState([]);    // finished messages
  const [typing, setTyping] = useState(null); // { who, text } being written
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");  // text typed into the input before it is sent

  useEffect(() => {
    const el = box.current;
    if (!el || reduce || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  useEffect(() => {
    if (reduce || !live) return undefined;
    let dead = false;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (!dead) {
        setDone([]); setTyping(null); setDraft("");
        await wait(500);
        for (const [who, text] of SCRIPT) {
          if (dead) return;
          if (who === "me") {
            for (let i = 1; i <= text.length && !dead; i++) { setDraft(text.slice(0, i)); await wait(30); }
            await wait(350);
            setDraft(""); setDone((d) => [...d, { who, text }]);
          } else {
            setThinking(true); await wait(1100); setThinking(false);
            const words = text.split(/(?<=\s)/);
            let out = "";
            for (const w of words) { if (dead) return; out += w; setTyping({ who, text: out }); await wait(45); }
            setTyping(null); setDone((d) => [...d, { who, text }]);
          }
          await wait(650);
        }
        await wait(4200);
      }
    })();
    return () => { dead = true; };
  }, [live, reduce]);

  useEffect(() => { const b = body.current; if (b) b.scrollTop = b.scrollHeight; }, [done, typing, thinking]);

  const shown = reduce ? SCRIPT.map(([who, text]) => ({ who, text })) : done;
  return (
    <div className="lp-chat" ref={box} role="img" aria-label={ALT}>
      <div aria-hidden="true" style={{ display: "contents" }}>
        <div className="lp-chat__head"><span className="lp-chat__dot"><Sparkles size={16} /></span> Learning AI · Mathematics <em>online</em></div>
        <div className="lp-chat__body" ref={body}>
          {shown.map((m, i) => <div key={i} className={`lp-msg lp-msg--${m.who}`}>{m.text}</div>)}
          {typing && <div className="lp-msg lp-msg--ai is-typing">{typing.text}</div>}
          {thinking && <div className="lp-msg lp-msg--ai lp-dots"><i /><i /><i /></div>}
        </div>
        <div className="lp-chat__foot"><Mic size={16} /><span className={draft ? "is-draft" : ""}>{draft || "Ask by typing or by voice"}</span><Send size={16} className="lp-chat__send" /></div>
      </div>
    </div>
  );
}

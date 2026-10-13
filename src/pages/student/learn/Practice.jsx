import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, CircleDot, Lightbulb, Eye, RefreshCw, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { learningApi } from "./api";
import { toast, errorMessage } from "../../../utils/toast";

// Practice & Assessment: practice sets whose answer keys were checked before they are shown, marked fairly, with a hint
// after a wrong try and the solution after a right one (or on request). Practice only, not a school assessment.

const LEVELS = [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]];
const FORMATS = [["mcq", "Multiple choice"], ["numeric", "Numerical"], ["short", "Short answer"]];
const VERDICT = { correct: ["Correct", CheckCircle2], partly: ["Partly right", CircleDot], incorrect: ["Not quite", XCircle], revealed: ["Solution shown", Eye] };

function Question({ q, n, sessionId, onDone }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(q.last ? { verdict: q.last.verdict, feedback: q.last.feedback, answer: q.answer, solution: q.solution } : null);
  const [busy, setBusy] = useState(false);
  const finished = result && (result.verdict === "correct" || result.verdict === "revealed" || result.solution);

  async function check() {
    if (!answer.trim()) return toast.error("Write or choose an answer first");
    setBusy(true);
    try {
      const r = await learningApi.post(`/practice/${sessionId}/answer`, { questionId: q.id, answer });
      setResult(r);
      onDone(r.summary);
    } catch (err) { toast.error(errorMessage(err, "Could not check the answer")); }
    setBusy(false);
  }
  async function reveal() {
    setBusy(true);
    try {
      const r = await learningApi.post(`/practice/${sessionId}/reveal`, { questionId: q.id });
      setResult({ verdict: "revealed", answer: r.answer, solution: r.solution, points: r.points });
      onDone(r.summary);
    } catch (err) { toast.error(errorMessage(err, "Could not show the solution")); }
    setBusy(false);
  }

  const [label, Icon] = result ? VERDICT[result.verdict] || VERDICT.incorrect : [];
  return (
    <li className="ea-learn__q">
      <p className="ea-learn__q-head"><strong>Q{n}.</strong> <span className="ea-learn__muted">{q.topic ? `${q.topic} · ` : ""}{q.difficulty}</span></p>
      <div className="ea-learn__q-text"><ReactMarkdown skipHtml>{q.prompt}</ReactMarkdown></div>
      {!finished && (q.format === "mcq" ? (
        <fieldset className="ea-learn__options">
          <legend className="ea-sr-only">Choose one answer for question {n}</legend>
          {q.options.map((o, i) => (
            <label key={o} className={`ea-learn__option${answer === o ? " is-on" : ""}`}>
              <input type="radio" name={`q-${q.id}`} value={o} checked={answer === o} onChange={() => setAnswer(o)} />
              <span><strong>{"ABCD"[i]}.</strong> {o}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <label className="ea-learn__field-block">
          <span className="ea-sr-only">Your answer to question {n}</span>
          {q.format === "short"
            ? <textarea className="ea-input" rows={2} value={answer} maxLength={2000} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer in your own words" />
            : <input className="ea-input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer, e.g. 12, 3/4 or 0.75" inputMode="decimal" />}
        </label>
      ))}
      {result && (
        <div className={`ea-learn__verdict is-${result.verdict}`} role="status">
          <p><Icon size={16} aria-hidden="true" /> <strong>{label}</strong>{result.feedback && result.verdict !== "revealed" ? ` · ${result.feedback}` : ""}</p>
          {result.hint && !finished && <p><Lightbulb size={14} aria-hidden="true" /> Hint: {result.hint}</p>}
          {result.answer && <p><strong>Answer:</strong> {result.answer}</p>}
          {result.points?.length > 0 && <p className="ea-learn__muted">A full answer mentions: {result.points.join("; ")}</p>}
          {result.solution && <div className="ea-learn__solution"><ReactMarkdown skipHtml>{result.solution}</ReactMarkdown></div>}
        </div>
      )}
      {!finished && (
        <div className="ea-learn__row">
          <button type="button" className="ea-btn ea-btn--primary" disabled={busy} onClick={check}>{busy ? "Checking…" : result ? "Try again" : "Check answer"}</button>
          <button type="button" className="ea-btn ea-btn--ghost" disabled={busy} onClick={reveal}><Eye size={15} aria-hidden="true" /> Show solution</button>
        </div>
      )}
    </li>
  );
}

export default function Practice({ context, preset }) {
  const [form, setForm] = useState({ subject: preset?.subject || "", topic: preset?.topic || "", difficulty: "medium", count: 5, formats: ["mcq", "numeric", "short"] });
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { learningApi.get("/practice").then(setRecent).catch(() => setRecent([])); }, [session]);

  async function create(extra = {}) {
    const body = { ...form, ...extra };
    if (!body.subject.trim() && extra.focus !== "weak") return toast.error("Choose or type a subject");
    if (!body.formats.length) return toast.error("Choose at least one question type");
    setBusy(true);
    try {
      const s = await learningApi.post("/practice", body);
      setSession(s);
      setSummary(s.summary);
      if (s.dropped) toast.info(`${s.dropped} generated question${s.dropped === 1 ? "" : "s"} did not pass the answer checks and ${s.dropped === 1 ? "was" : "were"} left out.`);
    } catch (err) { toast.error(errorMessage(err, "Could not make a practice set")); }
    setBusy(false);
  }
  async function open(id) {
    try { const s = await learningApi.get(`/practice/${id}`); setSession(s); setSummary(s.summary); } catch (err) { toast.error(errorMessage(err, "Could not open the set")); }
  }
  const toggleFormat = (f) => setForm((p) => ({ ...p, formats: p.formats.includes(f) ? p.formats.filter((x) => x !== f) : [...p.formats, f] }));

  if (session) {
    const done = summary && summary.answered === summary.total;
    return (
      <section className="ea-learn__practice" aria-label="Practice set">
        <div className="ea-learn__toolbar">
          <div><strong>{session.subject}{session.topic ? `: ${session.topic}` : ""}</strong> <span className="ea-learn__muted">· {session.difficulty} · practice, not graded by the school</span></div>
          <span className="ea-learn__spacer" />
          <button type="button" className="ea-btn ea-btn--ghost" onClick={() => setSession(null)}>New set</button>
        </div>
        {session.usedMaterial?.length > 0 && <p className="ea-learn__muted">Based on your school material: {session.usedMaterial.map((m) => m.title).join(", ")}.</p>}
        <ol className="ea-learn__questions">
          {session.questions.map((q, i) => <Question key={q.id} q={q} n={i + 1} sessionId={session._id} onDone={setSummary} />)}
        </ol>
        {summary && (
          <div className="ea-card ea-learn__summary" role="status">
            <p><strong>Score: {summary.score} / {summary.marked || 0}</strong> marked · {summary.answered} of {summary.total} answered</p>
            {done && (
              <div className="ea-learn__row">
                <span>{summary.nextDifficulty !== session.difficulty ? `Next time try ${summary.nextDifficulty}.` : "Stay at this level for one more set."}</span>
                <button type="button" className="ea-btn ea-btn--primary" disabled={busy} onClick={() => create({ subject: session.subject, topic: session.topic, difficulty: summary.nextDifficulty })}>
                  <RefreshCw size={15} aria-hidden="true" /> New {summary.nextDifficulty} set
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="ea-learn__practice" aria-label="Practice & Assessment">
      <form className="ea-card ea-learn__form" onSubmit={(e) => { e.preventDefault(); create(); }}>
        <div className="ea-learn__grid">
          <label className="ea-learn__field-block">Subject
            <input className="ea-input" list="ea-learn-subjects" value={form.subject} maxLength={40} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
            <datalist id="ea-learn-subjects">{(context?.subjects || []).map((s) => <option key={s} value={s} />)}</datalist>
          </label>
          <label className="ea-learn__field-block">Topic or chapter
            <input className="ea-input" value={form.topic} maxLength={80} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Fractions" />
          </label>
          <label className="ea-learn__field-block">Difficulty
            <select className="ea-select" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="ea-learn__field-block">Questions
            <select className="ea-select" value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}>
              {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <fieldset className="ea-learn__formats">
          <legend>Question types</legend>
          {FORMATS.map(([v, l]) => (
            <label key={v}><input type="checkbox" checked={form.formats.includes(v)} onChange={() => toggleFormat(v)} /> {l}</label>
          ))}
        </fieldset>
        <div className="ea-learn__row">
          <button type="submit" className="ea-btn ea-btn--primary" disabled={busy}>{busy ? "Preparing and checking questions…" : "Start practice"}</button>
          <button type="button" className="ea-btn ea-btn--ghost" disabled={busy} onClick={() => create({ focus: "weak" })}><Target size={15} aria-hidden="true" /> Practise my weak topics</button>
        </div>
        <p className="ea-learn__muted">Every answer key is checked before you see the questions. This is practice only, not a school test.</p>
      </form>
      {recent.length > 0 && (
        <div className="ea-card">
          <p className="ea-card__title">Recent practice</p>
          <ul className="ea-learn__list">
            {recent.map((s) => (
              <li key={s._id}>
                <button type="button" className="ea-learn__history-item" onClick={() => open(s._id)}>
                  <span>{s.subject}{s.topic ? `: ${s.topic}` : ""} <span className="ea-learn__muted">({s.difficulty})</span></span>
                  <span className="ea-learn__muted">{s.summary.score} / {s.summary.marked} · {s.summary.answered} of {s.summary.total} answered</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Calendar day in the school's timezone, as YYYY-MM-DD, so "today" matches the exam date.
const dayKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(d));
const examDay = (d) => new Date(d).toISOString().slice(0, 10); // exam dates are stored as UTC midnight

function whenLabel(date) {
  const diff = Math.round((new Date(examDay(date)) - new Date(dayKey(Date.now()))) / 864e5);
  if (diff === 0) return { text: "Today", color: "#B91C1C", bg: "#FEE2E2" };
  if (diff === 1) return { text: "Tomorrow", color: "#B45309", bg: "#FEF3C7" };
  if (diff <= 7) return { text: `In ${diff} days`, color: "var(--brand-dark)", bg: "var(--brand-soft)" };
  return null;
}

// Next exams for the signed-in student, or the selected child for a parent (the server limits the list to their class).
export default function UpcomingExams({ query = "", limit = 4, reloadKey }) {
  const [exams, setExams] = useState(null);

  useEffect(() => {
    let alive = true;
    axios.get(`${API}/exams${query}`, auth())
      .then((res) => {
        if (!alive) return;
        const today = dayKey(Date.now());
        const list = (res.data.data || [])
          .filter((e) => e.date && examDay(e.date) >= today)
          .sort((a, b) => examDay(a.date).localeCompare(examDay(b.date)) || String(a.startTime || "").localeCompare(String(b.startTime || "")));
        setExams(list);
      })
      .catch(() => alive && setExams([]));
    return () => { alive = false; };
  }, [query, reloadKey]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Upcoming Exams</h3>
        {exams?.length > limit && <span style={{ fontSize: 12, color: "var(--subtext)" }}>{exams.length} scheduled</span>}
      </div>
      <div style={{ background: "var(--card)", borderRadius: 14, padding: "4px 12px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {exams === null ? (
          <div style={{ padding: "16px 0", textAlign: "center", color: "var(--subtext)", fontSize: 13 }}>Loading...</div>
        ) : exams.length === 0 ? (
          <div style={{ padding: "16px 0", textAlign: "center", color: "var(--subtext)", fontSize: 13 }}>No upcoming exams</div>
        ) : (
          exams.slice(0, limit).map((e, i, arr) => {
            const d = new Date(e.date);
            const tag = whenLabel(e.date);
            return (
              <div key={e._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border, #f0f0f0)" : "none" }}>
                <div style={{ minWidth: 46, textAlign: "center", borderRadius: 10, background: "var(--bg)", padding: "5px 4px" }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", lineHeight: 1.1 }}>{d.getUTCDate()}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--subtext)", textTransform: "uppercase" }}>
                    {d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{e.subject}</div>
                  <div style={{ fontSize: 11, color: "var(--subtext)", marginTop: 2 }}>
                    {[e.title !== e.subject ? e.title : e.examType, e.startTime ? `${e.startTime}${e.endTime ? `–${e.endTime}` : ""}` : null, e.venue, e.totalMarks ? `${e.totalMarks} marks` : null].filter(Boolean).join(" • ")}
                  </div>
                  {e.instructions && <div style={{ fontSize: 11, color: "var(--subtext)", marginTop: 3, fontStyle: "italic" }}>{e.instructions}</div>}
                </div>
                {tag && <span style={{ fontSize: 10, fontWeight: 700, color: tag.color, background: tag.bg, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{tag.text}</span>}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

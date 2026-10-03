import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

// Accurate help for each portal, plus the school's real contact details.
const FAQ = {
  student: [
    { q: "How do I apply for leave?", a: "Open Apply Leave, choose the dates and reason, and submit. Your parent is notified and your class teacher reviews it." },
    { q: "Where are my notes?", a: "Open Notes. Your teachers' uploads for your class appear there; tap the download button to open a file." },
    { q: "How does Revise with AI work?", a: "It answers only from your class notes uploaded by your teachers. Use Explain for revision or Quiz me to test yourself." },
    { q: "How do I pay fees?", a: "Fee Status shows what is due. Online payment is not available yet; please pay at the school office and your receipt will appear here." },
    { q: "The bus map is not moving", a: "The location updates only while the driver's trip is active. Check your internet connection and reopen the page." },
    { q: "How do I change my password?", a: "Open Profile, then Settings, then Change Password." },
  ],
  teacher: [
    { q: "How do I mark attendance?", a: "Open Attendance, choose your class and date, set each student's status and save. Saving again updates the same day." },
    { q: "How do I publish marks?", a: "Open Enter Marks, choose class, subject and exam, enter marks and save as draft. Publish when ready; students and parents are notified and marks are locked." },
    { q: "Why is my note not in AI revision yet?", a: "Uploads are processed every few minutes. Scanned PDFs without text cannot be used; upload a typed PDF instead." },
    { q: "I cannot see a class", a: "Only classes assigned to you by the school administrator are shown. Ask the administrator to assign the class." },
    { q: "How do I change my password?", a: "Open Profile, then Settings, then Change Password." },
  ],
  parent: [
    { q: "I have more than one child in the school", a: "All linked children appear in the app. If a child is missing, ask the school office to link them to your account." },
    { q: "How do I apply for leave for my child?", a: "Open Apply Leave, choose the dates and reason, and submit. The class teacher reviews it and you are notified." },
    { q: "How do I pay fees?", a: "Online payment is not available yet. Please pay at the school office; the payment and receipt number appear in Fees." },
    { q: "What does SOS do?", a: "It immediately alerts the school administrators with the bus details. For emergencies, also call the school or 112." },
    { q: "How do I change my password?", a: "Open Profile, then Change Password." },
  ],
};

export default function SupportContent({ role = "student", dark = false }) {
  const [school, setSchool] = useState(null);

  useEffect(() => {
    fetch(`${API}/schools/me`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.json())
      .then((d) => { if (d?.success) setSchool(d.data); })
      .catch(() => {});
  }, []);

  const card = { background: dark ? "#16213e" : "white", borderRadius: "14px", padding: "16px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };
  const btn = { flex: 1, textAlign: "center", textDecoration: "none", background: "var(--brand-gradient)", color: "white", borderRadius: "12px", padding: "12px", fontWeight: "700", fontSize: "14px" };

  return (
    <>
      {(FAQ[role] || FAQ.student).map((faq) => (
        <div key={faq.q} style={card}>
          <div style={{ fontWeight: "700", fontSize: "14px", color: dark ? "#f1f1f1" : "#111", marginBottom: "6px" }}>{faq.q}</div>
          <div style={{ fontSize: "13px", color: dark ? "#bbb" : "#555", lineHeight: 1.6 }}>{faq.a}</div>
        </div>
      ))}
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px", color: dark ? "#f1f1f1" : "#111" }}>Still need help?</div>
        <div style={{ fontSize: "13px", color: dark ? "#aaa" : "#777", marginBottom: "12px" }}>
          {school ? `Contact ${school.name}` : "Contact your school office"}
          {school?.address ? ` • ${school.address}` : ""}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {school?.phone && <a href={`tel:${school.phone}`} style={btn}>Call school</a>}
          {school?.email && <a href={`mailto:${school.email}`} style={{ ...btn, background: "var(--brand-soft)", color: "var(--brand-dark)" }}>Email</a>}
        </div>
        {school && !school.phone && !school.email && (
          <div style={{ fontSize: 12, color: dark ? "#aaa" : "#888" }}>Your school has not added contact details yet.</div>
        )}
      </div>
    </>
  );
}

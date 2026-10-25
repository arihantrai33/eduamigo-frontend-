import { useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import "./landing.css";

// A plain description of how the product handles data today, written from how it actually works. It is not a legal policy: the
// banner says so, and the formal policy and terms of use (which need a lawyer and company details) replace it before general launch.
const SECTIONS = [
  ["Whose data this is", "A school using EduAmigo owns its records: students, parents, staff, attendance, marks, fees and notices. EduAmigo stores and processes them on the school's behalf. A school's records are kept apart from every other school's, and people can only open what their role in their own school allows."],
  ["What is stored", "Student, parent and staff details the school enters; attendance, marks, fees and receipts; messages and notices; uploaded study material and photos; the school bus location while a trip is running; and sign-in details. Passwords are stored only as one-way hashes and cannot be read back."],
  ["Who can see it", "Only signed-in people of the same school, and only the parts their role allows. A parent sees their own children; a student sees themselves; a teacher sees their assigned classes; office staff see what the school's administrator gave them. Changes to roles and other sensitive actions are recorded in a log the school can read. EduAmigo support can open a school only in a marked support session, and what is done in it is logged."],
  ["The AI features", "When someone asks the school assistant or the learning companion a question, the question and the school facts needed to answer it are sent to the AI provider the school's plan is configured with. The assistant answers a person only from records they are allowed to see. Stored copies of questions have email addresses, phone numbers and long ID numbers removed."],
  ["Services that help run EduAmigo", "Records are kept in a managed MongoDB database. Images and documents may be stored with a file-hosting service, notifications are sent through Firebase, and online fee payment, where a school switches it on, goes through the school's own Razorpay account. Each is used only for the purpose named."],
  ["Demo requests", "If you ask for a demo, the details you type into the form are kept so we can reply. They are not shown to schools or other visitors."],
  ["What is not decided yet", "How long records are kept after a school leaves, how a school exports or deletes its data, and the formal contact for data requests are not yet fixed. Until they are, please ask your school's administrator, who is the first point of contact for any request about your own or your child's data."],
];

export default function Privacy() {
  useEffect(() => { document.title = "Privacy and data handling | EduAmigo"; }, []);
  return (
    <div className="lp" id="top">
      <header className="lp-nav"><div className="lp-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64 }}>
        <Link className="lp-brand" to="/welcome"><span className="lp-brand__mark"><GraduationCap size={20} aria-hidden /></span>EduAmigo</Link>
        <Link to="/login" className="lp-btn lp-btn--ghost">Sign in</Link>
      </div></header>
      <main id="main" className="lp-wrap" style={{ maxWidth: 760, paddingBlock: "48px 72px" }}>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 38px)", lineHeight: 1.15, color: "var(--lp-ink)", margin: "0 0 12px" }}>Privacy and data handling</h1>
        <p role="note" style={{ background: "var(--lp-tint)", border: "1px solid var(--lp-line)", borderRadius: 12, padding: "12px 16px", fontSize: 14.5, color: "var(--lp-text)", margin: "0 0 28px" }}>
          This page explains in plain words how EduAmigo handles data today. It is not yet the formal privacy policy or terms of use; those will replace it before general launch.
        </p>
        {SECTIONS.map(([title, text]) => (
          <section key={title} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 19, color: "var(--lp-ink)", margin: "0 0 6px" }}>{title}</h2>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--lp-text)", margin: 0 }}>{text}</p>
          </section>
        ))}
        <p style={{ marginTop: 32 }}><Link to="/welcome">Back to the website</Link></p>
      </main>
    </div>
  );
}

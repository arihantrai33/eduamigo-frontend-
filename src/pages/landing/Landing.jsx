import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BarChart3, Bell, BookOpen, Briefcase, Bus, CalendarCheck, Check, ChevronDown, ClipboardCheck, GraduationCap, IdCard,
  KeyRound, Layers, LineChart, UserCog, Library, Menu, MessageCircle, Mic, PhoneCall, ScrollText, ShieldCheck, Smartphone, Sparkles, UserPlus, Users, Wallet, X, XCircle,
} from "lucide-react";
import "./landing.css";
import DemoForm from "./DemoForm";
import { AdminWindow, PhoneBus } from "./Mockups";
import AiDemo from "./AiDemo";
import DayInSchool from "./DayInSchool";
import AiTutorArt from "../student/learn/AiTutorArt";

const TITLE = "EduAmigo: Less paperwork, more teaching | School ERP and AI learning";
const DESCRIPTION = "EduAmigo brings attendance, fees, results, notices, school bus tracking and an AI study companion together for school staff, teachers, parents and students.";

const NAV = [["Why EduAmigo", "#why"], ["What you get", "#features"], ["AI learning", "#ai"], ["How it works", "#start"], ["FAQ", "#faq"]];

// Everything that is in the product today, grouped the way a school thinks about it.
const GROUPS = [
  { icon: BookOpen, tone: "#4f46e5", title: "Academics", tag: "Teachers and the office", points: ["Attendance for a class in one screen", "Timetable for every class and teacher", "Exam schedule, marks entry and report cards", "Study notes and assignments shared with the class", "Classes, sections, subjects and a school year setup guide"] },
  { icon: Wallet, tone: "#059669", title: "Fees and money", tag: "Office and accountant", points: ["Fee structures per class, billed in one click", "Collect fees, print receipts, see what is due", "Fee reports by class and month", "Parents can pay online where the school enables it"] },
  { icon: MessageCircle, tone: "#0284c7", title: "Communication", tag: "Everyone", points: ["Notices, circulars and an event calendar", "Notifications for attendance, results and fees", "Chat between parents, teachers and the office", "Announcements from EduAmigo for your office", "Help and support requests, with replies"] },
  { icon: Bus, tone: "#d97706", title: "Transport and safety", tag: "Parents, drivers, office", points: ["Live bus map with stops and arrival times", "A simple screen for the driver's phone", "Bus routes, stops and which student rides which bus", "A safety alert button for parents and students", "Alerts reach the school office inbox"] },
  { icon: UserPlus, tone: "#7c3aed", title: "Records and admissions", tag: "The school office", points: ["Admission enquiries to enrolled student", "Student, parent and teacher profiles", "ID cards and transfer certificates", "Bulk upload and year-end promotion", "Library catalogue and issue records"] },
  { icon: Sparkles, tone: "#db2777", title: "Learning AI", tag: "Students and parents", points: ["AI tutor that explains step by step, with a voice option", "Practice questions and a revision planner", "Uses the notes your teachers upload", "EduAmigo Ask answers questions about school records", "Hindi, English and Hinglish"] },
  { icon: UserCog, tone: "#0d9488", title: "Staff and HR", tag: "Principal and office", points: ["Teacher and office staff profiles", "Teaching assignments by class and subject", "Monthly salary records, generated in one click", "Salary paid and pending at a glance", "Staff leave requests with approval"] },
  { icon: LineChart, tone: "#2563eb", title: "Reports and insights", tag: "Principal and owner", points: ["School overview: students, teachers, parents and buses", "Attendance reports: overall rate, present, absent and late", "Fee collection reports by class and month", "What parents and staff ask EduAmigo Ask", "AI usage and limits, so you control the cost"] },
  { icon: KeyRound, tone: "#475569", title: "Control and trust", tag: "Principal and owner", points: ["Roles you can shape: principal, accountant, front office and more", "Each person sees only what their role allows", "A log of who changed what, and when", "Every school's data kept separate from other schools", "Your school's name, logo and colours in the app"] },
];

const BEFORE_AFTER = [
  ["Attendance on paper registers", "Marked on a phone in seconds, visible to parents the same day"],
  ["Parents phone the office for fee, result and bus questions", "Parents open the app and see it themselves"],
  ["Fee receipts written by hand, dues in a notebook", "Receipts printed, dues listed by student and class"],
  ["Notices lost in WhatsApp groups", "One notice board with notifications, and a record of what was sent"],
  ["Different registers for students, fees and results", "One student record that feeds attendance, fees and report cards"],
  ["Nobody knows who changed a mark or a fee", "An activity log shows who changed what"],
];

const WHO_GAINS = [
  [Briefcase, "Principal and owner", "See fees collected, attendance today and pending leave on one page, and decide who in your office can do what."],
  [ClipboardCheck, "Teachers", "Attendance, marks and notes from a phone, without copying the same data into three registers."],
  [Users, "Parents", "Attendance, results, fee dues and the bus on the map, with no phone calls to the office."],
  [GraduationCap, "Students", "Timetable, notes, results and an AI tutor that answers doubts at any hour."],
];

const TONES = { "Principal and owner": "#4f46e5", Teachers: "#0d9488", Parents: "#d97706", Students: "#db2777" };

const MARQUEE = [[CalendarCheck, "Attendance"], [Wallet, "Fees and receipts"], [BarChart3, "Results and report cards"], [Bus, "Live bus tracking"], [Bell, "Notices"], [MessageCircle, "Parent-teacher chat"], [Sparkles, "AI study companion"], [Mic, "Voice learning"], [IdCard, "ID cards and certificates"], [Library, "Library"], [KeyRound, "Roles and permissions"], [Smartphone, "Installable on phones"]];
const ROTATE = ["attendance.", "fee collection.", "report cards.", "the school bus.", "notices to parents.", "doubts at night."];

// The word that changes in the hero. The sentence is complete without it, and it stays still under reduced motion.
function Rotator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % ROTATE.length), 2400);
    return () => clearInterval(t);
  }, []);
  return <b className="lp-rotor" key={i}>{ROTATE[i]}</b>;
}

const AI_POINTS = [
  "Learning AI explains a topic step by step, with a voice option, and can create practice questions and a revision plan.",
  "Answers can draw on the notes a teacher has uploaded for the class.",
  "EduAmigo Ask lets staff and parents ask questions about school records in plain language, such as fees, attendance or timetable.",
  "Ask follows the signed-in person's permissions. It does not change fees or attendance; the only thing it can do is raise a request for the school office.",
];

const STEPS = [
  { title: "Request a demo", text: "Tell us about your school. We will show you how EduAmigo works for your staff, parents and students." },
  { title: "Your school is set up", text: "Your school gets its own space with its name, logo and colours, and the modules that suit it." },
  { title: "Everyone signs in", text: "Staff, parents and students sign in with the school's code. The app works in the browser and can be installed on a phone." },
];

const FAQ = [
  ["Who is EduAmigo for?", "Schools that want one system for administration, teaching, parent communication and student learning. Everyone signs in to the same app and sees the screens that suit their role, and bus drivers have a simple screen for the trip."],
  ["Does it work on phones?", "Yes. EduAmigo works in a mobile or desktop browser and can be installed on a phone like an app. The layout adapts to the screen, so parents can use it on the phone they already have."],
  ["Can parents pay fees online?", "Where the school switches it on. Each school connects its own Razorpay account, and payments are recorded against the student's fee automatically. Schools that prefer can keep recording payments at the office."],
  ["How does bus tracking work?", "The driver opens the driver screen on a phone and shares the bus location during the trip. Parents and students see the bus on a map, the stops in order and an estimated arrival time. It needs a phone with GPS and an internet connection on the bus."],
  ["Can one school see another school's data?", "No. Every school's data is kept separate, and every request is checked against the signed-in person's school and role on the server."],
  ["Is the AI safe for students?", "Learning AI is meant to help with study. Like any AI, it can make mistakes, so teachers and textbooks remain the reference. The school assistant only reads what the signed-in person is allowed to see."],
  ["Can we decide who in our office can do what?", "Yes. The principal or owner can give each person a role, for example front office, fee collector or accountant, and choose what that role can see and change. Ready-made templates make it quick to start."],
  ["What if we need help?", "Ask from inside the app (Help and support) and follow the replies there. EduAmigo can also post announcements, such as planned maintenance, on your office dashboard."],
  ["How much does it cost?", "Pricing depends on the modules and the size of the school, so we do not publish a single price. Request a demo and we will share the details with you."],
];

function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!root || reduce || !("IntersectionObserver" in window)) return undefined;
    root.classList.add("is-motion");
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => { io.disconnect(); root.classList.remove("is-motion"); };
  }, [rootRef]);
}

// Title and description belong to this page only; they are put back when the visitor moves on.
function usePageMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    let tag = document.querySelector('meta[name="description"]');
    const prevDesc = tag?.getAttribute("content");
    if (!tag) { tag = document.createElement("meta"); tag.setAttribute("name", "description"); document.head.appendChild(tag); }
    document.title = TITLE;
    tag.setAttribute("content", DESCRIPTION);
    return () => { document.title = prevTitle; if (prevDesc != null) tag.setAttribute("content", prevDesc); };
  }, []);
}

function Header() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const burger = useRef(null);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); burger.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`lp-header${stuck ? " is-stuck" : ""}`}>
      <div className="lp-wrap">
        <nav className="lp-nav" aria-label="Main">
          <a className="lp-brand" href="#top" aria-label="EduAmigo, back to the top">
            <span className="lp-brand__mark"><GraduationCap size={20} aria-hidden /></span>EduAmigo
          </a>
          <div className="lp-links">{NAV.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div>
          <div className="lp-actions">
            <Link className="lp-btn lp-btn--ghost lp-btn--sm" to="/login">Sign in</Link>
            <a className="lp-btn lp-btn--primary lp-btn--sm" href="#demo">Request a demo</a>
          </div>
          <button ref={burger} type="button" className="lp-burger" aria-expanded={open} aria-controls="lp-drawer" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </nav>
      </div>
      {open && (
        <div id="lp-drawer" className="lp-drawer">
          {NAV.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
          <a className="lp-btn lp-btn--primary" href="#demo" onClick={() => setOpen(false)}>Request a demo</a>
          <Link className="lp-btn lp-btn--ghost" to="/login">Sign in</Link>
        </div>
      )}
    </header>
  );
}

export default function Landing() {
  const root = useRef(null);
  useReveal(root);
  usePageMeta();
  // A link such as /welcome#demo: the page loads after the browser has already tried to scroll to the anchor.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, []);

  return (
    <div className="lp" ref={root} id="top">
      <a className="lp-skip" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="lp-hero__bg" aria-hidden="true"><i className="lp-orb lp-orb--a" /><i className="lp-orb lp-orb--b" /><i className="lp-orb lp-orb--c" /></div>
          <div className="lp-wrap lp-hero__grid">
            <div>
              <span className="lp-hero__badge"><b><Sparkles size={13} aria-hidden /></b>School ERP and AI learning for Indian schools</span>
              <h1 className="lp-h1" id="hero-title">Less paperwork. <em>More teaching.</em></h1>
              <p className="lp-hero__rotor" aria-live="off">EduAmigo takes care of <Rotator /></p>
              <p className="lp-hero__lead">Attendance, fees, results, notices, the school bus and an AI study companion, together in one app for the school office, teachers, parents and students.</p>
              <div className="lp-cta">
                <a className="lp-btn lp-btn--primary" href="#demo">Request a demo <ArrowRight size={18} aria-hidden /></a>
                <Link className="lp-btn lp-btn--ghost" to="/login">Sign in to your school</Link>
              </div>
              <ul className="lp-hero__note">
                <li><Check size={16} aria-hidden />Works in any modern browser</li>
                <li><Check size={16} aria-hidden />Installable on a phone</li>
                <li><Check size={16} aria-hidden />Roles you can shape</li>
              </ul>
            </div>
            <figure className="lp-shot lp-hero__visual">
              <AdminWindow />
              <PhoneBus />
              <figcaption>Sample data, not real figures.</figcaption>
            </figure>
          </div>
        </section>

        <div className="lp-marquee" aria-hidden="true">
          <div className="lp-marquee__track">
            {[0, 1].map((k) => <ul key={k}>{MARQUEE.map(([Icon, label]) => <li key={label + k}><Icon size={16} />{label}</li>)}</ul>)}
          </div>
        </div>

        <section className="lp-section" id="why" aria-labelledby="why-title">
          <div className="lp-wrap">
            <div className="lp-head lp-head--center" data-reveal>
              <span className="lp-eyebrow">Why EduAmigo</span>
              <h2 className="lp-h2" id="why-title">What changes on a Monday morning</h2>
              <p className="lp-lead">The same school, with the daily chasing taken out.</p>
            </div>
            <div className="lp-compare">
              <div className="lp-compare__head"><span>Today</span><span>With EduAmigo</span></div>
              {BEFORE_AFTER.map(([a, b]) => (
                <div key={a} className="lp-compare__row" data-reveal><p><XCircle size={18} aria-hidden />{a}</p><p><Check size={18} aria-hidden />{b}</p></div>
              ))}
            </div>
            <h3 className="lp-sub-h" data-reveal>What each person gains</h3>
            <ul className="lp-cards lp-cards--4">
              {WHO_GAINS.map(([Icon, title, text]) => (
                <li key={title} className="lp-card" data-reveal style={{ "--tone": TONES[title] }}><span className="lp-icon"><Icon size={22} aria-hidden /></span><h3>{title}</h3><p>{text}</p></li>
              ))}
            </ul>
          </div>
        </section>

        <DayInSchool />

        <section className="lp-section lp-section--soft" id="features" aria-labelledby="features-title">
          <div className="lp-wrap">
            <div className="lp-head lp-head--center" data-reveal>
              <span className="lp-eyebrow">What you get</span>
              <h2 className="lp-h2" id="features-title">Everything the school runs on, in one place</h2>
              <p className="lp-lead">Schools switch on the modules they need, so staff and parents only see what their school uses.</p>
            </div>
            <ul className="lp-groups">
              {GROUPS.map(({ icon: Icon, tone, title, tag, points }) => (
                <li key={title} className="lp-group" data-reveal style={{ "--tone": tone }}>
                  <div className="lp-group__head"><span className="lp-icon"><Icon size={22} aria-hidden /></span><div><h3>{title}</h3><small>{tag}</small></div></div>
                  <ul className="lp-ticks">{points.map((p) => <li key={p}><Check size={14} aria-hidden /><span>{p}</span></li>)}</ul>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-section lp-dark" id="ai" aria-labelledby="ai-title">
          <div className="lp-wrap lp-ai">
            <div data-reveal>
              <div className="lp-ai__logo"><span className="lp-ai__art" style={{ "--brand": "#818cf8" }}><AiTutorArt /></span><div><span className="lp-eyebrow">Learning AI</span><p className="lp-ai__name">Your school's study companion</p></div></div>
              <h2 className="lp-h2" id="ai-title">Help with studying, and quick answers about the school</h2>
              <p className="lp-lead">Students get a patient study companion. Parents and staff get plain-language answers from the school's own records.</p>
              <ul className="lp-ticks" style={{ marginTop: 24 }}>{AI_POINTS.map((p) => <li key={p}><Check size={14} aria-hidden /><span>{p}</span></li>)}</ul>
              <p className="lp-fine">AI can make mistakes. Teachers and textbooks stay the reference.</p>
            </div>
            <figure className="lp-shot" data-reveal>
              <AiDemo />
              <figcaption style={{ color: "#a5b4fc" }}>Sample conversation.</figcaption>
            </figure>
          </div>
        </section>

        <section className="lp-section lp-dark lp-trust" aria-labelledby="trust-title">
          <div className="lp-wrap">
            <div className="lp-head lp-head--center" data-reveal>
              <span className="lp-eyebrow">Trust and control</span>
              <h2 className="lp-h2" id="trust-title">Your school's data stays yours, and stays in order</h2>
            </div>
            <ul className="lp-cards lp-cards--3">
              {[
                [ShieldCheck, "Separate from other schools", "Every school has its own space. Each request is checked against the signed-in person's school and role on the server."],
                [KeyRound, "Roles you can shape", "Create roles such as front office, fee collector or principal, and choose what each can see and change. Start from ready-made templates."],
                [ScrollText, "A record of changes", "The activity log shows who changed marks, fees, students and roles, and when."],
                [Smartphone, "Parents see their own children only", "A parent's account is linked to their children and nobody else's."],
                [Layers, "You choose the modules", "Switch on only what your school uses. Add more when you are ready."],
                [PhoneCall, "Help when you need it", "Ask for help from inside the app and follow the replies. Announcements from EduAmigo appear on your dashboard."],
              ].map(([Icon, title, text]) => (
                <li key={title} className="lp-card" data-reveal><span className="lp-icon"><Icon size={22} aria-hidden /></span><h3>{title}</h3><p>{text}</p></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-section lp-section--soft" id="start" aria-labelledby="start-title">
          <div className="lp-wrap">
            <div className="lp-head lp-head--center" data-reveal>
              <span className="lp-eyebrow">How it works</span>
              <h2 className="lp-h2" id="start-title">From first conversation to first login</h2>
            </div>
            <ol className="lp-steps">
              {STEPS.map(({ title, text }) => <li key={title} className="lp-step" data-reveal><h3>{title}</h3><p>{text}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="lp-section" id="demo" aria-labelledby="demo-title">
          <div className="lp-wrap lp-demo">
            <div data-reveal>
              <span className="lp-eyebrow">Request a demo</span>
              <h2 className="lp-h2" id="demo-title">See EduAmigo with your school in mind</h2>
              <p className="lp-lead">Tell us a little about your school and what you would like to see. We will get back to you by email.</p>
              <ul className="lp-ticks" style={{ marginTop: 22 }}>
                <li><Check size={14} aria-hidden /><span>A walk-through for your office, teachers, parents and students</span></li>
                <li><Check size={14} aria-hidden /><span>Answers to your questions about modules and pricing</span></li>
              </ul>
              <p className="lp-form__note" style={{ marginTop: 22 }}>Already part of a school on EduAmigo? <Link to="/login" style={{ color: "var(--lp-brand-dark)", fontWeight: 700 }}>Sign in here</Link>.</p>
            </div>
            <div data-reveal><DemoForm /></div>
          </div>
        </section>

        <section className="lp-section lp-section--soft" id="faq" aria-labelledby="faq-title">
          <div className="lp-wrap">
            <div className="lp-head lp-head--center" data-reveal>
              <span className="lp-eyebrow">FAQ</span>
              <h2 className="lp-h2" id="faq-title">Questions schools ask us</h2>
            </div>
            <div className="lp-faq">
              {FAQ.map(([q, a]) => (
                <details key={q}><summary>{q}<ChevronDown size={20} aria-hidden /></summary><div>{a}</div></details>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="final-title">
          <div className="lp-wrap">
            <div className="lp-final" data-reveal>
              <h2 id="final-title">Bring your school's day-to-day into one app</h2>
              <p>Request a demo, or sign in if your school already uses EduAmigo.</p>
              <div className="lp-cta">
                <a className="lp-btn lp-btn--light" href="#demo">Request a demo <ArrowRight size={18} aria-hidden /></a>
                <Link className="lp-btn lp-btn--ghost" to="/login">Sign in</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer__grid">
            <div>
              <a className="lp-brand" href="#top"><span className="lp-brand__mark"><GraduationCap size={20} aria-hidden /></span>EduAmigo</a>
              <p>School ERP and AI learning for school staff, teachers, parents and students.</p>
            </div>
            <nav aria-label="Product"><h2>Product</h2><ul>{NAV.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul></nav>
            <nav aria-label="Get started"><h2>Get started</h2><ul>
              <li><a href="#demo">Request a demo</a></li>
              <li><Link to="/login">Sign in</Link></li>
              <li><Link to="/select-school">Find your school</Link></li>
            </ul></nav>
          </div>
          <small>© {new Date().getFullYear()} EduAmigo · <Link to="/privacy">Privacy and data handling</Link></small>
        </div>
      </footer>
    </div>
  );
}

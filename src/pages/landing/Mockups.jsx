import { Bus, GraduationCap, Sparkles, Mic } from "lucide-react";

// Pictures of the product, drawn in HTML. They show the kind of screen each portal has (attendance, fees, bus, results),
// use made-up names and numbers, and are always captioned "Sample data". They are not screenshots of a real school.

const Pill = ({ tone = "ok", children }) => <span className={`lp-pill lp-pill--${tone}`}>{children}</span>;
const Stat = ({ label, value, note, tone }) => (
  <div className="lp-stat"><small>{label}</small><strong>{value}</strong>{note && <em className={tone ? `lp-${tone}` : undefined}>{note}</em>}</div>
);

export function AdminWindow() {
  const bars = [78, 92, 85, 96, 64, 88];
  return (
    <div className="lp-win" role="img" aria-label="Sample admin dashboard showing attendance, fees collected and pending leave requests">
      <div className="lp-win__bar"><i /><i /><i /><span>Admin dashboard</span></div>
      <div className="lp-win__body" aria-hidden="true">
        <div className="lp-stats">
          <Stat label="Students present" value="1,142" note="Today" tone="ok" />
          <Stat label="Fees collected" value="₹ 3.2 L" note="This week" tone="ok" />
          <Stat label="Pending leaves" value="7" note="Needs review" tone="warn" />
          <Stat label="Buses on route" value="4" note="Live" tone="ok" />
        </div>
        <div className="lp-panel">
          <h4>Attendance this week</h4>
          <div className="lp-bars">{bars.map((h, i) => <span key={i} className={h < 70 ? "is-low" : ""} style={{ height: `${h}%` }} />)}</div>
          <div className="lp-days">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d}>{d}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

export function PhoneBus() {
  return (
    <div className="lp-phone" role="img" aria-label="Sample parent app showing a school bus on a live map with its arrival time">
      <div className="lp-phone__screen" aria-hidden="true">
        <div className="lp-phone__top"><span className="lp-brand__mark"><GraduationCap size={15} /></span>Live bus</div>
        <div className="lp-map">
          <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
            <path d="M-10 90 C 40 90, 50 40, 100 50 S 170 20, 215 30" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
            <path d="M-10 90 C 40 90, 50 40, 100 50 S 170 20, 215 30" fill="none" stroke="#818cf8" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
            <circle cx="52" cy="72" r="5" fill="#fff" stroke="#4f46e5" strokeWidth="2.5" />
            <circle cx="168" cy="26" r="5" fill="#fff" stroke="#4f46e5" strokeWidth="2.5" />
            <circle cx="100" cy="50" r="13" fill="#4f46e5" opacity=".18" />
            <circle cx="100" cy="50" r="8" fill="#4f46e5" />
          </svg>
          <span style={{ position: "absolute", left: "calc(50% - 6px)", top: "calc(41% - 6px)", color: "#fff", display: "grid", placeItems: "center" }}><Bus size={12} /></span>
        </div>
        <div className="lp-eta"><span>Next stop: Maple Road</span><strong>Arrives in about 6 min</strong></div>
        <div className="lp-eta"><span>Your child's stop</span><strong>Oak Street · 3 stops away</strong></div>
      </div>
    </div>
  );
}

// One panel per portal, shown by the tabs in the product section.
export function PortalPanel({ role }) {
  const panels = {
    Admin: {
      title: "Admin · Fee collection",
      body: (
        <>
          <div className="lp-stats">
            <Stat label="Collected" value="₹ 12.4 L" note="Term 2" tone="ok" />
            <Stat label="Outstanding" value="₹ 3.1 L" note="86 students" tone="warn" />
          </div>
          <div className="lp-panel">
            <h4>Recent payments</h4>
            <div className="lp-rows">
              <div className="lp-row"><span>Aarav S. · Class 7-A</span><Pill>Paid</Pill></div>
              <div className="lp-row"><span>Diya M. · Class 5-B</span><Pill>Paid</Pill></div>
              <div className="lp-row"><span>Kabir R. · Class 9-C</span><Pill tone="warn">Part paid</Pill></div>
              <div className="lp-row"><span>Isha T. · Class 3-A</span><Pill tone="bad">Overdue</Pill></div>
            </div>
          </div>
        </>
      ),
    },
    Teacher: {
      title: "Teacher · Attendance, Class 7-A",
      body: (
        <>
          <div className="lp-stats">
            <Stat label="Present" value="34" note="of 38" tone="ok" />
            <Stat label="On leave" value="2" note="Approved" />
          </div>
          <div className="lp-panel">
            <h4>Mark attendance</h4>
            <div className="lp-rows">
              <div className="lp-row"><span>Aarav S.</span><Pill>Present</Pill></div>
              <div className="lp-row"><span>Diya M.</span><Pill>Present</Pill></div>
              <div className="lp-row"><span>Kabir R.</span><Pill tone="bad">Absent</Pill></div>
              <div className="lp-row"><span>Isha T.</span><Pill tone="info">Leave</Pill></div>
            </div>
          </div>
        </>
      ),
    },
    Parent: {
      title: "Parent · My child",
      body: (
        <>
          <div className="lp-stats">
            <Stat label="Attendance" value="94%" note="This term" tone="ok" />
            <Stat label="Fee due" value="₹ 8,500" note="Pay online" tone="warn" />
          </div>
          <div className="lp-panel">
            <h4>Latest results</h4>
            <div className="lp-rows">
              {[["Mathematics", 86], ["Science", 91], ["English", 78]].map(([s, v]) => (
                <div key={s} style={{ display: "grid", gap: 6 }}>
                  <div className="lp-row"><span>{s}</span><span className="lp-ok" style={{ fontWeight: 700 }}>{v}/100</span></div>
                  <div className="lp-track"><i style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </>
      ),
    },
    Student: {
      title: "Student · Home",
      body: (
        <>
          <div className="lp-stats">
            <Stat label="Next class" value="Science" note="10:30 am" />
            <Stat label="Homework" value="2 due" note="This week" tone="warn" />
          </div>
          <div className="lp-panel">
            <h4>Today's timetable</h4>
            <div className="lp-rows">
              <div className="lp-row"><span>Mathematics</span><Pill tone="info">9:30</Pill></div>
              <div className="lp-row"><span>Science</span><Pill tone="info">10:30</Pill></div>
              <div className="lp-row"><span>English</span><Pill tone="info">11:30</Pill></div>
              <div className="lp-row"><span>Learning AI: revise Chapter 4</span><Pill>Suggested</Pill></div>
            </div>
          </div>
        </>
      ),
    },
  };
  const p = panels[role];
  return (
    <div className="lp-win" role="img" aria-label={`Sample ${role.toLowerCase()} screen: ${p.title}`}>
      <div className="lp-win__bar"><i /><i /><i /><span>{p.title}</span></div>
      <div className="lp-win__body" aria-hidden="true">{p.body}</div>
    </div>
  );
}

export function AiChat() {
  return (
    <div className="lp-chat" role="img" aria-label="Sample conversation: a student asks how to solve an equation and the tutor explains it step by step">
      <div aria-hidden="true" style={{ display: "contents" }}>
        <div className="lp-chat__head"><Sparkles size={18} color="#4f46e5" /> Learning AI · Mathematics</div>
        <div className="lp-msg lp-msg--me">Solve 2x + 3 = 11. I don't get the steps.</div>
        <div className="lp-msg lp-msg--ai">
          Let's do it one step at a time. We want x alone.
          <ol>
            <li>Take 3 away from both sides: 2x = 8</li>
            <li>Divide both sides by 2: x = 4</li>
            <li>Check: 2 × 4 + 3 = 11 ✓</li>
          </ol>
        </div>
        <div className="lp-msg lp-msg--me">Why do we subtract 3 first?</div>
        <div className="lp-chat__foot"><Mic size={16} /> Ask by typing or by voice</div>
      </div>
    </div>
  );
}

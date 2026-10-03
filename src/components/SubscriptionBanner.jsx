// Billing notice for school staff: trial ending soon, payment overdue (grace period) or read-only.
// The state comes from the server at sign-in and on every app start (user.subscription).
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const days = (n) => `${n} day${n === 1 ? "" : "s"}`;

function noticeFor(sub) {
  if (!sub) return null;
  if (sub.status === "read_only") {
    return { tone: "danger", text: "Your school's EduAmigo subscription has expired. Everyone can still view data, but changes are paused until it is renewed. Please contact EduAmigo to renew." };
  }
  if (sub.status === "past_due") {
    return { tone: "warning", text: `Your EduAmigo subscription ended on ${fmt(sub.endsAt)}. Renew within ${days(sub.daysLeft)} to avoid read-only mode.` };
  }
  if (sub.status === "trial" && sub.daysLeft != null && sub.daysLeft <= 7) {
    return { tone: "info", text: `Your free trial ends in ${days(sub.daysLeft)} (${fmt(sub.endsAt)}). Contact EduAmigo to choose a plan.` };
  }
  return null;
}

const TONES = {
  danger: { background: "#FEF2F2", border: "#FECACA", color: "#B91C1C", icon: "⛔" },
  warning: { background: "#FFFBEB", border: "#FDE68A", color: "#92400E", icon: "⚠️" },
  info: { background: "#EFF6FF", border: "#BFDBFE", color: "#1E40AF", icon: "ℹ️" },
};

export default function SubscriptionBanner({ user }) {
  const notice = noticeFor(user?.subscription);
  if (!notice) return null;
  const t = TONES[notice.tone];
  return (
    <div role="status" style={{ display: "flex", gap: 10, alignItems: "flex-start", background: t.background, border: `1px solid ${t.border}`, color: t.color, borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 13, lineHeight: 1.5, fontWeight: 500 }}>
      <span>{t.icon}</span>
      <span>{notice.text}</span>
    </div>
  );
}

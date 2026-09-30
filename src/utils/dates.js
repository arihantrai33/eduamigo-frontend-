// Today's date as YYYY-MM-DD in the user's own timezone (toISOString() uses UTC, which is
// the previous day in India before 5:30 AM).
export function todayLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

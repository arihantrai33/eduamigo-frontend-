// Tones for status colour (icon chips, badges). Colour carries meaning only, never decoration.
export const TONES = ["brand", "success", "warning", "danger", "info", "neutral"];

// The screens used to pass a raw colour to their own stat cards; this maps such a colour to a tone.
export function toneOf(color = "") {
  const c = String(color).toLowerCase();
  if (TONES.includes(c)) return c;
  if (/10b981|059669|16a34a|22c55e|15803d|green/.test(c)) return "success";
  if (/f59e0b|d97706|f97316|ea580c|eab308|amber|orange/.test(c)) return "warning";
  if (/ef4444|dc2626|f43f5e|e11d48|red/.test(c)) return "danger";
  if (/3b82f6|2563eb|0ea5e9|0284c7|1d4ed8|blue|sky/.test(c)) return "info";
  if (/64748b|94a3b8|gray|slate/.test(c)) return "neutral";
  return "brand";
}

// Categories (event types, library genres, exam types, notice types, subjects) take one of six fixed colours,
// --ea-cat-1..6 in index.css, never a status colour. Known names keep a stable colour; other names are hashed, so a
// name always gets the same colour.
const KNOWN_CATS = {
  holiday: 4, exam: 3, ptm: 2, event: 1, sports: 5, other: 6,
  fiction: 2, "non-fiction": 1, science: 5, textbook: 1, biography: 3, history: 4, reference: 6,
  "unit test": 2, "mid term": 3, "half yearly": 3, final: 4, annual: 4, quarterly: 5, practical: 1,
  general: 6, academic: 2, event_notice: 1, urgent: 4,
};
export function catOf(name = "") {
  const key = String(name).trim().toLowerCase();
  if (KNOWN_CATS[key]) return KNOWN_CATS[key];
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 6) + 1;
}

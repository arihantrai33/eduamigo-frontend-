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

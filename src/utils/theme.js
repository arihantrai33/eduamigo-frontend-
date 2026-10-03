// Builds a full colour palette from a school's brand colours, so every school's screens look like
// that school with only one colour configured. Accent defaults to a warm gold, which works on most brands.
const DEFAULT_PRIMARY = "#2F5BD3";
const DEFAULT_ACCENT = "#F5B301";
const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(v || "");

function toRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (rgb) => `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;

// Mixes a colour with white (amount > 0) or black (amount < 0).
function shade(hex, amount) {
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  return toHex(toRgb(hex).map((v) => v + (target - v) * t));
}

export function alpha(hex, a) {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Text colour that reads well on the given background.
export const readableOn = (hex) => (luminance(hex) > 0.45 ? "#14213D" : "#FFFFFF");

export function schoolTheme(school) {
  let primary = isHex(school?.primaryColor) ? school.primaryColor : DEFAULT_PRIMARY;
  // Very light brand colours cannot carry white text: darken them for buttons and headers.
  if (luminance(primary) > 0.5) primary = shade(primary, -0.45);
  const accent = isHex(school?.accentColor) ? school.accentColor : DEFAULT_ACCENT;
  return {
    primary,
    accent,
    onAccent: readableOn(accent),
    deep: shade(primary, -0.55),   // hero background, darkest
    dark: shade(primary, -0.3),
    light: shade(primary, 0.35),
    soft: shade(primary, 0.9),     // selected chips, subtle fills
    ring: alpha(primary, 0.18),    // focus rings
    glow: alpha(primary, 0.35),    // button shadow
  };
}

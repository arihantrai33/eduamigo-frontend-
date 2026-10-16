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

// WCAG contrast ratio of two hex colours.
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
// The brand colour as text: darkened (on light surfaces) or lightened (on dark ones) until it reaches `min`:1 on `bg`.
// A school with a light brand colour still gets readable links and labels; a dark one keeps its own shade.
function textShade(hex, bg, min, dir) {
  let c = hex;
  for (let i = 1; i <= 20 && contrast(c, bg) < min; i++) c = shade(hex, dir * i * 0.05);
  return c;
}
const lighterOf = (a, b) => (luminance(a) >= luminance(b) ? a : b);
const mixHex = (a, b, t) => toHex(toRgb(a).map((v, i) => v * (1 - t) + toRgb(b)[i] * t));
export const LIGHT_SURFACE = "#EEF1F6"; // the page canvas: the darkest background text sits on in the light themes
export const DARK_SURFACE = "#1E293B";  // the dark theme's cards

// Text colour that reads well on the given background.
export const readableOn = (hex) => (luminance(hex) > 0.45 ? "#14213D" : "#FFFFFF");

export function schoolTheme(school) {
  let base = isHex(school?.primaryColor) ? school.primaryColor : DEFAULT_PRIMARY;
  // Very light brand colours cannot carry white text: darken them for buttons and headers.
  if (luminance(base) > 0.5) base = shade(base, -0.45);
  const accent = isHex(school?.accentColor) ? school.accentColor : DEFAULT_ACCENT;
  const isLight = school?.heroStyle === "light";
  // Light-style schools use a softer version of their colour for tabs, chips, badges and buttons;
  // the dark shades (headings, text on tints) still come from the full colour so they stay readable.
  const primary = isLight ? shade(base, 0.22) : base;
  return {
    isLight,
    // Main buttons: soft and bright on light screens, deeper on bold ones.
    button: isLight
      ? `linear-gradient(135deg, ${shade(base, 0.38)} 0%, ${shade(base, 0.2)} 100%)`
      : `linear-gradient(135deg, ${primary} 0%, ${shade(primary, -0.3)} 100%)`,
    // Keeps white text crisp on the softer light-style buttons.
    buttonTextShadow: isLight ? `0 1px 2px ${alpha(shade(base, -0.4), 0.35)}` : "none",
    mist: shade(primary, 0.96),    // near-white tint
    primary,
    accent,
    onAccent: readableOn(accent),
    deep: shade(base, -0.55),      // hero background, darkest
    dark: shade(base, -0.3),
    light: shade(primary, 0.35),
    soft: shade(primary, 0.9),     // selected chips, subtle fills
    ring: alpha(primary, 0.18),    // focus rings
    glow: alpha(primary, 0.35),    // button shadow
    text: textShade(primary, LIGHT_SURFACE, 4.7, -1),       // brand-coloured text, light themes
    textOnDark: textShade(primary, lighterOf(DARK_SURFACE, mixHex(DARK_SURFACE, primary, 0.28)), 4.7, 1),   // brand-coloured text, dark themes: on the card and on the brand tint of a pill or an active link (the lighter of the two is the harder test)
  };
}

// Theme for screens after sign-in: the school's branding comes with the user (login and profile).
export const userTheme = (user) => schoolTheme(user?.branding || {});

// Colours for the branded header area of signed-in home screens. Follows the school's sign-in style:
// light schools get a soft tint with dark text, bold schools a brand gradient with white text.
export function brandLook(theme) {
  if (theme.isLight) {
    return {
      header: `linear-gradient(170deg, ${theme.soft} 0%, ${theme.mist} 100%)`,
      text: theme.deep,
      muted: alpha(theme.deep, 0.65),
      glass: "rgba(255,255,255,0.75)",        // cards and round buttons on the header
      border: `1px solid ${alpha(theme.primary, 0.15)}`,
      tile: "#fff",                            // small stat tiles
      value: theme.primary,                    // numbers on the header
      avatar: theme.primary,
    };
  }
  return {
    header: `linear-gradient(135deg, ${theme.dark} 0%, ${theme.primary} 100%)`,
    text: "#fff",
    muted: "rgba(255,255,255,0.75)",
    glass: "rgba(255,255,255,0.15)",
    border: "none",
    tile: "rgba(255,255,255,0.15)",
    value: "#fff",
    avatar: "rgba(255,255,255,0.2)",
  };
}

// CSS variables used by every signed-in screen (set on <html> by <BrandTheme /> in App.jsx).
// index.css holds the EduAmigo defaults, used before sign-in and for schools without branding.
export function brandCssVars(theme) {
  return {
    "--brand": theme.primary,
    "--brand-dark": theme.dark,
    "--brand-deep": theme.deep,
    "--brand-light": theme.light,
    "--brand-soft": theme.soft,
    "--brand-border": shade(theme.primary, 0.72),
    "--brand-accent": theme.accent,
    "--brand-text": theme.text,
    "--brand-text-dark": theme.textOnDark,
    // Headers and main buttons: deep brand gradient for bold schools, brighter for light ones.
    "--brand-gradient": theme.isLight ? theme.button : `linear-gradient(135deg, ${theme.dark} 0%, ${theme.primary} 100%)`,
  };
}

import { useState } from "react";
import { alpha } from "../utils/theme";
import { MapPin } from "lucide-react";

// Two looks, chosen per school (branding.heroStyle):
//   bold  - full brand-colour gradient with white text
//   light - soft tint of the brand colour with dark text; the brand colour is kept for accents
function heroLook(theme, light) {
  if (light) {
    return {
      background: `radial-gradient(120% 90% at 85% 0%, ${alpha(theme.accent, 0.22)} 0%, transparent 55%),
                   linear-gradient(170deg, ${theme.soft} 0%, ${theme.mist} 100%)`,
      text: theme.deep,
      dots: alpha(theme.deep, 0.05),
      rings: alpha(theme.primary, 0.12),
      nameShadow: "none",
      logoShadow: `0 12px 28px ${alpha(theme.primary, 0.22)}`,
      chip: { background: alpha(theme.primary, 0.08), border: `1px solid ${alpha(theme.primary, 0.25)}`, color: theme.primary },
    };
  }
  return {
    background: `radial-gradient(120% 90% at 85% 0%, ${alpha(theme.light, 0.45)} 0%, transparent 55%),
                 linear-gradient(160deg, ${theme.deep} 0%, ${theme.primary} 58%, ${theme.dark} 100%)`,
    text: "#fff",
    dots: "rgba(255,255,255,0.10)",
    rings: alpha("#ffffff", 0.12),
    nameShadow: `0 2px 12px ${alpha(theme.deep, 0.5)}`,
    logoShadow: `0 14px 34px ${alpha(theme.deep, 0.55)}`,
    chip: { background: alpha("#ffffff", 0.14), border: `1px solid ${alpha("#ffffff", 0.22)}` },
  };
}

// Branded header for pre-login screens: the school's colours, logo, name, campus and motto.
// `theme` comes from schoolTheme(school).
export default function SchoolHero({ school, theme, compact = false, children }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const name = school?.appName || school?.name || "EduAmigo";
  const initials = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "E";
  const logoSize = compact ? 64 : 92;
  const showLogo = school?.logoUrl && !logoFailed;
  const look = heroLook(theme, theme.isLight);

  return (
    <div className="ea-school-hero" style={{
      position: "relative", overflow: "hidden", flexShrink: 0,
      padding: compact ? "26px 24px 46px" : "34px 24px 58px",
      background: look.background,
      textAlign: "center", color: look.text,
    }}>
      {/* Decoration: soft rings, a dotted texture and an accent glow */}
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${look.dots} 1px, transparent 1.2px)`, backgroundSize: "16px 16px", maskImage: "linear-gradient(180deg, #000 0%, transparent 85%)", WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 85%)" }} />
      <div aria-hidden style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", border: `1px solid ${look.rings}`, top: -120, left: -90 }} />
      <div aria-hidden style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", border: `1px solid ${look.rings}`, top: -60, left: -40 }} />
      <div aria-hidden style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(theme.accent, 0.35)} 0%, transparent 70%)`, bottom: -110, right: -70 }} />

      {children}

      <div style={{ position: "relative", animation: "heroIn .6s cubic-bezier(.2,.8,.2,1) both" }}>
        <div style={{
          width: logoSize + 14, height: logoSize + 14, margin: "0 auto", borderRadius: "50%", padding: 4,
          background: `conic-gradient(from 200deg, ${theme.accent}, ${alpha(theme.accent, 0.2)}, ${theme.accent})`,
          boxShadow: look.logoShadow,
        }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#fff", padding: 4, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {showLogo ? (
              <img src={school.logoUrl} alt={`${name} logo`} onError={() => setLogoFailed(true)} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
            ) : (
              <span style={{ fontSize: logoSize * 0.36, fontWeight: 800, color: theme.primary, letterSpacing: 1 }}>{initials}</span>
            )}
          </div>
        </div>

        <h1 style={{ margin: compact ? "12px 0 6px" : "16px 0 8px", fontSize: compact ? 18 : 22, fontWeight: 800, lineHeight: 1.2, letterSpacing: 0.2, textShadow: look.nameShadow }}>
          {name}
        </h1>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          {school?.city && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, background: theme.accent, color: theme.onAccent, fontSize: 11, fontWeight: 800, letterSpacing: 0.3, boxShadow: `0 4px 12px ${alpha(theme.accent, 0.4)}` }}>
              <MapPin aria-hidden size={12} strokeWidth={2.5} /> {school.city}
            </span>
          )}
          {school?.code && !compact && (
            <span style={{ padding: "4px 10px", borderRadius: 999, ...look.chip, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
              {school.code}
            </span>
          )}
        </div>

        {school?.tagline && (
          <p style={{ margin: "10px auto 0", maxWidth: 280, fontSize: 13, fontStyle: "italic", opacity: 0.9, lineHeight: 1.45 }}>
            “{school.tagline}”
          </p>
        )}
      </div>

      {/* Curved bottom edge that the card below slides into */}
      <svg className="ea-school-hero__wave" aria-hidden viewBox="0 0 390 40" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: -1, width: "100%", height: 34, display: "block" }}>
        <path d="M0,40 L0,22 C90,2 160,0 195,0 C230,0 300,2 390,22 L390,40 Z" fill="var(--card, #fff)" />
      </svg>

      <style>{`@keyframes heroIn { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

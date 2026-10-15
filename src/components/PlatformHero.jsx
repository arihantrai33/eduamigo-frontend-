import { GraduationCap } from "lucide-react";

// Brand panel of the screens shown before a school is known (splash, find your school, support, driver), in the
// EduAmigo palette (design plan §2.1, D2). It is the sign-in hero (SchoolHero) with the EduAmigo logo instead of the
// school's: on phones a header with a curved edge above the form, from 1024 px the left half of the split.
// The page root carries .ea-platform, which pins the EduAmigo colours.
//   <PlatformHero title="EduAmigo" subtitle="Find your school" />
//   full: fills the whole screen (splash).
export default function PlatformHero({ title = "EduAmigo", subtitle, icon: Icon = GraduationCap, titleAs: Title = "h1", full = false, children }) {
  return (
    <div className={`ea-school-hero ea-platform-hero${full ? " ea-platform-hero--full" : ""}`}>
      <div aria-hidden className="ea-platform-hero__dots" />
      <div aria-hidden className="ea-platform-hero__ring" style={{ width: 260, height: 260, top: -120, left: -90 }} />
      <div aria-hidden className="ea-platform-hero__ring" style={{ width: 180, height: 180, top: -60, left: -40 }} />
      <div aria-hidden className="ea-platform-hero__glow" />
      <div className="ea-platform-hero__content">
        <div className="ea-platform-hero__logo"><Icon aria-hidden size={34} strokeWidth={1.8} /></div>
        <Title className="ea-platform-hero__title">{title}</Title>
        {subtitle && <p className="ea-platform-hero__sub">{subtitle}</p>}
        {children}
      </div>
      {!full && (
        <svg className="ea-school-hero__wave" aria-hidden viewBox="0 0 390 40" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: -1, width: "100%", height: 34, display: "block" }}>
          <path d="M0,40 L0,22 C90,2 160,0 195,0 C230,0 300,2 390,22 L390,40 Z" fill="var(--card, #fff)" />
        </svg>
      )}
    </div>
  );
}

// A figure on a portal home hero (attendance, grade, marks, fee). With onClick it is a button that opens the page
// behind the figure, so it can be reached by keyboard. `look` is brandLook(theme): the tile and text colours follow
// the school's light or bold hero; the focus ring uses the hero's text colour so it shows on both.
export default function HeroStat({ value, label, look, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} className="ea-hero-stat"
      style={{
        flex: 1, minWidth: 0, background: look.tile, border: look.border || "none", borderRadius: 12,
        padding: "8px 4px", textAlign: "center", cursor: onClick ? "pointer" : "default", font: "inherit", color: look.text,
      }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: look.value, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      <div style={{ fontSize: 11, color: look.muted, fontWeight: 600, marginTop: 1 }}>{label}</div>
    </Tag>
  );
}

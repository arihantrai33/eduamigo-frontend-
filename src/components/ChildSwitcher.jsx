import { getSelectedChildId, setSelectedChildId } from "../utils/selectedChild";

// Chips to switch between linked children. Renders nothing for single-child families.
// `theme` (optional): school theme for branded headers; without it the chips suit a dark header.
export default function ChildSwitcher({ children = [], current, onChange, theme }) {
  if (children.length < 2) return null;
  const activeId = String(current?._id || getSelectedChildId() || children[0]._id);
  return (
    <div role="tablist" aria-label="Choose child" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 0 10px" }}>
      {children.map((c) => {
        const active = String(c._id) === activeId;
        const colors = theme?.isLight
          ? { border: active ? "none" : `1px solid ${theme.ring}`, background: active ? theme.primary : "#fff", color: active ? "#fff" : theme.deep }
          : { border: active ? "none" : "1px solid rgba(255,255,255,0.45)", background: active ? "#fff" : "rgba(255,255,255,0.15)", color: active ? (theme?.primary || "var(--brand-dark)") : "#fff" };
        return (
          <button
            key={c._id}
            role="tab"
            aria-selected={active}
            onClick={() => { setSelectedChildId(String(c._id)); onChange?.(c); }}
            style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 999, ...colors, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            {c.name.split(" ")[0]} · {c.class}-{c.section}
          </button>
        );
      })}
    </div>
  );
}

// A list row (a <div>) that opens something: reachable with Tab and opened with Enter or Space, like a button.
//   <div style={rowStyle} {...pressable(() => open(item))}>...</div>
export const pressable = (onPress) => ({
  role: "button",
  tabIndex: 0,
  onClick: onPress,
  onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPress(); } },
});

// Parents with more than one child pick which child the app shows. The choice is a
// per-device convenience kept in localStorage; the server still checks every request.
const KEY = "eduamigo_selected_child";

export function getSelectedChildId() {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
}

export function setSelectedChildId(id) {
  try { localStorage.setItem(KEY, id || ""); } catch { /* storage unavailable */ }
}

// The selected child if still linked, otherwise the first child.
export function pickChild(children) {
  if (!Array.isArray(children) || !children.length) return null;
  const id = getSelectedChildId();
  return children.find((c) => String(c._id) === id) || children[0];
}

// "?studentId=..." for child-specific endpoints (empty when nothing is selected).
export function childQuery(prefix = "?") {
  const id = getSelectedChildId();
  return id ? `${prefix}studentId=${encodeURIComponent(id)}` : "";
}

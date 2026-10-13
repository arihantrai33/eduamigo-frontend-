import { useEffect } from "react";

// Record lists (students, fees, ...) read better on a phone as one card per row than as a wide table that scrolls
// sideways. A table opts in with `data-stack`; this labels each of its cells with its column heading
// (`data-label`), which the phone layout in index.css shows in front of the value. Data-heavy tables (reports)
// leave `data-stack` off and keep scrolling inside their card.
function labelTable(table) {
  const heads = [...table.querySelectorAll("thead th")].map((th) => th.textContent.trim());
  for (const row of table.querySelectorAll("tbody tr")) {
    let col = 0;
    for (const cell of row.children) {
      const label = heads[col] || "";
      if (cell.getAttribute("data-label") !== label) cell.setAttribute("data-label", label);
      col += Number(cell.getAttribute("colspan") || 1);
    }
  }
}

// Labels every `table[data-stack]` inside `rootRef` now and whenever its rows change.
export function useStackedTables(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const run = () => root.querySelectorAll("table[data-stack]").forEach(labelTable);
    run();
    const observer = new MutationObserver(run);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [rootRef]);
}

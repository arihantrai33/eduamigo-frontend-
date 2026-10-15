import { useEffect, useState } from "react";

// True while the CSS media query matches, e.g. useMediaQuery("(min-width: 1024px)") for the desktop layout
// (the width at which the portals switch to the sidebar).
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const list = window.matchMedia?.(query);
    if (!list) return undefined;
    const onChange = () => setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

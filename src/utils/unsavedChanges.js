import { useEffect } from "react";

// True when any field of a form object has been filled in (text, number or a non-empty list).
export function hasEntries(form) {
  return Object.values(form || {}).some((v) => (Array.isArray(v) ? v.length > 0 : v !== "" && v != null));
}

// While `dirty` is true, closing or reloading the browser tab asks first, so a half-filled full-page form is not lost.
// (Moving to another screen inside the app is not covered: the app uses BrowserRouter, which cannot block navigation.)
export function useUnsavedChanges(dirty) {
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

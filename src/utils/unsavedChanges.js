import { useContext, useEffect } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";
import { confirmAction } from "./toast";

// True when any field of a form object has been filled in (text, number or a non-empty list).
export function hasEntries(form) {
  return Object.values(form || {}).some((v) => (Array.isArray(v) ? v.length > 0 : v !== "" && v != null));
}

// While some form on screen has unsaved changes:
//  - closing or reloading the tab, or leaving for another site: the browser asks first (beforeunload);
//  - moving to another screen inside the app (links, menus, buttons that call navigate()): the app asks first.
// The app uses BrowserRouter, where React Router's useBlocker is not available, so the router's navigator is guarded
// instead (push/replace wait for the answer). The browser's own Back and Forward buttons are NOT covered: the address
// has already changed when the app hears of it.
const MESSAGE = "You have unsaved changes. Leave this page and lose them?";
const dirtySources = new Set();
let guarded = null; // { navigator, push, replace } while the guard is installed

function syncGuard(navigator) {
  if (dirtySources.size && !guarded && navigator?.push) {
    const { push, replace } = navigator;
    guarded = { navigator, push, replace };
    const ask = (go) => (...args) => {
      confirmAction(MESSAGE, { confirmLabel: "Leave" }).then((leave) => { if (leave) go.apply(navigator, args); });
    };
    navigator.push = ask(push);
    navigator.replace = ask(replace);
  } else if (!dirtySources.size && guarded) {
    guarded.navigator.push = guarded.push;
    guarded.navigator.replace = guarded.replace;
    guarded = null;
  }
}

// For actions that end the page another way before navigating (signing out clears the session first): asks once
// if something is unsaved, and on "Leave" lifts the guard so the navigation that follows is not asked about again.
export async function confirmLeave() {
  if (!dirtySources.size) return true;
  if (!(await confirmAction(MESSAGE, { confirmLabel: "Leave" }))) return false;
  dirtySources.clear();
  syncGuard();
  return true;
}

export function useUnsavedChanges(dirty) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  useEffect(() => {
    if (!dirty) return undefined;
    const source = Symbol("unsaved form");
    dirtySources.add(source);
    syncGuard(navigator);
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      dirtySources.delete(source);
      syncGuard(navigator);
    };
  }, [dirty, navigator]);
}

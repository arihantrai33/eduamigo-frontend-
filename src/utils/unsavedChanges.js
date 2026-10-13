import { useContext, useEffect } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";
import { confirmAction } from "./toast";

// True when any field of a form object has been filled in (text, number or a non-empty list).
export function hasEntries(form) {
  return Object.values(form || {}).some((v) => (Array.isArray(v) ? v.length > 0 : v !== "" && v != null));
}

// While some form on screen has unsaved changes:
//  - closing or reloading the tab, or leaving for another site: the browser asks first (beforeunload);
//  - moving to another screen inside the app (links, menus, buttons that call navigate()): the app asks first;
//  - the browser's Back and Forward buttons, and the app's own back buttons (navigate(-1)): the app asks first.
// The app uses BrowserRouter, where React Router's useBlocker is not available (it needs a data router), so:
//  - push/replace of the router's navigator wait for the answer;
//  - Back/Forward: BrowserRouter hears of them through a "popstate" listener on window. Listeners on window run in
//    the order they were added, so installBackForwardGuard() is called from main.jsx before the app (and its router)
//    starts: our listener runs first, stops the event so the router does not move, puts the address back
//    (history.go), asks, and on "Leave" repeats the move. It does nothing while no form is dirty. Every entry made
//    by BrowserRouter carries its position (state.idx), which gives the distance to go back; an entry without it
//    (not made by the app) is let through.
const MESSAGE = "You have unsaved changes. Leave this page and lose them?";
const dirtySources = new Set();
let guarded = null; // { navigator, push, replace, idx } while the guard is installed
let skipPops = 0;   // popstate events caused by putting the address back: the router must not hear of them
let asking = false;

const historyIndex = () => window.history.state?.idx;

function onPopState(event) {
  if (skipPops > 0) { skipPops -= 1; event.stopImmediatePropagation(); return; }
  if (!guarded) return;
  const next = event.state?.idx;
  const delta = typeof next === "number" && typeof guarded.idx === "number" ? guarded.idx - next : 0;
  if (!delta) return;
  event.stopImmediatePropagation();
  skipPops += 1;
  window.history.go(delta); // back to the page with the form; the question comes next
  if (asking) return;
  asking = true;
  confirmAction(MESSAGE, { confirmLabel: "Leave" }).then((leave) => {
    asking = false;
    if (!leave || !guarded) return;
    liftGuard();
    window.history.go(-delta);
  });
}

// "Leave" was chosen: the changes are given up, so nothing is asked again, even before the page has closed.
function liftGuard() {
  dirtySources.clear();
  syncGuard();
}

function syncGuard(navigator) {
  if (dirtySources.size && !guarded && navigator?.push) {
    const { push, replace } = navigator;
    guarded = { navigator, push, replace, idx: historyIndex() };
    const ask = (go) => (...args) => {
      confirmAction(MESSAGE, { confirmLabel: "Leave" }).then((leave) => {
        if (!leave) return;
        liftGuard();
        go.apply(navigator, args);
      });
    };
    navigator.push = ask(push);
    navigator.replace = ask(replace);
  } else if (!dirtySources.size && guarded) {
    guarded.navigator.push = guarded.push;
    guarded.navigator.replace = guarded.replace;
    guarded = null;
    skipPops = 0;
  }
}

// Called once from main.jsx, before the app renders (see above for why the order matters).
let backForwardInstalled = false;
export function installBackForwardGuard() {
  if (backForwardInstalled) return;
  backForwardInstalled = true;
  window.addEventListener("popstate", onPopState, true);
}

// For actions that end the page another way before navigating (signing out clears the session first): asks once
// if something is unsaved, and on "Leave" lifts the guard so the navigation that follows is not asked about again.
export async function confirmLeave() {
  if (!dirtySources.size) return true;
  if (!(await confirmAction(MESSAGE, { confirmLabel: "Leave" }))) return false;
  liftGuard();
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

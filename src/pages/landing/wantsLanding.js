import { isNative } from "../../native/platform";
import { getSavedSchool } from "../../utils/school";
import { isTenantHost } from "../../utils/tenantHost";

// Who sees the public website at "/" (everyone else gets the splash screen, as before):
// a first-time visitor in a browser tab. Not the Android/iOS app, not an installed web app, not someone who is signed in,
// and not a device that already chose its school (they come to sign in, so they go straight to the sign-in page).
export function wantsLanding() {
  if (isNative() || isTenantHost()) return false; // a school's own address is that school's sign-in, not EduAmigo's website
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone) return false;
    if (localStorage.getItem("token") && localStorage.getItem("eduamigo_user")) return false;
  } catch {
    // Storage blocked (private mode): the visitor is treated as new.
  }
  return !getSavedSchool();
}

// Installed once at startup (before any component renders) so every API call is covered.
// When the server says the session is no longer valid (expired token, deactivated account,
// password changed elsewhere), the user is signed out and sent to the login screen.
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";
let redirecting = false;

function isApiCall(url) {
  const u = String(url || "");
  return API && u.startsWith(API) && !u.includes("/users/login") && !u.includes("/users/password");
}

function expireSession(reason = "expired") {
  if (redirecting || !localStorage.getItem("token")) return;
  redirecting = true;
  const role = (() => { try { return JSON.parse(localStorage.getItem("eduamigo_user") || "{}").role; } catch { return null; } })();
  if (role) localStorage.setItem("lastRole", role);
  localStorage.removeItem("eduamigo_user");
  localStorage.removeItem("token");
  window.location.assign(`/login?${reason}=1`);
}

// The school's account was suspended: signing in again would not help, so say so.
const isSuspended = (body) => body?.code === "SCHOOL_SUSPENDED";

export function installSessionGuard() {
  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401 && isApiCall(err.config?.url)) expireSession();
      if (err?.response?.status === 403 && isApiCall(err.config?.url) && isSuspended(err.response.data)) expireSession("suspended");
      return Promise.reject(err);
    },
  );

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const res = await originalFetch(...args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
    if (res.status === 401 && isApiCall(url)) expireSession();
    if (res.status === 403 && isApiCall(url)) {
      res.clone().json().then((body) => { if (isSuspended(body)) expireSession("suspended"); }).catch(() => {});
    }
    return res;
  };
}

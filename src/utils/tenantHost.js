import { saveSchool } from "./school";

// A school's own address (erp.greenvalley.edu.in, or alp.eduamigo.com). Off unless VITE_TENANT_ROUTING=on, so nothing changes
// for a deployment that does not use it. The address only picks which school's sign-in page to show: the server decides
// whether the address belongs to a registered school (GET /public/schools/by-domain), and who the person is still comes from
// signing in. A host that is not registered gets no school and falls back to the normal "find your school" flow.
//   VITE_TENANT_ROUTING=on
//   VITE_PLATFORM_BASE_DOMAIN=eduamigo.com     the platform's own domain (the website, and the {code}.eduamigo.com schools)
//   VITE_PLATFORM_HOSTS=eduamigo.com,www.eduamigo.com   hosts that are the platform itself, not a school
const API = import.meta.env.VITE_API_URL || "";
const list = (v) => String(v || "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
const ROUTING_ON = import.meta.env.VITE_TENANT_ROUTING === "on";
const BASE = String(import.meta.env.VITE_PLATFORM_BASE_DOMAIN || "").trim().toLowerCase();
const PLATFORM_HOSTS = new Set([...list(import.meta.env.VITE_PLATFORM_HOSTS), BASE, BASE && `www.${BASE}`].filter(Boolean));

export function isTenantHost(host = window.location.hostname) {
  if (!ROUTING_ON) return false;
  const h = String(host).toLowerCase();
  if (PLATFORM_HOSTS.has(h) || h === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false;
  return true;
}

let pending = null;

// The school registered for this address, or null. Remembered as the device's school (an address belongs to one school).
export function resolveHostSchool() {
  if (!isTenantHost()) return Promise.resolve(null);
  pending ??= fetch(`${API}/public/schools/by-domain?host=${encodeURIComponent(window.location.host)}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => {
      const school = body?.data?.code ? body.data : null;
      if (school) saveSchool(school);
      return school;
    })
    .catch(() => null);
  return pending;
}

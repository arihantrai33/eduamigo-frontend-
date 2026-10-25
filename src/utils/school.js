// The school this device signs in to. Chosen once on the "find your school" screen (or from a
// school link / QR code) and kept until the user picks "Change school".
const KEY = "eduamigo_school";
const API = import.meta.env.VITE_API_URL || "";

export function getSavedSchool() {
  try {
    const school = JSON.parse(localStorage.getItem(KEY) || "null");
    return school?.code ? school : null;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function saveSchool(school) {
  localStorage.setItem(KEY, JSON.stringify(school));
}

export function clearSavedSchool() {
  localStorage.removeItem(KEY);
}

const OFFLINE = "Can't reach EduAmigo. Please check your internet connection and try again.";
const SERVER_DOWN = "EduAmigo is not responding right now. Please try again in a minute.";

async function getJson(path) {
  let res;
  try {
    res = await fetch(`${API}${path}`);
  } catch {
    throw Object.assign(new Error(OFFLINE), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 502-504 come from the proxy or host when the API itself is down, without a JSON message.
    const fallback = res.status >= 502 ? SERVER_DOWN : "Something went wrong. Please try again.";
    const err = new Error(data.message || fallback);
    err.status = res.status;
    throw err;
  }
  return data.data;
}

// { code, name, city, appName, logoUrl, primaryColor, tagline }
export const findSchoolByCode = (code) => getJson(`/public/schools/${encodeURIComponent(String(code).trim())}`);
export const searchSchools = (query) => getJson(`/public/schools?search=${encodeURIComponent(String(query).trim())}`);

export const schoolColor = (school, fallback = "#4f8ef7") =>
  (/^#[0-9a-fA-F]{6}$/.test(school?.primaryColor || "") ? school.primaryColor : fallback);

// ---------------- Signing in ----------------
// One answer shape for the screens: { ok, status, data } or a thrown Error with a plain-language message.
async function postJson(path, body) {
  let res;
  try {
    res = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw Object.assign(new Error(OFFLINE), { status: 0 });
  }
  if (res.status >= 502) throw Object.assign(new Error(SERVER_DOWN), { status: res.status });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success !== false, status: res.status, data };
}

// { identifier, password, schoolCode? } -> a session, or { requiresSchoolChoice, ticket, schools } when a mobile number is
// linked to accounts in several schools. The role and the school come back from the server; none is sent.
export const signInRequest = (body) => postJson("/users/login", body);
export const requestCodeRequest = (body) => postJson("/users/otp/request", body);
export const codeSignInRequest = (body) => postJson("/users/otp/verify", body);
export const chooseSchoolRequest = (ticket, schoolCode) => postJson("/users/login/school", { ticket, schoolCode });

// The device remembers the school it signed in to (so the next visit opens its sign-in page).
export function rememberSchoolOf(user) {
  if (!user?.schoolCode) return;
  const before = getSavedSchool();
  const b = user.branding || {};
  saveSchool({
    ...(before?.code === user.schoolCode ? before : {}),
    code: user.schoolCode, name: user.school || b.appName || "", appName: b.appName || user.school || "",
    logoUrl: b.logoUrl || "", primaryColor: b.primaryColor || "", accentColor: b.accentColor || "", heroStyle: b.heroStyle || "bold",
  });
}

// A page to return to after signing in, only if it is inside the portal of the role that signed in.
export function safeNext(next, role) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return null;
  const portal = role === "accountant" || role === "staff" ? "admin" : role;
  return new RegExp(`^/${portal}(/|$|\\?)`).test(next) ? next : null;
}

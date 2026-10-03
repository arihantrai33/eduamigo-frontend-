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

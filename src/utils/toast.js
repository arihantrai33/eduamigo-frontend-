// App-wide toast and confirm dialog (replaces browser alert()/confirm()).
// Rendered by <Toast /> which is mounted once in App.jsx.

const TOAST_EVENT = 'eduamigo:toast';
const CONFIRM_EVENT = 'eduamigo:confirm';
const CREDENTIALS_EVENT = 'eduamigo:credentials';

function emit(type, message) {
  if (!message) return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { type, message: String(message) } }));
}

export const toast = {
  success: (message) => emit('success', message),
  error: (message) => emit('error', message),
  info: (message) => emit('info', message),
};

// Usage: if (!(await confirmAction('Delete this bus?'))) return;
export function confirmAction(message, { confirmLabel = 'Confirm', danger = true } = {}) {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, { detail: { message, confirmLabel, danger, resolve } }));
  });
}

// Readable, actionable message from an axios/fetch error. Messages the server wrote for users are kept (the
// backend never sends internals: a 500 says only "Something went wrong" plus a request id). Technical texts
// ("Network Error", "Failed to fetch", "Request failed with status code 500", code bugs) are replaced, and a
// server failure shows a short reference that matches the request id in the server log.
const SERVER_GENERIC = 'Something went wrong. Please try again.';
const STATUS_MESSAGES = {
  401: 'Your session has ended. Please sign in again.',
  403: "You don't have permission to do this. Ask your school admin if you need access.",
  404: 'This item could not be found. It may have been removed; refresh the page and try again.',
  408: 'The request took too long. Please try again.',
  413: 'The file is too large. Choose a smaller file and try again.',
  429: 'Too many attempts. Please wait a minute and try again.',
};
const ENDPOINT_MISSING = 'This part of EduAmigo is not available on the server yet. The server may be running an older version than the app; please try again later or tell the school office.';
const OFFLINE = "You're offline. Check your internet connection and try again.";
const UNREACHABLE = "Can't reach EduAmigo right now. Check your internet connection and try again.";
const TECHNICAL = /^(network ?error|failed to fetch|load failed|networkerror when attempting|request failed with status code|timeout of \d+ms exceeded|the network connection was lost)/i;

const sentence = (text) => (/[.!?]$/.test(text) ? text : `${text}.`);

// Development only: method, path and status of a failed request (never the body, query or token).
function logFailure(err) {
  if (!import.meta.env.DEV || !err) return;
  const cfg = err.config || {};
  const path = String(cfg.url || '').split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  console.warn('[EduAmigo] request failed', { method: cfg.method?.toUpperCase(), path, status: err.response?.status, requestId: err.response?.data?.requestId, error: err.name });
}

export function errorMessage(err, fallback = SERVER_GENERIC) {
  logFailure(err);
  const res = err?.response;
  if (res) {
    const status = res.status;
    const server = typeof res.data?.message === 'string' ? res.data.message.trim() : '';
    if (status >= 500) {
      const ref = String(res.data?.requestId || res.headers?.['x-request-id'] || '').slice(0, 8);
      const base = server && server !== SERVER_GENERIC
        ? sentence(server)
        : `${sentence(fallback)} The server had a problem; please try again in a moment.`;
      return ref ? `${base} Reference: ${ref}` : base;
    }
    // The server has no such address at all (not a missing record): it does not have this feature, usually because it
    // runs an older version than the app. Refreshing will not help, so the message does not suggest it.
    if (status === 404 && server === 'Endpoint not found') return ENDPOINT_MISSING;
    if (server) return server;
    return STATUS_MESSAGES[status] || sentence(fallback);
  }
  if (err?.code === 'ECONNABORTED') return STATUS_MESSAGES[408];
  const text = typeof err?.message === 'string' ? err.message.trim() : '';
  if (err?.request || TECHNICAL.test(text)) return typeof navigator !== 'undefined' && navigator.onLine === false ? OFFLINE : UNREACHABLE;
  // A message the screen put into an Error itself (from the server's answer) is shown; a code bug is not.
  if (text && !(err instanceof TypeError || err instanceof ReferenceError || err instanceof SyntaxError)) return text;
  return sentence(fallback);
}

// Shows newly issued login details in a dialog that stays open until the admin closes it.
// entries: [{ label: 'Student', schoolCode?, loginId?, email?, password }]
// loginId is what the person types (admission number, mobile or email); older answers only have email.
export function showCredentials(entries, title = 'Login details') {
  const list = (entries || []).filter((e) => e && (e.loginId || e.email) && e.password);
  if (!list.length) return;
  window.dispatchEvent(new CustomEvent(CREDENTIALS_EVENT, { detail: { title, entries: list } }));
}

export { TOAST_EVENT, CONFIRM_EVENT, CREDENTIALS_EVENT };

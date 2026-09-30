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

// Readable message from an axios/fetch error.
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || err?.message || fallback;
}

// Shows newly issued login details in a dialog that stays open until the admin closes it.
// entries: [{ label: 'Student', email, password }]
export function showCredentials(entries, title = 'Login details') {
  const list = (entries || []).filter((e) => e && e.email && e.password);
  if (!list.length) return;
  window.dispatchEvent(new CustomEvent(CREDENTIALS_EVENT, { detail: { title, entries: list } }));
}

export { TOAST_EVENT, CONFIRM_EVENT, CREDENTIALS_EVENT };

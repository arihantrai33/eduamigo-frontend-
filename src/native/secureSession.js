import { isNative } from "./platform";

// In the mobile apps the sign-in session is kept in the phone's secure store (iOS Keychain / Android Keystore)
// instead of the WebView's localStorage, which is a plain file on the device.
//
// The app reads the session synchronously in many places (localStorage.getItem("token")), so instead of changing
// every caller, this module loads the session from the secure store once at start-up and then serves these keys
// from memory, writing every change through to the secure store. Other localStorage keys are untouched.
// In a browser it does nothing.
const SECURE_KEYS = ["token", "eduamigo_user"];
// iOS keeps Keychain items after the app is deleted, so a reinstalled app would sign the previous user back in
// (for example on a phone handed on to someone else). Plain storage is deleted with the app: when this marker is
// missing the app is a fresh install, and a session left in the secure store by an earlier install is removed.
const INSTALL_MARKER = "eduamigo_installed";

export async function installSecureSession() {
  if (!isNative()) return;
  const { SecureStorage } = await import("@aparajita/capacitor-secure-storage");
  const ls = window.localStorage;
  const original = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
  };
  const memory = new Map();

  if (original.getItem.call(ls, INSTALL_MARKER) == null) {
    for (const key of SECURE_KEYS) {
      try { await SecureStorage.remove(key); } catch { /* nothing stored */ }
    }
    original.setItem.call(ls, INSTALL_MARKER, "1");
  }

  for (const key of SECURE_KEYS) {
    let value;
    try { value = await SecureStorage.get(key, false); } catch { value = null; }
    // A session saved in plain storage by an older app version moves into the secure store and is deleted there.
    const plain = original.getItem.call(ls, key);
    if (value == null && plain != null) {
      value = plain;
      try { await SecureStorage.set(key, plain, false); } catch { /* keep it in memory for this run */ }
    }
    if (plain != null) original.removeItem.call(ls, key);
    if (value != null) memory.set(key, String(value));
  }

  const isSecure = (store, key) => store === ls && SECURE_KEYS.includes(key);
  Storage.prototype.getItem = function getItem(key) {
    return isSecure(this, key) ? (memory.has(key) ? memory.get(key) : null) : original.getItem.call(this, key);
  };
  Storage.prototype.setItem = function setItem(key, value) {
    if (!isSecure(this, key)) return original.setItem.call(this, key, value);
    memory.set(key, String(value));
    SecureStorage.set(key, String(value), false).catch(() => {});
    return undefined;
  };
  Storage.prototype.removeItem = function removeItem(key) {
    if (!isSecure(this, key)) return original.removeItem.call(this, key);
    memory.delete(key);
    SecureStorage.remove(key).catch(() => {});
    return undefined;
  };
  Storage.prototype.clear = function clear() {
    if (this === ls) SECURE_KEYS.forEach((key) => { memory.delete(key); SecureStorage.remove(key).catch(() => {}); });
    return original.clear.call(this);
  };
}

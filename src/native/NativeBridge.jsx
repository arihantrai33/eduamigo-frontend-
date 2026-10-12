import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "../utils/toast";
import { isNative, platformName } from "./platform";

const API = import.meta.env.VITE_API_URL;
const PUSH_TOKEN_KEY = "eduamigo_push_token"; // also cleared by AuthContext.logout

// Where a tapped notification opens, by notification type and role.
const TARGETS = {
  parent: { Attendance: "/parent/attendance", Fee: "/parent/fee", Exam: "/parent/result", Result: "/parent/result" },
  student: { Attendance: "/student/attendance", Fee: "/student/fee", Exam: "/student/result", Result: "/student/result" },
  teacher: {},
};
const INBOX = { parent: "/parent/notifications", student: "/student/notifications", teacher: "/teacher/notifications" };
const targetFor = (role, type) => TARGETS[role]?.[type] || INBOX[role] || "/";

// Native-only behaviour of the Android and iOS apps. Renders nothing; does nothing in a browser.
//   - Android back button: goes back, or leaves the app from the first screen
//   - Links (https school links or eduamigo://...) open the matching screen
//   - Push notifications: asked for after sign-in (not at first launch), the device is registered with the API,
//     a tapped notification opens the related screen, one that arrives while the app is open shows as a message
//   - iOS status bar text: readable on the strip above the page (dark on the light theme, light on the dark one)
//   - The screen layouts follow the WebView's height, so they fit above the keyboard
export default function NativeBridge() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const role = user?.role;
  const signedIn = !!user?.token;
  const roleRef = useRef(role);
  useEffect(() => { roleRef.current = role; }, [role]);

  // The admin portal has no dark theme, so its strip stays light.
  const darkStrip = darkMode && !pathname.startsWith("/admin");
  useEffect(() => {
    if (platformName() !== "ios") return;
    import("@capacitor/status-bar")
      .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: darkStrip ? Style.Dark : Style.Light }))
      .catch(() => {});
  }, [darkStrip]);

  useEffect(() => {
    if (!isNative()) return undefined;
    // The WebView shrinks to the space above the keyboard; the layouts take their height from --ea-vh (index.css).
    const fitHeight = () => document.documentElement.style.setProperty("--ea-vh", `${window.innerHeight}px`);
    fitHeight();
    window.addEventListener("resize", fitHeight);
    let handles = [];
    (async () => {
      const { App } = await import("@capacitor/app");
      handles.push(await App.addListener("backButton", ({ canGoBack }) => (canGoBack ? window.history.back() : App.exitApp())));
      handles.push(await App.addListener("appUrlOpen", ({ url }) => {
        try {
          const u = new URL(url);
          const path = u.protocol === "eduamigo:" ? `/${u.host}${u.pathname}` : u.pathname;
          if (path && path !== "/") navigate(path + u.search);
        } catch { /* not a link the app understands */ }
      }));
    })();
    return () => { window.removeEventListener("resize", fitHeight); handles.forEach((h) => h.remove()); };
  }, [navigate]);

  useEffect(() => {
    // Push needs the school's Firebase files in the app (google-services.json / GoogleService-Info.plist), so it is
    // switched on per build with VITE_PUSH_ENABLED=true. Without it the app works fully, just without pushes.
    if (!isNative() || !signedIn || import.meta.env.VITE_PUSH_ENABLED !== "true") return undefined;
    let handles = [];
    let cancelled = false;
    const saveToken = async (token) => {
      if (!token) return;
      localStorage.setItem(PUSH_TOKEN_KEY, token);
      await fetch(`${API}/users/fcm-token`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ fcmToken: token, platform: platformName() }),
      }).catch(() => {});
    };
    (async () => {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      let perm = await FirebaseMessaging.checkPermissions();
      if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") perm = await FirebaseMessaging.requestPermissions();
      if (cancelled || perm.receive !== "granted") return;
      handles.push(await FirebaseMessaging.addListener("tokenReceived", ({ token }) => saveToken(token)));
      handles.push(await FirebaseMessaging.addListener("notificationReceived", ({ notification }) => {
        toast.success([notification?.title, notification?.body].filter(Boolean).join(": "));
      }));
      handles.push(await FirebaseMessaging.addListener("notificationActionPerformed", ({ notification }) => {
        navigate(targetFor(roleRef.current, notification?.data?.type));
      }));
      const { token } = await FirebaseMessaging.getToken();
      await saveToken(token);
    })().catch(() => {});
    return () => { cancelled = true; handles.forEach((h) => h.remove()); };
  }, [signedIn, navigate]);

  return null;
}

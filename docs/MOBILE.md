# EduAmigo mobile apps (Android and iOS)

## Decision: Capacitor around the existing web app
The web app is a React 19 + Vite single-page app that talks only to the EduAmigo API. It already has responsive
layouts, a tab bar for phones, role-aware navigation and plan-gated screens. Capacitor packages exactly this app as
real Android (Gradle) and iOS (Xcode, Swift Package Manager) projects and adds native features through plugins.

| Option | Why not chosen / chosen |
|---|---|
| **Capacitor** (chosen) | One codebase for web, Android and iOS; no business rules duplicated; every web fix ships to the apps; native plugins for secure storage, push, back button, deep links |
| React Native / Flutter | Would mean rewriting ~25,000 lines of screens and keeping two front ends in step with the API |
| PWA only | No store presence, no reliable iOS push, no Keychain/Keystore |

Trade-off accepted: screens are web views, so very heavy animation or offline-first data sync would need more work.
EduAmigo's screens (forms, lists, dashboards, a map) suit a web view well.

## What is native
| Feature | How | Files |
|---|---|---|
| Session storage | The sign-in token and user record are kept in iOS Keychain / Android Keystore (`@aparajita/capacitor-secure-storage`), served to the app from memory; an older plain-storage session is migrated and deleted. A fresh install starts signed out: iOS keeps Keychain items after an app is deleted, so without this a reinstalled app (for example on a phone passed on to someone else) would sign the previous person back in | `src/native/secureSession.js` |
| Screen edges | iOS draws the app under the status bar. The layouts start below it and above the home indicator (`viewport-fit=cover`, `env(safe-area-inset-*)`); the strip under the status bar takes the page colour, and the status bar text follows the app's light or dark theme (`@capacitor/status-bar`). Android places the app between its system bars by itself | `index.html`, `src/index.css`, `NativeBridge.jsx` |
| Keyboard | The app shrinks to the space above the keyboard (`@capacitor/keyboard`, resize `native` on iOS; Android does it by itself), and the layouts take their height from the WebView (`--ea-vh`), so a screen's header stays in view and a chat's message box sits on the keyboard. Tapping a text field does not zoom the page on iPhone and iPad | `capacitor.config.ts`, `NativeBridge.jsx`, `src/utils/iosZoom.js` |
| Push notifications | Firebase Cloud Messaging on both platforms (`@capacitor-firebase/messaging`, FCM token on iOS too). Permission is asked after sign-in, not at first launch. The device is registered with `PATCH /api/users/fcm-token` and removed with `DELETE` on sign-out. A tapped notification opens the related screen | `src/native/NativeBridge.jsx`, backend `src/services/push.js` |
| Android back button | Back, or leave the app from the first screen | `NativeBridge.jsx` |
| Deep links | `eduamigo://s/<SCHOOLCODE>` opens the school's sign-in | `AndroidManifest.xml`, `Info.plist`, `NativeBridge.jsx` |
| Revoked sessions | Same as the website: a 401 from the API signs the person out (`utils/session.js`); "sign out everywhere" and password resets also silence push on every device (server side) | |
| Offline | The app's files are inside the app, so it opens without network; data screens show their error states until the connection returns. The service worker is used only on the website | `main.jsx` |

Not used yet (no screen needs them): camera and gallery capture beyond the web file picker, background location.
The bus-driver screen uses the web Geolocation API, which works in the app's web view with the system permission prompt.

## Configuration (nothing is hard-coded)
| Setting | Where | Notes |
|---|---|---|
| `VITE_API_URL` | `.env.mobile` (git-ignored; template `.env.mobile.example`) or the shell | Must be a full URL; the mobile build stops otherwise |
| `CAP_LOCAL_DEV=true` | shell, when building for a backend on this computer | Allows plain http (`10.0.2.2` on the Android emulator). Never set it for release |
| `VITE_PUSH_ENABLED=true` | `.env.mobile` | Only after the Firebase files below are in place |
| `android/app/google-services.json` | from the Firebase console (Android app `in.eduamigo.app`) | Not in git. Without it the Android build works but has no push |
| `ios/App/App/GoogleService-Info.plist` | from the Firebase console (iOS app `in.eduamigo.app`), added to the App target in Xcode | Not in git. Also: Push Notifications capability and an APNs key uploaded to Firebase |
| Backend `CORS_ORIGINS` | Render | Add `https://localhost` (Android) and `capacitor://localhost` (iOS) next to the website address |
| Backend Firebase | `FIREBASE_SERVICE_ACCOUNT` | Same Firebase project as the apps |

## Run locally
```
# backend (terminal 1)
cd ../eduamigo-backend && npm run demo

# Android emulator against the demo
CAP_LOCAL_DEV=true VITE_API_URL=http://10.0.2.2:8000/api npm run build:mobile
npm run cap:android          # opens Android Studio; or: cd android && ./gradlew assembleDebug

# iOS simulator against the demo
CAP_LOCAL_DEV=true VITE_API_URL=http://localhost:8000/api npm run build:mobile
npm run cap:ios              # opens Xcode; choose a simulator and Run
```
Demo sign-ins are printed by `npm run demo` (password `Demo@1234`).
Xcode signs a Simulator build to run locally by itself. A command-line build with `CODE_SIGNING_ALLOWED=NO` cannot use
the Keychain in the Simulator (error -34018), so the app would not keep a session; `e2e/native/README.md` has a
command-line build that works.

## Verified (2026-10-13, local)
| What | Result |
|---|---|
| Android emulator (Pixel profile, Android 16 / API 36), `npm run test:android` | 14/14 checks: school search through the API, parent sign-in, session not in plain storage (Keystore), tab bar, back button, chat with the real keyboard, still signed in after a restart, `eduamigo://s/LFS` link, sign-out, nobody signed in after sign-out |
| iOS Simulator (iPhone 16, iOS 18.6), `npm run test:ios` | 20/20 checks: the same flows plus safe area, status bar text on light and dark themes, no zoom on text fields, Keychain session across restarts, and a reinstalled app starts signed out |
| Website, `npm run test:e2e` (Playwright, Chrome) | 19/19 |
| Android debug APK | builds: `android/app/build/outputs/apk/debug/app-debug.apk` (for the emulator against the demo) |
| Android release bundle | builds unsigned: `android/app/build/outputs/bundle/release/app-release.aab`. It was built with a placeholder API address, so it is not for distribution |
| iOS | builds and runs in the Simulator (Xcode 16.4, iOS 18.6 Simulator runtime) |

Not verified yet: physical phones, push delivery (needs the Firebase files and an APNs key), tapping **Open** on the
iOS "Open in EduAmigo?" prompt for a link (a script cannot answer it; the link handling is shared with Android, where
it passes), iPad and landscape layouts in the apps, signed release builds, and store review.

## Release builds
- Android: `VITE_API_URL=https://<api>/api npm run build:mobile`, then in Android Studio *Build > Generate Signed App Bundle*
  (`.aab` for Play). Needs your upload keystore; keep it out of git.
- iOS: same build command, then in Xcode *Product > Archive* with your Apple Developer team, and upload to App Store Connect.
- Store listings need privacy details (the apps handle student data: names, attendance, fees, photos), screenshots and
  review. Compiling is not store readiness.

## Toolchain on this Mac
JDK 21 (`brew install openjdk@21`, keg-only: `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`),
Android SDK command-line tools (`brew install --cask android-commandlinetools`, SDK at `/opt/homebrew/share/android-commandlinetools`,
packages: platform-tools, platforms;android-36, build-tools;36.0.0), Xcode 16.4 with the iOS 18.6 Simulator runtime
(`xcodebuild -downloadPlatform iOS`), and `ios_webkit_debug_proxy` (`brew install ios-webkit-debug-proxy`) for the
iOS smoke test. `android/local.properties` (git-ignored) points Gradle at the SDK.

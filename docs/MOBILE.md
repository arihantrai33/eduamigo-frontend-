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
| Session storage | The sign-in token and user record are kept in iOS Keychain / Android Keystore (`@aparajita/capacitor-secure-storage`), served to the app from memory; an older plain-storage session is migrated and deleted | `src/native/secureSession.js` |
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

## Release builds
- Android: `VITE_API_URL=https://<api>/api npm run build:mobile`, then in Android Studio *Build > Generate Signed App Bundle*
  (`.aab` for Play). Needs your upload keystore; keep it out of git.
- iOS: same build command, then in Xcode *Product > Archive* with your Apple Developer team, and upload to App Store Connect.
- Store listings need privacy details (the apps handle student data: names, attendance, fees, photos), screenshots and
  review. Compiling is not store readiness.

## Toolchain on this Mac
JDK 21 (`brew install openjdk@21`, keg-only: `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`),
Android SDK command-line tools (`brew install --cask android-commandlinetools`, SDK at `/opt/homebrew/share/android-commandlinetools`,
packages: platform-tools, platforms;android-36, build-tools;36.0.0), Xcode 16.4.
`android/local.properties` (git-ignored) points Gradle at the SDK.

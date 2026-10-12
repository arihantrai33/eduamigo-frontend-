# Mobile app smoke tests

These scripts drive the real Android and iOS apps (debug builds) in the emulator and the Simulator. Each one signs in
as the demo parent and checks secure session storage, the tab bar, chat with the keyboard open, staying signed in
after a restart, school links, and sign-out. The iOS script also checks the status bar, the safe area, input zoom,
and that a reinstalled app starts signed out. They complement the Playwright tests in `e2e/`, which cover the
website.

Both scripts use the demo backend on this computer. Start it from the backend repository with `npm run demo`
(port 8000). It uses in-memory data, so no real records are involved.

## Android

1. Start an emulator (for example `emulator -avd eduamigo_pixel`).
2. Build the app for the emulator. The emulator reaches this computer at 10.0.2.2:
   ```sh
   export CAP_LOCAL_DEV=true VITE_API_URL=http://10.0.2.2:8000/api
   npx vite build --mode mobile && npx cap sync android
   (cd android && ./gradlew assembleDebug)
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
3. Run `npm run test:android`. Screenshots and `android-results.json` go to `e2e/native/screenshots/`.

The script clears the app's data before it starts.

## iOS (macOS with Xcode)

1. Boot a Simulator. The default is "iPhone 16"; set `IOS_SIMULATOR` to use another one.
2. Build the app for the Simulator, signed to run locally. The Keychain refuses an unsigned app in the Simulator
   (error -34018), so `CODE_SIGNING_ALLOWED=NO` builds cannot keep a session.
   ```sh
   export CAP_LOCAL_DEV=true VITE_API_URL=http://localhost:8000/api
   npx vite build --mode mobile && npx cap sync ios
   xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug \
     -derivedDataPath /tmp/eduamigo-ios -destination 'generic/platform=iOS Simulator' \
     CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= build
   ```
3. Start the inspector proxy for the Simulator (`brew install ios-webkit-debug-proxy`):
   ```sh
   ios_webkit_debug_proxy -s unix:$(lsof -aUc launchd_sim | grep -o '/private/tmp/com.apple.launchd[^ ]*webinspectord_sim.socket' | head -1)
   ```
4. Run `IOS_APP=/tmp/eduamigo-ios/Build/Products/Debug-iphonesimulator/App.app npm run test:ios`.

The script deletes and reinstalls the app. iOS asks "Open in EduAmigo?" before it follows an `eduamigo://` link, and
a script cannot answer that prompt. The iOS script therefore checks only that the scheme is registered; tap **Open**
by hand to try a link. The Android script covers the in-app link handling, which both platforms share.

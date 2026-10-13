import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// The app's one typeface, bundled with the app (no font CDN; works offline and inside the mobile apps).
import "@fontsource-variable/inter"
import "./index.css"
import App from "./App.jsx"
import { ThemeProvider } from "./context/ThemeContext.jsx"
import { installSessionGuard } from "./utils/session"
import ErrorBoundary from "./components/ErrorBoundary.jsx"
import { installSecureSession } from "./native/secureSession"
import { isNative } from "./native/platform"
import { preventIosInputZoom } from "./utils/iosZoom"
import { installBackForwardGuard } from "./utils/unsavedChanges"

async function start() {
  preventIosInputZoom()
  // Mobile apps: load the sign-in session from the phone's secure store before anything reads it.
  await installSecureSession()
  installSessionGuard()
  // Before the router starts, so it hears Back/Forward after the unsaved-changes guard (utils/unsavedChanges.js).
  installBackForwardGuard()

  // Offline support for the website. Not used inside the mobile apps, which ship their files with them.
  if (!isNative() && "serviceWorker" in navigator) {
    import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <ThemeProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </StrictMode>
  )
}

start()

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// The app's one typeface, bundled with the app (no font CDN; works offline and inside the mobile apps).
import "@fontsource-variable/inter"
import "./index.css"
import App from "./App.jsx"
import { ThemeProvider } from "./context/ThemeContext.jsx"
import { installSessionGuard } from "./utils/session"
import ErrorBoundary from "./components/ErrorBoundary.jsx"

installSessionGuard()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
)

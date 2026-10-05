import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
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

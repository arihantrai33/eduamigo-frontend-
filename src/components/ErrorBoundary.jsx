import { Component } from "react";

// A render error in one part of the app should not blank the whole screen. `fallback` is what to show instead
// (null hides the part, e.g. the assistant button); without one a short message with a reload button is shown.
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error("UI error:", error); }
  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div role="alert" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center", fontFamily: "'Inter','Segoe UI',sans-serif", color: "var(--text, #111)" }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Something went wrong on this screen</div>
        <div style={{ fontSize: 14, color: "var(--subtext, #666)", maxWidth: 320 }}>Your work on other screens is safe. Reload to try again.</div>
        <button type="button" onClick={() => window.location.reload()} style={{ padding: "10px 18px", borderRadius: 12, border: "none", background: "var(--brand-gradient, #0f766e)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Reload</button>
      </div>
    );
  }
}

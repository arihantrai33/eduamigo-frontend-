import { useEffect, useState, useCallback } from "react";
import { TOAST_EVENT, CONFIRM_EVENT, CREDENTIALS_EVENT } from "../utils/toast";

const COLORS = {
  success: { bg: "#ECFDF5", border: "#10B981", color: "#065F46", icon: "✓" },
  error:   { bg: "#FEF2F2", border: "#EF4444", color: "#991B1B", icon: "!" },
  info:    { bg: "#EFF6FF", border: "#3B82F6", color: "#1E3A8A", icon: "i" },
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [creds, setCreds] = useState(null);
  const [copied, setCopied] = useState(false);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  useEffect(() => {
    const onToast = (e) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((t) => [...t.slice(-3), { id, ...e.detail }]);
      setTimeout(() => dismiss(id), e.detail.type === "error" ? 6000 : 3500);
    };
    const onConfirm = (e) => setConfirm(e.detail);
    const onCreds = (e) => { setCopied(false); setCreds(e.detail); };
    window.addEventListener(TOAST_EVENT, onToast);
    window.addEventListener(CONFIRM_EVENT, onConfirm);
    window.addEventListener(CREDENTIALS_EVENT, onCreds);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      window.removeEventListener(CONFIRM_EVENT, onConfirm);
      window.removeEventListener(CREDENTIALS_EVENT, onCreds);
    };
  }, [dismiss]);

  const answer = (value) => {
    confirm?.resolve(value);
    setConfirm(null);
  };

  const copyCreds = async () => {
    const text = creds.entries.map((c) => `${c.label ? `${c.label}: ` : ""}${c.schoolCode ? `school ${c.schoolCode}, ` : ""}login ${c.loginId || c.email} / ${c.password}`).join("\n");
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  };

  return (
    <>
      <div role="status" aria-live="polite" style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10000, display: "flex", flexDirection: "column", gap: 8, width: "calc(100% - 32px)", maxWidth: 420, pointerEvents: "none" }}>
        {toasts.map((t) => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} onClick={() => dismiss(t.id)} style={{ pointerEvents: "auto", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start", background: c.bg, borderLeft: `4px solid ${c.border}`, color: c.color, padding: "12px 14px", borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,0.15)", fontSize: 14, fontFamily: "inherit", lineHeight: 1.4 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: c.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.icon}</span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>

      {confirm && (
        <div role="dialog" aria-modal="true" onClick={() => answer(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 20, width: "100%", maxWidth: 380, boxShadow: "0 20px 50px rgba(15,23,42,0.3)", fontFamily: "inherit" }}>
            <p style={{ margin: "0 0 18px", fontSize: 15, color: "#0F172A", lineHeight: 1.5 }}>{confirm.message}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => answer(false)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button autoFocus onClick={() => answer(true)} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: confirm.danger ? "#DC2626" : "var(--brand)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>{confirm.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}

      {creds && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, width: "100%", maxWidth: 440, boxShadow: "0 20px 50px rgba(15,23,42,0.3)", fontFamily: "inherit" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 17, color: "#0F172A" }}>{creds.title}</h3>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>Share these securely. Each password is temporary and must be changed at first login. They will not be shown again.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
              {creds.entries.map((c, i) => (
                <div key={i} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>
                  {c.label && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{c.label}</div>}
                  {c.schoolCode && <div style={{ color: "#64748B", fontSize: 12 }}>School code: <strong style={{ color: "#0F172A" }}>{c.schoolCode}</strong></div>}
                  <div style={{ color: "#0F172A" }}>Login ID: <strong>{c.loginId || c.email}</strong></div>
                  <div style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "#0F172A", fontWeight: 700, marginTop: 2 }}>{c.password}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={copyCreds} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" }}>{copied ? "Copied" : "Copy all"}</button>
              <button onClick={() => setCreds(null)} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "var(--brand)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

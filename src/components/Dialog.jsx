import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

// The one dialog of the app (replaces 12 per-screen copies). Accessible: announced as a dialog named by its title,
// Escape closes it, keyboard focus moves into it, stays inside while it is open and returns to where it was.
// It fits the screen on phones. A click on the dim background does nothing, so a half-filled form is never lost.
//   <Dialog show={open} onClose={close} title="Collect Fee Payment" width={540}>...</Dialog>
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Dialog({ show = true, onClose, title, children, width = 540 }) {
  const titleId = useId();
  const box = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!show) return undefined;
    const opener = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current?.(); return; }
      if (e.key !== "Tab" || !box.current) return;
      const items = [...box.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const t = requestAnimationFrame(() => {
      const target = box.current?.querySelector('input:not([type="hidden"]):not([disabled]), select, textarea') || box.current;
      target?.focus();
    });
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("keydown", onKey);
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [show]);

  if (!show) return null;
  return (
    <div className="ea-dialog-backdrop">
      <div ref={box} className="ea-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} style={{ width }}>
        <div className="ea-dialog__head">
          <h2 id={titleId} className="ea-dialog__title">{title}</h2>
          <button type="button" className="ea-dialog__close" aria-label="Close" onClick={() => closeRef.current?.()}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

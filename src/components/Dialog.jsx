import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { confirmAction } from "../utils/toast";
import { useUnsavedChanges } from "../utils/unsavedChanges";

// The one dialog of the app (replaces 12 per-screen copies). Accessible: announced as a dialog named by its title,
// Escape closes it, keyboard focus moves into it, stays inside while it is open and returns to where it was.
// It fits the screen on phones. A click on the dim background does nothing, so a half-filled form is never lost.
// Once something has been typed or picked inside it, Escape and the close button ask before discarding it
// (the screen's own Cancel button and a successful save still close it straight away). Reloading or closing the tab,
// or moving to another screen, also asks while it holds changes (see utils/unsavedChanges.js).
//   <Dialog show={open} onClose={close} title="Collect Fee Payment" width={540}>...</Dialog>
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Dialog({ show = true, onClose, title, children, width = 540 }) {
  const titleId = useId();
  const box = useRef(null);
  const closeRef = useRef(onClose);
  const dirty = useRef(false);
  const [hasChanges, setHasChanges] = useState(false);
  const asking = useRef(false);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useUnsavedChanges(show && hasChanges);

  const requestClose = useCallback(async () => {
    if (asking.current) return;
    if (dirty.current) {
      asking.current = true;
      const discard = await confirmAction("Discard the changes you have made?", { confirmLabel: "Discard" });
      asking.current = false;
      if (!discard) return;
    }
    closeRef.current?.();
  }, []);

  useEffect(() => {
    if (!show) return undefined;
    dirty.current = false;
    const opener = document.activeElement;
    const markDirty = (e) => { if (e.isTrusted) { dirty.current = true; setHasChanges(true); } };
    const node = box.current;
    node?.addEventListener("input", markDirty);
    node?.addEventListener("change", markDirty);
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); requestClose(); return; }
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
      node?.removeEventListener("input", markDirty);
      node?.removeEventListener("change", markDirty);
      setHasChanges(false);
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [show, requestClose]);

  if (!show) return null;
  return (
    <div className="ea-dialog-backdrop">
      <div ref={box} className="ea-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} style={{ width }}>
        <div className="ea-dialog__head">
          <h2 id={titleId} className="ea-dialog__title">{title}</h2>
          <button type="button" className="ea-dialog__close" aria-label="Close" onClick={requestClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

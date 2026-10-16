import { useRef } from "react";
import { Paperclip, X } from "lucide-react";

// An optional file to send with a form. The file input itself stays in the tab order (visually hidden, not
// display:none), and the drop zone is its label: Tab reaches it, Space or Enter opens the file picker, and screen
// readers hear the field name. Remove is a separate button (not inside the label) and also clears the input, so
// the same file can be chosen again.
export default function FileAttach({ id, label, file, onChange, accept = ".pdf,.jpg,.jpeg,.png", hint = "PDF, JPG, PNG supported", prompt = "Attach Medical Report or Document" }) {
  const input = useRef(null);
  const remove = () => {
    if (input.current) input.current.value = "";
    onChange(null);
    input.current?.focus();
  };
  return (
    <div className="ea-file">
      <span className="ea-label" id={`${id}-label`}>{label}</span>
      <div className="ea-file__row">
        <label className="ea-file__zone" htmlFor={id}>
          <input ref={input} id={id} type="file" accept={accept} className="ea-sr-only" aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`}
            onChange={(e) => onChange(e.target.files?.[0] || null)} />
          <Paperclip size={18} aria-hidden="true" className="ea-file__icon" />
          <span className="ea-file__text">
            <span className="ea-file__name">{file ? file.name : prompt}</span>
            <span className="ea-file__hint" id={`${id}-hint`}>{file ? `${(file.size / 1024).toFixed(1)} KB` : hint}</span>
          </span>
        </label>
        {file && (
          <button type="button" className="ea-file__remove" aria-label="Remove attachment" onClick={remove}>
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

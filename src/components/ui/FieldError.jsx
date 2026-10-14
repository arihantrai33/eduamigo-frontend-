import { AlertCircle } from "lucide-react";

// The message under a form field that failed a check (see utils/fieldErrors.js): an icon and words, so it does not
// rely on the red colour alone. The field points to it with aria-describedby.
export default function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <span id={id} className="ea-field-error">
      <AlertCircle size={14} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

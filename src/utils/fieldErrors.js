import { useCallback, useState } from "react";

// Field-level validation for a form. `ids` maps each field to the id of its input.
//   const v = useFieldErrors({ identifier: "login-id", password: "login-password" });
//   if (!v.check({ identifier: !id.trim() && "Enter your email", password: !pw && "Enter your password" })) return;
//   <input id="login-id" {...v.invalid("identifier")} onChange={(e) => { setId(e.target.value); v.clear("identifier"); }} />
//   <FieldError id={v.errorId("identifier")}>{v.errors.identifier}</FieldError>
// check() shows the message of every failing field under it, moves focus to the first one (a screen reader then
// reads the label and the message) and returns true when every field passed. Rules are listed in form order.
export function useFieldErrors(ids) {
  const [errors, setErrors] = useState({});
  const check = useCallback((rules) => {
    const failed = Object.fromEntries(Object.entries(rules).filter(([, message]) => message));
    setErrors(failed);
    const first = Object.keys(failed)[0];
    if (first) requestAnimationFrame(() => document.getElementById(ids[first])?.focus());
    return !first;
  }, [ids]);
  const clear = useCallback((name) => setErrors((e) => {
    if (!e[name]) return e;
    const next = { ...e };
    delete next[name];
    return next;
  }), []);
  const errorId = (name) => `${ids[name]}-error`;
  const invalid = (name) => (errors[name] ? { "aria-invalid": true, "aria-describedby": errorId(name) } : {});
  return { errors, check, clear, invalid, errorId, setErrors };
}

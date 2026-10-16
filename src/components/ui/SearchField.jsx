import { Search } from "lucide-react";

// The search box above a list, one look everywhere: a magnifier inside a field with the shared control surface
// (white, a visible border, 40 px; see "Form controls" in index.css). It is a plain text input (role textbox), so it
// keeps its name for screen readers and keyboard use.
//   <SearchField value={search} onChange={setSearch} label="Search students" placeholder="Search by name or roll number" />
// `onChange` receives the new text. `style` / `className` size it inside a toolbar (it grows to fill the row).
export default function SearchField({ value, onChange, label, placeholder, className = "", style }) {
  return (
    <div className={`ea-search${className ? ` ${className}` : ""}`} style={style}>
      <Search aria-hidden="true" />
      <input className="ea-input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} placeholder={placeholder} />
    </div>
  );
}

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Bus, School } from "lucide-react";

// Line icons as SVG markup for Leaflet markers, whose content is an HTML string (not React).
const svg = (Icon, size) => renderToStaticMarkup(createElement(Icon, { size, color: "#fff", strokeWidth: 2.2, "aria-hidden": "true" }));

export const BUS_SVG = svg(Bus, 24);
export const schoolSvg = (size) => svg(School, size);

// Leaflet draws routes with SVG attributes, which cannot use CSS variables: read the school's colour itself.
export const cssVar = (name, fallback) =>
  (typeof document !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue(name).trim()) || fallback;

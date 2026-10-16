// Mirrors backend src/utils/grades.js. Keep both in step: one grading scale everywhere.
export const PASS_PERCENT = 33;

export function gradeFor(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 33) return "E";
  return "F";
}

export const GRADE_STYLE = {
  "A+": { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  A:    { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
  B:    { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  C:    { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  D:    { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" },
  E:    { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  F:    { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
  AB:   { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
};

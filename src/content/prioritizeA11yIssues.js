/**
 * Accessibility issue prioritization — Spec: 10ab6f26 — Accessibility Audit
 *
 * Sorts accessibility issues by severity: critical → major → minor → pass.
 */

/** Numeric priority for each severity level (lower = higher priority). */
export const SEVERITY_ORDER = {
  critical: 0,
  major:    1,
  minor:    2,
  pass:     3,
};

/**
 * Return a new array of issues sorted by severity (most severe first).
 * Items with equal severity retain their original relative order (stable sort).
 *
 * @param {Array<{ severity: string }>} issues
 * @returns {Array<{ severity: string }>}
 */
export function prioritizeA11yIssues(issues) {
  const order = (s) => SEVERITY_ORDER[s] ?? 99;
  return [...issues].sort((a, b) => order(a.severity) - order(b.severity));
}

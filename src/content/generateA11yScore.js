/**
 * Accessibility score summary — Spec: 10ab6f26 — Accessibility Audit
 *
 * Aggregates issues into pass/warn/fail counts for totals and per category.
 */

/**
 * Map severity string to bucket name.
 * @param {string} severity
 * @returns {'pass'|'warn'|'fail'}
 */
function severityToBucket(severity) {
  if (severity === 'pass') return 'pass';
  if (severity === 'minor') return 'warn';
  return 'fail'; // critical, major
}

/**
 * @param {Array<{ category: string, severity: string }>} issues
 * @returns {{ totals: { pass: number, warn: number, fail: number }, categories: Record<string, { pass: number, warn: number, fail: number }> }}
 */
export function generateA11yScore(issues) {
  const totals = { pass: 0, warn: 0, fail: 0 };
  const categories = {};

  for (const { category, severity } of issues) {
    const bucket = severityToBucket(severity);
    totals[bucket]++;

    if (!categories[category]) {
      categories[category] = { pass: 0, warn: 0, fail: 0 };
    }
    categories[category][bucket]++;
  }

  return { totals, categories };
}

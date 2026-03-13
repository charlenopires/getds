/**
 * Limitations section generation — Spec: b0d5a227 — Markdown Report Generation
 *
 * Produces a ⚠️ Limitations section documenting all extraction constraints
 * encountered during the 7-layer extraction (cross-origin blocks, closed
 * shadow DOM, inaccessible styles, etc.).
 */

/**
 * Generate the Limitations section of the design system Markdown report.
 *
 * @param {string[]} [limitations=[]] - Array of limitation message strings collected
 *   during extraction (e.g. from collectStylesheetTexts, shadow DOM detectors, etc.)
 * @returns {string}
 */
export function generateLimitationsSection(limitations = []) {
  const count  = limitations.length;
  const header = `## ⚠️ Limitations`;

  if (count === 0) {
    return `${header}\n\nNo extraction constraints encountered.`;
  }

  const intro = `${count} extraction constraint${count === 1 ? '' : 's'} encountered:`;
  const items = limitations.map(l => `- ${l}`).join('\n');

  return `${header}\n\n${intro}\n\n${items}`;
}

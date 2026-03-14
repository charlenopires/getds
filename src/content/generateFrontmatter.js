/**
 * Frontmatter generation — Spec: b0d5a227 — Markdown Report Generation
 *
 * Produces a YAML frontmatter block for the extracted design system report.
 * Includes URL, title, extraction timestamp, tool version, duration,
 * and a W3C DTCG compliance note.
 */

// Colon triggers YAML quoting; URLs (http/https) are exempt from quoting
const YAML_SPECIAL_RE = /[:#\[\]{},|>&*!'"]/;

/**
 * Quote a YAML scalar value if it contains special characters.
 * URLs (starting with http:// or https://) are never quoted.
 *
 * @param {string} value
 * @returns {string}
 */
function quoteIfNeeded(value) {
  if (!value) return value;
  // URLs are safe to emit unquoted
  if (/^https?:\/\//.test(value)) return value;
  if (YAML_SPECIAL_RE.test(value)) return `'${value.replace(/'/g, "''")}'`;
  return value;
}

/**
 * Generate a YAML frontmatter block from report metadata.
 *
 * @param {{ url: string, title: string, extractedAt: string, dsx_version: string, duration: number }} meta
 * @returns {string}
 */
export function generateFrontmatter(meta) {
  const {
    url          = 'unknown',
    title        = 'Untitled',
    extractedAt  = new Date().toISOString(),
    dsx_version  = '0.1.0',
    duration     = 0,
  } = meta ?? {};

  const lines = [
    '---',
    `url: ${quoteIfNeeded(url)}`,
    `title: ${quoteIfNeeded(title)}`,
    `extractedAt: ${extractedAt}`,
    `dsx_version: ${dsx_version}`,
    `duration: ${duration}ms`,
    `tokenStandard: W3C DTCG 2025`,
    `wcagTarget: AA`,
    `layers:`,
    `  - visual-foundations`,
    `  - tokens`,
    `  - components`,
    `  - layout-patterns`,
    `  - animations`,
    `  - iconography`,
    `  - accessibility`,
    '---',
  ];

  return lines.join('\n');
}

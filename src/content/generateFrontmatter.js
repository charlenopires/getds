/**
 * Frontmatter generation — Spec: b0d5a227 — Markdown Report Generation
 *
 * Produces a YAML frontmatter block for the extracted design system report.
  * 
 * @example
 * // Usage of generateFrontmatter
*/

const YAML_SPECIAL_RE = /[:#\[\]{},|>&*!'"]/;

/**
 * Quote a YAML scalar value if it contains special characters.
 *
 * @param {string} value
 * @returns {string}
 */
function quoteIfNeeded(value) {
  if (!value) return value;
  if (YAML_SPECIAL_RE.test(value)) return `'${value}'`;
  return value;
}

/**
 * Generate a YAML frontmatter block from report metadata.
 *
 * @param {{ url: string, title: string, extractedAt: string, dsx_version: string, duration: number }} meta
 * @returns {string}
 */
export function generateFrontmatter(meta) {
  const { url, title, extractedAt, dsx_version, duration } = meta;

  const lines = [
    '---',
    `url: ${url}`,
    `title: ${quoteIfNeeded(title)}`,
    `extractedAt: ${extractedAt}`,
    `dsx_version: ${dsx_version}`,
    `duration: ${duration}ms`,
    '---',
  ];

  return lines.join('\n');
}

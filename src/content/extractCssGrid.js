/**
 * CSS Grid extraction — Spec: f87063a1 — Grid and Layout Extraction
 *
 * Detects elements using CSS Grid layout and extracts their grid properties:
 * grid-template-columns, grid-template-rows, gap, grid-template-areas.
 */

/**
 * Infer the number of explicit columns from a grid-template-columns value.
 *
 * Handles:
 *   - Space-separated track list: "1fr 1fr 1fr" → 3
 *   - repeat(N, ...): "repeat(4, 1fr)" → 4
 *   - auto-fill/auto-fit repeat: returns 0 (cannot resolve statically)
 *   - empty / "none": returns 0
 *
 * @param {string} value
 * @returns {number}
 */
export function parseColumnCount(value) {
  if (!value || value === 'none') return 0;

  // repeat(N, ...) — only numeric repeat counts
  const repeatMatch = value.match(/^repeat\(\s*(\d+)\s*,/);
  if (repeatMatch) return parseInt(repeatMatch[1], 10);

  // repeat(auto-fill/auto-fit, ...) — cannot resolve
  if (/repeat\(\s*(auto-fill|auto-fit)/i.test(value)) return 0;

  // Space-separated track list — count whitespace-delimited tokens
  return value.trim().split(/\s+/).length;
}

/**
 * Extract CSS Grid layout descriptors from a list of computed style objects.
 *
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {Array<{
 *   templateColumns: string,
 *   templateRows: string,
 *   gap: string,
 *   templateAreas: string,
 *   columnCount: number
 * }>}
 */
export function extractGridDescriptors(computedStyles) {
  const results = [];

  for (const cs of computedStyles) {
    const display = cs.display ?? cs.getPropertyValue('display');
    if (display !== 'grid' && display !== 'inline-grid') continue;

    const templateColumns = cs.getPropertyValue('grid-template-columns') ?? '';
    const templateRows    = cs.getPropertyValue('grid-template-rows') ?? '';
    const gap             = cs.getPropertyValue('gap') ?? '';
    const templateAreas   = cs.getPropertyValue('grid-template-areas') ?? '';

    results.push({
      templateColumns,
      templateRows,
      gap,
      templateAreas,
      columnCount: parseColumnCount(templateColumns),
    });
  }

  return results;
}

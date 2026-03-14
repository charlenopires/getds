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
 * Parse auto-fill/auto-fit repeat values.
 * @param {string} value
 * @returns {{ type: 'auto-fill'|'auto-fit'|null, minTrack: string, maxTrack: string }|null}
 */
export function parseAutoFillFit(value) {
  if (!value) return null;
  const match = value.match(/repeat\(\s*(auto-fill|auto-fit)\s*,\s*minmax\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*\)/i);
  if (!match) return null;
  return { type: match[1].toLowerCase(), minTrack: match[2].trim(), maxTrack: match[3].trim() };
}

/**
 * Extract named grid area names from grid-template-areas.
 * @param {string} templateAreas
 * @returns {string[]}
 */
export function extractGridAreaNames(templateAreas) {
  if (!templateAreas || templateAreas === 'none') return [];
  const names = new Set();
  const tokens = templateAreas.replace(/["']/g, ' ').split(/\s+/);
  for (const t of tokens) {
    if (t && t !== '.' && t !== 'none') names.add(t);
  }
  return Array.from(names);
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
 *   columnCount: number,
 *   gridAutoFlow: string,
 *   gridAutoColumns: string,
 *   gridAutoRows: string,
 *   placeItems: string,
 *   placeContent: string,
 *   alignContent: string
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
    const gridAutoFlow    = cs.getPropertyValue('grid-auto-flow') ?? '';
    const gridAutoColumns = cs.getPropertyValue('grid-auto-columns') ?? '';
    const gridAutoRows    = cs.getPropertyValue('grid-auto-rows') ?? '';
    const placeItems      = cs.getPropertyValue('place-items') ?? '';
    const placeContent    = cs.getPropertyValue('place-content') ?? '';
    const alignContent    = cs.getPropertyValue('align-content') ?? '';

    results.push({
      templateColumns,
      templateRows,
      gap,
      templateAreas,
      columnCount: parseColumnCount(templateColumns),
      gridAutoFlow,
      gridAutoColumns,
      gridAutoRows,
      placeItems,
      placeContent,
      alignContent,
    });
  }

  return results;
}

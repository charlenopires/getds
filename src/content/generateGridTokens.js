/**
 * Grid token generation — Spec: f87063a1 — Grid and Layout Extraction
 *
 * Generates W3C DTCG design tokens for:
 *   - Breakpoints (dimension tokens keyed by category)
 *   - Grid columns (most common column count)
 *   - Gutters (dimension tokens)
 *   - Container max-widths (dimension tokens)
 */

/** @param {string} $value @param {string} [$type] */
const token = ($value, $type = 'dimension') => ({ $value, $type });

/**
 * Find the most common numeric value in an array.
 * @param {number[]} values
 * @returns {number|null}
 */
function mostCommon(values) {
  if (values.length === 0) return null;
  const freq = new Map();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Generate DTCG-compliant tokens for the grid/layout layer.
 *
 * @param {{
 *   breakpoints?: Array<{ value: number, unit: string, category: string }>,
 *   gridDescriptors?: Array<{ columnCount: number }>,
 *   gutters?: string[],
 *   containerWidths?: Array<{ maxWidth: string, width: string }>
 * }} input
 * @returns {Record<string, object>}
 */
export function generateGridTokens({
  breakpoints     = [],
  gridDescriptors = [],
  gutters         = [],
  containerWidths = [],
} = {}) {
  // ── Breakpoints ────────────────────────────────────────────────────────────
  const bpTokens = {};
  for (const bp of breakpoints) {
    bpTokens[bp.category] = token(`${bp.value}${bp.unit}`);
  }

  // ── Grid columns ──────────────────────────────────────────────────────────
  const columnCounts = gridDescriptors.map(d => d.columnCount).filter(n => n > 0);
  const dominantCols = mostCommon(columnCounts);
  const gridTokens = {
    columns: token(dominantCols != null ? String(dominantCols) : '0', 'number'),
  };

  // ── Gutters ───────────────────────────────────────────────────────────────
  const gutterTokens = {};
  gutters.forEach((g, i) => {
    gutterTokens[`gutter-${i + 1}`] = token(g);
  });

  // ── Containers ────────────────────────────────────────────────────────────
  const containerTokens = {};
  containerWidths.forEach((c, i) => {
    const value = c.maxWidth || c.width;
    if (value) containerTokens[`container-${i + 1}`] = token(value);
  });

  return {
    breakpoints: bpTokens,
    grid:        gridTokens,
    gutters:     gutterTokens,
    containers:  containerTokens,
  };
}

/**
 * Generate column system tokens from inferred grid system data.
 *
 * @param {{ detectedSystem: string, dominantColumnCount: number, confidence: number }} columnSystem
 * @param {{ isModular: boolean, rowCount: number, columnCount: number }} modularGrid
 * @returns {Record<string, object>}
 */
export function generateColumnSystemTokens(columnSystem, modularGrid) {
  const tokens = {};

  if (columnSystem && columnSystem.detectedSystem !== 'none') {
    tokens['grid-system'] = token(columnSystem.detectedSystem, 'string');
    tokens['grid-system-columns'] = token(String(columnSystem.dominantColumnCount), 'number');
  }

  if (modularGrid && modularGrid.isModular) {
    tokens['grid-modular'] = token('true', 'string');
    tokens['grid-modular-rows'] = token(String(modularGrid.rowCount), 'number');
    tokens['grid-modular-columns'] = token(String(modularGrid.columnCount), 'number');
  }

  return tokens;
}

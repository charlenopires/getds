/**
 * Gutter extraction — Spec: f87063a1 — Grid and Layout Extraction
 *
 * Extracts gap, column-gap, and row-gap values from computed styles and
 * collects a unique set of gutter sizes used across all layout elements.
 */

/**
 * Extract gap properties from a single computed style object.
 *
 * @param {CSSStyleDeclaration} cs
 * @returns {{ gap: string, columnGap: string, rowGap: string }}
 */
export function extractGutters(cs) {
  return {
    gap:       cs.getPropertyValue('gap')        ?? '',
    columnGap: cs.getPropertyValue('column-gap') ?? '',
    rowGap:    cs.getPropertyValue('row-gap')    ?? '',
  };
}

/**
 * Collect all unique non-empty gutter values from a list of computed styles.
 *
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {string[]}
 */
export function collectUniqueGutters(computedStyles) {
  const seen = new Set();

  for (const cs of computedStyles) {
    const { gap, columnGap, rowGap } = extractGutters(cs);
    if (gap)       seen.add(gap);
    if (columnGap) seen.add(columnGap);
    if (rowGap)    seen.add(rowGap);
  }

  return Array.from(seen);
}

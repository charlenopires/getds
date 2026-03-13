/**
 * Color statistics reporting — Spec: fff645a0 — Color System Extraction
 *
 * Computes:
 *   - totalUnique: number of distinct colors extracted
 *   - topColors: top-10 most-used colors sorted descending by count
 *   - distributionByProperty: count of unique colors per CSS property type
  * 
 * @example
 * // Usage of colorStats
*/

/**
 * @param {Array<{ raw: string, property: string, hex?: string, count?: number }>} colors
 * @returns {{
 *   totalUnique: number,
 *   topColors: Array<{ raw: string, hex: string, count: number }>,
 *   distributionByProperty: Record<string, number>
 * }}
 */
export function computeColorStats(colors) {
  const totalUnique = colors.length;

  // Top-10 by count descending
  const topColors = [...colors]
    .sort((a, b) => (b.count ?? 1) - (a.count ?? 1))
    .slice(0, 10)
    .map(c => ({ raw: c.raw, hex: c.hex ?? '', count: c.count ?? 1 }));

  // Distribution: count of unique colors per property
  const distributionByProperty = {};
  for (const c of colors) {
    distributionByProperty[c.property] = (distributionByProperty[c.property] ?? 0) + 1;
  }

  return { totalUnique, topColors, distributionByProperty };
}

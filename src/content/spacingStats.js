/**
 * Spacing statistics — Spec: 29ea3708 — Spacing System Extraction
 *
 * Reports frequency distribution of spacing values across CSS properties.
 */

/**
 * Compute spacing usage statistics.
 *
 * @param {Array<{ px: number|null, value: string, properties: string[] }>} values
 * @param {{ baseUnit: number|null }} options
 * @returns {{
 *   totalUnique: number,
 *   topValues: Array<{ value: string, px: number, count: number }>,
 *   distributionByProperty: Record<string, number>
 * }}
 */
export function computeSpacingStats(values, { baseUnit } = {}) {
  const countByPx = new Map(); // px → { value, count }
  const distributionByProperty = {};

  for (const entry of values) {
    if (entry.px === null || entry.px === undefined) continue;

    // Accumulate count per px value
    const existing = countByPx.get(entry.px);
    const entryCount = entry.properties?.length ?? 1;
    if (existing) {
      existing.count += entryCount;
    } else {
      countByPx.set(entry.px, { value: entry.value, px: entry.px, count: entryCount });
    }

    // Accumulate per property
    for (const prop of entry.properties ?? []) {
      distributionByProperty[prop] = (distributionByProperty[prop] ?? 0) + 1;
    }
  }

  const topValues = [...countByPx.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalUnique: countByPx.size,
    topValues,
    distributionByProperty,
  };
}

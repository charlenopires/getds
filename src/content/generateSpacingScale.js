/**
 * Spacing scale generation — Spec: 29ea3708 — Spacing System Extraction
 *
 * Produces a sorted, deduplicated spacing scale with step indices and
 * multiplier labels relative to the detected base unit.
  * 
 * @example
 * // Usage of generateSpacingScale
*/

/**
 * Generate a sorted spacing scale from enriched spacing values.
 *
 * @param {Array<{ px: number|null, value: string }>} values — enriched entries from enrichSpacingWithPx()
 * @param {{ baseUnit: number|null }} options
 * @returns {{ scale: Array<{ step: number, px: number, value: string, multiplier: number|null }> }}
 */
export function generateSpacingScale(values, { baseUnit } = {}) {
  // Filter nulls, deduplicate by px
  const seen = new Map();
  for (const entry of values) {
    if (entry.px === null || entry.px === undefined) continue;
    if (!seen.has(entry.px)) {
      seen.set(entry.px, entry.value ?? `${entry.px}px`);
    }
  }

  const sorted = [...seen.entries()]
    .sort(([a], [b]) => a - b);

  const scale = sorted.map(([px, value], i) => {
    const multiplier = baseUnit != null
      ? Math.round((px / baseUnit) * 1000) / 1000
      : null;
    return { step: i + 1, px, value, multiplier };
  });

  return { scale };
}

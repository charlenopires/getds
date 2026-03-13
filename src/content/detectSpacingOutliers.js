/**
 * Spacing outlier detection — Spec: 29ea3708 — Spacing System Extraction
 *
 * Identifies spacing values that do not conform to the detected grid base unit.
  * 
 * @example
 * // Usage of detectSpacingOutliers
*/

/**
 * Detect spacing values that are not multiples of the base unit.
 *
 * @param {Array<{ px: number|null, value?: string }>} values
 * @param {{ baseUnit: number|null }} options
 * @returns {{ outliers: Array<{ px: number, value: string, deviation: number }> }}
 */
export function detectSpacingOutliers(values, { baseUnit } = {}) {
  if (!baseUnit) return { outliers: [] };

  const outliers = [];

  for (const entry of values) {
    const { px } = entry;
    if (px === null || px === undefined) continue;

    const rounded = Math.round(px);
    if (rounded % baseUnit === 0) continue;

    // Nearest grid points below and above
    const below = Math.floor(rounded / baseUnit) * baseUnit;
    const above = below + baseUnit;
    const deviation = Math.min(rounded - below, above - rounded);

    outliers.push({
      px: rounded,
      value: entry.value ?? `${rounded}px`,
      deviation,
    });
  }

  return { outliers };
}

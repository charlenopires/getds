/**
 * Opacity value extraction — Visual Foundations
 * Collects non-1 opacity values with frequency counts.
 */

/**
 * Extract opacity values from computed styles.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{ opacityValues: Array<{ value: string, count: number }> }}
 */
export function extractOpacity(computedStyles) {
  const freq = new Map();

  for (const cs of computedStyles) {
    const raw = cs.getPropertyValue('opacity') ?? '';
    if (raw === '' || raw === '1') continue;
    freq.set(raw, (freq.get(raw) ?? 0) + 1);
  }

  const opacityValues = [...freq.entries()]
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([value, count]) => ({ value, count }));

  return { opacityValues };
}

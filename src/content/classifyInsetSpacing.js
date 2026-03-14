/**
 * Inset spacing classification — Layout Analysis
 * Classifies padding patterns as equal, squish, stretch, or asymmetric.
 */

/**
 * Classify an inset (padding) pattern by its shape.
 * @param {{ top: number, right: number, bottom: number, left: number }} inset
 * @returns {{ type: 'equal'|'squish'|'stretch'|'asymmetric' }}
 */
export function classifyInset({ top, right, bottom, left }) {
  // equal: all four sides identical
  if (top === right && right === bottom && bottom === left) return { type: 'equal' };
  // squish: top/bottom equal, left/right equal, horizontal > vertical
  if (top === bottom && left === right && left > top) return { type: 'squish' };
  // stretch: top/bottom equal, left/right equal, vertical > horizontal
  if (top === bottom && left === right && top > left) return { type: 'stretch' };
  return { type: 'asymmetric' };
}

/**
 * Extract inset patterns from computed styles.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{ insets: Array<{ type: string, values: { top: number, right: number, bottom: number, left: number }, count: number }> }}
 */
export function extractInsetPatterns(computedStyles) {
  const seen = new Map(); // "type|top|right|bottom|left" -> { type, values, count }

  for (const cs of computedStyles) {
    const top = parseFloat(cs.getPropertyValue('padding-top')) || 0;
    const right = parseFloat(cs.getPropertyValue('padding-right')) || 0;
    const bottom = parseFloat(cs.getPropertyValue('padding-bottom')) || 0;
    const left = parseFloat(cs.getPropertyValue('padding-left')) || 0;

    if (top === 0 && right === 0 && bottom === 0 && left === 0) continue;

    const { type } = classifyInset({ top, right, bottom, left });
    const key = `${type}|${top}|${right}|${bottom}|${left}`;

    if (!seen.has(key)) {
      seen.set(key, { type, values: { top, right, bottom, left }, count: 0 });
    }
    seen.get(key).count++;
  }

  return { insets: Array.from(seen.values()) };
}

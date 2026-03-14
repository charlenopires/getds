/**
 * Overflow pattern extraction — Visual Foundations
 * Collects overflow, scroll-behavior, and scrollbar-width patterns.
 */

/**
 * Extract overflow patterns from computed styles.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{
 *   overflowPatterns: Array<{ overflow: string, overflowX: string, overflowY: string, count: number }>,
 *   scrollBehavior: string,
 *   hasScrollbarStyling: boolean
 * }}
 */
export function extractOverflowPatterns(computedStyles) {
  const freq = new Map();
  let scrollBehavior = 'auto';
  let hasScrollbarStyling = false;

  for (const cs of computedStyles) {
    const overflow  = cs.getPropertyValue('overflow')   ?? '';
    const overflowX = cs.getPropertyValue('overflow-x') ?? '';
    const overflowY = cs.getPropertyValue('overflow-y') ?? '';

    // Skip default visible/visible
    if (overflowX === 'visible' && overflowY === 'visible') continue;

    const key = `${overflow}|${overflowX}|${overflowY}`;
    freq.set(key, (freq.get(key) ?? 0) + 1);

    const sb = cs.getPropertyValue('scroll-behavior') ?? '';
    if (sb && sb !== 'auto') scrollBehavior = sb;

    const sw = cs.getPropertyValue('scrollbar-width') ?? '';
    if (sw && sw !== 'auto' && sw !== '') hasScrollbarStyling = true;
  }

  const overflowPatterns = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => {
      const [overflow, overflowX, overflowY] = key.split('|');
      return { overflow, overflowX, overflowY, count };
    });

  return { overflowPatterns, scrollBehavior, hasScrollbarStyling };
}

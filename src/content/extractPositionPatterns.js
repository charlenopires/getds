/**
 * Position pattern extraction — Layout Analysis
 * Detects sticky, fixed, and scroll-snap patterns from computed styles.
 */

/**
 * Extract position patterns from computed styles.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{ stickyElements: Array<{ top: string, zIndex: string }>, fixedElements: Array<{ top: string, zIndex: string }>, scrollSnapContainers: Array<{ snapType: string, snapAlign: string }> }}
 */
export function extractPositionPatterns(computedStyles) {
  const stickyElements = [];
  const fixedElements = [];
  const scrollSnapContainers = [];

  for (const cs of computedStyles) {
    const position = cs.getPropertyValue('position') ?? '';
    const top = cs.getPropertyValue('top') ?? 'auto';
    const zIndex = cs.getPropertyValue('z-index') ?? 'auto';

    if (position === 'sticky') {
      stickyElements.push({ top, zIndex });
    } else if (position === 'fixed') {
      fixedElements.push({ top, zIndex });
    }

    const snapType = cs.getPropertyValue('scroll-snap-type') ?? '';
    if (snapType && snapType !== 'none') {
      const snapAlign = cs.getPropertyValue('scroll-snap-align') ?? 'none';
      scrollSnapContainers.push({ snapType, snapAlign });
    }
  }

  return { stickyElements, fixedElements, scrollSnapContainers };
}

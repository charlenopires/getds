/**
 * Flexbox extraction — Spec: f87063a1 — Grid and Layout Extraction
 *
 * Detects elements using Flexbox layout and extracts their flex properties:
 * flex-direction, flex-wrap, justify-content, align-items, gap.
 */

/**
 * @typedef {{
 *   flexDirection: string,
 *   flexWrap: string,
 *   justifyContent: string,
 *   alignItems: string,
 *   gap: string
 * }} FlexDescriptor
 */

/**
 * Extract Flexbox layout descriptors from a list of computed style objects.
 *
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {FlexDescriptor[]}
 */
export function extractFlexDescriptors(computedStyles) {
  const results = [];

  for (const cs of computedStyles) {
    const display = cs.display ?? cs.getPropertyValue('display');
    if (display !== 'flex' && display !== 'inline-flex') continue;

    results.push({
      flexDirection:  cs.getPropertyValue('flex-direction')  ?? '',
      flexWrap:       cs.getPropertyValue('flex-wrap')       ?? '',
      justifyContent: cs.getPropertyValue('justify-content') ?? '',
      alignItems:     cs.getPropertyValue('align-items')     ?? '',
      gap:            cs.getPropertyValue('gap')             ?? '',
    });
  }

  return results;
}

/**
 * Extract flex child properties from computed styles of non-flex-container elements.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{ flexChildren: Array<{ flexBasis: string, flexGrow: string, flexShrink: string, order: string, count: number }> }}
 */
export function extractFlexChildProperties(computedStyles) {
  const seen = new Map();

  for (const cs of computedStyles) {
    const flexBasis  = cs.getPropertyValue('flex-basis')  ?? 'auto';
    const flexGrow   = cs.getPropertyValue('flex-grow')   ?? '0';
    const flexShrink = cs.getPropertyValue('flex-shrink') ?? '1';
    const order      = cs.getPropertyValue('order')       ?? '0';

    // Skip default values
    if (flexBasis === 'auto' && flexGrow === '0' && flexShrink === '1' && order === '0') continue;

    const sig = `${flexBasis}|${flexGrow}|${flexShrink}|${order}`;
    if (!seen.has(sig)) {
      seen.set(sig, { flexBasis, flexGrow, flexShrink, order, count: 0 });
    }
    seen.get(sig).count++;
  }

  return { flexChildren: Array.from(seen.values()) };
}

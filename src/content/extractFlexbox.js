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

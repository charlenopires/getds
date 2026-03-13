/**
 * Component variant detection — Spec: 86aa4a39 — UI Component Detection
 *
 * Groups component instances of the same type by style signature.
 * Instances whose key style properties match form a single variant.
 * Differences between variant groups are recorded as distinguishingProps.
 */

const VARIANT_STYLE_KEYS = [
  'background-color',
  'color',
  'border',
  'font-weight',
  'font-size',
  'border-radius',
];

/**
 * Build a style signature string used to cluster components into variants.
 */
function styleSignature(styles) {
  return VARIANT_STYLE_KEYS
    .map(key => `${key}:${styles[key] ?? ''}`)
    .join('|');
}

/**
 * Find which style keys differ across a collection of style objects.
 */
function findDistinguishingProps(variantStylesList) {
  if (variantStylesList.length <= 1) return [];

  const diffKeys = [];
  for (const key of VARIANT_STYLE_KEYS) {
    const values = new Set(variantStylesList.map(s => s[key] ?? ''));
    if (values.size > 1) diffKeys.push(key);
  }
  return diffKeys;
}

/**
 * Detect component variants by clustering instances with identical style signatures.
 *
 * @param {Array<{ tag: string, classes: string[], styles: Record<string, string> }>} components
 * @returns {Array<{
 *   styles: Record<string, string>,
 *   classes: string[],
 *   instanceCount: number,
 *   distinguishingProps: string[]
 * }>}
 */
export function detectComponentVariants(components) {
  if (components.length === 0) return [];

  // Group by style signature
  const groups = new Map(); // signature → { styles, classSet, count }

  for (const comp of components) {
    const sig = styleSignature(comp.styles ?? {});
    if (!groups.has(sig)) {
      groups.set(sig, {
        styles: comp.styles ?? {},
        classSet: new Set(comp.classes ?? []),
        count: 0,
      });
    }
    const group = groups.get(sig);
    group.count += 1;
    for (const cls of comp.classes ?? []) group.classSet.add(cls);
  }

  const allStyles = [...groups.values()].map(g => g.styles);
  const distinguishing = findDistinguishingProps(allStyles);

  return [...groups.values()].map(group => ({
    styles: group.styles,
    classes: [...group.classSet],
    instanceCount: group.count,
    distinguishingProps: distinguishing,
  }));
}

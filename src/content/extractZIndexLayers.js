/**
 * Z-index layer extraction — Visual Foundations
 * Collects z-index values and infers semantic roles.
 */

const ROLE_MAP = [
  { min: -Infinity, max: -1,    role: 'below' },
  { min: 0,         max: 9,     role: 'base' },
  { min: 10,        max: 99,    role: 'dropdown' },
  { min: 100,       max: 999,   role: 'sticky' },
  { min: 1000,      max: 9999,  role: 'modal' },
  { min: 10000,     max: Infinity, role: 'toast' },
];

/**
 * Infer a semantic role from a z-index value.
 * @param {number} value
 * @returns {string}
 */
export function inferZIndexRole(value) {
  for (const { min, max, role } of ROLE_MAP) {
    if (value >= min && value <= max) return role;
  }
  return 'unknown';
}

/**
 * Extract z-index layers from computed styles.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{ zIndexLayers: Array<{ value: number, count: number, inferredRole: string }> }}
 */
export function extractZIndexLayers(computedStyles) {
  const freq = new Map();

  for (const cs of computedStyles) {
    const raw = cs.getPropertyValue('z-index') ?? '';
    if (raw === 'auto' || raw === '' || raw === 'none') continue;
    const val = parseInt(raw, 10);
    if (Number.isNaN(val)) continue;
    freq.set(val, (freq.get(val) ?? 0) + 1);
  }

  const zIndexLayers = [...freq.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, count]) => ({ value, count, inferredRole: inferZIndexRole(value) }));

  return { zIndexLayers };
}

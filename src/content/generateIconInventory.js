/**
 * Icon inventory generation — Spec: 4e6f0589 — Iconography and Asset Detection
 *
 * Aggregates icons by identifier + sourceType + context, counting instances.
 */

/**
 * @typedef {{ identifier: string, sourceType: string, context: string }} IconEntry
 * @typedef {{ identifier: string, sourceType: string, context: string, count: number }} InventoryRow
 */

/**
 * Generate an icon inventory table from a flat list of icon entries.
 * Groups by (identifier, sourceType, context) and counts instances.
 * Result is sorted by count descending.
 *
 * @param {IconEntry[]} icons
 * @returns {InventoryRow[]}
 */
export function generateIconInventory(icons) {
  /** @type {Map<string, InventoryRow>} */
  const map = new Map();

  for (const { identifier, sourceType, context } of icons) {
    const key = `${identifier}||${sourceType}||${context}`;
    if (map.has(key)) {
      map.get(key).count++;
    } else {
      map.set(key, { identifier, sourceType, context, count: 1 });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

/**
 * Container width extraction — Spec: f87063a1 — Grid and Layout Extraction
 *
 * Extracts max-width and explicit width values from computed styles,
 * deduplicating entries to build a set of content width constraints.
 *
 * Ignores:
 *   - max-width: none
 *   - width: auto
 *   - width: 100%  (full-bleed, not a container constraint)
 */

const SKIP_WIDTHS = new Set(['auto', '100%', '']);
const SKIP_MAX_WIDTHS = new Set(['none', '']);

/**
 * @typedef {{ maxWidth: string, width: string }} ContainerWidth
 */

/**
 * Extract unique container width constraints from computed styles.
 *
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {ContainerWidth[]}
 */
export function extractContainerWidths(computedStyles) {
  const seen = new Map(); // key → ContainerWidth

  for (const cs of computedStyles) {
    const maxWidth = cs.getPropertyValue('max-width') ?? '';
    const width    = cs.getPropertyValue('width')     ?? '';

    const hasMaxWidth = !SKIP_MAX_WIDTHS.has(maxWidth);
    const hasWidth    = !SKIP_WIDTHS.has(width);

    if (!hasMaxWidth && !hasWidth) continue;

    const key = `${maxWidth}|${width}`;
    if (!seen.has(key)) {
      seen.set(key, {
        maxWidth: hasMaxWidth ? maxWidth : '',
        width:    hasWidth    ? width    : '',
      });
    }
  }

  return Array.from(seen.values());
}

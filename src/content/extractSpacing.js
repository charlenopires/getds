/**
 * Spacing extraction — Spec: 29ea3708 — Spacing System Extraction
 *
 * Extracts all unique, non-zero spacing values (margin, padding, gap)
 * from computed styles of every visible DOM element.
  * 
 * @example
 * // Usage of extractSpacing
*/

const SPACING_PROPERTIES = [
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'row-gap', 'column-gap',
];

const ZERO_VALUES = new Set(['0px', '0', '0em', '0rem', '']);

/**

 * Executes the isVisible functionality.

 * 

 * @param {any} computed - The computed parameter.

 * @returns {any} Result of isVisible.

 * 

 * @example

 * isVisible(computed);

 */

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**
 * @returns {{
 *   values: Array<{ value: string, properties: string[] }>
 * }}
 */
export function extractSpacing() {
  // value → Set of property names it appeared on
  const seen = new Map();

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    for (const prop of SPACING_PROPERTIES) {
      const value = computed.getPropertyValue(prop).trim();
      if (!value || ZERO_VALUES.has(value)) continue;

      if (!seen.has(value)) {
        seen.set(value, new Set());
      }
      seen.get(value).add(prop);
    }
  }

  const values = Array.from(seen.entries()).map(([value, props]) => ({
    value,
    properties: Array.from(props),
  }));

  return { values };
}

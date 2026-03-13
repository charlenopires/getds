/**
 * Type scale extraction — Spec: f7625baf — Typography System Extraction
 *
 * Extracts all unique font-size values from visible text elements,
 * parses them to a numeric px value, and returns a sorted type scale.
  * 
 * @example
 * // Usage of extractTypeScale
*/

const TEXT_TAGS = new Set([
  'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'li', 'td', 'th', 'label', 'button', 'input', 'textarea',
  'code', 'pre', 'blockquote', 'figcaption', 'caption', 'dt', 'dd',
  'strong', 'em', 'b', 'i', 'small', 'mark', 'cite', 'q',
]);

const BASE_FONT_SIZE_PX = 16; // standard browser default for rem conversion

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
 * Parse a CSS font-size value to a numeric px equivalent.
 * Returns null if not parseable.
 *
 * @param {string} value
 * @returns {{ px: number, remValue: number|null } | null}
 */
function parseFontSize(value) {
  const pxMatch  = value.match(/^([\d.]+)px$/);
  const remMatch = value.match(/^([\d.]+)rem$/);
  const emMatch  = value.match(/^([\d.]+)em$/);
  const ptMatch  = value.match(/^([\d.]+)pt$/);

  if (pxMatch)  return { px: Number(pxMatch[1]),  remValue: null };
  if (remMatch) return { px: Number(remMatch[1]) * BASE_FONT_SIZE_PX, remValue: Number(remMatch[1]) };
  if (emMatch)  return { px: Number(emMatch[1])  * BASE_FONT_SIZE_PX, remValue: null };
  if (ptMatch)  return { px: Math.round(Number(ptMatch[1]) * 1.333), remValue: null };
  return null;
}

/**
 * @returns {{ scale: Array<{ value: string, px: number, remValue: number|null, step: number }> }}
 */
export function extractTypeScale() {
  const seen    = new Map(); // value → { px, remValue }
  const elements = Array.from(document.getElementsByTagName('*'));

  for (const el of elements) {
    if (!TEXT_TAGS.has(el.tagName.toLowerCase())) continue;

    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const value = computed.getPropertyValue('font-size').trim();
    if (!value || seen.has(value)) continue;

    const parsed = parseFontSize(value);
    if (!parsed) continue;

    seen.set(value, parsed);
  }

  // Sort ascending by px value, assign 1-based step index
  const sorted = [...seen.entries()]
    .sort((a, b) => a[1].px - b[1].px)
    .map(([value, { px, remValue }], i) => ({
      step: i + 1,
      value,
      px,
      remValue,
    }));

  return { scale: sorted };
}

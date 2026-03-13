/**
 * Type style extraction — Spec: f7625baf — Typography System Extraction
 *
 * Extracts font-weight, line-height, letter-spacing, and text-transform
 * for each distinct type style found on visible text-containing elements.
  * 
 * @example
 * // Usage of extractTypeStyles
*/

const TEXT_TAGS = new Set([
  'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'li', 'td', 'th', 'label', 'button', 'input', 'textarea',
  'code', 'pre', 'blockquote', 'figcaption', 'caption', 'dt', 'dd',
  'strong', 'em', 'b', 'i', 'small', 'mark', 'cite', 'q',
]);

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
 * Build a deduplication key from the 5 typography properties.
 * Two elements with identical keys represent the same type style.
 */
function styleKey(fontSize, fontWeight, lineHeight, letterSpacing, textTransform) {
  return `${fontSize}|${fontWeight}|${lineHeight}|${letterSpacing}|${textTransform}`;
}

/**
 * @returns {{
 *   styles: Array<{
 *     tag: string,
 *     fontSize: string,
 *     fontWeight: string,
 *     lineHeight: string,
 *     letterSpacing: string,
 *     textTransform: string,
 *   }>
 * }}
 */
export function extractTypeStyles() {
  const seen   = new Set();
  const styles = [];

  for (const el of document.getElementsByTagName('*')) {
    const tag = el.tagName.toLowerCase();
    if (!TEXT_TAGS.has(tag)) continue;

    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const fontSize      = computed.getPropertyValue('font-size').trim();
    const fontWeight    = computed.getPropertyValue('font-weight').trim();
    const lineHeight    = computed.getPropertyValue('line-height').trim();
    const letterSpacing = computed.getPropertyValue('letter-spacing').trim();
    const textTransform = computed.getPropertyValue('text-transform').trim();

    if (!fontSize) continue;

    const key = styleKey(fontSize, fontWeight, lineHeight, letterSpacing, textTransform);
    if (seen.has(key)) continue;
    seen.add(key);

    styles.push({ tag, fontSize, fontWeight, lineHeight, letterSpacing, textTransform });
  }

  return { styles };
}

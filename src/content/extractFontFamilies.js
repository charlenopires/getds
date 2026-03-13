/**
 * Font family extraction — Spec: f7625baf — Typography System Extraction
 *
 * Extracts all unique font-family stacks from computed styles across
 * every visible, text-containing DOM element.
 */

const GENERIC_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace',
  'ui-rounded', 'math', 'emoji', 'fangsong',
]);

/** Tags that contain text and are worth inspecting for typography */
const TEXT_TAGS = new Set([
  'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'li', 'td', 'th', 'label', 'button', 'input', 'textarea',
  'code', 'pre', 'blockquote', 'figcaption', 'caption', 'dt', 'dd',
  'strong', 'em', 'b', 'i', 'small', 'mark', 'cite', 'q',
]);

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**
 * Parse a font-family stack string into individual family names.
 * Handles quoted names and comma separation.
 *
 * @param {string} stack — e.g. '"Inter", Arial, sans-serif'
 * @returns {string[]}
 */
function parseFamilies(stack) {
  return stack
    .split(',')
    .map(f => f.trim().replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

/**
 * Extract the primary (first non-generic) font name from a family list.
 *
 * @param {string[]} families
 * @returns {string}
 */
function primaryFont(families) {
  return families.find(f => !GENERIC_FAMILIES.has(f.toLowerCase())) ?? families[0] ?? '';
}

/**
 * Extract the generic family keyword from a family list (last one, if generic).
 *
 * @param {string[]} families
 * @returns {string|null}
 */
function genericFamily(families) {
  const last = families[families.length - 1]?.toLowerCase();
  return last && GENERIC_FAMILIES.has(last) ? last : null;
}

/**
 * @returns {{ fonts: Array<{ stack: string, primary: string, generic: string|null }> }}
 */
export function extractFontFamilies() {
  const seen  = new Set();
  const fonts = [];

  const elements = Array.from(document.getElementsByTagName('*'));

  for (const el of elements) {
    if (!TEXT_TAGS.has(el.tagName.toLowerCase())) continue;

    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const stack = computed.getPropertyValue('font-family').trim();
    if (!stack || seen.has(stack)) continue;

    seen.add(stack);
    const families = parseFamilies(stack);

    fonts.push({
      stack,
      primary: primaryFont(families),
      generic: genericFamily(families),
    });
  }

  return { fonts };
}

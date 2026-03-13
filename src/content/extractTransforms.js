/**
 * Transform extraction — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Extracts transform property values from computed styles and parses
 * which transform functions (translate, rotate, scale, skew, matrix) are used.
  * 
 * @example
 * // Usage of extractTransforms
*/

const TRANSFORM_FN_RE = /(\w+)\s*\(/g;

const KNOWN_TRANSFORM_FNS = new Set([
  'translate', 'translateX', 'translateY', 'translateZ', 'translate3d',
  'rotate', 'rotateX', 'rotateY', 'rotateZ', 'rotate3d',
  'scale', 'scaleX', 'scaleY', 'scaleZ', 'scale3d',
  'skew', 'skewX', 'skewY',
  'matrix', 'matrix3d',
  'perspective',
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
 * Parse a CSS transform value string and return the list of transform function names used.
 *
 * @param {string} value — e.g. "translateX(10px) rotate(45deg)"
 * @returns {string[]}
 */
export function parseTransformFunctions(value) {
  if (!value || value === 'none') return [];

  const fns = [];
  TRANSFORM_FN_RE.lastIndex = 0;
  let match;

  while ((match = TRANSFORM_FN_RE.exec(value)) !== null) {
    const fn = match[1];
    if (KNOWN_TRANSFORM_FNS.has(fn)) fns.push(fn);
  }

  return fns;
}

/**
 * @returns {{ transforms: Array<{ value: string, functions: string[] }> }}
 */
export function extractTransforms() {
  const seen = new Set();
  const transforms = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const value = computed.getPropertyValue('transform').trim();
    if (!value || value === 'none') continue;
    if (seen.has(value)) continue;
    seen.add(value);

    const functions = parseTransformFunctions(value);
    transforms.push({ value, functions });
  }

  return { transforms };
}

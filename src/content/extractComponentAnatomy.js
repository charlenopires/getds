/**
 * Component anatomy extraction — Spec: 86aa4a39 — UI Component Detection
 *
 * Documents a component's DOM subtree structure and key computed styles
 * for each constituent element.
  * 
 * @example
 * // Usage of extractComponentAnatomy
*/

const ANATOMY_STYLE_KEYS = [
  'color',
  'background-color',
  'font-size',
  'border',
  'padding',
  'border-radius',
];

/**

 * Executes the classArray functionality.

 * 

 * @param {any} el - The el parameter.

 * @returns {any} Result of classArray.

 * 

 * @example

 * classArray(el);

 */

function classArray(el) {
  return el.className ? String(el.className).trim().split(/\s+/).filter(Boolean) : [];
}

/**

 * Executes the extractStyles functionality.

 * 

 * @param {any} el - The el parameter.

 * @returns {any} Result of extractStyles.

 * 

 * @example

 * extractStyles(el);

 */

function extractStyles(el) {
  const computed = getComputedStyle(el);
  const styles = {};
  for (const key of ANATOMY_STYLE_KEYS) {
    styles[key] = computed.getPropertyValue(key) ?? '';
  }
  return styles;
}

/**
 * Recursively extract the anatomy of a DOM element — one level of children only
 * (shallow, not deep, to keep output manageable).
 *
 * @param {Element} el
 * @returns {{
 *   tag: string,
 *   classes: string[],
 *   role: string|null,
 *   styles: Record<string, string>,
 *   children: Array<{ tag, classes, role, styles, children }>
 * }}
 */
export function extractComponentAnatomy(el) {
  const children = Array.from(el.children).map(child => ({
    tag: child.tagName.toLowerCase(),
    classes: classArray(child),
    role: child.getAttribute('role') ?? null,
    styles: extractStyles(child),
    children: [],
  }));

  return {
    tag: el.tagName.toLowerCase(),
    classes: classArray(el),
    role: el.getAttribute('role') ?? null,
    styles: extractStyles(el),
    children,
  };
}

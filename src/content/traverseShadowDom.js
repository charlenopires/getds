/**
 * Shadow DOM traversal — Spec: 21d9e937 — Protected Page Resilience
 *
 * Recursively collects all DOM elements including those inside open shadow
 * roots. Closed shadow roots (shadowRoot === null) are silently skipped —
 * they are reported as limitations by detectShadowLimitations.js.
 */

/**
 * Recursively walk a list of elements, descending into:
 *   - element.children  (light DOM)
 *   - element.shadowRoot.children  (open shadow DOM, if present)
 *
 * @param {ArrayLike<Element>} elements
 * @param {Element[]} [acc]
 * @returns {Element[]}
 */
export function collectAllElements(elements, acc = []) {
  for (const el of elements) {
    acc.push(el);

    if (el.children && el.children.length > 0) {
      collectAllElements(el.children, acc);
    }

    if (el.shadowRoot && el.shadowRoot.children) {
      collectAllElements(el.shadowRoot.children, acc);
    }
  }
  return acc;
}

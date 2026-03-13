/**
 * Closed shadow DOM limitation detection — Spec: 21d9e937 — Protected Page Resilience
 *
 * Identifies custom elements (tag names containing a hyphen) whose shadowRoot
 * is null, indicating a closed shadow root that cannot be traversed.
 * Each such element is recorded as a structured limitation.
 */

/**
 * @typedef {{ layer: string, message: string, element: string }} Limitation
 */

/**
 * Scan a flat element list for custom elements with null shadowRoot (closed shadow DOM).
 *
 * Custom elements are identified by a hyphen in their tag name per the HTML spec.
 *
 * @param {Element[]} elements
 * @returns {Limitation[]}
 */
export function detectClosedShadowRoots(elements) {
  const limitations = [];

  for (const el of elements) {
    const tag = (el.tagName ?? '').toLowerCase();
    const isCustomElement = tag.includes('-');
    if (isCustomElement && el.shadowRoot === null) {
      limitations.push({
        layer: 'visual-foundations',
        message: `Closed shadow DOM on <${tag}>: styles inside this shadow root cannot be extracted.`,
        element: tag,
      });
    }
  }

  return limitations;
}

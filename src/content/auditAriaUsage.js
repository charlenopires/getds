/**
 * ARIA usage audit — Spec: 10ab6f26 — Accessibility Audit
 *
 * Collects all ARIA roles, states, and properties from elements,
 * then detects common misuse patterns.
 */

/** Interactive element tags that should NOT have aria-hidden=true */
const FOCUSABLE_TAGS = new Set(['a', 'button', 'input', 'select', 'textarea', 'details', 'summary']);

/**
 * @typedef {{ tag: string, role: string|null, ariaAttrs: Array<{name:string,value:string}> }} AriaUsage
 * @typedef {{ type: string, message: string, severity: string }} AriaIssue
 */

/**
 * Collect ARIA attributes from a list of elements.
 * Only elements with at least one ARIA attribute or role are included.
 *
 * @param {Element[]} elements
 * @returns {AriaUsage[]}
 */
export function collectAriaUsage(elements) {
  const results = [];

  for (const el of elements) {
    const tag  = (el.tagName ?? '').toLowerCase();
    const role = el.getAttribute('role');
    const ariaAttrs = Array.from(el.attributes ?? [])
      .filter(a => a.name.startsWith('aria-'))
      .map(a => ({ name: a.name, value: a.value }));

    if (!role && ariaAttrs.length === 0) continue;

    results.push({ tag, role, ariaAttrs });
  }

  return results;
}

/**
 * Detect common ARIA misuse patterns from collected usage data.
 *
 * Checks:
 *   1. aria-hidden=true on a natively focusable element
 *   2. role=button on a non-interactive element (div/span) without keyboard handling signal
 *
 * @param {AriaUsage[]} usages
 * @returns {AriaIssue[]}
 */
export function detectAriaMisuses(usages) {
  const issues = [];

  for (const { tag, role, ariaAttrs } of usages) {
    // aria-hidden=true on focusable element
    const isHidden = ariaAttrs.some(a => a.name === 'aria-hidden' && a.value === 'true');
    if (isHidden && FOCUSABLE_TAGS.has(tag)) {
      issues.push({
        type: 'aria-hidden-focusable',
        message: `<${tag}> has aria-hidden="true" but is natively focusable — it will still be reachable by keyboard.`,
        severity: 'critical',
      });
    }

    // role=button on non-interactive element
    if (role === 'button' && !FOCUSABLE_TAGS.has(tag)) {
      issues.push({
        type: 'role-button-non-interactive',
        message: `<${tag}> has role="button" but is not natively interactive. Ensure tabindex="0" and keyboard event handlers are present.`,
        severity: 'major',
      });
    }
  }

  return issues;
}

/**
 * CSP restriction detection — Spec: 21d9e937 — Protected Page Resilience
 *
 * Inspects the page's Content-Security-Policy meta tag to detect directives
 * that would block inline script execution, which is required for the content
 * script to call injected helper functions.
 *
 * A CSP is considered restrictive when:
 *   - script-src or default-src is present AND does NOT include 'unsafe-inline'
 */

/**
 * @typedef {{ layer: string, message: string, element: string }} Limitation
 */

/** Directives that govern script execution */
const SCRIPT_DIRECTIVES = ['script-src', 'default-src'];

/**
 * Parse a CSP policy string into a map of directive → values[].
 *
 * @param {string} policy
 * @returns {Map<string, string[]>}
 */
function parseCsp(policy) {
  const map = new Map();
  for (const part of policy.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const [directive, ...values] = tokens;
    map.set(directive.toLowerCase(), values);
  }
  return map;
}

/**
 * Detect CSP restrictions that may block content-script inline execution.
 *
 * @param {Document} [doc]
 * @returns {Limitation[]}
 */
export function detectCspLimitations(doc = document) {
  const metaEl = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!metaEl) return [];

  const policy = metaEl.getAttribute('content') ?? '';
  const directives = parseCsp(policy);

  for (const directive of SCRIPT_DIRECTIVES) {
    if (!directives.has(directive)) continue;
    const values = directives.get(directive);
    const allowsInline = values.includes("'unsafe-inline'");
    if (!allowsInline) {
      return [{
        layer: 'visual-foundations',
        message: `CSP restriction detected: '${directive}' does not include 'unsafe-inline'. Script execution may be blocked, limiting extraction capabilities.`,
        element: `meta[http-equiv="Content-Security-Policy"]`,
      }];
    }
  }

  return [];
}

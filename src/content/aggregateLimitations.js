/**
 * Limitations aggregation — Spec: 21d9e937 — Protected Page Resilience
 *
 * Collects structured limitation descriptors from all resilience checks
 * (shadow DOM, CSP, cross-origin stylesheets) into a single flat warnings
 * array that is passed to the Markdown generator's limitations section.
 */

/**
 * @typedef {{ layer: string, message: string, element: string }} Limitation
 */

/**
 * Merge limitation arrays from known sources into one flat warnings array.
 *
 * Recognised keys: shadow, csp, crossOrigin.
 * Unknown keys are ignored.
 *
 * @param {{ shadow?: Limitation[], csp?: Limitation[], crossOrigin?: Limitation[] }} sources
 * @returns {Limitation[]}
 */
export function aggregateLimitations({ shadow = [], csp = [], crossOrigin = [] } = {}) {
  return [...shadow, ...csp, ...crossOrigin];
}

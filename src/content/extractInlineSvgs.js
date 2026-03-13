/**
 * Inline SVG extraction — Spec: 4e6f0589 — Iconography and Asset Detection
 *
 * Extracts viewBox, path data, label, and contextual usage from inline SVG elements.
 */

const INTERACTIVE_PARENTS = new Set(['BUTTON', 'A']);
const NAV_PARENTS = new Set(['NAV']);

/**
 * Extract descriptor data from an inline SVG element.
 *
 * @param {SVGElement} svg
 * @returns {{ viewBox: string|null, paths: string[], label: string|null, ariaHidden: boolean }}
 */
export function extractSvgDescriptor(svg) {
  const viewBox = svg.getAttribute('viewBox');

  const pathEls = svg.querySelectorAll('path');
  const paths = Array.from(pathEls)
    .map(p => p.getAttribute('d'))
    .filter(Boolean);

  const ariaLabel = svg.getAttribute('aria-label');
  const titleEls = svg.querySelectorAll('title');
  const titleText = titleEls.length > 0 ? titleEls[0].textContent : null;
  const label = ariaLabel ?? titleText ?? null;

  const ariaHidden = svg.getAttribute('aria-hidden') === 'true';

  return { viewBox, paths, label, ariaHidden };
}

/**
 * Classify the usage context of an SVG based on its DOM position and ARIA attributes.
 *
 * @param {SVGElement} svg
 * @returns {'decorative'|'action'|'navigation'|'informative'}
 */
export function classifySvgContext(svg) {
  const ariaHidden = svg.getAttribute('aria-hidden') === 'true';
  if (ariaHidden) return 'decorative';

  const parentTag = svg.parentElement?.tagName ?? '';

  if (NAV_PARENTS.has(parentTag)) return 'navigation';
  if (INTERACTIVE_PARENTS.has(parentTag)) return 'action';

  const ariaLabel = svg.getAttribute('aria-label');
  if (ariaLabel) return 'informative';

  return 'decorative';
}

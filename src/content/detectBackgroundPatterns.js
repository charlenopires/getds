/**
 * CSS background-image pattern detection — Spec: 4e6f0589 — Iconography and Asset Detection
 *
 * Classifies background-image values as gradient, pattern, svg, image, or none.
 */

import { isSvgUrl } from './detectSvgReferences.js';

/**
 * Classify a CSS background-image value.
 *
 * @param {string} value
 * @returns {'gradient'|'pattern'|'svg'|'image'|'none'}
 */
export function classifyBackgroundImage(value) {
  if (!value || value === 'none') return 'none';

  if (/^repeating-(radial|conic)-gradient/i.test(value)) return 'pattern';
  if (/gradient\s*\(/i.test(value)) return 'gradient';

  const urlMatch = value.match(/url\(["']?([^"')]+)["']?\)/i);
  if (urlMatch) {
    const url = urlMatch[1];
    if (isSvgUrl(url)) return 'svg';
    return 'image';
  }

  return 'none';
}

/**
 * Collect unique background-image patterns from an array of computed styles.
 *
 * @param {Array<{ getPropertyValue: Function }>} computedStyles
 * @returns {Array<{ value: string, type: 'gradient'|'pattern'|'svg'|'image' }>}
 */
export function extractBackgroundPatterns(computedStyles) {
  const seen = new Set();
  const results = [];

  for (const cs of computedStyles) {
    const value = cs.getPropertyValue('background-image');
    const type = classifyBackgroundImage(value);
    if (type === 'none') continue;
    if (seen.has(value)) continue;
    seen.add(value);
    results.push({ value, type });
  }

  return results;
}

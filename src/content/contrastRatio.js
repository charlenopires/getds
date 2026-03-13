/**
 * WCAG 2.1 contrast ratio calculation — Spec: 10ab6f26 — Accessibility Audit
 *
 * Implements the WCAG 2.1 relative luminance and contrast ratio formulas:
 *   https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *   https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

/** Regex to match rgb() or rgba() color strings */
const RGB_RE = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/;

/**
 * Parse a CSS rgb/rgba color string into an [r, g, b] tuple.
 *
 * @param {string} value
 * @returns {[number, number, number]|null}
 */
export function parseRgb(value) {
  const m = (value ?? '').match(RGB_RE);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

/**
 * Convert a single 8-bit channel value to its linearized form.
 * @param {number} c  0–255
 * @returns {number}
 */
function linearize(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/**
 * Compute the WCAG 2.1 relative luminance of an sRGB color.
 *
 * @param {[number, number, number]} rgb  Values in range 0–255
 * @returns {number}  Luminance in range [0, 1]
 */
export function relativeLuminance([r, g, b]) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Compute the WCAG 2.1 contrast ratio between two sRGB colors.
 *
 * The ratio is always ≥ 1 (lighter color / darker color + 0.05 each).
 *
 * @param {[number, number, number]} rgb1
 * @param {[number, number, number]} rgb2
 * @returns {number}
 */
export function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

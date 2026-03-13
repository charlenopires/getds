/**
 * Spacing base unit inference — Spec: 29ea3708 — Spacing System Extraction
 *
 * Finds the greatest common divisor (GCD) of the most frequent spacing px values
 * to infer the base design unit (typically 4 or 8).
  * 
 * @example
 * // Usage of inferSpacingBase
*/

/**
 * Euclidean GCD for two non-negative integers.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Compute the GCD of all values in an array of integers.
 *
 * @param {number[]} values
 * @returns {number}
 */
function gcdAll(values) {
  return values.reduce((acc, v) => gcd(acc, v));
}

/**
 * Infer the base spacing unit from a list of spacing entries with px values.
 *
 * Algorithm:
 *   1. Filter out null/zero px values
 *   2. Round px values to integers (sub-pixel values are noise)
 *   3. Compute GCD of all unique integer px values
 *   4. Confidence = fraction of values that are exact multiples of the base unit
 *
 * @param {Array<{ px: number | null }>} values
 * @returns {{ baseUnit: number | null, confidence: number }}
 */
export function inferBaseUnit(values) {
  const pxValues = values
    .map(v => v.px)
    .filter(v => v !== null && v > 0)
    .map(v => Math.round(v));

  if (pxValues.length === 0) return { baseUnit: null, confidence: 0 };

  const uniquePx = [...new Set(pxValues)];
  const base = gcdAll(uniquePx);

  // Confidence: proportion of all px values that are exact multiples of base
  const fitting  = pxValues.filter(v => v % base === 0).length;
  const confidence = fitting / pxValues.length;

  return { baseUnit: base, confidence: Math.round(confidence * 1000) / 1000 };
}

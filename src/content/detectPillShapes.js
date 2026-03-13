/**
 * Pill-shape detection — Spec: 7c17b9ef — Elevation and Border Radius Extraction
 *
 * Identifies border-radius values that produce pill or circle shapes.
  * 
 * @example
 * // Usage of detectPillShapes
*/

/**
 * Determine if a border-radius CSS value represents a full/pill radius.
 *
 * @param {string|null} value
 * @returns {boolean}
 */
export function isPillRadius(value) {
  if (!value) return false;

  const pctMatch = value.match(/^([\d.]+)%$/);
  if (pctMatch) return Number(pctMatch[1]) >= 50;

  const pxMatch = value.match(/^([\d.]+)px$/);
  if (pxMatch) return Number(pxMatch[1]) >= 9999;

  return false;
}

/**
 * Filter a radii array to only pill-shaped entries.
 *
 * @param {Array<{ value: string }>} radii
 * @returns {{ pills: Array<{ value: string }> }}
 */
export function detectPillShapes(radii) {
  return { pills: radii.filter(r => isPillRadius(r.value)) };
}

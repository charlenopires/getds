/**
 * Spacing unit conversion — Spec: 29ea3708 — Spacing System Extraction
 *
 * Converts CSS spacing values (px, rem, em, pt) to numeric pixel values
 * for comparison and grid analysis.
 */

const BASE_PX = 16; // standard browser root font size for rem/em conversion

/**
 * Parse a CSS length value to its pixel equivalent.
 * Returns null for values that cannot be resolved without context (%, auto, etc.).
 *
 * @param {string} value
 * @returns {number | null}
 */
export function spacingValueToPx(value) {
  if (!value) return null;

  const pxMatch  = value.match(/^([\d.]+)px$/);
  const remMatch = value.match(/^([\d.]+)rem$/);
  const emMatch  = value.match(/^([\d.]+)em$/);
  const ptMatch  = value.match(/^([\d.]+)pt$/);

  if (pxMatch)  return Number(pxMatch[1]);
  if (remMatch) return Number(remMatch[1]) * BASE_PX;
  if (emMatch)  return Number(emMatch[1])  * BASE_PX;
  if (ptMatch)  return Math.round(Number(ptMatch[1]) * 1.333);

  return null;
}

/**
 * Add a `px` numeric field to each spacing value entry.
 *
 * @param {Array<{ value: string, properties: string[] }>} values — from extractSpacing()
 * @returns {Array<{ value: string, properties: string[], px: number | null }>}
 */
export function enrichSpacingWithPx(values) {
  return values.map(entry => ({
    ...entry,
    px: spacingValueToPx(entry.value),
  }));
}

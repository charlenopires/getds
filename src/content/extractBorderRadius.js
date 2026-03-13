/**
 * Border-radius extraction — Spec: 7c17b9ef — Elevation and Border Radius Extraction
 */

/**
 * Extract unique border-radius values from all elements in the document.
 * Skips 0px and empty values.
 *
 * @returns {{ radii: Array<{ value: string }> }}
 */
export function extractBorderRadius() {
  const elements = document.getElementsByTagName('*');
  const seen = new Set();

  for (const el of elements) {
    const value = getComputedStyle(el).getPropertyValue('border-radius').trim();
    if (!value || value === '0px' || value === '0') continue;
    seen.add(value);
  }

  return { radii: [...seen].map(value => ({ value })) };
}

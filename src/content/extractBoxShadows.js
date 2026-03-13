/**
 * Box-shadow extraction — Spec: 7c17b9ef — Elevation and Border Radius Extraction
 *
 * Collects all unique box-shadow values from computed styles across every element.
 */

/**
 * Extract unique box-shadow values from all elements in the document.
 *
 * @returns {{ shadows: Array<{ value: string }> }}
 */
export function extractBoxShadows() {
  const elements = document.getElementsByTagName('*');
  const seen = new Set();

  for (const el of elements) {
    const value = getComputedStyle(el).getPropertyValue('box-shadow').trim();
    if (!value || value === 'none') continue;
    seen.add(value);
  }

  return { shadows: [...seen].map(value => ({ value })) };
}

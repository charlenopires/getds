/**
 * Text-shadow extraction — Spec: 7c17b9ef — Elevation and Border Radius Extraction
 */

/**
 * Extract unique text-shadow values from all elements in the document.
 *
 * @returns {{ shadows: Array<{ value: string }> }}
 */
export function extractTextShadows() {
  const elements = document.getElementsByTagName('*');
  const seen = new Set();

  for (const el of elements) {
    const value = getComputedStyle(el).getPropertyValue('text-shadow').trim();
    if (!value || value === 'none') continue;
    seen.add(value);
  }

  return { shadows: [...seen].map(value => ({ value })) };
}

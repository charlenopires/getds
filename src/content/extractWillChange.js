/**
 * will-change hints extraction
 *
 * Extracts will-change property values from computed styles and
 * aggregates them by frequency. Ignores `auto` (the default).
 *
 * @returns {{ willChangeHints: Array<{ property: string, count: number }> }}
 */

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**
 * @returns {{ willChangeHints: Array<{ property: string, count: number }> }}
 */
export function extractWillChange() {
  const counts = {};

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const value = computed.getPropertyValue('will-change').trim();
    if (!value || value === 'auto') continue;

    // will-change can list multiple properties: "transform, opacity"
    const props = value.split(',').map(p => p.trim()).filter(Boolean);
    for (const prop of props) {
      counts[prop] = (counts[prop] ?? 0) + 1;
    }
  }

  const willChangeHints = Object.entries(counts)
    .map(([property, count]) => ({ property, count }))
    .sort((a, b) => b.count - a.count);

  return { willChangeHints };
}

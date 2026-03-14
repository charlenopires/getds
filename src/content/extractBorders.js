// -- Border Extraction --------------------------------------------------------
// Follows the same iterate+dedup pattern as extractBorderRadius.js.

/**
 * Extract unique border declarations from all visible elements.
 *
 * @returns {{ borders: Array<{width: string, style: string, color: string, count: number}> }}
 */
export function extractBorders() {
  const map = new Map();
  let els;
  try {
    els = document.getElementsByTagName('*');
  } catch {
    return { borders: [] };
  }

  for (const el of els) {
    let cs;
    try {
      cs = getComputedStyle(el);
    } catch {
      continue;
    }

    const width = cs.borderTopWidth;
    const style = cs.borderTopStyle;
    const color = cs.borderTopColor;

    // Skip elements with no visible border
    if (!width || width === '0px' || !style || style === 'none') continue;

    const key = `${width}|${style}|${color}`;
    if (map.has(key)) {
      map.get(key).count++;
    } else {
      map.set(key, { width, style, color, count: 1 });
    }
  }

  const borders = [...map.values()].sort((a, b) => b.count - a.count);
  return { borders };
}

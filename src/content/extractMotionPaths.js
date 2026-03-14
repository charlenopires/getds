/**
 * Motion path extraction
 *
 * Extracts CSS motion path properties (offset-path, offset-distance,
 * offset-rotate, offset-anchor) from computed styles of visible elements.
 *
 * @returns {{ motionPaths: Array<{ selector: string, path: string, distance: string, rotate: string }> }}
 */

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

function buildSelector(el) {
  let label = el.tagName.toLowerCase();
  if (el.id) return '#' + el.id;
  if (el.classList.length) {
    const cls = Array.from(el.classList).filter(c => /^[\w-]+$/.test(c)).slice(0, 2).join('.');
    if (cls) label += '.' + cls;
  }
  return label;
}

/**
 * @returns {{ motionPaths: Array<{ selector: string, path: string, distance: string, rotate: string }> }}
 */
export function extractMotionPaths() {
  const motionPaths = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const path = computed.getPropertyValue('offset-path').trim();
    if (!path || path === 'none') continue;

    motionPaths.push({
      selector: buildSelector(el),
      path,
      distance: computed.getPropertyValue('offset-distance').trim() || '0%',
      rotate:   computed.getPropertyValue('offset-rotate').trim()   || 'auto',
    });
  }

  return { motionPaths };
}

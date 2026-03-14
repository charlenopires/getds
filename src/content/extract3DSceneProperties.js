/**
 * CSS 3D Scene Properties extraction — Layer 5
 *
 * Extracts CSS properties that create 3D rendering contexts:
 * perspective, perspectiveOrigin, transformStyle, backfaceVisibility.
 *
 * Only includes elements with at least one non-default value.
 *
 * @returns {{ css3DScenes: Array<{ selector: string, perspective: string|null, perspectiveOrigin: string|null, transformStyle: string|null, backfaceVisibility: string|null, childCount: number }> }}
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
 * @returns {{ css3DScenes: Array<{ selector: string, perspective: string|null, perspectiveOrigin: string|null, transformStyle: string|null, backfaceVisibility: string|null, childCount: number }> }}
 */
export function extract3DSceneProperties() {
  const css3DScenes = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const perspective = computed.getPropertyValue('perspective').trim();
    const perspectiveOrigin = computed.getPropertyValue('perspective-origin').trim();
    const transformStyle = computed.getPropertyValue('transform-style').trim();
    const backfaceVisibility = computed.getPropertyValue('backface-visibility').trim();

    const hasPerspective = perspective && perspective !== 'none';
    const hasOrigin = perspectiveOrigin && perspectiveOrigin !== '50% 50%';
    const hasPreserve3d = transformStyle && transformStyle !== 'flat';
    const hasBackface = backfaceVisibility && backfaceVisibility !== 'visible';

    if (!hasPerspective && !hasOrigin && !hasPreserve3d && !hasBackface) continue;

    css3DScenes.push({
      selector: buildSelector(el),
      perspective: hasPerspective ? perspective : null,
      perspectiveOrigin: hasOrigin ? perspectiveOrigin : null,
      transformStyle: hasPreserve3d ? transformStyle : null,
      backfaceVisibility: hasBackface ? backfaceVisibility : null,
      childCount: el.children.length,
    });
  }

  return { css3DScenes };
}

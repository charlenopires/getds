/**
 * Web Animations API extraction — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Calls element.getAnimations() on every visible DOM element to capture
 * JavaScript-driven animations and their timing metadata.
 */

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**
 * @returns {{ webAnimations: Array<{
 *   id: string,
 *   duration: number,
 *   delay: number,
 *   easing: string,
 *   fill: string,
 *   iterations: number,
 *   direction: string
 * }> }}
 */
export function extractWebAnimations() {
  const webAnimations = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    // getAnimations() is a Web Animations API method — not available in all environments
    if (typeof el.getAnimations !== 'function') continue;

    for (const anim of el.getAnimations()) {
      const timing = anim.effect?.getTiming?.() ?? {};

      webAnimations.push({
        id:         anim.id ?? '',
        duration:   timing.duration  ?? 0,
        delay:      timing.delay     ?? 0,
        easing:     timing.easing    ?? 'linear',
        fill:       timing.fill      ?? 'none',
        iterations: timing.iterations ?? 1,
        direction:  timing.direction  ?? 'normal',
      });
    }
  }

  return { webAnimations };
}

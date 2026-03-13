/**
 * CSS animation extraction — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Extracts the 7 animation sub-properties from computed styles of every
 * visible DOM element. Deduplicates by animation signature.
  * 
 * @example
 * // Usage of extractCssAnimations
*/

const SKIP_NAMES = new Set(['', 'none']);

/**

 * Executes the isVisible functionality.

 * 

 * @param {any} computed - The computed parameter.

 * @returns {any} Result of isVisible.

 * 

 * @example

 * isVisible(computed);

 */

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**
 * @returns {{ animations: Array<{
 *   name: string,
 *   duration: string,
 *   timingFunction: string,
 *   delay: string,
 *   iterationCount: string,
 *   direction: string,
 *   fillMode: string
 * }> }}
 */
export function extractCssAnimations() {
  const seen = new Set();
  const animations = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const name           = computed.getPropertyValue('animation-name').trim();
    if (!name || SKIP_NAMES.has(name)) continue;

    const duration       = computed.getPropertyValue('animation-duration').trim();
    const timingFunction = computed.getPropertyValue('animation-timing-function').trim();
    const delay          = computed.getPropertyValue('animation-delay').trim();
    const iterationCount = computed.getPropertyValue('animation-iteration-count').trim();
    const direction      = computed.getPropertyValue('animation-direction').trim();
    const fillMode       = computed.getPropertyValue('animation-fill-mode').trim();

    const sig = `${name}|${duration}|${timingFunction}|${delay}|${iterationCount}|${direction}|${fillMode}`;
    if (seen.has(sig)) continue;
    seen.add(sig);

    animations.push({ name, duration, timingFunction, delay, iterationCount, direction, fillMode });
  }

  return { animations };
}

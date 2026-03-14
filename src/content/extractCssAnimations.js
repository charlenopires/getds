/**
 * CSS animation extraction — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Extracts the 7 animation sub-properties from computed styles of every
 * visible DOM element. Deduplicates by animation signature.
 * Enhanced with category classification and element context.
 */

import { categorizeAnimation } from './categorizeAnimation.js';
import { buildElementContext } from './mapAnimationToElement.js';

const SKIP_NAMES = new Set(['', 'none']);

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
 *   fillMode: string,
 *   category: string,
 *   element: object|null
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

    let element = null;
    try { element = buildElementContext(el); } catch { /* ignore */ }

    const componentType = element?.componentType ?? 'unknown';
    const category = categorizeAnimation({ name, iterationCount, componentType });

    animations.push({ name, duration, timingFunction, delay, iterationCount, direction, fillMode, category, element });
  }

  return { animations };
}

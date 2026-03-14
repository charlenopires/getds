/**
 * Web Animations API extraction — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Calls element.getAnimations() on every visible DOM element to capture
 * JavaScript-driven animations and their timing metadata, computed keyframes,
 * animation type classification, and element context.
 */

import { buildElementContext } from './mapAnimationToElement.js';

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**
 * Classify the animation type based on its constructor.
 */
function classifyAnimationType(anim) {
  if (typeof CSSAnimation !== 'undefined' && anim instanceof CSSAnimation) return 'css-animation';
  if (typeof CSSTransition !== 'undefined' && anim instanceof CSSTransition) return 'css-transition';
  return 'web-animation';
}

/**
 * Get a readable name for the animation.
 */
function getAnimationName(anim, animationType) {
  if (animationType === 'css-animation') return anim.animationName ?? '';
  if (animationType === 'css-transition') return anim.transitionProperty ?? '';
  return anim.id ?? '';
}

/**
 * Safely extract computed keyframes from the animation effect.
 */
function safeGetKeyframes(anim) {
  try {
    if (typeof anim.effect?.getKeyframes === 'function') {
      return anim.effect.getKeyframes().map(kf => {
        const result = {};
        for (const [key, val] of Object.entries(kf)) {
          if (val !== undefined && val !== null && val !== '') {
            result[key] = val;
          }
        }
        return result;
      });
    }
  } catch { /* ignore */ }
  return [];
}

/**
 * Safely extract computed timing from the animation effect.
 */
function safeGetComputedTiming(anim) {
  try {
    if (typeof anim.effect?.getComputedTiming === 'function') {
      const ct = anim.effect.getComputedTiming();
      return {
        activeDuration: ct.activeDuration ?? null,
        endTime: ct.endTime ?? null,
        progress: ct.progress ?? null,
      };
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * @returns {{ webAnimations: Array<{
 *   id: string,
 *   duration: number,
 *   delay: number,
 *   easing: string,
 *   fill: string,
 *   iterations: number,
 *   direction: string,
 *   animationType: string,
 *   animationName: string,
 *   playState: string,
 *   keyframes: Array<object>,
 *   computedTiming: object|null,
 *   element: object|null
 * }> }}
 */
export function extractWebAnimations() {
  const webAnimations = [];
  const seen = new Set();

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    if (typeof el.getAnimations !== 'function') continue;

    for (const anim of el.getAnimations()) {
      const timing = anim.effect?.getTiming?.() ?? {};
      const animationType = classifyAnimationType(anim);
      const animationName = getAnimationName(anim, animationType);

      // Deduplicate by animation identity
      const sig = `${anim.id ?? ''}|${animationName}|${timing.duration ?? 0}|${timing.easing ?? ''}`;
      if (seen.has(sig)) continue;
      seen.add(sig);

      let element = null;
      try { element = buildElementContext(el); } catch { /* ignore */ }

      webAnimations.push({
        id:             anim.id ?? '',
        duration:       timing.duration   ?? 0,
        delay:          timing.delay      ?? 0,
        easing:         timing.easing     ?? 'linear',
        fill:           timing.fill       ?? 'none',
        iterations:     timing.iterations ?? 1,
        direction:      timing.direction  ?? 'normal',
        animationType,
        animationName,
        playState:      anim.playState ?? 'running',
        keyframes:      safeGetKeyframes(anim),
        computedTiming: safeGetComputedTiming(anim),
        element,
      });
    }
  }

  return { webAnimations };
}

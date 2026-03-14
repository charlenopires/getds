/**
 * Reduced motion extraction — Layer 5
 *
 * Wraps detectReducedMotion with an assessment and returns in the standard
 * extractor format { reducedMotion: { ... } }.
 *
 * @returns {{ reducedMotion: { supported: boolean, ruleCount: number, overriddenProperties: string[], assessment: string } }}
 */

import { detectReducedMotion } from './detectReducedMotion.js';

/**
 * Assess the quality of prefers-reduced-motion support.
 *
 * @param {{ hasReducedMotionSupport: boolean, ruleCount: number, overriddenProperties: string[] }} data
 * @param {number} totalAnimationCount - total animations on page
 * @returns {string}
 */
function assessReducedMotionSupport(data, totalAnimationCount) {
  if (!data.hasReducedMotionSupport) return 'None';

  const props = data.overriddenProperties;
  const hasAnimation = props.includes('animation') || props.includes('animation-name') || props.includes('animation-duration');
  const hasTransition = props.includes('transition') || props.includes('transition-duration');

  if (hasAnimation && hasTransition && data.ruleCount >= 2) return 'Excellent';
  if (hasAnimation || hasTransition) return 'Partial';
  if (data.ruleCount > 0) return 'Partial';
  return 'None';
}

/**
 * @param {number} [totalAnimationCount] - optional total animations on page
 * @returns {{ reducedMotion: { supported: boolean, ruleCount: number, overriddenProperties: string[], assessment: string } }}
 */
export function extractReducedMotion(totalAnimationCount = 0) {
  const data = detectReducedMotion();

  return {
    reducedMotion: {
      supported: data.hasReducedMotionSupport,
      ruleCount: data.ruleCount,
      overriddenProperties: data.overriddenProperties,
      assessment: assessReducedMotionSupport(data, totalAnimationCount),
    },
  };
}

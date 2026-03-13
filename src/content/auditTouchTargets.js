/**
 * Touch target size audit — Spec: 10ab6f26 — Accessibility Audit
 *
 * Checks interactive element dimensions against the WCAG 2.5.5 recommendation
 * of 44×44 CSS pixels minimum touch target size.
 */

/** Minimum recommended touch target size in CSS pixels */
export const TOUCH_TARGET_MIN = 44;

/** Threshold below which the issue is considered major (not just minor) */
const MAJOR_THRESHOLD = 32;

/**
 * @typedef {{ width: number, height: number, passes: boolean, severity: string }} TouchTargetResult
 */

/**
 * Classify the touch target size of an element.
 *
 * @param {number} width   Element width in CSS pixels
 * @param {number} height  Element height in CSS pixels
 * @returns {TouchTargetResult}
 */
export function checkTouchTarget(width, height) {
  const passes = width >= TOUCH_TARGET_MIN && height >= TOUCH_TARGET_MIN;

  let severity;
  if (passes) {
    severity = 'pass';
  } else if (width >= MAJOR_THRESHOLD && height >= MAJOR_THRESHOLD) {
    severity = 'minor';
  } else {
    severity = 'major';
  }

  return { width, height, passes, severity };
}

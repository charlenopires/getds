/**
 * WCAG contrast violation classification — Spec: 10ab6f26 — Accessibility Audit
 *
 * Classifies a pre-computed contrast ratio against WCAG AA and AAA thresholds
 * for both normal and large text.
 *
 * Large text: ≥ 18pt (24px) or ≥ 14pt bold (approximately 18.67px bold).
 */

/** WCAG 2.1 minimum contrast thresholds */
export const WCAG_THRESHOLDS = {
  AA:  { normal: 4.5, large: 3 },
  AAA: { normal: 7,   large: 4.5 },
};

/**
 * @typedef {{ ratio: number, isLargeText: boolean, passAA: boolean, passAAA: boolean, severity: string }} ContrastResult
 */

/**
 * Classify a contrast ratio result against WCAG AA and AAA thresholds.
 *
 * Severity:
 *   'pass'     — meets AA
 *   'minor'    — fails AAA but passes AA (informational only)
 *   'major'    — fails AA but ratio ≥ 3:1
 *   'critical' — ratio < 3:1 (essentially unusable)
 *
 * @param {number} ratio
 * @param {boolean} isLargeText
 * @returns {ContrastResult}
 */
export function checkContrastViolation(ratio, isLargeText) {
  const thresholds = isLargeText ? { aa: WCAG_THRESHOLDS.AA.large, aaa: WCAG_THRESHOLDS.AAA.large }
                                 : { aa: WCAG_THRESHOLDS.AA.normal, aaa: WCAG_THRESHOLDS.AAA.normal };

  const passAA  = ratio >= thresholds.aa;
  const passAAA = ratio >= thresholds.aaa;

  let severity;
  if (passAA) {
    severity = 'pass';
  } else if (ratio >= 3) {
    severity = 'major';
  } else {
    severity = 'critical';
  }

  return { ratio, isLargeText, passAA, passAAA, severity };
}

/**
 * Motion token generation — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Builds W3C DTCG-style duration and easing tokens from extracted animation data.
  * 
 * @example
 * // Usage of generateMotionTokens
*/

/**
 * Convert a CSS duration string to milliseconds for sorting.
 * "200ms" → 200, "1s" → 1000, "0.3s" → 300
 */
function toMs(duration) {
  if (!duration) return 0;
  const sMatch  = duration.match(/^([\d.]+)s$/);
  const msMatch = duration.match(/^([\d.]+)ms$/);
  if (sMatch)  return Number(sMatch[1])  * 1000;
  if (msMatch) return Number(msMatch[1]);
  return 0;
}

/**
 * Turn an easing value into a URL-safe slug for token naming.
 * "ease-in-out" → "ease-in-out", "cubic-bezier(0.4,0,0.2,1)" → "cubic-bezier-0-4-0-0-2-1"
 */
function easingSlug(value) {
  return value
    .replace(/[(),.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * @param {{
 *   durations: string[],
 *   easings: string[]
 * }} options
 * @returns {{
 *   durationTokens: Array<{ name: string, $value: string, $type: 'duration' }>,
 *   easingTokens: Array<{ name: string, $value: string, $type: 'cubicBezier' }>
 * }}
 */
export function generateMotionTokens({ durations = [], easings = [] } = {}) {
  // Duration tokens — deduplicate, sort ascending, label by step
  const uniqueDurations = [...new Set(durations)].sort((a, b) => toMs(a) - toMs(b));
  const durationTokens = uniqueDurations.map((val, i) => ({
    name: `duration-${i + 1}`,
    $value: val,
    $type: 'duration',
  }));

  // Easing tokens — deduplicate, name by slug
  const uniqueEasings = [...new Set(easings)];
  const easingTokens = uniqueEasings.map(val => ({
    name: `easing-${easingSlug(val)}`,
    $value: val,
    $type: 'cubicBezier',
  }));

  return { durationTokens, easingTokens };
}

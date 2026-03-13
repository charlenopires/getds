/**
 * Executive summary generation — Spec: b0d5a227 — Markdown Report Generation
 *
 * Produces a Markdown executive summary section with extraction counts
 * derived from the full 7-layer extraction payload.
  * 
 * @example
 * // Usage of generateExecutiveSummary
*/

/**
 * Count animations from the animations layer.
 * Prefers explicit cssAnimations + keyframes arrays; falls back to object key count.
 *
 * @param {object} anim
 * @returns {number}
 */
function countAnimations(anim) {
  if (!anim || typeof anim !== 'object') return 0;
  const css = Array.isArray(anim.cssAnimations) ? anim.cssAnimations.length : 0;
  const kf  = Array.isArray(anim.keyframes)     ? anim.keyframes.length     : 0;
  return css + kf;
}

/**
 * Generate a Markdown executive summary section from the extraction payload.
 *
 * @param {Record<string, object>} payload - Assembled 7-layer extraction payload
 * @returns {string} Markdown string starting with an H2 section header
 */
export function generateExecutiveSummary(payload = {}) {
  const vf    = payload['visual-foundations'] ?? {};
  const lp    = payload['layout-patterns']   ?? {};
  const comp  = payload['components']         ?? {};
  const anim  = payload['animations']         ?? {};
  const a11y  = payload['accessibility']      ?? {};

  const colours    = Array.isArray(vf.colors) ? vf.colors.length : 0;
  const fonts      = Array.isArray(vf.fonts)  ? vf.fonts.length  : 0;
  const typeSteps  = Array.isArray(lp.typeScale?.steps)      ? lp.typeScale.steps.length      : 0;
  const spacSteps  = Array.isArray(lp.spacingGrid?.scale)    ? lp.spacingGrid.scale.length    : 0;
  const components = Object.keys(comp).length;
  const animations = countAnimations(anim);
  const a11yIssues = Array.isArray(a11y.issues) ? a11y.issues.length : 0;

  const rows = [
    ['Unique colours',        colours],
    ['Font families',         fonts],
    ['Type scale steps',      typeSteps],
    ['Spacing steps',         spacSteps],
    ['Components detected',   components],
    ['Animations found',      animations],
    ['Accessibility issues',  a11yIssues],
  ];

  const table = [
    '| Metric | Count |',
    '|--------|-------|',
    ...rows.map(([label, count]) => `| ${label} | ${count} |`),
  ].join('\n');

  return `## 📊 Executive Summary\n\n${table}`;
}

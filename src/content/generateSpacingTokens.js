/**
 * Spacing token generation — Spec: 29ea3708 — Spacing System Extraction
 *
 * Generates W3C DTCG design tokens for spacing values.
  * 
 * @example
 * // Usage of generateSpacingTokens
*/

/**
 * Generate DTCG spacing tokens from a spacing scale.
 *
 * Token key format: spacing-{step}
 *
 * @param {Array<{ step: number, px: number, value: string, multiplier: number|null }>} scale
 * @returns {Record<string, { $value: string, $type: 'dimension', $description: string }>}
 */
export function generateSpacingTokens(scale) {
  const tokens = {};
  for (const entry of scale) {
    const key = `spacing-${entry.step}`;
    const token = {
      $value: entry.value,
      $type: 'dimension',
      $description: `${entry.px}px${entry.multiplier != null ? ` (×${entry.multiplier})` : ''}`,
    };
    if (entry.semanticName) {
      token.$extensions = { 'com.getds.semantic': entry.semanticName };
    }
    tokens[key] = token;
  }
  return tokens;
}

/**
 * Generate semantic spacing tokens keyed by semantic names (3xs–3xl).
 *
 * @param {Array<{ step: number, px: number, value: string, semanticName: string }>} scale
 * @returns {Record<string, { $value: string, $type: 'dimension', $description: string }>}
 */
export function generateSemanticSpacingTokens(scale) {
  const tokens = {};
  for (const entry of scale) {
    if (!entry.semanticName) continue;
    tokens[`spacing-${entry.semanticName}`] = {
      $value: entry.value,
      $type: 'dimension',
      $description: `${entry.px}px (step ${entry.step})`,
    };
  }
  return tokens;
}

/**
 * Spacing token generation — Spec: 29ea3708 — Spacing System Extraction
 *
 * Generates W3C DTCG design tokens for spacing values.
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
    tokens[key] = {
      $value: entry.value,
      $type: 'dimension',
      $description: `${entry.px}px${entry.multiplier != null ? ` (×${entry.multiplier})` : ''}`,
    };
  }
  return tokens;
}

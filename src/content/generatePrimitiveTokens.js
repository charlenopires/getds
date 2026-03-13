/**
 * W3C DTCG primitive color token generation — Spec: fff645a0 — Color System Extraction
 *
 * Produces a flat map of token-name → { $value, $type: "color" } objects
 * following the W3C Design Token Community Group format.
 *
 * Primitive tokens represent raw color values with no semantic meaning.
 * They form the foundation that semantic alias tokens reference.
 */

import { normalizeColor } from './normalizeColor.js';

/**
 * Derive a stable, human-readable token name from a hex color.
 * Strategy: use the hex digits as the name suffix, prefixed by a hue label.
 *
 * Examples:
 *   #ff0000 → color-ff0000
 *   #0080ff → color-0080ff
 *
 * @param {string} hex — 6 or 8 digit lowercase hex (with #)
 * @param {number} index — position in input array (used to guarantee uniqueness)
 * @returns {string}
 */
function tokenName(hex, index) {
  const digits = hex.replace('#', '').slice(0, 6);
  return `color-${digits}`;
}

/**
 * Generate W3C DTCG primitive color tokens from a list of extracted colors.
 *
 * @param {Array<{ raw: string, hex?: string }>} colors
 * @returns {Record<string, { $value: string, $type: 'color' }>}
 */
export function generatePrimitiveTokens(colors) {
  const tokens = {};
  const usedNames = new Set();

  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    const hex = c.hex ?? normalizeColor(c.raw)?.hex;
    if (!hex) continue;

    let name = tokenName(hex, i);

    // Guarantee uniqueness (handles theoretical collisions from 8-digit hex truncation)
    if (usedNames.has(name)) {
      name = `${name}-${i}`;
    }
    usedNames.add(name);

    tokens[name] = { $value: hex, $type: 'color' };
  }

  return tokens;
}

/**
 * Serialize a token object as a fenced Markdown JSON code block.
 *
 * @param {Record<string, { $value: string, $type: string }>} tokens
 * @returns {string}
 */
export function tokensToJsonBlock(tokens) {
  return `\`\`\`json\n${JSON.stringify(tokens, null, 2)}\n\`\`\``;
}

/**
 * W3C DTCG primitive color token generation — Spec: fff645a0 — Color System Extraction
 *
 * Produces a flat map of token-name → { $value, $type: "color" } objects
 * following the W3C Design Token Community Group format.
 *
 * Primitive tokens represent raw color values with no semantic meaning.
 * They form the foundation that semantic alias tokens reference.
  * 
 * @example
 * // Usage of generatePrimitiveTokens
*/

import { normalizeColor } from './normalizeColor.js';

/**
 * Derive a stable token name for a color, using semantic role if available.
 *
 * @param {string} hex — 6 or 8 digit lowercase hex (with #)
 * @param {Record<string, string>} semanticRoles — map of role → hex value
 * @returns {string}
 */
function resolveTokenName(hex, semanticRoles = {}) {
  // Check if this hex matches any semantic role
  for (const [role, roleHex] of Object.entries(semanticRoles)) {
    if (roleHex && roleHex.toLowerCase() === hex.toLowerCase()) {
      // Convert camelCase role to kebab-case token name
      const kebab = role.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `color-${kebab}`;
    }
  }
  // Fallback: use hex digits
  const digits = hex.replace('#', '').slice(0, 6);
  return `color-${digits}`;
}

/**
 * Generate W3C DTCG primitive color tokens from a list of extracted colors.
 * Uses semantic names (e.g. color-brand-primary) when a semantic role is known.
 *
 * @param {Array<{ raw: string, hex?: string }>} colors
 * @param {Record<string, string>} [semanticRoles={}] — map of roleName → hex value
 * @returns {Record<string, { $value: string, $type: 'color' }>}
 */
export function generatePrimitiveTokens(colors, semanticRoles = {}) {
  const tokens = {};
  const usedNames = new Set();

  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    const hex = c.hex ?? normalizeColor(c.raw)?.hex;
    if (!hex) continue;

    let name = resolveTokenName(hex, semanticRoles);

    // Guarantee uniqueness
    if (usedNames.has(name)) {
      name = `${name}-${i}`;
    }
    usedNames.add(name);

    tokens[name] = {
      $value: hex,
      $type: 'color',
      $extensions: {
        'com.getds.authored': c.raw ?? hex,
        'com.getds.usageCount': c.count ?? 1,
        'com.getds.cssProperties': c.properties ?? (c.property ? [c.property] : []),
      },
    };
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

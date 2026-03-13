/**
 * W3C DTCG semantic alias token generation — Spec: fff645a0 — Color System Extraction
 *
 * Generates semantic alias tokens that reference primitive color tokens.
 * Alias token $value uses DTCG reference syntax: {primitive-token-name}
 *
 * Example output:
 *   "color-danger": { "$value": "{color-ff0000}", "$type": "color" }
  * 
 * @example
 * // Usage of generateAliasTokens
*/

/**
 * Find the primitive token name for a given hex value.
 *
 * @param {string} hex — lowercase hex like #ff0000
 * @param {Record<string, { $value: string }>} primitives
 * @returns {string|null}
 */
function findPrimitiveName(hex, primitives) {
  for (const [name, token] of Object.entries(primitives)) {
    if (token.$value === hex) return name;
  }
  return null;
}

/**
 * Generate semantic alias tokens referencing primitive color tokens.
 *
 * @param {Array<{ colorRaw: string, role: string }>} roles — from inferSemanticRoles()
 * @param {Record<string, { $value: string, $type: string }>} primitives — from generatePrimitiveTokens()
 * @param {Array<{ raw: string, hex: string }>} colorMap — maps raw value to its hex
 * @returns {Record<string, { $value: string, $type: 'color' }>}
 */
export function generateAliasTokens(roles, primitives, colorMap = []) {
  const rawToHex = new Map(colorMap.map(c => [c.raw, c.hex]));
  const aliases  = {};

  for (const { colorRaw, role } of roles) {
    const hex = rawToHex.get(colorRaw);
    if (!hex) continue;

    const primName = findPrimitiveName(hex, primitives);
    if (!primName) continue;

    const aliasKey = `color-${role}`;
    aliases[aliasKey] = {
      $value: `{${primName}}`,
      $type: 'color',
    };
  }

  return aliases;
}

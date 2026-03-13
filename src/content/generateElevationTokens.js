/**
 * Elevation and border-radius token generation — Spec: 7c17b9ef
 *
 * Generates W3C DTCG tokens for shadow elevation levels and border-radius scale.
  * 
 * @example
 * // Usage of generateElevationTokens
*/

/**
 * Generate DTCG shadow tokens from elevation entries.
 * Key: elevation-{level}
 *
 * @param {Array<{ level: number, value: string, blur: number }>} entries
 * @returns {Record<string, { $value: string, $type: 'shadow' }>}
 */
export function generateElevationTokens(entries) {
  if (!Array.isArray(entries)) return {};
  const tokens = {};
  for (const entry of entries) {
    const key = `elevation-${entry.level}`;
    // If multiple shadows map to same level, keep the one with highest blur
    if (!tokens[key] || entry.blur > (tokens[key].__blur ?? 0)) {
      tokens[key] = { $value: entry.value, $type: 'shadow', __blur: entry.blur };
    }
  }
  // Remove internal __blur field
  for (const key of Object.keys(tokens)) {
    delete tokens[key].__blur;
  }
  return tokens;
}

/**
 * Generate DTCG dimension tokens from a border-radius scale.
 * Key: border-radius-{name}
 *
 * @param {Array<{ name: string, value: string, px: number }>} scale
 * @returns {Record<string, { $value: string, $type: 'dimension' }>}
 */
export function generateRadiusTokens(scale) {
  const tokens = {};
  for (const entry of scale) {
    tokens[`border-radius-${entry.name}`] = {
      $value: entry.value,
      $type: 'dimension',
    };
  }
  return tokens;
}

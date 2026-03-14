/**
 * W3C DTCG typography token generation — Spec: f7625baf — Typography System Extraction
 *
 * Produces composite typography tokens:
 *   "typography-body": {
 *     "$type": "typography",
 *     "$value": { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing }
 *   }
  * 
 * @example
 * // Usage of generateTypographyTokens
*/

/**
 * @param {Array<{
 *   role: string,
 *   style: { fontSize: string, fontWeight: string, lineHeight: string, letterSpacing: string },
 *   fontFamily: string,
 * }>} roleEntries — from inferTypeRoles(), enriched with fontFamily
 * @returns {Record<string, { $type: 'typography', $value: object }>}
 */
export function generateTypographyTokens(roleEntries) {
  const tokens = {};

  for (const { role, style, fontFamily } of roleEntries) {
    const key = `typography-${role}`;
    const value = {
      fontFamily:    fontFamily ?? '',
      fontSize:      style.fontSize,
      fontWeight:    style.fontWeight,
      lineHeight:    style.lineHeight,
      letterSpacing: style.letterSpacing,
    };

    // Add optional properties when non-default
    if (style.fontStyle && style.fontStyle !== 'normal') {
      value.fontStyle = style.fontStyle;
    }
    if (style.fontVariant && style.fontVariant !== 'normal') {
      value.fontVariant = style.fontVariant;
    }
    if (style.textDecoration && style.textDecoration !== 'none' && !style.textDecoration.startsWith('none ')) {
      value.textDecoration = style.textDecoration;
    }

    tokens[key] = { $type: 'typography', $value: value };
  }

  return tokens;
}

/**
 * W3C DTCG token generation for @font-face rules.
 * Produces fontFamily tokens with provider info in $extensions.
 */

/**
 * Generate design tokens for @font-face rules.
 *
 * @param {Array<object>} fontFaceRules — from collectFontFaceFromSheets()
 * @param {Array<object>} fontSources — from detectFontSources()
 * @returns {Record<string, object>} W3C DTCG tokens
 */
export function generateFontFaceTokens(fontFaceRules = [], fontSources = []) {
  const tokens = {};
  const sourceMap = new Map();

  // Build lookup from family → source info
  for (const src of fontSources) {
    if (!sourceMap.has(src.family)) {
      sourceMap.set(src.family, src);
    }
  }

  for (const rule of fontFaceRules) {
    const family = rule.fontFamily;
    if (!family) continue;

    const weight = rule.fontWeight ?? 'normal';
    const style = rule.fontStyle ?? 'normal';
    const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const key = `fontFace-${slug}-${weight.replace(/\s+/g, '-')}-${style}`;

    // Avoid duplicates
    if (tokens[key]) continue;

    const sourceInfo = sourceMap.get(family) ?? {};

    tokens[key] = {
      $type: 'fontFamily',
      $value: [family],
      $extensions: {
        'com.getds.fontFace': {
          fontWeight: weight,
          fontStyle: style,
          fontDisplay: rule.fontDisplay ?? null,
          sources: rule.sources ?? [],
          provider: sourceInfo.provider ?? null,
          linkTag: sourceInfo.linkTag ?? null,
          unicodeRange: rule.unicodeRange ?? null,
          fontStretch: rule.fontStretch ?? null,
        },
      },
    };
  }

  return tokens;
}

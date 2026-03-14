/**
 * W3C DTCG token generation for variable fonts.
 * Produces fontFamily tokens with axis info in $extensions.
 */

/**
 * Generate design tokens for variable fonts.
 *
 * @param {Array<object>} variableFonts — from detectVariableFonts()
 * @returns {Record<string, object>} W3C DTCG tokens
 */
export function generateVariableFontTokens(variableFonts = []) {
  const tokens = {};

  for (const font of variableFonts) {
    const family = font.family;
    if (!family) continue;

    const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const key = `fontVariable-${slug}`;

    // Avoid duplicates
    if (tokens[key]) continue;

    tokens[key] = {
      $type: 'fontFamily',
      $value: [family],
      $extensions: {
        'com.getds.variableFont': {
          axes: font.axes ?? [],
          usedSettings: font.usedSettings ?? [],
          source: font.source ?? null,
        },
      },
    };
  }

  return tokens;
}

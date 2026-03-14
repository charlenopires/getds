// -- Font Family Token Generation (W3C DTCG) ---------------------------------
// Inspired by projectwallace destructure-font-family.ts.

/**
 * Generate W3C DTCG fontFamily tokens from extractFontFamilies() output.
 *
 * @param {Array<{stack: string, primary: string, generic: string}>} fonts
 * @returns {Record<string, {$type: string, $value: string[], $extensions: object}>}
 */
export function generateFontFamilyTokens(fonts) {
  if (!fonts || fonts.length === 0) return {};

  const tokens = {};
  const seen = new Set();

  for (const f of fonts) {
    if (!f.primary) continue;
    const key = f.primary.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (seen.has(key)) continue;
    seen.add(key);

    const families = f.stack
      ? f.stack.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''))
      : [f.primary, f.generic].filter(Boolean);

    tokens[`fontFamily-${key}`] = {
      $type: 'fontFamily',
      $value: families,
      $extensions: {
        'com.getds.primary': f.primary,
        'com.getds.generic': f.generic || null,
        'com.getds.stack': f.stack || families.join(', '),
      },
    };
  }

  return tokens;
}

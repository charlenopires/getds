/**
 * Semantic color role classification
 * Classifies extracted colors into semantic design roles based on frequency and context.
 * Identifies: pageBackground, surfaceBackground, brandPrimary, textDefault, textMuted,
 * borderDefault, interactivePrimary
 */

/**
 * Determines if a hex color is neutral (near-grayscale).
 * @param {string|null} hex
 * @returns {boolean}
 */
function isNeutral(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  return saturation < 0.15;
}

/**
 * Classify extracted colors into semantic roles.
 *
 * @param {Array<{ raw: string, hex?: string, count?: number, properties?: string[], tags?: string[] }>} colors
 * @param {Array<{ backgroundColor?: string, color?: string, classes?: string[], instanceCount?: number }>} buttonVariants
 * @returns {{
 *   pageBackground: string|null,
 *   surfaceBackground: string|null,
 *   brandPrimary: string|null,
 *   textDefault: string|null,
 *   textMuted: string|null,
 *   borderDefault: string|null,
 *   interactivePrimary: string|null,
 * }}
 */
export function extractSemanticColorRoles(colors = [], buttonVariants = []) {
  const sorted = [...colors].sort((a, b) => (b.count || 0) - (a.count || 0));

  const bgColors = sorted.filter(c => Array.isArray(c.properties) && c.properties.includes('background-color'));
  const textColors = sorted.filter(c => Array.isArray(c.properties) && c.properties.includes('color'));
  const borderColors = sorted.filter(c => Array.isArray(c.properties) && c.properties.some(p => p.includes('border')));

  // pageBackground: most frequent background-color on body/html/main elements
  const pageBackground =
    bgColors.find(c => Array.isArray(c.tags) && c.tags.some(t => ['html', 'body', 'main'].includes(t))) ??
    bgColors[0] ??
    null;

  // surfaceBackground: second most frequent background (cards, panels)
  const surfaceBackground = bgColors.find(c => c !== pageBackground) ?? null;

  // brandPrimary: most frequent non-neutral color (excl. page/surface backgrounds)
  const brandPrimary =
    sorted.find(c => c.hex && !isNeutral(c.hex) && c !== pageBackground && c !== surfaceBackground) ??
    null;

  // textDefault: most frequent text color
  const textDefault = textColors[0] ?? null;

  // textMuted: second text color
  const textMuted = textColors.find(c => c !== textDefault) ?? null;

  // borderDefault: most frequent border color
  const borderDefault = borderColors[0] ?? null;

  // interactivePrimary: backgroundColor from primary button variant (by instanceCount)
  const primaryButton =
    [...buttonVariants]
      .sort((a, b) => (b.instanceCount || 0) - (a.instanceCount || 0))
      .find(b => Array.isArray(b.classes) && b.classes.some(c => /primary/i.test(c))) ??
    buttonVariants.sort((a, b) => (b.instanceCount || 0) - (a.instanceCount || 0))[0] ??
    null;

  const interactivePrimary = primaryButton?.backgroundColor ?? brandPrimary?.hex ?? brandPrimary?.raw ?? null;

  return {
    pageBackground: pageBackground?.hex ?? pageBackground?.raw ?? null,
    surfaceBackground: surfaceBackground?.hex ?? surfaceBackground?.raw ?? null,
    brandPrimary: brandPrimary?.hex ?? brandPrimary?.raw ?? null,
    textDefault: textDefault?.hex ?? textDefault?.raw ?? null,
    textMuted: textMuted?.hex ?? textMuted?.raw ?? null,
    borderDefault: borderDefault?.hex ?? borderDefault?.raw ?? null,
    interactivePrimary,
  };
}

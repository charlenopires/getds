/**
 * Typography statistics reporting — Spec: f7625baf — Typography System Extraction
 *
 * Computes:
 *   - totalFontFamilies: count of distinct font families
 *   - fontFamilyNames: list of primary font names
 *   - scaleSteps: number of steps in the type scale
 *   - scaleValues: list of font-size values in scale order
 *   - baseFontSize: the scale value closest to 16px (browser default body size)
  * 
 * @example
 * // Usage of typographyStats
*/

/**
 * @param {Array<{ primary: string, stack: string }>} fonts — from extractFontFamilies()
 * @param {Array<{ value: string, px: number, step: number }>} scale — from extractTypeScale()
 * @param {Array} fontFaceRules — from collectFontFaceFromSheets()
 * @param {Array} variableFonts — from detectVariableFonts()
 * @param {Array<{ provider?: string }>} fontSources — from detectFontSources()
 * @returns {{
 *   totalFontFamilies: number,
 *   fontFamilyNames: string[],
 *   scaleSteps: number,
 *   scaleValues: string[],
 *   baseFontSize: string | null,
 *   fontFaceCount: number,
 *   variableFontCount: number,
 *   fontSourceProviders: string[],
 * }}
 */
export function computeTypographyStats(fonts, scale, fontFaceRules = [], variableFonts = [], fontSources = []) {
  const totalFontFamilies = fonts.length;
  const fontFamilyNames   = fonts.map(f => f.primary);

  const scaleSteps  = scale.length;
  const scaleValues = scale.map(s => s.value);

  // Base font size = scale value whose px is closest to 16
  let baseFontSize = null;
  if (scale.length > 0) {
    const closest = scale.reduce((best, step) =>
      Math.abs(step.px - 16) < Math.abs(best.px - 16) ? step : best
    );
    baseFontSize = closest.value;
  }

  const fontFaceCount = fontFaceRules.length;
  const variableFontCount = variableFonts.length;
  const fontSourceProviders = [...new Set(fontSources.map(s => s.provider).filter(Boolean))];

  return { totalFontFamilies, fontFamilyNames, scaleSteps, scaleValues, baseFontSize, fontFaceCount, variableFontCount, fontSourceProviders };
}

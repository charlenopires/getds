/**
 * @font-face detection — Spec: f7625baf — Typography System Extraction
 *
 * Parses @font-face rules from CSS text and extracts:
 *   - fontFamily, fontWeight, fontStyle
 *   - sources: [{ url, format, isVariable }]
 *   - fontDisplay, fontStretch, unicodeRange
 *   - fontFeatureSettings, fontVariationSettings
 *   - sizeAdjust, ascentOverride, descentOverride, lineGapOverride
  * 
 * @example
 * // Usage of detectFontFace
*/

/** Match a single property inside a block: prop: value */
function getProp(block, prop) {
  const m = block.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i'));
  return m ? m[1].trim() : null;
}

/** Strip surrounding quotes from a string */
function unquote(str) {
  return str ? str.replace(/^["']|["']$/g, '').trim() : str;
}

/**
 * Parse the src declaration into an array of { url, format } objects.
 *
 * @param {string} srcValue — e.g. 'url("a.woff2") format("woff2"), url("a.woff")'
 * @returns {Array<{ url: string, format: string|null, isVariable: boolean }>}
 */
function parseSrc(srcValue) {
  if (!srcValue) return [];
  const sources = [];

  // Each source entry is separated by commas (but commas also appear inside format())
  // Split on commas that are NOT inside parentheses
  const entries = srcValue.split(/,(?![^(]*\))/);

  for (const entry of entries) {
    const urlMatch    = entry.match(/url\(\s*["']?([^"')]+)["']?\s*\)/i);
    const formatMatch = entry.match(/format\(\s*["']?([^"')]+)["']?\s*\)/i);
    if (!urlMatch) continue;
    const isVariable = formatMatch ? /variations/i.test(formatMatch[1]) : false;
    sources.push({
      url: urlMatch[1].trim(),
      format: formatMatch ? formatMatch[1].trim() : null,
      isVariable,
    });
  }

  return sources;
}

/**
 * Parse all @font-face blocks from CSS text.
 *
 * @param {string} cssText
 * @returns {Array<{
 *   fontFamily: string,
 *   fontWeight: string|null,
 *   fontStyle: string,
 *   sources: Array<{ url: string, format: string|null, isVariable: boolean }>,
 *   fontDisplay: string|null,
 *   fontStretch: string|null,
 *   unicodeRange: string|null,
 *   fontFeatureSettings: string|null,
 *   fontVariationSettings: string|null,
 *   sizeAdjust: string|null,
 *   ascentOverride: string|null,
 *   descentOverride: string|null,
 *   lineGapOverride: string|null,
 * }>}
 */
export function parseFontFaceRules(cssText) {
  const results = [];
  const fontFaceRe = /@font-face\s*\{/gi;
  let match;

  while ((match = fontFaceRe.exec(cssText)) !== null) {
    const start = match.index + match[0].length;
    let depth = 1, i = start;
    while (i < cssText.length && depth > 0) {
      if (cssText[i] === '{') depth++;
      else if (cssText[i] === '}') depth--;
      i++;
    }
    const block = cssText.slice(start, i - 1);

    const fontFamilyRaw = getProp(block, 'font-family');
    if (!fontFamilyRaw) continue;

    const srcRaw = getProp(block, 'src');

    results.push({
      fontFamily:             unquote(fontFamilyRaw),
      fontWeight:             getProp(block, 'font-weight'),
      fontStyle:              getProp(block, 'font-style') ?? 'normal',
      sources:                parseSrc(srcRaw),
      fontDisplay:            getProp(block, 'font-display'),
      fontStretch:            getProp(block, 'font-stretch'),
      unicodeRange:           getProp(block, 'unicode-range'),
      fontFeatureSettings:    getProp(block, 'font-feature-settings'),
      fontVariationSettings:  getProp(block, 'font-variation-settings'),
      sizeAdjust:             getProp(block, 'size-adjust'),
      ascentOverride:         getProp(block, 'ascent-override'),
      descentOverride:        getProp(block, 'descent-override'),
      lineGapOverride:        getProp(block, 'line-gap-override'),
    });
  }

  return results;
}

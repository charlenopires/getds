/**
 * Icon font detection — Spec: f7625baf — Typography System Extraction
 *
 * Identifies icon fonts by matching known font-family name patterns.
 * Icon fonts render glyphs/icons via unicode code points rather than text characters.
  * 
 * @example
 * // Usage of detectIconFonts
*/

/** Known icon font name patterns (case-insensitive substring or full match) */
const ICON_FONT_PATTERNS = [
  /font\s*awesome/i,
  /fontawesome/i,
  /material\s+icons/i,
  /material\s+symbols/i,
  /ionicons/i,
  /glyphicons/i,
  /feather/i,
  /remixicon/i,
  /bootstrap\s+icons/i,
  /phosphor/i,
  /tabler\s+icons/i,
  /heroicons/i,
  /lucide/i,
  /octicons/i,
  /dashicons/i,
  /typicons/i,
  /linearicons/i,
  /icomoon/i,
  /simple\s+icons/i,
];

/**
 * Determine whether a font-family name belongs to a known icon font.
 *
 * @param {string} fontName
 * @returns {boolean}
 */
export function isIconFont(fontName) {
  return ICON_FONT_PATTERNS.some(pattern => pattern.test(fontName));
}

/**
 * Filter a list of font entries to those that are icon fonts.
 *
 * @param {Array<{ primary: string, stack: string }>} fonts — from extractFontFamilies()
 * @returns {Array<{ primary: string, stack: string, isIconFont: true }>}
 */
export function detectIconFonts(fonts) {
  return fonts
    .filter(f => isIconFont(f.primary))
    .map(f => ({ ...f, isIconFont: true }));
}

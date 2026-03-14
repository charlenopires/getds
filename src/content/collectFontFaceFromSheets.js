/**
 * Collect @font-face rules from all accessible stylesheets.
 * Handles cross-origin SecurityError by skipping inaccessible sheets.
 */

import { parseFontFaceRules } from './detectFontFace.js';

/**
 * @returns {{ fontFaceRules: Array<object> }}
 */
export function collectFontFaceFromSheets() {
  const allRules = [];
  for (const sheet of document.styleSheets) {
    try {
      let text = '';
      for (const rule of sheet.cssRules) text += rule.cssText;
      allRules.push(...parseFontFaceRules(text));
    } catch { /* cross-origin: skip */ }
  }
  return { fontFaceRules: allRules };
}

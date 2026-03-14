/**
 * Shared utility — collect all stylesheet CSS text from document.styleSheets.
 * Replaces duplicated pattern across visual-foundations, layout-patterns, and animations layers.
 *
 * @returns {string[]} Array of concatenated CSS rule text per stylesheet
 */
export function collectStylesheetTexts() {
  const texts = [];
  try {
    for (const sheet of document.styleSheets) {
      try {
        let text = '';
        for (const rule of sheet.cssRules) text += rule.cssText;
        if (text) texts.push(text);
      } catch { continue; }
    }
  } catch { /* cross-origin guard */ }
  return texts;
}

/**
 * Cross-origin stylesheet fallback — Spec: fff645a0 — Color System Extraction
 *
 * Safely reads CSS text from document.styleSheets.
 * When a stylesheet is cross-origin, accessing .cssRules throws a SecurityError.
 * In that case we fall back to an empty text and log the limitation.
  * 
 * @example
 * // Usage of crossOriginFallback
*/

/** Marker string included in limitation messages */
export const CROSS_ORIGIN_MARKER = '[cross-origin]';

/**
 * Attempt to read the text content of a single CSSStyleSheet.
 *
 * @param {CSSStyleSheet} sheet
 * @returns {{ text: string, crossOrigin: boolean, href: string|null }}
 */
export function getStylesheetText(sheet) {
  const href = sheet.href ?? null;

  try {
    // Accessing cssRules on a cross-origin sheet throws a SecurityError
    void sheet.cssRules;

    // Inline <style> elements — read from ownerNode
    const text = sheet.ownerNode?.textContent ?? '';
    return { text, crossOrigin: false, href };
  } catch (err) {
    if (err.name === 'SecurityError') {
      return { text: '', crossOrigin: true, href };
    }
    // Other unexpected errors — treat as inaccessible but not cross-origin
    return { text: '', crossOrigin: false, href };
  }
}

/**
 * Collect CSS text from all provided stylesheets.
 * Logs a message for each cross-origin sheet that cannot be accessed.
 *
 * @param {CSSStyleSheet[]} sheets — typically Array.from(document.styleSheets)
 * @param {(msg: string) => void} logger — receives one message per cross-origin sheet
 * @returns {{ texts: string[], limitations: string[] }}
 */
export function collectStylesheetTexts(sheets, logger = () => {}) {
  const texts       = [];
  const limitations = [];

  for (const sheet of sheets) {
    const { text, crossOrigin, href } = getStylesheetText(sheet);

    if (crossOrigin) {
      const msg = `${CROSS_ORIGIN_MARKER} Cannot read CSS rules from cross-origin stylesheet: ${href ?? '(unknown)'}`;
      logger(msg);
      limitations.push(msg);
    } else if (text) {
      texts.push(text);
    }
  }

  return { texts, limitations };
}

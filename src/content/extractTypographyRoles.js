/**
 * Typography role extraction
 * Captures computed styles for each heading level (h1-h6), body text,
 * small/caption text, and code elements.
 */

const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const BODY_SELECTORS = ['p', 'li', 'td', 'div', 'span'];
const SMALL_SELECTORS = 'small, caption, figcaption';
const CODE_SELECTORS = 'code, pre';

function isElementVisible(cs) {
  return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
}

function captureTypographyStyle(el) {
  const cs = getComputedStyle(el);
  return {
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform,
    color: cs.color,
    fontFamily: cs.fontFamily,
  };
}

/**
 * Extract typography styles by semantic role.
 *
 * @returns {{ typographyRoles: Record<string, object> }}
 */
export function extractTypographyRoles() {
  const roles = {};

  // Headings h1-h6
  for (const level of HEADING_LEVELS) {
    const el = document.querySelector(level);
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (!isElementVisible(cs)) continue;
    roles[level] = captureTypographyStyle(el);
  }

  // Body text: first visible paragraph or similar
  for (const sel of BODY_SELECTORS) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (!isElementVisible(cs)) continue;
    roles['body'] = captureTypographyStyle(el);
    break;
  }

  // Small / caption text
  const smallEl = document.querySelector(SMALL_SELECTORS);
  if (smallEl) {
    const cs = getComputedStyle(smallEl);
    if (isElementVisible(cs)) {
      roles['small'] = {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        color: cs.color,
        fontFamily: cs.fontFamily,
      };
    }
  }

  // Code / monospace
  const codeEl = document.querySelector(CODE_SELECTORS);
  if (codeEl) {
    const cs = getComputedStyle(codeEl);
    if (isElementVisible(cs)) {
      roles['code'] = {
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily,
        backgroundColor: cs.backgroundColor,
        color: cs.color,
      };
    }
  }

  return { typographyRoles: roles };
}

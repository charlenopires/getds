/**
 * Interaction state extraction — Spec: 86aa4a39 — UI Component Detection
 *
 * Parses CSS text to find rules containing interaction pseudo-classes:
 * :hover, :focus, :focus-visible, :active, :disabled,
 * [disabled], [aria-disabled="true"]
 */

/** Pseudo-classes we care about and their canonical name */
const PSEUDO_CLASS_MAP = {
  ':hover':                  'hover',
  ':focus-visible':          'focus-visible',
  ':focus':                  'focus',
  ':active':                 'active',
  ':disabled':               'disabled',
  '[disabled]':              'disabled',
  '[aria-disabled="true"]':  'disabled',
  "[aria-disabled='true']":  'disabled',
};

const PSEUDO_PATTERNS = Object.keys(PSEUDO_CLASS_MAP);

/**
 * Parse CSS declarations block (content between {}) into a styles object.
 * e.g. "color: red; opacity: 0.5;" → { color: 'red', opacity: '0.5' }
 */
function parseDeclarations(block) {
  const styles = {};
  for (const decl of block.split(';')) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx < 0) continue;
    const prop = decl.slice(0, colonIdx).trim();
    const val  = decl.slice(colonIdx + 1).trim();
    if (prop && val) styles[prop] = val;
  }
  return styles;
}

/**
 * Parse CSS text and extract all rules that contain interaction pseudo-classes.
 *
 * @param {string} cssText
 * @returns {Array<{ selector: string, pseudoClass: string, styles: Record<string, string> }>}
 */
export function parseInteractionStates(cssText) {
  if (!cssText) return [];

  const results = [];

  // Match CSS rules: selector { declarations }
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = ruleRe.exec(cssText)) !== null) {
    const selector = match[1].trim();
    const body     = match[2].trim();

    for (const pattern of PSEUDO_PATTERNS) {
      if (selector.includes(pattern)) {
        results.push({
          selector,
          pseudoClass: PSEUDO_CLASS_MAP[pattern],
          styles: parseDeclarations(body),
        });
        break; // one entry per rule — use the first matching pseudo
      }
    }
  }

  return results;
}

/**
 * Extract interaction states from all accessible stylesheets on the page.
 *
 * @returns {Array<{ selector: string, pseudoClass: string, styles: Record<string, string> }>}
 */
export function extractInteractionStates() {
  const results = [];

  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules ?? sheet.rules ?? [];
    } catch {
      continue; // cross-origin stylesheet
    }

    for (const rule of rules) {
      if (!rule.selectorText || !rule.cssText) continue;
      const parsed = parseInteractionStates(rule.cssText);
      results.push(...parsed);
    }
  }

  return results;
}

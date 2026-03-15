/**
 * Fluid spacing detection — parses CSS stylesheet text for
 * clamp(), calc(), min(), max(), and viewport-unit spacing declarations.
 *
 * Mirrors detectFluidTypography.js approach but targets spacing properties.
 */

const SPACING_PROPERTIES = [
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'row-gap', 'column-gap',
  'width', 'height', 'max-width', 'min-width', 'max-height', 'min-height',
];

const SPACING_PROP_RE = SPACING_PROPERTIES.map(p => p.replace('-', '\\-')).join('|');

/**
 * Parse a clamp() expression into min/preferred/max.
 * @param {string} expr
 * @returns {{ min: string, preferred: string, max: string }|null}
 */
function parseClamp(expr) {
  const match = expr.match(/clamp\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/i);
  if (!match) return null;
  return {
    min: match[1].trim(),
    preferred: match[2].trim(),
    max: match[3].trim(),
  };
}

/**
 * Detect fluid spacing expressions from CSS stylesheet texts.
 *
 * @param {string[]} stylesheetTexts — array of CSS text from accessible stylesheets
 * @returns {{ fluidSpacing: Array<{
 *   selector: string,
 *   property: string,
 *   declaration: string,
 *   type: 'clamp'|'calc'|'min'|'max'|'viewport-unit',
 *   min: string|null,
 *   preferred: string|null,
 *   max: string|null,
 * }> }}
 */
export function detectFluidSpacing(stylesheetTexts = []) {
  const results = [];
  const seen = new Set();

  // Build regex to match rules containing fluid spacing declarations
  const ruleRe = new RegExp(
    `([^{}]+)\\{([^}]*(?:${SPACING_PROP_RE})\\s*:\\s*[^;]*(?:clamp|calc|min|max|vw|vh|vmin|vmax|svw|svh|dvw|dvh)[^;]*;[^}]*)\\}`,
    'gi'
  );

  // Match individual spacing property declarations within a rule block
  const propRe = new RegExp(
    `(${SPACING_PROP_RE})\\s*:\\s*([^;]*(?:clamp|calc|min|max|vw|vh|vmin|vmax|svw|svh|dvw|dvh)[^;]*)`,
    'gi'
  );

  for (const cssText of stylesheetTexts) {
    let ruleMatch;

    while ((ruleMatch = ruleRe.exec(cssText)) !== null) {
      const selector = ruleMatch[1].trim();
      const block = ruleMatch[2];

      let propMatch;
      propRe.lastIndex = 0;

      while ((propMatch = propRe.exec(block)) !== null) {
        const property = propMatch[1].trim();
        const declaration = propMatch[2].trim();
        const dedupKey = `${selector}|${property}|${declaration}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        let type = 'viewport-unit';
        let min = null;
        let preferred = null;
        let max = null;

        if (/clamp\s*\(/i.test(declaration)) {
          type = 'clamp';
          const parsed = parseClamp(declaration);
          if (parsed) {
            min = parsed.min;
            preferred = parsed.preferred;
            max = parsed.max;
          }
        } else if (/min\s*\(/i.test(declaration)) {
          type = 'min';
        } else if (/max\s*\(/i.test(declaration)) {
          type = 'max';
        } else if (/calc\s*\(/i.test(declaration)) {
          type = 'calc';
        }

        results.push({ selector, property, declaration, type, min, preferred, max });
      }
    }
  }

  return { fluidSpacing: results };
}

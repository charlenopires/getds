/**
 * Authored CSS value preservation — parses stylesheet text for properties
 * containing var(), calc(), clamp(), min(), max() expressions that would
 * be lost when reading computed styles.
 */

const TARGET_PROPERTIES = [
  'font-size', 'line-height', 'letter-spacing',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'gap', 'row-gap', 'column-gap',
  'width', 'height', 'max-width', 'min-width', 'max-height', 'min-height',
  'grid-template-columns', 'grid-template-rows',
  'border-radius',
  'top', 'right', 'bottom', 'left',
  'inset',
];

const EXPRESSION_TYPES = [
  { re: /var\s*\(/i, type: 'var' },
  { re: /clamp\s*\(/i, type: 'clamp' },
  { re: /min\s*\(/i, type: 'min' },
  { re: /max\s*\(/i, type: 'max' },
  { re: /calc\s*\(/i, type: 'calc' },
];

const PROP_PATTERN = TARGET_PROPERTIES.map(p => p.replace('-', '\\-')).join('|');

/**
 * Extract authored CSS values containing design-intent expressions.
 *
 * @param {string[]} stylesheetTexts — array of CSS text from accessible stylesheets
 * @returns {{ authoredValues: Array<{
 *   selector: string,
 *   property: string,
 *   authoredValue: string,
 *   expressionType: string,
 * }> }}
 */
export function extractAuthoredValues(stylesheetTexts = []) {
  const results = [];
  const seen = new Set();

  const ruleRe = /([^{}]+)\{([^}]+)\}/gi;
  const propRe = new RegExp(
    `(${PROP_PATTERN})\\s*:\\s*([^;]+)`,
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
        const value = propMatch[2].trim();

        // Detect expression type
        let expressionType = null;
        for (const { re, type } of EXPRESSION_TYPES) {
          if (re.test(value)) {
            expressionType = type;
            break;
          }
        }

        if (!expressionType) continue;

        const dedupKey = `${selector}|${property}|${value}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        results.push({
          selector,
          property,
          authoredValue: value,
          expressionType,
        });
      }
    }
  }

  return { authoredValues: results };
}

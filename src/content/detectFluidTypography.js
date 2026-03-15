/**
 * Fluid typography detection — parses CSS stylesheet text for
 * clamp(), calc(), and viewport-unit font-size declarations.
 *
 * Must parse original CSS text, not computed styles (which resolve clamp to static px).
 */

/**
 * Parse a clamp() expression into min/preferred/max.
 * @param {string} expr — e.g. "clamp(1rem, 2vw + 0.5rem, 2rem)"
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
 * Detect fluid typography from CSS stylesheet texts.
 *
 * @param {string[]} stylesheetTexts — array of CSS text from accessible stylesheets
 * @returns {{ fluidTypography: Array<{
 *   selector: string,
 *   declaration: string,
 *   type: 'clamp'|'calc'|'min'|'max'|'viewport-unit',
 *   min: string|null,
 *   preferred: string|null,
 *   max: string|null,
 * }> }}
 */
export function detectFluidTypography(stylesheetTexts = []) {
  const results = [];
  const seen = new Set();

  for (const cssText of stylesheetTexts) {
    // Match font-size declarations
    // We need to find selector { ... font-size: <value> ... }
    // Strategy: find all font-size declarations with clamp/calc/vw/vh
    const ruleRe = /([^{}]+)\{([^}]*font-size\s*:\s*[^;]*(?:clamp|calc|min|max|vw|vh)[^;]*;[^}]*)\}/gi;
    let match;

    while ((match = ruleRe.exec(cssText)) !== null) {
      const selector = match[1].trim();
      const block = match[2];

      // Extract font-size declaration
      const fsMatch = block.match(/font-size\s*:\s*([^;]+)/i);
      if (!fsMatch) continue;

      const declaration = fsMatch[1].trim();
      const dedupKey = `${selector}|${declaration}`;
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

      results.push({ selector, declaration, type, min, preferred, max });
    }
  }

  return { fluidTypography: results };
}

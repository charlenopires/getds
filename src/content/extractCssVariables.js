/**
 * CSS custom property (variable) color extraction — Spec: fff645a0 — Color System Extraction
 *
 * Detects --variable-name declarations whose values are colors,
 * and preserves the variable name as the token key.
  * 
 * @example
 * // Usage of extractCssVariables
*/

/** Matches rgb/rgba/hsl/hsla/hex color values */
const COLOR_VALUE_RE =
  /^(rgba?\(\s*[\d.,\s]+\)|hsla?\(\s*[\d.,%\s]+\)|#[0-9a-fA-F]{3,8})$/;

/** Matches a var() reference */
const VAR_REF_RE = /^var\(\s*(--[\w-]+)\s*\)$/;

/**
 * Convert a CSS custom property name to a token key.
 * Strips leading `--`, lowercases, and converts camelCase to kebab-case.
 *
 * @param {string} varName — e.g. "--color-primary" or "--colorPrimary"
 * @returns {string} — e.g. "color-primary"
 */
export function cssVarNameToTokenName(varName) {
  return varName
    .replace(/^--/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Extract CSS custom properties that resolve to color values.
 *
 * @param {string} cssText — raw stylesheet text to parse
 * @param {Record<string, string>} resolvedMap — map of --var-name → resolved value
 *   (for resolving var() references; typically from getComputedStyle on :root)
 * @returns {Array<{ name: string, value: string, tokenName: string, resolvedValue?: string }>}
 */
export function extractCssColorVariables(cssText, resolvedMap = {}) {
  const results = [];
  const seen = new Set();

  // Match --custom-property: value; declarations
  const declRe = /(--[\w-]+)\s*:\s*([^;}{]+)/g;
  let m;

  while ((m = declRe.exec(cssText)) !== null) {
    const name  = m[1].trim();
    const value = m[2].trim();

    if (seen.has(name)) continue;

    // Check if value is a direct color
    if (COLOR_VALUE_RE.test(value)) {
      seen.add(name);
      results.push({ name, value, tokenName: cssVarNameToTokenName(name) });
      continue;
    }

    // Check if value is a var() reference to a known color
    const varMatch = value.match(VAR_REF_RE);
    if (varMatch) {
      const refName = varMatch[1];
      const resolved = resolvedMap[refName];
      if (resolved && COLOR_VALUE_RE.test(resolved)) {
        seen.add(name);
        results.push({
          name,
          value,
          tokenName: cssVarNameToTokenName(name),
          resolvedValue: resolved,
        });
      }
    }
  }

  return results;
}

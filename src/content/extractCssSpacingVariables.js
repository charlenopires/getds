/**
 * CSS spacing variable extraction — Layout Analysis
 * Extracts CSS custom properties related to spacing from stylesheets.
 */

const SPACING_PATTERNS = [
  /^--spacing-/,
  /^--space-/,
  /^--gap-/,
  /^--gutter-/,
  /^--margin-/,
  /^--padding-/,
  /^--size-/,
];

/**
 * Test if a CSS variable name matches spacing patterns.
 * @param {string} name
 * @returns {string|null} category name or null
 */
export function matchSpacingCategory(name) {
  if (/^--spacing-/i.test(name)) return 'spacing';
  if (/^--space-/i.test(name)) return 'space';
  if (/^--gap-/i.test(name)) return 'gap';
  if (/^--gutter-/i.test(name)) return 'gutter';
  if (/^--margin-/i.test(name)) return 'margin';
  if (/^--padding-/i.test(name)) return 'padding';
  if (/^--size-/i.test(name)) return 'size';
  return null;
}

/**
 * Resolve a CSS variable value to pixels if possible.
 * @param {string} value
 * @param {Record<string, string>} resolvedMap
 * @returns {number|null}
 */
export function resolveToPx(value, resolvedMap) {
  let resolved = value;
  // Resolve var() references
  const varMatch = resolved.match(/var\(\s*(--[\w-]+)\s*\)/);
  if (varMatch && resolvedMap[varMatch[1]]) {
    resolved = resolvedMap[varMatch[1]];
  }
  const pxMatch = resolved.match(/^([\d.]+)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);
  const remMatch = resolved.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const emMatch = resolved.match(/^([\d.]+)em$/);
  if (emMatch) return parseFloat(emMatch[1]) * 16;
  return null;
}

/**
 * Extract CSS custom properties for spacing from stylesheet text.
 * @param {string[]} stylesheetTexts
 * @param {Record<string, string>} [resolvedMap={}]
 * @returns {{ spacingVariables: Array<{ name: string, value: string, resolvedPx: number|null, category: string }> }}
 */
export function extractCssSpacingVariables(stylesheetTexts, resolvedMap = {}) {
  const seen = new Map();
  const varDeclRe = /(--[\w-]+)\s*:\s*([^;}]+)/g;

  for (const text of stylesheetTexts) {
    let match;
    const re = new RegExp(varDeclRe.source, varDeclRe.flags);
    while ((match = re.exec(text)) !== null) {
      const name = match[1];
      const value = match[2].trim();
      const category = matchSpacingCategory(name);
      if (!category) continue;
      if (seen.has(name)) continue;

      const resolvedPx = resolveToPx(resolvedMap[name] ?? value, resolvedMap);
      seen.set(name, { name, value, resolvedPx, category });
    }
  }

  return { spacingVariables: Array.from(seen.values()) };
}

/**
 * Reduced motion detection — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Searches CSS text for @media (prefers-reduced-motion) rules and reports:
 * - hasReducedMotionSupport: whether any such rules exist
 * - ruleCount: how many matching @media blocks were found
 * - overriddenProperties: deduplicated list of CSS properties overridden within those blocks
 */

const REDUCED_MOTION_RE = /@media\s*\([^)]*prefers-reduced-motion[^)]*\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gi;
const DECLARATION_RE = /([a-z-]+)\s*:/g;

/**
 * Parse CSS text and report prefers-reduced-motion usage.
 *
 * @param {string} cssText
 * @returns {{
 *   hasReducedMotionSupport: boolean,
 *   ruleCount: number,
 *   overriddenProperties: string[]
 * }}
 */
export function parseReducedMotion(cssText) {
  if (!cssText) {
    return { hasReducedMotionSupport: false, ruleCount: 0, overriddenProperties: [] };
  }

  let ruleCount = 0;
  const propSet = new Set();

  let match;
  REDUCED_MOTION_RE.lastIndex = 0;

  while ((match = REDUCED_MOTION_RE.exec(cssText)) !== null) {
    ruleCount++;
    const body = match[1];

    DECLARATION_RE.lastIndex = 0;
    let declMatch;
    while ((declMatch = DECLARATION_RE.exec(body)) !== null) {
      const prop = declMatch[1].trim();
      if (prop && !prop.startsWith('-')) propSet.add(prop);
    }
  }

  return {
    hasReducedMotionSupport: ruleCount > 0,
    ruleCount,
    overriddenProperties: [...propSet],
  };
}

/**
 * Extract prefers-reduced-motion data from all accessible document.styleSheets.
 *
 * @returns {{ hasReducedMotionSupport: boolean, ruleCount: number, overriddenProperties: string[] }}
 */
export function detectReducedMotion() {
  let totalRuleCount = 0;
  const allProps = new Set();

  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules ?? sheet.rules ?? [];
    } catch {
      continue;
    }

    for (const rule of rules) {
      if (!rule.cssText) continue;
      const result = parseReducedMotion(rule.cssText);
      totalRuleCount += result.ruleCount;
      for (const p of result.overriddenProperties) allProps.add(p);
    }
  }

  return {
    hasReducedMotionSupport: totalRuleCount > 0,
    ruleCount: totalRuleCount,
    overriddenProperties: [...allProps],
  };
}

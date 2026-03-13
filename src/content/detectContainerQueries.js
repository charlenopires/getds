/**
 * Container query detection — Spec: f87063a1 — Grid and Layout Extraction
 *
 * Detects @container rules (CSSContainerRule, type 12) in accessible
 * stylesheets. Cross-origin sheets are silently skipped.
 */

/** CSSContainerRule type constant (not universally available in all environments) */
const CONTAINER_RULE_TYPE = 12;

/** @typedef {{ condition: string, name: string }} ContainerQuery */

/**
 * Extract unique @container query descriptors from an array of stylesheets.
 *
 * @param {CSSStyleSheet[]} sheets
 * @returns {ContainerQuery[]}
 */
export function extractContainerQueriesFromSheets(sheets) {
  const seen = new Set();
  const results = [];

  for (const sheet of sheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin
    }

    for (const rule of rules) {
      if (rule.type !== CONTAINER_RULE_TYPE) continue;

      const condition = rule.conditionText ?? '';
      const name      = rule.containerName ?? '';
      const key       = `${name}|${condition}`;

      if (!seen.has(key)) {
        seen.add(key);
        results.push({ condition, name });
      }
    }
  }

  return results;
}

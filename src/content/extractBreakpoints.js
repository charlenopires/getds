/**
 * Breakpoint extraction — Spec: f87063a1 — Grid and Layout Extraction
 *
 * Extracts responsive breakpoints from @media query rules in accessible
 * stylesheets, deduplicates them, and categorizes each into:
 *   mobile  (≤ 767px)
 *   tablet  (768–1023px)
 *   desktop (1024–1439px)
 *   wide    (≥ 1440px)
 */

/** @typedef {{ value: number, unit: string, query: string, category: string }} Breakpoint */

/** Regex to match min-width or max-width in a media condition */
const WIDTH_RE = /\(\s*(min|max)-width\s*:\s*([\d.]+)(px|em|rem)\s*\)/i;

/**
 * Categorize a breakpoint pixel value into a named tier.
 *
 * @param {number} px
 * @returns {'mobile'|'tablet'|'desktop'|'wide'}
 */
export function categorizeBreakpoint(px) {
  if (px <= 767)  return 'mobile';
  if (px <= 1023) return 'tablet';
  if (px <= 1439) return 'desktop';
  return 'wide';
}

/**
 * Extract unique breakpoints from an array of CSSStyleSheet objects.
 *
 * Cross-origin sheets whose cssRules access throws are silently skipped.
 *
 * @param {CSSStyleSheet[]} sheets
 * @returns {Breakpoint[]}
 */
export function extractBreakpointsFromSheets(sheets) {
  const seen = new Map(); // `${value}${unit}` → Breakpoint

  for (const sheet of sheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin
    }

    for (const rule of rules) {
      if (rule.type !== (typeof CSSRule !== 'undefined' ? CSSRule.MEDIA_RULE : 4)) continue;

      const condition = rule.conditionText ?? rule.media?.mediaText ?? '';
      const match = condition.match(WIDTH_RE);
      if (!match) continue;

      const rawValue = parseFloat(match[2]);
      const unit     = match[3].toLowerCase();
      const key      = `${rawValue}${unit}`;

      if (!seen.has(key)) {
        // Convert em to approximate px for categorization (1em ≈ 16px)
        const px = unit === 'px' ? rawValue : rawValue * 16;
        seen.set(key, {
          value: rawValue,
          unit,
          query: condition,
          category: categorizeBreakpoint(px),
        });
      }
    }
  }

  return Array.from(seen.values());
}

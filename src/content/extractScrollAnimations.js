/**
 * Scroll-driven animation extraction
 *
 * Extracts scroll-timeline, view-timeline, and animation-timeline
 * declarations from stylesheets via CSSOM with regex fallback.
 *
 * @returns {{ scrollAnimations: Array<{ timeline: string, animation: string, type: string }> }}
 */

const SCROLL_PROPS_RE = /(?:scroll-timeline|view-timeline|animation-timeline)\s*:\s*([^;}"]+)/gi;

/**
 * @returns {{ scrollAnimations: Array<{ timeline: string, animation: string, type: string }> }}
 */
export function extractScrollAnimations() {
  const scrollAnimations = [];
  const seen = new Set();

  let sheets;
  try {
    sheets = document.styleSheets;
  } catch {
    return { scrollAnimations };
  }

  for (const sheet of sheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      // CORS-blocked stylesheet — try fallback via ownerNode
      try {
        const text = sheet.ownerNode?.textContent ?? '';
        extractFromCssText(text, scrollAnimations, seen);
      } catch { /* ignore */ }
      continue;
    }

    for (const rule of rules) {
      if (!rule.cssText) continue;
      extractFromCssText(rule.cssText, scrollAnimations, seen);
    }
  }

  return { scrollAnimations };
}

/**
 * @param {string} cssText
 * @param {Array} results
 * @param {Set} seen
 */
function extractFromCssText(cssText, results, seen) {
  SCROLL_PROPS_RE.lastIndex = 0;
  let match;

  while ((match = SCROLL_PROPS_RE.exec(cssText)) !== null) {
    const fullMatch = match[0];
    const value = match[1].trim();

    if (!value || value === 'auto' || value === 'none') continue;

    const key = fullMatch.trim();
    if (seen.has(key)) continue;
    seen.add(key);

    let type = 'scroll';
    if (fullMatch.includes('view-timeline')) type = 'view';
    else if (fullMatch.includes('animation-timeline')) type = 'animation-timeline';
    else if (fullMatch.includes('scroll-timeline')) type = 'scroll';

    const animation = extractAnimationName(cssText) ?? '';

    results.push({ timeline: value, animation, type });
  }
}

/**
 * Try to extract the animation-name from the same rule block.
 * @param {string} cssText
 * @returns {string|null}
 */
function extractAnimationName(cssText) {
  const m = cssText.match(/animation(?:-name)?\s*:\s*([^;}"]+)/i);
  if (!m) return null;
  // First word of animation shorthand is typically the name (or duration, but names don't start with digits)
  const parts = m[1].trim().split(/\s+/);
  for (const p of parts) {
    if (!/^[\d.]/.test(p) && !['none', 'normal', 'reverse', 'alternate', 'forwards', 'backwards', 'both', 'infinite', 'paused', 'running'].includes(p)) {
      return p;
    }
  }
  return parts[0] ?? null;
}

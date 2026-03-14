/**
 * Animation trigger extraction — Layer 5
 *
 * Detects what triggers each animation/transition (hover, focus, active, scroll, load).
 * Scans CSSOM for pseudo-class rules and DOM for scroll-trigger attributes.
 *
 * @returns {{ triggers: Array<{ type: string, selector: string, animationOrProperty: string, source: string }> }}
 */

const PSEUDO_TRIGGERS = [
  { type: 'hover',  re: /:hover\b/ },
  { type: 'focus',  re: /:focus(?:-within|-visible)?\b/ },
  { type: 'active', re: /:active\b/ },
];

const MOTION_PROPS_RE = /\b(transition|animation|transform|opacity|translate|scale|rotate)\b/;

const SCROLL_ATTRS = ['data-aos', 'data-scroll', 'data-animate', 'data-reveal', 'data-sal'];

/**
 * Extract animation triggers from CSSOM and DOM attributes.
 *
 * @returns {{ triggers: Array<{ type: string, selector: string, animationOrProperty: string, source: string }> }}
 */
export function extractAnimationTriggers() {
  const triggers = [];
  const seen = new Set();

  // 1. Scan CSSOM for pseudo-class rules with motion properties
  try {
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules ?? sheet.rules ?? [];
      } catch {
        // CORS-blocked — try fallback
        try {
          const text = sheet.ownerNode?.textContent ?? '';
          extractTriggersFromCssText(text, triggers, seen);
        } catch { /* ignore */ }
        continue;
      }

      for (const rule of rules) {
        if (!rule.cssText) continue;
        extractTriggersFromCssText(rule.cssText, triggers, seen);
      }
    }
  } catch { /* ignore */ }

  // 2. Scan DOM for scroll-trigger attributes
  for (const attr of SCROLL_ATTRS) {
    let els = [];
    try { els = document.querySelectorAll(`[${attr}]`); } catch {
      // Fallback: scan all elements
      try { els = Array.from(document.getElementsByTagName('*')).filter(el => el.hasAttribute(attr)); } catch { continue; }
    }
    for (const el of els) {
      const value = el.getAttribute(attr) || 'scroll';
      const selector = buildSelector(el);
      const key = `scroll|${selector}|${value}`;
      if (seen.has(key)) continue;
      seen.add(key);

      triggers.push({
        type: 'scroll',
        selector,
        animationOrProperty: value,
        source: `[${attr}]`,
      });
    }
  }

  return { triggers };
}

/**
 * Parse CSS text for pseudo-class rules that contain motion-related properties.
 */
function extractTriggersFromCssText(cssText, results, seen) {
  // Split into individual rule blocks
  const ruleRe = /([^{]+)\{([^}]*)\}/g;
  let match;

  while ((match = ruleRe.exec(cssText)) !== null) {
    const selector = match[1].trim();
    const body = match[2];

    // Skip @-rules
    if (selector.startsWith('@')) continue;

    // Check if selector contains a trigger pseudo-class
    for (const { type, re } of PSEUDO_TRIGGERS) {
      if (!re.test(selector)) continue;
      if (!MOTION_PROPS_RE.test(body)) continue;

      // Extract the motion property name
      const propMatch = body.match(MOTION_PROPS_RE);
      const prop = propMatch ? propMatch[1] : 'unknown';

      const key = `${type}|${selector}|${prop}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        type,
        selector,
        animationOrProperty: prop,
        source: 'cssom',
      });
    }
  }
}

function buildSelector(el) {
  let label = el.tagName.toLowerCase();
  if (el.id) return '#' + el.id;
  if (el.classList && el.classList.length) {
    const cls = Array.from(el.classList).filter(c => /^[\w-]+$/.test(c)).slice(0, 2).join('.');
    if (cls) label += '.' + cls;
  }
  return label;
}

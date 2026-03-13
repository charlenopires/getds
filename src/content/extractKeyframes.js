/**
 * @keyframes extraction — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Parses CSS text to extract @keyframes rules with their name,
 * stop percentages/keywords, and the CSS properties animated at each stop.
  * 
 * @example
 * // Usage of extractKeyframes
*/

/**
 * Parse CSS declarations block into a styles object.
 * e.g. "opacity: 0; transform: scale(0.8);" → { opacity: '0', transform: 'scale(0.8)' }
 */
function parseDeclarations(block) {
  const styles = {};
  // Split on semicolons, but be careful with values containing parens like cubic-bezier()
  const parts = block.split(';');
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx < 0) continue;
    const prop = part.slice(0, colonIdx).trim();
    const val  = part.slice(colonIdx + 1).trim();
    if (prop && val) styles[prop] = val;
  }
  return styles;
}

/**
 * Parse @keyframes rules from raw CSS text.
 *
 * @param {string} cssText
 * @returns {Array<{
 *   name: string,
 *   stops: Array<{ key: string, styles: Record<string, string> }>
 * }>}
 */
export function parseKeyframes(cssText) {
  if (!cssText) return [];

  const results = [];

  // Match @keyframes name { ... }
  // Uses a simple brace-counting approach to handle nested braces
  const keyframesRe = /@keyframes\s+([\w-]+)\s*\{/g;
  let match;

  while ((match = keyframesRe.exec(cssText)) !== null) {
    const name = match[1];
    const startIdx = match.index + match[0].length;

    // Find the matching closing brace
    let depth = 1;
    let i = startIdx;
    while (i < cssText.length && depth > 0) {
      if (cssText[i] === '{') depth++;
      else if (cssText[i] === '}') depth--;
      i++;
    }
    const body = cssText.slice(startIdx, i - 1);

    // Parse each keyframe stop inside the body
    const stops = [];
    const stopRe = /(from|to|\d+(?:\.\d+)?%)\s*\{([^}]*)\}/g;
    let stopMatch;

    while ((stopMatch = stopRe.exec(body)) !== null) {
      stops.push({
        key: stopMatch[1].trim(),
        styles: parseDeclarations(stopMatch[2]),
      });
    }

    results.push({ name, stops });
  }

  return results;
}

/**
 * Extract @keyframes rules from all accessible document.styleSheets.
 *
 * @returns {Array<{ name: string, stops: Array<{ key: string, styles: Record<string, string> }> }>}
 */
export function extractKeyframes() {
  const results = [];

  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules ?? sheet.rules ?? [];
    } catch {
      continue; // cross-origin
    }

    for (const rule of rules) {
      // CSSKeyframesRule type = 7
      if (rule.type !== 7) continue;
      const name = rule.name;
      const stops = [];

      for (const keyframeRule of rule.cssRules ?? []) {
        stops.push({
          key: keyframeRule.keyText,
          styles: parseDeclarations(keyframeRule.style?.cssText ?? ''),
        });
      }

      results.push({ name, stops });
    }
  }

  return results;
}

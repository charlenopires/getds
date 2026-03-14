/**
 * Gradient extraction — Visual Foundations
 * Extracts gradient values from computed background-image properties.
 */

const GRADIENT_RE = /(linear|radial|conic)-gradient\(([^)]+(?:\([^)]*\)[^)]*)*)\)/g;

/**
 * Parse color stops from a gradient value string.
 * @param {string} gradientBody
 * @returns {string[]}
 */
function parseStops(gradientBody) {
  // Split by commas that are not inside parentheses
  const stops = [];
  let depth = 0;
  let current = '';
  for (const ch of gradientBody) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) stops.push(trimmed);
      current = '';
      continue;
    }
    current += ch;
  }
  const last = current.trim();
  if (last) stops.push(last);
  // First stop is usually the direction/shape, rest are color stops
  return stops.length > 1 ? stops.slice(1) : stops;
}

/**
 * Extract gradients from computed styles.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{ gradients: Array<{ type: string, value: string, stops: string[] }> }}
 */
export function extractGradients(computedStyles) {
  const seen = new Set();
  const gradients = [];

  for (const cs of computedStyles) {
    const bg = cs.getPropertyValue('background-image') ?? '';
    if (bg === 'none' || !bg) continue;

    let match;
    const re = new RegExp(GRADIENT_RE.source, GRADIENT_RE.flags);
    while ((match = re.exec(bg)) !== null) {
      const type = match[1];
      const value = match[0];
      if (seen.has(value)) continue;
      seen.add(value);
      gradients.push({ type, value, stops: parseStops(match[2]) });
    }
  }

  return { gradients };
}

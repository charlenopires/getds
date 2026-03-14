// ── Structured Shadow Destructuring (W3C DTCG) ────────────────────────
// Inspired by projectwallace destructure-box-shadow.ts.
// Extends getds's parseBoxShadow (categorizeElevation.js) with color extraction.

// Reuse the embedded color regex from extractColors.js
const COLOR_RE = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)|hsla?\(\s*[\d.]+\s*,\s*[\d.%]+\s*,\s*[\d.%]+(?:\s*,\s*[\d.]+)?\s*\)|#[0-9a-fA-F]{3,8}\b/;

/**
 * Parse a single box-shadow layer into a W3C DTCG shadow value object.
 *
 * @param {string} shadow - A single shadow (not comma-separated).
 * @returns {{ offsetX: {value: number, unit: string}, offsetY: {value: number, unit: string},
 *             blur: {value: number, unit: string}, spread: {value: number, unit: string},
 *             color: string, inset: boolean }}
 */
function parseSingleShadow(shadow) {
  const trimmed = shadow.trim();
  if (!trimmed || trimmed === 'none') return null;

  // Detect inset
  const inset = /\binset\b/i.test(trimmed);
  // Remove inset keyword for dimension parsing
  let cleaned = trimmed.replace(/\binset\b/gi, '').trim();

  // Extract color (may be at start or end)
  let color = '#000000';
  const colorMatch = cleaned.match(COLOR_RE);
  if (colorMatch) {
    color = colorMatch[0];
    cleaned = cleaned.replace(COLOR_RE, '').trim();
  }

  // Extract dimensions (px values)
  const dims = cleaned.match(/-?[\d.]+px|-?[\d.]+(?=\s|$)/g) || [];
  const values = dims.map((d) => parseFloat(d));

  const dim = (v) => ({ value: v ?? 0, unit: 'px' });

  return {
    offsetX: dim(values[0]),
    offsetY: dim(values[1]),
    blur: dim(values[2]),
    spread: dim(values[3]),
    color,
    inset,
  };
}

/**
 * Destructure a CSS box-shadow value into W3C DTCG shadow object(s).
 * Handles multiple comma-separated shadows.
 *
 * @param {string} shadowString - Full CSS box-shadow value.
 * @returns {Array|object|null} Array for multiple shadows, single object for one, null on failure.
 */
export function destructureShadow(shadowString) {
  if (!shadowString || shadowString === 'none') return null;

  try {
    // Split by comma, but respect parentheses (for rgba/hsla)
    const layers = [];
    let depth = 0, start = 0;
    for (let i = 0; i < shadowString.length; i++) {
      if (shadowString[i] === '(') depth++;
      else if (shadowString[i] === ')') depth--;
      else if (shadowString[i] === ',' && depth === 0) {
        layers.push(shadowString.slice(start, i));
        start = i + 1;
      }
    }
    layers.push(shadowString.slice(start));

    const parsed = layers.map(parseSingleShadow).filter(Boolean);
    if (parsed.length === 0) return null;
    return parsed.length === 1 ? parsed[0] : parsed;
  } catch {
    return null;
  }
}

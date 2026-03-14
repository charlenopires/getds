// ── HSL-based color family grouping ────────────────────────────────────
// Inspired by projectwallace group-colors.ts: classifies colors into 12 families.

const HUE_RANGES = [
  { family: 'red',    min: 0,   max: 22  },
  { family: 'orange', min: 22,  max: 50  },
  { family: 'yellow', min: 50,  max: 72  },
  { family: 'green',  min: 72,  max: 165 },
  { family: 'cyan',   min: 165, max: 195 },
  { family: 'blue',   min: 195, max: 260 },
  { family: 'purple', min: 260, max: 300 },
  { family: 'pink',   min: 300, max: 345 },
  { family: 'red',    min: 345, max: 360 },
];

/**
 * Parse "hsl(210, 50%, 60%)" → { h, s, l } with s/l as 0–100.
 */
function parseHslString(hsl) {
  if (!hsl) return null;
  const m = hsl.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/);
  if (!m) return null;
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) };
}

/**
 * Classify a single color entry into a hue family.
 */
function classifyColor(hslValues) {
  const { h, s, l } = hslValues;

  // Achromatic checks (low saturation or extreme lightness)
  if (s < 10 && l > 90) return 'white';
  if (s < 10 && l < 10) return 'black';
  if (s < 5) return 'grey';

  // Chromatic — find hue range
  for (const range of HUE_RANGES) {
    if (h >= range.min && h < range.max) return range.family;
  }
  return 'red'; // fallback for exactly 360
}

/**
 * Group colors by hue family.
 *
 * @param {Array<{hsl?: string, hex?: string, count?: number, [k: string]: any}>} colors
 * @returns {Array<{family: string, colors: Array}>} sorted by group size descending
 */
export function groupColorsByHue(colors) {
  if (!colors || colors.length === 0) return [];

  const groups = new Map();

  for (const c of colors) {
    const hslValues = parseHslString(c.hsl);
    if (!hslValues) continue;

    const family = classifyColor(hslValues);
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push(c);
  }

  return Array.from(groups.entries())
    .map(([family, familyColors]) => ({ family, colors: familyColors }))
    .sort((a, b) => b.colors.length - a.colors.length);
}

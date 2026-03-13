/**
 * Semantic role inference — Spec: fff645a0 — Color System Extraction
 *
 * Assigns semantic roles to colors using:
 *   1. Hue/saturation analysis for alert colors (danger, success, warning, info)
 *   2. Frequency + CSS property context for structural roles (surface, on-surface, primary, secondary)
 *   3. Accent for high-saturation brand colors not covered by alert ranges
 *   4. Neutral as fallback
 *
 * Alert roles always take precedence over frequency-based roles.
  * 
 * @example
 * // Usage of inferSemanticRoles
*/

import { normalizeColor } from './normalizeColor.js';

/**
 * Parse an hsl() string into { h, s, l, a } numbers (h: 0-360, s/l: 0-100).
 */
function parseHslString(hsl) {
  if (!hsl) return null;
  const m = hsl.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]), a: m[4] !== undefined ? Number(m[4]) : 1 };
}

/**

 * Executes the getHsl functionality.

 * 

 * @param {any} colorEntry - The colorEntry parameter.

 * @returns {any} Result of getHsl.

 * 

 * @example

 * getHsl(colorEntry);

 */

function getHsl(colorEntry) {
  if (colorEntry.hsl) {
    const parsed = parseHslString(colorEntry.hsl);
    if (parsed) return parsed;
  }
  const norm = normalizeColor(colorEntry.raw);
  if (norm?.hsl) return parseHslString(norm.hsl);
  return null;
}

/**
 * Classify a color into an alert role based on hue + saturation.
 * Returns 'danger'|'success'|'warning'|'info'|null.
 *
 * Hue ranges (degrees):
 *   danger  : 345-360 + 0-15   (red)
 *   warning : 30-65             (yellow / amber)
 *   success : 90-165            (green)
 *   info    : 195-240           (sky-blue to blue)
 *   Purple/violet (240+) is left unclassified here → accent
 */
function alertRole(hsl) {
  if (!hsl || hsl.s < 40) return null;
  const { h } = hsl;
  if (h >= 345 || h <= 15) return 'danger';
  if (h >= 30  && h <= 65)  return 'warning';
  if (h >= 90  && h <= 165) return 'success';
  if (h >= 195 && h <= 240) return 'info';
  return null;
}

/**
 * @param {Array<{ raw: string, property: string, count?: number, hsl?: string }>} colors
 * @returns {Array<{ colorRaw: string, role: string }>}
 */
export function inferSemanticRoles(colors) {
  const assigned = new Map(); // raw → role

  // --- Pass 1: Alert roles (hue-based — highest priority) ---
  for (const c of colors) {
    const hsl = getHsl(c);
    const role = alertRole(hsl);
    if (role && !assigned.has(c.raw)) assigned.set(c.raw, role);
  }

  // --- Pass 2: Structural roles from frequency + property context ---
  const byCount = arr => [...arr].sort((a, b) => (b.count ?? 1) - (a.count ?? 1));
  const bgColors   = byCount(colors.filter(c => c.property === 'background-color'));
  const textColors = byCount(colors.filter(c => c.property === 'color'));

  // surface = most-used background (override alert if it's also an alert color — unlikely but handle)
  const topBg = bgColors.find(c => !assigned.has(c.raw));
  if (topBg) assigned.set(topBg.raw, 'surface');

  // on-surface = most-used text color when a surface exists; else primary
  const topText = textColors.find(c => !assigned.has(c.raw));
  if (topText) assigned.set(topText.raw, topBg ? 'on-surface' : 'primary');

  // secondary = next most-used text color
  const secondText = textColors.find(c => !assigned.has(c.raw));
  if (secondText) assigned.set(secondText.raw, 'secondary');

  // --- Pass 3: Accent — high-saturation, not yet assigned ---
  for (const c of colors) {
    if (assigned.has(c.raw)) continue;
    const hsl = getHsl(c);
    if (hsl && hsl.s >= 60) {
      assigned.set(c.raw, 'accent');
      break;
    }
  }

  // --- Pass 4: Everything else → neutral ---
  for (const c of colors) {
    if (!assigned.has(c.raw)) assigned.set(c.raw, 'neutral');
  }

  return colors.map(c => ({ colorRaw: c.raw, role: assigned.get(c.raw) ?? 'neutral' }));
}

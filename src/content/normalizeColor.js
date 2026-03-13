/**
 * Color normalization — Spec: fff645a0 — Color System Extraction
 *
 * Converts any CSS color string to canonical hex, rgb, and hsl representations.
  * 
 * @example
 * // Usage of normalizeColor
*/

/** Parse an rgb/rgba string into { r, g, b, a } — all numbers */
function parseRgb(str) {
  const m = str.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/
  );
  if (!m) return null;
  return {
    r: Math.round(Number(m[1])),
    g: Math.round(Number(m[2])),
    b: Math.round(Number(m[3])),
    a: m[4] !== undefined ? Number(m[4]) : 1,
  };
}

/** Parse a 3- or 6- or 8-digit hex string into { r, g, b, a } */
function parseHex(str) {
  let h = str.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 6) h += 'ff';
  if (h.length !== 8) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16) / 255,
  };
}

/** Parse hsl/hsla into { r, g, b, a } via conversion */
function parseHsl(str) {
  const m = str.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/
  );
  if (!m) return null;
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const a = m[4] !== undefined ? Number(m[4]) : 1;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
}

/**

 * Executes the hue2rgb functionality.

 * 

 * @param {any} p - The p parameter.

 * @param {any} q - The q parameter.

 * @param {any} t - The t parameter.

 * @returns {any} Result of hue2rgb.

 * 

 * @example

 * hue2rgb(p, q, t);

 */

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/** Convert { r, g, b, a } to hex string (#rrggbb or #rrggbbaa) */
function toHex({ r, g, b, a }) {
  const hex = [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  if (a < 1) {
    const ah = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${hex}${ah}`;
  }
  return `#${hex}`;
}

/** Convert { r, g, b, a } to rgb()/rgba() string */
function toRgbString({ r, g, b, a }) {
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

/** Convert { r, g, b, a } to hsl()/hsla() string */
function toHslString({ r, g, b, a }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return a < 1
    ? `hsla(${hDeg}, ${sPct}%, ${lPct}%, ${a})`
    : `hsl(${hDeg}, ${sPct}%, ${lPct}%)`;
}

/**
 * Normalize a CSS color string into { hex, rgb, hsl }.
 * Returns null if the value cannot be parsed.
 *
 * @param {string} raw
 * @returns {{ hex: string, rgb: string, hsl: string } | null}
 */
export function normalizeColor(raw) {
  const s = raw.trim();
  let channels = null;

  if (s.startsWith('rgb')) channels = parseRgb(s);
  else if (s.startsWith('#')) channels = parseHex(s);
  else if (s.startsWith('hsl')) channels = parseHsl(s);

  if (!channels) return null;

  return {
    hex: toHex(channels),
    rgb: toRgbString(channels),
    hsl: toHslString(channels),
  };
}

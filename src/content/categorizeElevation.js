/**
 * Elevation categorization — Spec: 7c17b9ef — Elevation and Border Radius Extraction
 *
 * Parses box-shadow values and assigns elevation levels 0–5 based on blur radius.
 */

/**
 * Parse a CSS box-shadow string into its numeric components.
 * Handles: [inset] <offsetX> <offsetY> [<blur> [<spread>]] <color>
 *
 * @param {string} value
 * @returns {{ offsetX: number, offsetY: number, blur: number, spread: number, inset: boolean } | null}
 */
export function parseBoxShadow(value) {
  if (!value || value.trim() === 'none') return null;

  const inset = /\binset\b/.test(value);
  const cleaned = value.replace(/\binset\b/g, '').trim();

  // Extract px/unitless numeric tokens (skip color tokens like rgba/rgb/hsl/#hex)
  const numericTokens = [...cleaned.matchAll(/-?[\d.]+px|-?[\d.]+(?=\s|$)/g)]
    .map(m => parseFloat(m[0]));

  if (numericTokens.length < 2) return null;

  const [offsetX, offsetY, blur = 0, spread = 0] = numericTokens;

  return { offsetX, offsetY, blur, spread, inset };
}

/**
 * Assign elevation levels (0–5) to shadow entries by ranking blur radius.
 *
 * @param {Array<{ value: string }>} shadows
 * @returns {Array<{ value: string, blur: number, level: number }>}
 */
export function categorizeElevation(shadows) {
  const parsed = shadows
    .map(entry => {
      const p = parseBoxShadow(entry.value);
      return p ? { value: entry.value, blur: p.blur } : null;
    })
    .filter(Boolean);

  if (parsed.length === 0) return [];

  // Sort by blur to assign relative levels 0–5
  const sorted = [...parsed].sort((a, b) => a.blur - b.blur);
  const maxBlur = sorted[sorted.length - 1].blur;
  const minBlur = sorted[0].blur;
  const range = maxBlur - minBlur || 1;

  for (const entry of parsed) {
    entry.level = Math.round(((entry.blur - minBlur) / range) * 5);
  }

  return parsed;
}

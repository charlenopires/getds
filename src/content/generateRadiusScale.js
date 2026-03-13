/**
 * Border-radius scale generation — Spec: 7c17b9ef — Elevation and Border Radius Extraction
 *
 * Maps sorted unique border-radius px values to semantic names:
 * none=0, xs, sm, md, lg, xl (by distribution), full=9999px or >=50%
 */

const SCALE_NAMES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
const FULL_PX = 9999;
const FULL_PCT = 50;

/**
 * Parse a border-radius CSS value to px.
 * Returns null for values that cannot be resolved (auto, %, unless 50%+).
 *
 * @param {string} value
 * @returns {{ px: number, isFull: boolean } | null}
 */
function parseRadius(value) {
  if (!value) return null;

  const pctMatch = value.match(/^([\d.]+)%$/);
  if (pctMatch) {
    const pct = Number(pctMatch[1]);
    return pct >= FULL_PCT ? { px: FULL_PX, isFull: true } : null;
  }

  const pxMatch = value.match(/^([\d.]+)px$/);
  if (pxMatch) {
    const px = Number(pxMatch[1]);
    return { px, isFull: px >= FULL_PX };
  }

  const remMatch = value.match(/^([\d.]+)rem$/);
  if (remMatch) {
    return { px: Number(remMatch[1]) * 16, isFull: false };
  }

  return null;
}

/**
 * Generate a named border-radius scale from unique radius entries.
 *
 * @param {Array<{ value: string }>} radii
 * @returns {{ scale: Array<{ name: string, value: string, px: number }> }}
 */
export function generateRadiusScale(radii) {
  const parsed = radii
    .map(entry => {
      const p = parseRadius(entry.value);
      return p ? { name: '', value: entry.value, px: p.px, isFull: p.isFull } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.px - b.px);

  if (parsed.length === 0) return { scale: [] };

  // Separate full-radius entries
  const regular = parsed.filter(e => !e.isFull);
  const full    = parsed.filter(e => e.isFull);

  // Assign names to regular entries
  if (regular.length === 1) {
    regular[0].name = 'md';
  } else {
    const names = SCALE_NAMES.slice(0, regular.length);
    regular.forEach((entry, i) => { entry.name = names[i] ?? `radius-${i + 1}`; });
  }

  // All full entries get name 'full'
  for (const entry of full) entry.name = 'full';

  const scale = [...regular, ...full]
    .sort((a, b) => a.px - b.px)
    .map(({ name, value, px }) => ({ name, value, px }));

  return { scale };
}

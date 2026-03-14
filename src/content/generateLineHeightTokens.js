// -- Line Height Token Generation (W3C DTCG) ----------------------------------
// Inspired by projectwallace destructure-line-height.ts.

/**
 * Generate W3C DTCG line height tokens from extractTypeStyles() output.
 *
 * @param {Array<{lineHeight: string, [k: string]: any}>} styles
 * @returns {Record<string, {$type: string, $value: number|string}>}
 */
export function generateLineHeightTokens(styles) {
  if (!styles || styles.length === 0) return {};

  const unique = new Map();

  for (const s of styles) {
    const lh = s.lineHeight;
    if (!lh || unique.has(lh)) continue;

    if (lh === 'normal') {
      unique.set(lh, { $type: 'number', $value: 1.2 });
    } else if (/^[\d.]+$/.test(lh)) {
      // Unitless number
      unique.set(lh, { $type: 'number', $value: parseFloat(lh) });
    } else if (/^[\d.]+px$/.test(lh)) {
      unique.set(lh, { $type: 'dimension', $value: lh });
    } else if (/^[\d.]+rem$/.test(lh)) {
      unique.set(lh, { $type: 'dimension', $value: lh });
    } else if (/^[\d.]+em$/.test(lh)) {
      unique.set(lh, { $type: 'dimension', $value: lh });
    } else if (/^[\d.]+%$/.test(lh)) {
      // Convert percentage to unitless (e.g., 150% -> 1.5)
      unique.set(lh, { $type: 'number', $value: parseFloat(lh) / 100 });
    }
  }

  const tokens = {};
  let idx = 1;
  const sorted = [...unique.entries()].sort((a, b) => {
    const av = typeof a[1].$value === 'number' ? a[1].$value : parseFloat(a[1].$value);
    const bv = typeof b[1].$value === 'number' ? b[1].$value : parseFloat(b[1].$value);
    return av - bv;
  });

  for (const [, token] of sorted) {
    tokens[`lineHeight-${idx}`] = token;
    idx++;
  }

  return tokens;
}

// ── Perceptual Color Deduplication (CIE76 delta-E) ─────────────────────
// Inspired by dembrandt's CIE76 algorithm and projectwallace's hash-based dedup.

/**
 * Parse #rrggbb or #rgb hex string to {r, g, b} (0–255).
 */
export function hexToRgb(hex) {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * sRGB gamma linearization (identical to contrastRatio.js:linearize).
 */
export function srgbToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Convert sRGB (0–255) to CIELAB using D65 reference white.
 */
export function rgbToLab(r, g, b) {
  // sRGB → linear
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  // linear RGB → XYZ (D65)
  let x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  let y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  let z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  // D65 reference white
  const xn = 0.95047, yn = 1.0, zn = 1.08883;
  x /= xn; y /= yn; z /= zn;

  const f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(x), fy = f(y), fz = f(z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * CIE76 color difference (Euclidean distance in Lab space).
 */
export function deltaE76(lab1, lab2) {
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 +
    (lab1.a - lab2.a) ** 2 +
    (lab1.b - lab2.b) ** 2
  );
}

/**
 * Deduplicate colors by perceptual similarity.
 * Groups colors within `threshold` delta-E, keeps entry with highest count,
 * sums merged counts.
 *
 * @param {Array<{hex: string, count?: number, [k: string]: any}>} colors
 * @param {number} threshold - CIE76 distance below which colors merge (default 15)
 * @returns {Array} deduplicated colors with `mergedFrom` field
 */
export function deduplicateColors(colors, threshold = 15) {
  if (!colors || colors.length === 0) return [];

  // Pre-compute Lab values
  const entries = colors.map((c) => {
    const hex = c.hex || '#000000';
    const { r, g, b } = hexToRgb(hex);
    return { ...c, lab: rgbToLab(r, g, b), count: c.count ?? 1 };
  });

  const used = new Array(entries.length).fill(false);
  const result = [];

  for (let i = 0; i < entries.length; i++) {
    if (used[i]) continue;

    let best = entries[i];
    let totalCount = best.count;
    let mergedFrom = 0;

    for (let j = i + 1; j < entries.length; j++) {
      if (used[j]) continue;
      if (deltaE76(best.lab, entries[j].lab) < threshold) {
        used[j] = true;
        mergedFrom++;
        totalCount += entries[j].count;
        if (entries[j].count > best.count) {
          best = entries[j];
        }
      }
    }

    const { lab, ...rest } = best;
    result.push({ ...rest, count: totalCount, mergedFrom });
  }

  return result;
}

/**
 * Remove noise colors that appear fewer than `minCount` times.
 */
export function filterNoiseColors(colors, minCount = 3) {
  if (!colors || colors.length === 0) return [];
  return colors.filter((c) => (c.count ?? 1) >= minCount);
}

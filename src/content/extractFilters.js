/**
 * CSS filter extraction — Visual Foundations
 * Extracts filter and backdrop-filter values.
 */

const FILTER_FN_RE = /(\w[\w-]*)\([^)]*\)/g;

/**
 * Parse function names from a filter value.
 * @param {string} value
 * @returns {string[]}
 */
function parseFunctions(value) {
  const fns = [];
  let match;
  const re = new RegExp(FILTER_FN_RE.source, FILTER_FN_RE.flags);
  while ((match = re.exec(value)) !== null) {
    fns.push(match[1]);
  }
  return fns;
}

/**
 * Extract filter, backdrop-filter, clip-path, mask-image, and mix-blend-mode values from computed styles.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{ filters: Array<{ value: string, functions: string[] }>, backdropFilters: Array<{ value: string, functions: string[] }>, clipPaths: Array<{ value: string }>, maskImages: Array<{ value: string }>, blendModes: Array<{ value: string, count: number }> }}
 */
export function extractFilters(computedStyles) {
  const seenFilters = new Set();
  const seenBackdrop = new Set();
  const seenClipPath = new Set();
  const seenMask = new Set();
  const blendModeMap = new Map();
  const filters = [];
  const backdropFilters = [];
  const clipPaths = [];
  const maskImages = [];

  for (const cs of computedStyles) {
    const f = cs.getPropertyValue('filter') ?? '';
    if (f && f !== 'none' && !seenFilters.has(f)) {
      seenFilters.add(f);
      filters.push({ value: f, functions: parseFunctions(f) });
    }

    const bf = cs.getPropertyValue('backdrop-filter') ?? '';
    if (bf && bf !== 'none' && !seenBackdrop.has(bf)) {
      seenBackdrop.add(bf);
      backdropFilters.push({ value: bf, functions: parseFunctions(bf) });
    }

    const cp = cs.getPropertyValue('clip-path') ?? '';
    if (cp && cp !== 'none' && !seenClipPath.has(cp)) {
      seenClipPath.add(cp);
      clipPaths.push({ value: cp });
    }

    const mi = cs.getPropertyValue('mask-image') ?? cs.getPropertyValue('-webkit-mask-image') ?? '';
    if (mi && mi !== 'none' && !seenMask.has(mi)) {
      seenMask.add(mi);
      maskImages.push({ value: mi });
    }

    const bm = cs.getPropertyValue('mix-blend-mode') ?? '';
    if (bm && bm !== 'normal') {
      blendModeMap.set(bm, (blendModeMap.get(bm) ?? 0) + 1);
    }
  }

  const blendModes = Array.from(blendModeMap.entries()).map(([value, count]) => ({ value, count }));

  return { filters, backdropFilters, clipPaths, maskImages, blendModes };
}

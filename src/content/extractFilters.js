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
 * Extract filter and backdrop-filter values from computed styles.
 * @param {CSSStyleDeclaration[]} computedStyles
 * @returns {{ filters: Array<{ value: string, functions: string[] }>, backdropFilters: Array<{ value: string, functions: string[] }> }}
 */
export function extractFilters(computedStyles) {
  const seenFilters = new Set();
  const seenBackdrop = new Set();
  const filters = [];
  const backdropFilters = [];

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
  }

  return { filters, backdropFilters };
}

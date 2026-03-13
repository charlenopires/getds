/**
 * Card grid detection — Spec: 446634bf — Layout Pattern Detection
 *
 * Analyses a set of card bounding rects to determine grid structure:
 * column count, row count, uniformity, and modal card dimensions.
 */

const PX_TOLERANCE = 5; // sub-pixel tolerance for grouping positions

/**
 * Group numeric values into buckets within a tolerance.
 *
 * @param {number[]} values
 * @param {number}   tolerance
 * @returns {number[][]} Array of value groups
 */
function bucketize(values, tolerance) {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const buckets = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const last = buckets[buckets.length - 1];
    if (sorted[i] - last[last.length - 1] <= tolerance) {
      last.push(sorted[i]);
    } else {
      buckets.push([sorted[i]]);
    }
  }
  return buckets;
}

/**
 * Return the modal (most-frequent) value from an array of numbers.
 *
 * @param {number[]} values
 * @returns {number}
 */
function modal(values) {
  if (values.length === 0) return 0;
  const freq = new Map();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Analyse grid structure from an array of card bounding rects.
 *
 * @param {Array<{ rect: { top: number, left: number, width: number, height: number } }>} cards
 * @returns {{
 *   columnCount: number,
 *   rowCount: number,
 *   cardCount: number,
 *   cardWidth: number,
 *   cardHeight: number,
 *   isUniform: boolean
 * }}
 */
export function analyseCardGrid(cards) {
  if (!cards || cards.length === 0) {
    return { columnCount: 0, rowCount: 0, cardCount: 0, cardWidth: 0, cardHeight: 0, isUniform: true };
  }

  const tops   = cards.map(c => c.rect?.top  ?? 0);
  const lefts  = cards.map(c => c.rect?.left ?? 0);
  const widths = cards.map(c => c.rect?.width  ?? 0);
  const heights= cards.map(c => c.rect?.height ?? 0);

  const rowBuckets = bucketize(tops,  PX_TOLERANCE);
  const colBuckets = bucketize(lefts, PX_TOLERANCE);

  const rowCount    = rowBuckets.length;
  const columnCount = colBuckets.length;

  // Modal dimensions represent the "standard" card size
  const cardWidth  = modal(widths.map(w => Math.round(w)));
  const cardHeight = modal(heights.map(h => Math.round(h)));

  // Uniform: all cards are the same size (within tolerance)
  const widthVariance  = Math.max(...widths)  - Math.min(...widths);
  const heightVariance = Math.max(...heights) - Math.min(...heights);
  const isUniform = widthVariance <= PX_TOLERANCE && heightVariance <= PX_TOLERANCE;

  return { columnCount, rowCount, cardCount: cards.length, cardWidth, cardHeight, isUniform };
}

/**
 * Detect card grid patterns in the live DOM.
 *
 * Looks for containers whose direct children form a repeated grid pattern.
 *
 * @returns {Array<{ selector: string, columnCount: number, rowCount: number, cardCount: number, cardWidth: number, cardHeight: number, isUniform: boolean, gridType: string }>}
 */
export function detectCardGrids() {
  const results = [];
  const MIN_CARDS = 3; // need at least 3 children to call it a grid

  // Candidate containers: elements with display:grid or display:flex with wrapping
  const candidates = Array.from(document.querySelectorAll('*')).filter(el => {
    const cs = getComputedStyle(el);
    const display = cs.display;
    if (display === 'grid') return true;
    if (display === 'flex' && cs.flexWrap !== 'nowrap') return true;
    return false;
  });

  for (const container of candidates) {
    const children = Array.from(container.children).filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

    if (children.length < MIN_CARDS) continue;

    const cards = children.map(el => {
      const r = el.getBoundingClientRect();
      return { rect: { top: r.top, left: r.left, width: r.width, height: r.height } };
    });

    const analysis = analyseCardGrid(cards);
    if (analysis.columnCount < 2) continue; // skip single-column lists

    const cs = getComputedStyle(container);
    const gridType = cs.display === 'grid' ? 'css-grid' : 'flexbox';
    const tag = container.tagName.toLowerCase();
    const cls = container.className ? `.${container.className.trim().split(/\s+/).join('.')}` : '';
    const selector = `${tag}${cls}`.slice(0, 60);

    results.push({ selector, gridType, ...analysis });
  }

  return results;
}

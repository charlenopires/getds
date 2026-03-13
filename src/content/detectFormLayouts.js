/**
 * Form layout detection — Spec: 446634bf — Layout Pattern Detection
 *
 * Classifies each form's field arrangement into one of:
 *   single-column — fields stacked vertically in one lane
 *   multi-column  — fields arranged in 2+ side-by-side columns
 *   inline        — fields on the same horizontal row
 *   grouped       — form uses <fieldset> elements to group fields
 */

/** @type {Record<string, string>} */
export const FORM_LAYOUTS = {
  SINGLE_COLUMN: 'single-column',
  MULTI_COLUMN:  'multi-column',
  INLINE:        'inline',
  GROUPED:       'grouped',
};

/** Tolerance in pixels for considering two positions "the same" */
const TOP_TOLERANCE  = 10;
const LEFT_TOLERANCE = 10;

/**
 * Count distinct values in an array within a given tolerance bucket.
 *
 * @param {number[]} values
 * @param {number} tolerance
 * @returns {number}
 */
function countDistinct(values, tolerance) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  let buckets = 1;
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - prev > tolerance) {
      buckets++;
      prev = sorted[i];
    }
  }
  return buckets;
}

/**
 * Classify the layout pattern of a form from its field rects and fieldset presence.
 *
 * @param {{ fields: Array<{ rect: { top: number, left: number, width: number, height: number } }>, hasFieldsets?: boolean }} input
 * @returns {{ layout: string, confidence: number }}
 */
export function classifyFormLayout({ fields = [], hasFieldsets = false } = {}) {
  // Grouped wins when fieldsets are present regardless of field arrangement
  if (hasFieldsets) {
    return { layout: FORM_LAYOUTS.GROUPED, confidence: 0.95 };
  }

  if (fields.length === 0) {
    return { layout: FORM_LAYOUTS.SINGLE_COLUMN, confidence: 0.5 };
  }

  const tops  = fields.map(f => f.rect?.top  ?? 0);
  const lefts = fields.map(f => f.rect?.left ?? 0);

  const distinctTops  = countDistinct(tops,  TOP_TOLERANCE);
  const distinctLefts = countDistinct(lefts, LEFT_TOLERANCE);

  // Inline: 2+ fields share approximately the same top position
  if (distinctTops === 1 && fields.length > 1) {
    return { layout: FORM_LAYOUTS.INLINE, confidence: 0.9 };
  }

  // Multi-column: 2+ distinct left positions across similar rows
  if (distinctLefts >= 2) {
    return { layout: FORM_LAYOUTS.MULTI_COLUMN, confidence: 0.85 };
  }

  // Single-column: one left lane, fields stacked
  return { layout: FORM_LAYOUTS.SINGLE_COLUMN, confidence: 0.85 };
}

/**
 * Detect layout patterns for all forms in the live DOM.
 *
 * @returns {Array<{ formIndex: number, layout: string, confidence: number, fieldCount: number, hasFieldsets: boolean }>}
 */
export function detectFormLayouts() {
  const results = [];
  const forms = document.getElementsByTagName('form');

  Array.from(forms).forEach((form, formIndex) => {
    const fieldEls = form.querySelectorAll('input:not([type=hidden]), select, textarea');
    const hasFieldsets = form.querySelector('fieldset') !== null;

    const fields = Array.from(fieldEls).map(el => {
      const r = el.getBoundingClientRect();
      return { rect: { top: r.top, left: r.left, width: r.width, height: r.height } };
    });

    const { layout, confidence } = classifyFormLayout({ fields, hasFieldsets });
    results.push({ formIndex, layout, confidence, fieldCount: fields.length, hasFieldsets });
  });

  return results;
}

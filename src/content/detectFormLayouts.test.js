/**
 * Task: d780fdb0 — Detect form layout patterns
 * Spec: 446634bf — Layout Pattern Detection
 */

import { describe, test, expect } from 'bun:test';
import { classifyFormLayout, FORM_LAYOUTS } from './detectFormLayouts.js';

// ── Field builders ────────────────────────────────────────────────────────────

function field(top, left, width = 300, height = 40) {
  return { rect: { top, left, width, height, bottom: top + height, right: left + width } };
}

// ── Typical field arrangements ────────────────────────────────────────────────

/** 3 fields stacked vertically in one column */
const singleColumn = [
  field(0,   0),
  field(60,  0),
  field(120, 0),
  field(180, 0),
];

/** 6 fields in 2 columns (left=0 and left=320), 3 rows */
const multiColumn = [
  field(0,   0,   300),
  field(0,   320, 300),
  field(60,  0,   300),
  field(60,  320, 300),
  field(120, 0,   300),
  field(120, 320, 300),
];

/** 3 fields side-by-side on one row (inline) */
const inline = [
  field(0, 0,   100),
  field(0, 120, 100),
  field(0, 240, 100),
];

/** 4 fields with fieldsets grouping */
const grouped = {
  fields: [
    field(0,   0),
    field(60,  0),
    field(120, 0),
    field(180, 0),
  ],
  hasFieldsets: true,
};

describe('FORM_LAYOUTS — exported layout name constants', () => {
  test('exports SINGLE_COLUMN', () => {
    expect(FORM_LAYOUTS.SINGLE_COLUMN).toBe('single-column');
  });
  test('exports MULTI_COLUMN', () => {
    expect(FORM_LAYOUTS.MULTI_COLUMN).toBe('multi-column');
  });
  test('exports INLINE', () => {
    expect(FORM_LAYOUTS.INLINE).toBe('inline');
  });
  test('exports GROUPED', () => {
    expect(FORM_LAYOUTS.GROUPED).toBe('grouped');
  });
});

describe('classifyFormLayout — pure form layout classification', () => {
  test('returns { layout, confidence } object', () => {
    const result = classifyFormLayout({ fields: singleColumn });
    expect(result).toHaveProperty('layout');
    expect(result).toHaveProperty('confidence');
  });

  test('confidence is between 0 and 1', () => {
    const { confidence } = classifyFormLayout({ fields: singleColumn });
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  test('classifies stacked fields as single-column', () => {
    const { layout } = classifyFormLayout({ fields: singleColumn });
    expect(layout).toBe(FORM_LAYOUTS.SINGLE_COLUMN);
  });

  test('classifies 2-column grid as multi-column', () => {
    const { layout } = classifyFormLayout({ fields: multiColumn });
    expect(layout).toBe(FORM_LAYOUTS.MULTI_COLUMN);
  });

  test('classifies fields on same row as inline', () => {
    const { layout } = classifyFormLayout({ fields: inline });
    expect(layout).toBe(FORM_LAYOUTS.INLINE);
  });

  test('classifies form with fieldsets as grouped', () => {
    const { layout } = classifyFormLayout(grouped);
    expect(layout).toBe(FORM_LAYOUTS.GROUPED);
  });

  test('grouped wins over other patterns when hasFieldsets is true', () => {
    // Even if fields are inline, fieldsets make it grouped
    const { layout } = classifyFormLayout({ fields: inline, hasFieldsets: true });
    expect(layout).toBe(FORM_LAYOUTS.GROUPED);
  });

  test('handles single field as single-column', () => {
    const { layout } = classifyFormLayout({ fields: [field(0, 0)] });
    expect(layout).toBe(FORM_LAYOUTS.SINGLE_COLUMN);
  });

  test('handles empty fields array', () => {
    const result = classifyFormLayout({ fields: [] });
    expect(result).toHaveProperty('layout');
    expect(result).toHaveProperty('confidence');
  });

  test('multi-column has confidence ≥ 0.8', () => {
    const { confidence } = classifyFormLayout({ fields: multiColumn });
    expect(confidence).toBeGreaterThanOrEqual(0.8);
  });

  test('inline has confidence ≥ 0.8 when all fields share same top', () => {
    const { confidence } = classifyFormLayout({ fields: inline });
    expect(confidence).toBeGreaterThanOrEqual(0.8);
  });

  test('tolerates slight vertical misalignment (within 10px) for inline', () => {
    // Fields roughly on same row but with slight offsets
    const nearlyInline = [
      field(0,   0,   100),
      field(5,   120, 100),  // 5px offset
      field(3,   240, 100),  // 3px offset
    ];
    const { layout } = classifyFormLayout({ fields: nearlyInline });
    expect(layout).toBe(FORM_LAYOUTS.INLINE);
  });
});

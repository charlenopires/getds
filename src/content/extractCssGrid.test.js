/**
 * Task: 7f3dca98 — Detect CSS Grid elements and extract grid properties
 * Spec: f87063a1 — Grid and Layout Extraction
 */

import { describe, test, expect } from 'bun:test';
import { extractGridDescriptors, parseColumnCount } from './extractCssGrid.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function style(props = {}) {
  return {
    display: props.display ?? 'block',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

function gridEl(props = {}) {
  return style({ display: 'grid', ...props });
}

function inlineGridEl(props = {}) {
  return style({ display: 'inline-grid', ...props });
}

// ── parseColumnCount ──────────────────────────────────────────────────────────

describe('parseColumnCount — infer column count from grid-template-columns', () => {
  test('returns 1 for single column', () => {
    expect(parseColumnCount('1fr')).toBe(1);
  });

  test('returns 3 for three equal columns', () => {
    expect(parseColumnCount('1fr 1fr 1fr')).toBe(3);
  });

  test('returns 4 for repeat(4, 1fr)', () => {
    expect(parseColumnCount('repeat(4, 1fr)')).toBe(4);
  });

  test('returns 12 for repeat(12, minmax(0, 1fr))', () => {
    expect(parseColumnCount('repeat(12, minmax(0, 1fr))')).toBe(12);
  });

  test('returns 2 for two pixel columns', () => {
    expect(parseColumnCount('200px 200px')).toBe(2);
  });

  test('returns 0 for empty/none string', () => {
    expect(parseColumnCount('')).toBe(0);
    expect(parseColumnCount('none')).toBe(0);
  });

  test('returns correct count for auto-fill repeat', () => {
    // auto-fill can't be resolved statically — returns 0
    expect(parseColumnCount('repeat(auto-fill, minmax(200px, 1fr))')).toBe(0);
  });
});

// ── extractGridDescriptors ────────────────────────────────────────────────────

describe('extractGridDescriptors — extract CSS Grid properties from computed styles', () => {
  test('returns array', () => {
    expect(Array.isArray(extractGridDescriptors([]))).toBe(true);
  });

  test('ignores non-grid elements', () => {
    const result = extractGridDescriptors([style({ display: 'block' })]);
    expect(result).toHaveLength(0);
  });

  test('includes elements with display:grid', () => {
    const result = extractGridDescriptors([gridEl()]);
    expect(result).toHaveLength(1);
  });

  test('includes elements with display:inline-grid', () => {
    const result = extractGridDescriptors([inlineGridEl()]);
    expect(result).toHaveLength(1);
  });

  test('extracts grid-template-columns', () => {
    const el = gridEl({ 'grid-template-columns': '1fr 1fr 1fr' });
    const [desc] = extractGridDescriptors([el]);
    expect(desc.templateColumns).toBe('1fr 1fr 1fr');
  });

  test('extracts grid-template-rows', () => {
    const el = gridEl({ 'grid-template-rows': '100px auto' });
    const [desc] = extractGridDescriptors([el]);
    expect(desc.templateRows).toBe('100px auto');
  });

  test('extracts gap', () => {
    const el = gridEl({ gap: '16px' });
    const [desc] = extractGridDescriptors([el]);
    expect(desc.gap).toBe('16px');
  });

  test('extracts grid-template-areas', () => {
    const el = gridEl({ 'grid-template-areas': '"header" "main" "footer"' });
    const [desc] = extractGridDescriptors([el]);
    expect(desc.templateAreas).toBe('"header" "main" "footer"');
  });

  test('includes inferred columnCount', () => {
    const el = gridEl({ 'grid-template-columns': '1fr 1fr 1fr' });
    const [desc] = extractGridDescriptors([el]);
    expect(desc.columnCount).toBe(3);
  });

  test('handles multiple grid elements', () => {
    const els = [
      gridEl({ 'grid-template-columns': '1fr 1fr' }),
      gridEl({ 'grid-template-columns': 'repeat(3, 1fr)' }),
    ];
    expect(extractGridDescriptors(els)).toHaveLength(2);
  });
});

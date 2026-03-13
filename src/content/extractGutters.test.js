/**
 * Task: 6ab0fdf4 — Extract gutter sizes from gap, column-gap, and row-gap
 * Spec: f87063a1 — Grid and Layout Extraction
 */

import { describe, test, expect } from 'bun:test';
import { extractGutters, collectUniqueGutters } from './extractGutters.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function style(props = {}) {
  return {
    display: props.display ?? 'grid',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

// ── extractGutters ────────────────────────────────────────────────────────────

describe('extractGutters — extract gap, column-gap, row-gap from a computed style', () => {
  test('returns object with gap, columnGap, rowGap', () => {
    const result = extractGutters(style({}));
    expect(result).toHaveProperty('gap');
    expect(result).toHaveProperty('columnGap');
    expect(result).toHaveProperty('rowGap');
  });

  test('reads gap property', () => {
    expect(extractGutters(style({ gap: '16px' })).gap).toBe('16px');
  });

  test('reads column-gap property', () => {
    expect(extractGutters(style({ 'column-gap': '24px' })).columnGap).toBe('24px');
  });

  test('reads row-gap property', () => {
    expect(extractGutters(style({ 'row-gap': '8px' })).rowGap).toBe('8px');
  });

  test('returns empty strings when no gap properties set', () => {
    const result = extractGutters(style({}));
    expect(result.gap).toBe('');
    expect(result.columnGap).toBe('');
    expect(result.rowGap).toBe('');
  });

  test('handles shorthand gap "16px 24px" (row column)', () => {
    const result = extractGutters(style({ gap: '16px 24px' }));
    expect(result.gap).toBe('16px 24px');
  });
});

// ── collectUniqueGutters ──────────────────────────────────────────────────────

describe('collectUniqueGutters — collect unique gutter values from multiple styles', () => {
  test('returns array', () => {
    expect(Array.isArray(collectUniqueGutters([]))).toBe(true);
  });

  test('returns empty array for no gap properties', () => {
    expect(collectUniqueGutters([style({})])).toHaveLength(0);
  });

  test('collects unique gap values', () => {
    const styles = [
      style({ gap: '16px' }),
      style({ gap: '16px' }),
      style({ gap: '24px' }),
    ];
    const result = collectUniqueGutters(styles);
    expect(result).toContain('16px');
    expect(result).toContain('24px');
    expect(result).toHaveLength(2);
  });

  test('collects column-gap values separately', () => {
    const result = collectUniqueGutters([style({ 'column-gap': '12px' })]);
    expect(result).toContain('12px');
  });

  test('collects row-gap values', () => {
    const result = collectUniqueGutters([style({ 'row-gap': '8px' })]);
    expect(result).toContain('8px');
  });

  test('deduplicates across gap, column-gap, and row-gap', () => {
    const s = style({ gap: '16px', 'column-gap': '16px', 'row-gap': '16px' });
    const result = collectUniqueGutters([s]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('16px');
  });
});

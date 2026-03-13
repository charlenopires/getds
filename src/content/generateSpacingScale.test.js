/**
 * Task: 6b478001 — Generate sorted spacing scale with multiplier labels
 * Spec: 29ea3708 — Spacing System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { generateSpacingScale } from './generateSpacingScale.js';

describe('generateSpacingScale — sorted scale with multiplier labels', () => {
  test('returns an object with a scale array', () => {
    const result = generateSpacingScale([], { baseUnit: 8 });
    expect(result).toHaveProperty('scale');
    expect(Array.isArray(result.scale)).toBe(true);
  });

  test('scale is sorted ascending by px value', () => {
    const values = [{ px: 32 }, { px: 8 }, { px: 16 }];
    const { scale } = generateSpacingScale(values, { baseUnit: 8 });
    const pxList = scale.map(s => s.px);
    expect(pxList).toEqual([...pxList].sort((a, b) => a - b));
  });

  test('each entry has px, value, and multiplier fields', () => {
    const values = [{ px: 8, value: '8px' }];
    const { scale } = generateSpacingScale(values, { baseUnit: 8 });
    expect(scale[0]).toHaveProperty('px');
    expect(scale[0]).toHaveProperty('value');
    expect(scale[0]).toHaveProperty('multiplier');
  });

  test('multiplier is px / baseUnit for exact multiples', () => {
    const values = [{ px: 8, value: '8px' }, { px: 16, value: '16px' }, { px: 32, value: '32px' }];
    const { scale } = generateSpacingScale(values, { baseUnit: 8 });
    expect(scale[0].multiplier).toBe(1);
    expect(scale[1].multiplier).toBe(2);
    expect(scale[2].multiplier).toBe(4);
  });

  test('multiplier is null when baseUnit is null', () => {
    const values = [{ px: 5, value: '5px' }];
    const { scale } = generateSpacingScale(values, { baseUnit: null });
    expect(scale[0].multiplier).toBeNull();
  });

  test('deduplicates entries with the same px value', () => {
    const values = [{ px: 8, value: '8px' }, { px: 8, value: '8px' }];
    const { scale } = generateSpacingScale(values, { baseUnit: 8 });
    expect(scale.length).toBe(1);
  });

  test('filters out null px entries', () => {
    const values = [{ px: 8, value: '8px' }, { px: null, value: 'auto' }];
    const { scale } = generateSpacingScale(values, { baseUnit: 8 });
    expect(scale.length).toBe(1);
    expect(scale[0].px).toBe(8);
  });

  test('returns empty scale for empty input', () => {
    const { scale } = generateSpacingScale([], { baseUnit: 8 });
    expect(scale).toEqual([]);
  });

  test('preserves value string from input entry', () => {
    const values = [{ px: 16, value: '1rem' }];
    const { scale } = generateSpacingScale(values, { baseUnit: 8 });
    expect(scale[0].value).toBe('1rem');
  });

  test('multiplier is a rounded decimal for non-exact multiples', () => {
    // 12px with baseUnit 8 → multiplier = 1.5
    const values = [{ px: 12, value: '12px' }];
    const { scale } = generateSpacingScale(values, { baseUnit: 8 });
    expect(scale[0].multiplier).toBe(1.5);
  });

  test('adds a step index (1-based) to each entry', () => {
    const values = [{ px: 8, value: '8px' }, { px: 16, value: '16px' }];
    const { scale } = generateSpacingScale(values, { baseUnit: 8 });
    expect(scale[0].step).toBe(1);
    expect(scale[1].step).toBe(2);
  });
});

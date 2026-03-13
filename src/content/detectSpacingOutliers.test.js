/**
 * Task: 1411907b — Identify outlier spacing values
 * Spec: 29ea3708 — Spacing System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { detectSpacingOutliers } from './detectSpacingOutliers.js';

describe('detectSpacingOutliers — identify spacing values that break the grid', () => {
  test('returns an object with an outliers array', () => {
    const result = detectSpacingOutliers([], { baseUnit: 8 });
    expect(result).toHaveProperty('outliers');
    expect(Array.isArray(result.outliers)).toBe(true);
  });

  test('returns no outliers when all values fit the base unit', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 24 }];
    const { outliers } = detectSpacingOutliers(values, { baseUnit: 8 });
    expect(outliers.length).toBe(0);
  });

  test('flags values not divisible by baseUnit as outliers', () => {
    const values = [{ px: 8 }, { px: 5 }, { px: 16 }];
    const { outliers } = detectSpacingOutliers(values, { baseUnit: 8 });
    expect(outliers.some(o => o.px === 5)).toBe(true);
  });

  test('does not flag values divisible by baseUnit', () => {
    const values = [{ px: 8 }, { px: 5 }, { px: 16 }];
    const { outliers } = detectSpacingOutliers(values, { baseUnit: 8 });
    expect(outliers.some(o => o.px === 8)).toBe(false);
    expect(outliers.some(o => o.px === 16)).toBe(false);
  });

  test('each outlier entry has a px field', () => {
    const values = [{ px: 5, value: '5px' }];
    const { outliers } = detectSpacingOutliers(values, { baseUnit: 8 });
    expect(outliers[0]).toHaveProperty('px');
  });

  test('each outlier has a deviation field showing distance to nearest grid point', () => {
    const values = [{ px: 5, value: '5px' }];
    const { outliers } = detectSpacingOutliers(values, { baseUnit: 8 });
    // nearest 8px multiple to 5 is 8; deviation = 3
    expect(outliers[0]).toHaveProperty('deviation');
    expect(outliers[0].deviation).toBe(3);
  });

  test('returns empty outliers for empty input', () => {
    const { outliers } = detectSpacingOutliers([], { baseUnit: 8 });
    expect(outliers).toEqual([]);
  });

  test('returns empty outliers when baseUnit is null', () => {
    const values = [{ px: 5 }, { px: 7 }];
    const { outliers } = detectSpacingOutliers(values, { baseUnit: null });
    expect(outliers).toEqual([]);
  });

  test('ignores null px entries', () => {
    const values = [{ px: null }, { px: 8 }];
    const { outliers } = detectSpacingOutliers(values, { baseUnit: 8 });
    expect(outliers.length).toBe(0);
  });

  test('deviation is the minimum distance to any grid point', () => {
    // 13px: nearest 8-multiple is 16 (diff=3) or 8 (diff=5) → deviation=3
    const values = [{ px: 13, value: '13px' }];
    const { outliers } = detectSpacingOutliers(values, { baseUnit: 8 });
    expect(outliers[0].deviation).toBe(3);
  });

  test('preserves value string on outlier entries', () => {
    const values = [{ px: 5, value: '5px' }];
    const { outliers } = detectSpacingOutliers(values, { baseUnit: 8 });
    expect(outliers[0].value).toBe('5px');
  });
});

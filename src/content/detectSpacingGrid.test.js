/**
 * Task: dd494adc — Detect 4px-grid or 8px-grid patterns
 * Spec: 29ea3708 — Spacing System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { detectSpacingGrid } from './detectSpacingGrid.js';

describe('detectSpacingGrid — identify the spacing grid system in use', () => {
  test('returns an object with grid, baseUnit, and adherence fields', () => {
    const result = detectSpacingGrid([]);
    expect(result).toHaveProperty('grid');
    expect(result).toHaveProperty('baseUnit');
    expect(result).toHaveProperty('adherence');
  });

  test('detects "8px" grid for 8, 16, 24, 32 scale', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 24 }, { px: 32 }];
    expect(detectSpacingGrid(values).grid).toBe('8px');
  });

  test('detects "4px" grid for 4, 8, 12, 16, 20 scale', () => {
    const values = [{ px: 4 }, { px: 8 }, { px: 12 }, { px: 16 }, { px: 20 }];
    expect(detectSpacingGrid(values).grid).toBe('4px');
  });

  test('detects "8px" grid when base unit is 8 with high adherence', () => {
    // Mix of 8-multiples with one outlier
    const values = [
      { px: 8 }, { px: 16 }, { px: 24 }, { px: 32 }, { px: 40 }, { px: 5 },
    ];
    const result = detectSpacingGrid(values);
    // 5/6 values are 8-multiples → should still detect 8px grid
    expect(result.grid).toBe('8px');
  });

  test('reports "4px" grid when base is 4 and values include non-8-multiples', () => {
    const values = [{ px: 4 }, { px: 12 }, { px: 20 }]; // not all 8-multiples
    expect(detectSpacingGrid(values).grid).toBe('4px');
  });

  test('returns grid "custom" when no common 4/8 pattern', () => {
    const values = [{ px: 5 }, { px: 7 }, { px: 11 }, { px: 13 }];
    expect(detectSpacingGrid(values).grid).toBe('custom');
  });

  test('adherence is a number between 0 and 1', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 24 }];
    const { adherence } = detectSpacingGrid(values);
    expect(adherence).toBeGreaterThanOrEqual(0);
    expect(adherence).toBeLessThanOrEqual(1);
  });

  test('adherence is 1.0 when all values are exact multiples of the grid', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 32 }];
    expect(detectSpacingGrid(values).adherence).toBe(1);
  });

  test('baseUnit matches the detected grid number', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 24 }];
    const result = detectSpacingGrid(values);
    expect(result.baseUnit).toBe(8);
  });

  test('returns grid "none" and baseUnit null for empty input', () => {
    const result = detectSpacingGrid([]);
    expect(result.grid).toBe('none');
    expect(result.baseUnit).toBeNull();
  });

  test('ignores entries with null px when detecting grid', () => {
    const values = [{ px: 8 }, { px: null }, { px: 16 }, { px: 24 }];
    expect(detectSpacingGrid(values).grid).toBe('8px');
  });

  test('prefers 8px grid over 4px when base is 8', () => {
    // 8 is a multiple of 4 — should prefer the stricter 8px grid
    const values = [{ px: 8 }, { px: 16 }, { px: 32 }, { px: 64 }];
    expect(detectSpacingGrid(values).grid).toBe('8px');
  });
});

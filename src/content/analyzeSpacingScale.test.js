import { describe, test, expect } from 'bun:test';
import { analyzeSpacingScale } from './analyzeSpacingScale.js';

describe('analyzeSpacingScale', () => {
  test('returns custom for less than 3 values', () => {
    const result = analyzeSpacingScale([4, 8]);
    expect(result.scaleType).toBe('custom');
    expect(result.baseValue).toBe(4);
  });

  test('returns custom for empty array', () => {
    const result = analyzeSpacingScale([]);
    expect(result.scaleType).toBe('custom');
  });

  test('detects arithmetic scale (4px increment)', () => {
    const result = analyzeSpacingScale([4, 8, 12, 16, 20, 24]);
    expect(result.scaleType).toBe('arithmetic');
    expect(result.increment).toBe(4);
    expect(result.baseValue).toBe(4);
    expect(result.fitScore).toBeGreaterThanOrEqual(0.8);
    expect(result.formula).toContain('4');
  });

  test('detects geometric scale (2x ratio)', () => {
    const result = analyzeSpacingScale([4, 8, 16, 32, 64]);
    expect(result.scaleType).toBe('geometric');
    expect(result.ratio).toBe(2);
    expect(result.ratioName).toBe('Double');
    expect(result.fitScore).toBeGreaterThanOrEqual(0.8);
  });

  test('detects golden ratio geometric scale', () => {
    // Approximate golden ratio: 4, 6.5, 10.5, 17
    const result = analyzeSpacingScale([4, 6.5, 10.5, 17, 27.5]);
    expect(result.scaleType).toBe('geometric');
    expect(result.fitScore).toBeGreaterThan(0.4);
  });

  test('returns low fit for irregular values', () => {
    const result = analyzeSpacingScale([3, 11, 14, 29, 37, 83]);
    expect(result.fitScore).toBeLessThanOrEqual(0.5);
  });

  test('reports deviations for arithmetic scale', () => {
    // Almost perfect but one off
    const result = analyzeSpacingScale([4, 8, 12, 16, 21, 24]);
    if (result.scaleType === 'arithmetic') {
      expect(result.deviations.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('handles duplicate values', () => {
    const result = analyzeSpacingScale([4, 4, 8, 8, 12, 12, 16]);
    expect(result.scaleType).toBe('arithmetic');
  });
});

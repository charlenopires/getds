/**
 * Task: aa9728f7 — Infer base spacing unit via GCD of most frequent values
 * Spec: 29ea3708 — Spacing System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { gcd, inferBaseUnit } from './inferSpacingBase.js';

describe('gcd — greatest common divisor', () => {
  test('gcd(8, 4) = 4', () => expect(gcd(8, 4)).toBe(4));
  test('gcd(16, 8) = 8', () => expect(gcd(16, 8)).toBe(8));
  test('gcd(12, 8) = 4', () => expect(gcd(12, 8)).toBe(4));
  test('gcd(24, 16) = 8', () => expect(gcd(24, 16)).toBe(8));
  test('gcd(8, 8) = 8', () => expect(gcd(8, 8)).toBe(8));
  test('gcd(6, 4) = 2', () => expect(gcd(6, 4)).toBe(2));
  test('gcd(5, 3) = 1', () => expect(gcd(5, 3)).toBe(1));
  test('gcd(0, 8) = 8', () => expect(gcd(0, 8)).toBe(8));
});

describe('inferBaseUnit — find the most likely spacing base unit', () => {
  test('returns an object with baseUnit and confidence', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 24 }];
    const result = inferBaseUnit(values);
    expect(result).toHaveProperty('baseUnit');
    expect(result).toHaveProperty('confidence');
  });

  test('detects base unit 8 from 8px, 16px, 24px scale', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 24 }, { px: 32 }];
    expect(inferBaseUnit(values).baseUnit).toBe(8);
  });

  test('detects base unit 4 from 4px, 8px, 12px, 16px scale', () => {
    const values = [{ px: 4 }, { px: 8 }, { px: 12 }, { px: 16 }];
    expect(inferBaseUnit(values).baseUnit).toBe(4);
  });

  test('detects base unit 8 when most values are multiples of 8', () => {
    const values = [
      { px: 8 }, { px: 16 }, { px: 24 }, { px: 32 },
      { px: 8 }, { px: 16 }, // repeated → higher weight
    ];
    expect(inferBaseUnit(values).baseUnit).toBe(8);
  });

  test('confidence is a number between 0 and 1', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 24 }];
    const { confidence } = inferBaseUnit(values);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  test('high confidence when all values are multiples of base', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 24 }, { px: 32 }];
    expect(inferBaseUnit(values).confidence).toBeGreaterThan(0.8);
  });

  test('returns baseUnit null for empty array', () => {
    expect(inferBaseUnit([]).baseUnit).toBeNull();
  });

  test('returns baseUnit null when all px values are null', () => {
    const values = [{ px: null }, { px: null }];
    expect(inferBaseUnit(values).baseUnit).toBeNull();
  });

  test('ignores entries with null px', () => {
    const values = [{ px: 8 }, { px: null }, { px: 16 }, { px: 24 }];
    const result = inferBaseUnit(values);
    expect(result.baseUnit).toBe(8);
  });

  test('detects base unit 5 from 5, 10, 15 scale', () => {
    const values = [{ px: 5 }, { px: 10 }, { px: 15 }];
    expect(inferBaseUnit(values).baseUnit).toBe(5);
  });

  test('baseUnit is a positive integer', () => {
    const values = [{ px: 8 }, { px: 16 }, { px: 24 }];
    const { baseUnit } = inferBaseUnit(values);
    expect(Number.isInteger(baseUnit)).toBe(true);
    expect(baseUnit).toBeGreaterThan(0);
  });
});

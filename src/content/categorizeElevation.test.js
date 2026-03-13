/**
 * Task: e7081b5d — Categorize shadows into elevation levels 0–5 by blur-radius and spread
 * Spec: 7c17b9ef — Elevation and Border Radius Extraction
 */

import { describe, test, expect } from 'bun:test';
import { parseBoxShadow, categorizeElevation } from './categorizeElevation.js';

describe('parseBoxShadow — parse a CSS box-shadow string', () => {
  test('parses offsetX, offsetY, blur, spread from a simple shadow', () => {
    const result = parseBoxShadow('0px 2px 4px 0px rgba(0,0,0,0.2)');
    expect(result.blur).toBe(4);
    expect(result.spread).toBe(0);
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(2);
  });

  test('parses blur when spread is omitted', () => {
    const result = parseBoxShadow('0px 2px 8px rgba(0,0,0,0.2)');
    expect(result.blur).toBe(8);
  });

  test('returns null for "none"', () => {
    expect(parseBoxShadow('none')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(parseBoxShadow('')).toBeNull();
  });

  test('handles inset keyword', () => {
    const result = parseBoxShadow('inset 0px 2px 4px rgba(0,0,0,0.1)');
    expect(result).not.toBeNull();
    expect(result.inset).toBe(true);
  });

  test('blur defaults to 0 when not present', () => {
    const result = parseBoxShadow('0px 1px rgba(0,0,0,0.1)');
    expect(result.blur).toBe(0);
  });
});

describe('categorizeElevation — assign elevation levels to shadow entries', () => {
  test('returns an array', () => {
    expect(Array.isArray(categorizeElevation([]))).toBe(true);
  });

  test('each result entry has level, value, and blur fields', () => {
    const shadows = [{ value: '0px 2px 4px rgba(0,0,0,0.2)' }];
    const result = categorizeElevation(shadows);
    expect(result[0]).toHaveProperty('level');
    expect(result[0]).toHaveProperty('value');
    expect(result[0]).toHaveProperty('blur');
  });

  test('level is a number 0-5', () => {
    const shadows = [{ value: '0px 2px 4px rgba(0,0,0,0.2)' }];
    const result = categorizeElevation(shadows);
    expect(result[0].level).toBeGreaterThanOrEqual(0);
    expect(result[0].level).toBeLessThanOrEqual(5);
  });

  test('assigns level 0 to smallest blur', () => {
    const shadows = [
      { value: '0px 1px 1px rgba(0,0,0,0.1)' },
      { value: '0px 4px 8px rgba(0,0,0,0.2)' },
      { value: '0px 8px 24px rgba(0,0,0,0.3)' },
    ];
    const result = categorizeElevation(shadows);
    const sorted = [...result].sort((a, b) => a.blur - b.blur);
    expect(sorted[0].level).toBeLessThan(sorted[sorted.length - 1].level);
  });

  test('assigns higher level to larger blur', () => {
    const shadows = [
      { value: '0px 1px 2px rgba(0,0,0,0.1)' },
      { value: '0px 8px 32px rgba(0,0,0,0.3)' },
    ];
    const result = categorizeElevation(shadows);
    const small = result.find(r => r.blur === 2);
    const large = result.find(r => r.blur === 32);
    expect(large.level).toBeGreaterThan(small.level);
  });

  test('returns empty array for empty input', () => {
    expect(categorizeElevation([])).toEqual([]);
  });

  test('skips unparseable shadow values', () => {
    const shadows = [{ value: 'none' }, { value: '0px 2px 4px rgba(0,0,0,0.2)' }];
    expect(categorizeElevation(shadows).length).toBe(1);
  });

  test('levels are integers', () => {
    const shadows = [{ value: '0px 2px 4px rgba(0,0,0,0.2)' }];
    const result = categorizeElevation(shadows);
    expect(Number.isInteger(result[0].level)).toBe(true);
  });
});

/**
 * Task: 48504e8a — Detect pill-shaped elements (border-radius >= 9999px or 50%)
 * Spec: 7c17b9ef — Elevation and Border Radius Extraction
 */

import { describe, test, expect } from 'bun:test';
import { isPillRadius, detectPillShapes } from './detectPillShapes.js';

describe('isPillRadius — detect pill/full border-radius values', () => {
  test('returns true for 9999px', () => {
    expect(isPillRadius('9999px')).toBe(true);
  });

  test('returns true for values >= 9999px', () => {
    expect(isPillRadius('10000px')).toBe(true);
  });

  test('returns true for 50%', () => {
    expect(isPillRadius('50%')).toBe(true);
  });

  test('returns true for 100%', () => {
    expect(isPillRadius('100%')).toBe(true);
  });

  test('returns false for 4px', () => {
    expect(isPillRadius('4px')).toBe(false);
  });

  test('returns false for 8px', () => {
    expect(isPillRadius('8px')).toBe(false);
  });

  test('returns false for 49%', () => {
    expect(isPillRadius('49%')).toBe(false);
  });

  test('returns false for null/empty', () => {
    expect(isPillRadius('')).toBe(false);
    expect(isPillRadius(null)).toBe(false);
  });
});

describe('detectPillShapes — filter radii array for pill entries', () => {
  test('returns an object with a pills array', () => {
    expect(detectPillShapes([])).toHaveProperty('pills');
    expect(Array.isArray(detectPillShapes([]).pills)).toBe(true);
  });

  test('returns empty array when no pill radii', () => {
    const radii = [{ value: '4px' }, { value: '8px' }];
    expect(detectPillShapes(radii).pills.length).toBe(0);
  });

  test('flags 9999px as pill', () => {
    const radii = [{ value: '9999px' }, { value: '4px' }];
    const { pills } = detectPillShapes(radii);
    expect(pills.some(p => p.value === '9999px')).toBe(true);
  });

  test('flags 50% as pill', () => {
    const radii = [{ value: '50%' }];
    const { pills } = detectPillShapes(radii);
    expect(pills.length).toBe(1);
  });

  test('does not include non-pill entries in pills array', () => {
    const radii = [{ value: '9999px' }, { value: '4px' }];
    const { pills } = detectPillShapes(radii);
    expect(pills.some(p => p.value === '4px')).toBe(false);
  });

  test('each pill entry has a value field', () => {
    const radii = [{ value: '9999px' }];
    expect(detectPillShapes(radii).pills[0]).toHaveProperty('value');
  });
});

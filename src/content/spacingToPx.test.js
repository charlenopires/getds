/**
 * Task: 088ea315 — Convert all spacing values to pixels for comparison
 * Spec: 29ea3708 — Spacing System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { spacingValueToPx, enrichSpacingWithPx } from './spacingToPx.js';

describe('spacingValueToPx — parse a CSS spacing value to a number', () => {
  test('converts px value', () => {
    expect(spacingValueToPx('16px')).toBe(16);
  });

  test('converts decimal px value', () => {
    expect(spacingValueToPx('1.5px')).toBe(1.5);
  });

  test('converts rem to px (base 16)', () => {
    expect(spacingValueToPx('1rem')).toBe(16);
  });

  test('converts 0.5rem to px', () => {
    expect(spacingValueToPx('0.5rem')).toBe(8);
  });

  test('converts 2rem to px', () => {
    expect(spacingValueToPx('2rem')).toBe(32);
  });

  test('converts em to px (base 16)', () => {
    expect(spacingValueToPx('1em')).toBe(16);
  });

  test('converts pt to px (1pt ≈ 1.333px)', () => {
    expect(spacingValueToPx('12pt')).toBe(16);
  });

  test('returns null for unparseable value', () => {
    expect(spacingValueToPx('auto')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(spacingValueToPx('')).toBeNull();
  });

  test('returns null for percentage (cannot resolve without context)', () => {
    expect(spacingValueToPx('50%')).toBeNull();
  });

  test('converts integer px without decimals', () => {
    expect(spacingValueToPx('8px')).toBe(8);
  });
});

describe('enrichSpacingWithPx — add px field to each spacing value entry', () => {
  test('returns an array', () => {
    const result = enrichSpacingWithPx([]);
    expect(Array.isArray(result)).toBe(true);
  });

  test('each entry gets a px field', () => {
    const values = [{ value: '16px', properties: ['padding-top'] }];
    const result = enrichSpacingWithPx(values);
    expect(result[0]).toHaveProperty('px');
  });

  test('px field is correct numeric value', () => {
    const values = [{ value: '16px', properties: ['padding-top'] }];
    const result = enrichSpacingWithPx(values);
    expect(result[0].px).toBe(16);
  });

  test('px is null for unparseable values', () => {
    const values = [{ value: 'auto', properties: ['margin-top'] }];
    const result = enrichSpacingWithPx(values);
    expect(result[0].px).toBeNull();
  });

  test('converts rem values to px', () => {
    const values = [{ value: '1rem', properties: ['padding-top'] }];
    const result = enrichSpacingWithPx(values);
    expect(result[0].px).toBe(16);
  });

  test('preserves all original fields', () => {
    const values = [{ value: '8px', properties: ['gap'], count: 5 }];
    const result = enrichSpacingWithPx(values);
    expect(result[0].value).toBe('8px');
    expect(result[0].properties).toEqual(['gap']);
    expect(result[0].count).toBe(5);
  });

  test('handles multiple entries', () => {
    const values = [
      { value: '8px',  properties: ['padding-top'] },
      { value: '16px', properties: ['margin-top'] },
      { value: '1rem', properties: ['gap'] },
    ];
    const result = enrichSpacingWithPx(values);
    expect(result.map(r => r.px)).toEqual([8, 16, 16]);
  });
});
